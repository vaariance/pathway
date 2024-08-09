import { coins } from "@cosmjs/amino";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import {
  GeneratedType,
  OfflineDirectSigner,
  Registry,
} from "@cosmjs/proto-signing";
import {
  SigningStargateClient,
  StargateClient,
  defaultRegistryTypes,
} from "@cosmjs/stargate";
import { ecsign, toBytes, toRpcSig } from "@ethereumjs/util";
import axios from "axios";
import { Buffer } from "buffer";

import {
  Account,
  Address,
  concatHex,
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  encodePacked,
  Hex,
  hexToBigInt,
  http,
  keccak256,
  maxUint256,
  numberToHex,
  parseEventLogs,
  publicActions,
  toHex,
} from "viem";
import { normalize } from "viem/ens";

import {
  AGGREGATOR_V3_INTERFACE,
  Chains,
  DESTINATION_CALLERS,
  DOMAINS,
  ICCTP,
  IERC20,
  MESSAGE_TRANSMITTERS,
  REVERSE_DOMAINS,
  SOURCE_CHAIN_CONFIRMATIONS,
  TOKEN_MESSENGERS,
  TRANSPORTS,
  USDC_CONTRACTS,
  VIEM_NETWORKS,
} from "../constants/index";

import { privateKeyToAccount } from "viem/accounts";
import { MsgDepositForBurnWithCaller, MsgReceiveMessage } from "./generated";

export type SerializableResult<T, E> =
  | {
      ok: false;
      value?: undefined;
      error: E;
      info?: unknown;
    }
  | {
      ok: true;
      value: T;
      error?: undefined;
      info?: undefined;
    };

export type Result<T, E = string> = SerializableResult<T, E> & {
  unwrap(): T;
  unwrap_err(): E;
  unwrap_or(default_value: T): T;
  map_err<F>(f: (e: E) => F): Result<T, F>;
  map<U>(f: (v: T) => U): Result<U, E>;
};

export const Result = <T, E>(res: SerializableResult<T, E>): Result<T, E> =>
  res.ok ? Ok(res.value) : Err(res.error);

export const Err = <E>(error: E, info?: unknown): Result<never, E> => ({
  ok: false,
  info,
  error,
  unwrap: () => {
    throw error;
  },
  unwrap_err: () => error,
  unwrap_or: <T>(default_value: T): T => default_value,
  map_err: <F>(f: (e: E) => F): Result<never, F> => Err(f(error)),
  map: (): Result<never, E> => Err(error),
});

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
  unwrap: () => value,
  unwrap_err: () => {
    throw new Error(`Not an error. Has value: ${value}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unwrap_or: <F>(_: F): T => value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map_err: <F>(_: (e: never) => F): Result<T, F> => Ok(value),
  map: <U>(f: (v: T) => U): Result<U, never> => Ok(f(value)),
});

export const cctp_types: ReadonlyArray<[string, GeneratedType]> = [
  ...defaultRegistryTypes,
  [TOKEN_MESSENGERS.noble, MsgDepositForBurnWithCaller],
  [MESSAGE_TRANSMITTERS.noble, MsgReceiveMessage],
];

export const create_default_registry = (): Registry => {
  return new Registry(cctp_types);
};

export type Receiver = Hex | `noble1${string}` | `${string}.eth`;

export type Path = {
  from_chain: Chains;
  to_chain: Chains;
  receiver_address: Receiver;
  sender_address: Receiver;
  amount: bigint;
};

export type ExecutionResponse = {
  hash?: string;
  gas: {
    deposit?: {
      amount: bigint;
      decimals: number;
    };
    receive?: {
      amount: bigint;
      decimals: number;
    };
  };
};

export type ReceiveMessage = {
  message_bytes: Hex;
  message_hash: Hex;
  circle_attestation?: Hex;
  block_confirmation_in_ms?: number;
  status: "pending" | "attested" | "received" | "failed";
  destination_block_height_at_deposit: bigint;
  nonce: bigint;
  original_path: Path;
};

export type Quote = {
  estimated_fee: Record<
    string,
    | {
        amount: bigint;
        decimals: number;
      }
    | undefined
  >;
  estimated_time_in_milliseconds: number;
  estimated_output_amount: bigint;
};

export class PathwayOptions<T, R> {
  public viem_signer?: T;
  public noble_signer?: R;

  constructor({
    viem_signer,
    noble_signer,
  }: {
    viem_signer?: T;
    noble_signer?: R;
  }) {
    this.viem_signer = viem_signer;
    this.noble_signer = noble_signer;
  }
}

export class Pathway<
  T extends Account | Address | undefined,
  R extends OfflineDirectSigner | undefined
> {
  options: PathwayOptions<T, R>;
  axios_instance = axios.create({
    baseURL: "https://api.thepathway.to",
  });

  constructor(options: PathwayOptions<T, R>) {
    this.options = options;
  }

  /**
   * Validates a given path and throws an error if the receiver address or amount is invalid.
   *
   * @param {Path} path - The path to validate.
   * @throws {Error} Throws an error if the receiver address or amount is invalid.
   */
  private validate_path(path: Path) {
    const { from_chain, to_chain, receiver_address, amount } = path;
    if (receiver_address.startsWith("noble1") && to_chain !== Chains.noble) {
      throw new Error("Receiver must be Noble address");
    }

    if (receiver_address.endsWith(".eth") && from_chain !== Chains.noble) {
      throw new Error("Receiver must be ENS name");
    }

    if (receiver_address.startsWith("0x") && from_chain !== Chains.noble) {
      throw new Error("Receiver must be EVM address");
    }

    if (amount === BigInt(0)) {
      throw new Error("Amount is required and must be greater than 0");
    }

    if (from_chain === to_chain) {
      throw new Error("To and from Chains cannot be the same");
    }
  }

  /**
   * Retrieves the Ethereum client.
   *
   * @return {WalletClient | PublicClient} The Ethereum client.
   * @throws {Error} If the Viem client is not available.
   */
  private get_ethereum_client(chain: Chains, strict = false) {
    if (this.options.viem_signer && !strict) {
      return this.get_ethereum_wallet_client(chain);
    }
    return createPublicClient({
      chain: VIEM_NETWORKS[chain],
      transport: http(TRANSPORTS("hPKLnYQOgqDTQuD1_xb7iHDnMlW0GQQk")[chain]),
    });
  }

  /**
   * Retrieves the Ethereum wallet client.
   *
   * @return {WalletClient} The Ethereum wallet client.
   * @throws {Error} If the Viem wallet client is not provided or does not have wallet capabilities.
   */
  private get_ethereum_wallet_client(chain: Chains) {
    if (!this.options.viem_signer) {
      throw new Error("Viem account is not provided");
    }

    let client;

    switch (typeof this.options.viem_signer === "string") {
      case true:
        client = createWalletClient({
          account: this.options.viem_signer as Address,
          chain: VIEM_NETWORKS[chain],
          transport: custom(window.ethereum!),
        }).extend(publicActions);
        break;

      default:
        client = createWalletClient({
          account: this.options.viem_signer as Account,
          chain: VIEM_NETWORKS[chain],
          transport: http(
            TRANSPORTS("hPKLnYQOgqDTQuD1_xb7iHDnMlW0GQQk")[chain]
          ),
        });
        break;
    }

    return client.extend(publicActions);
  }

  /**
   * Retrieves the Noble client.
   *
   * @return {Promise<StargateClient>} The Noble client.
   * @throws {Error} If the Noble client is not available or if the Noble client expects an offline signer.
   */
  private async get_noble_client() {
    if (this.options.noble_signer) {
      return this.get_noble_wallet_client();
    }
    return StargateClient.connect(TRANSPORTS()[Chains.noble]);
  }

  /**
   * Retrieves the Noble wallet client.
   *
   * @return {Promise<SigningStargateClient>} The Noble wallet client.
   * @throws {Error} If the Noble client is not provided or if it is not an instance of SigningStargateClient.
   */
  private async get_noble_wallet_client() {
    if (!this.options.noble_signer) {
      throw new Error("Noble offline signer is not provided");
    }
    return SigningStargateClient.connectWithSigner(
      TRANSPORTS()[Chains.noble],
      this.options.noble_signer!,
      {
        registry: create_default_registry(),
      }
    );
  }

  private async get_allowance(path: Path): Promise<boolean> {
    const { from_chain, amount, sender_address } = path;
    const client = this.get_ethereum_client(from_chain);

    if (from_chain !== Chains.noble) {
      const allowance = await client.readContract({
        address: USDC_CONTRACTS[from_chain],
        abi: IERC20,
        functionName: "allowance",
        args: [sender_address as Address, TOKEN_MESSENGERS[from_chain]],
      });

      return allowance >= amount;
    }
    return true;
  }

  /**
   * Approves a USDC if the allowance is not sufficient and the chain is not Noble.
   *
   * @param {Path} path - The path to approve.
   * @return {Promise<void>} A promise that resolves when the approval is complete.
   */
  async approve(path: Path): Promise<void> {
    const { from_chain } = path;
    const allowance = await this.get_allowance(path);

    const client = this.get_ethereum_wallet_client(Chains[path.from_chain]);

    if (!allowance && from_chain !== Chains.noble) {
      const { request } = await client.simulateContract({
        address: USDC_CONTRACTS[from_chain],
        abi: IERC20,
        functionName: "approve",
        args: [TOKEN_MESSENGERS[from_chain] as Address, maxUint256],
      });
      await client.writeContract(request);
    }
  }

  /**
   * Asynchronously retrieves the block height of the Noble client.
   *
   * @return {Promise<number>} A promise that resolves to the block height of the Noble client.
   */
  async get_noble_block_height(): Promise<bigint> {
    const client = await this.get_noble_client();
    const height = await client.getHeight();
    return BigInt(height);
  }

  /**
   * Retrieves the current Ethereum block height.
   *
   * @return {Promise<number>} A promise that resolves to the current Ethereum block height.
   */
  async get_eth_block_height(domain: number): Promise<bigint> {
    const client = this.get_ethereum_client(REVERSE_DOMAINS[domain], true);
    return await client.getBlockNumber();
  }

  async get_gas_price(chain: Chains): Promise<bigint> {
    const client = this.get_ethereum_client(chain, true);
    return await client.getGasPrice();
  }

  async retrive_transaction_receipt(hash: Hex, chain: Chains, skip = false) {
    const client = this.get_ethereum_client(chain, true);
    try {
      if (skip) throw "Skipping waiting time";
      return await client.waitForTransactionReceipt({
        hash,
        confirmations: 2,
        timeout: 60000,
      });
    } catch (error) {
      return await client.getTransactionReceipt({
        hash,
      });
    }
  }

  /**
   * Converts a hexadecimal address to a Uint8Array.
   *
   * @param {Address} address - The hexadecimal address to convert.
   * @param {boolean} [pad=true] - Whether to pad the address with leading zeros if it is less than 64 characters.
   * @return {Uint8Array} The Uint8Array representation of the address.
   */
  get_bytes_from_hex(address: Address, pad = true): Uint8Array {
    const raw = address.slice(2);
    const buf = Buffer.from(pad ? raw.padStart(64, "0") : raw, "hex");
    return new Uint8Array(buf);
  }

  /**
   * Converts a Bech32 address to a Uint8Array.
   *
   * @param {`noble1${string}`} address - The Bech32 address to convert.
   * @param {boolean} [pad=true] - Whether to pad the resulting Uint8Array to a length of 32.
   * @return {Uint8Array} The Uint8Array representation of the Bech32 address.
   */
  get_bytes_from_bech_32(address: `noble1${string}`, pad = true): Uint8Array {
    const raw = toHex(fromBech32(address).data).replace("0x", "");
    const buf = Buffer.from(pad ? raw.padStart(64, "0") : raw, "hex");
    return new Uint8Array(buf);
  }

  /**
   * Converts an array of bytes to a hexadecimal string.
   *
   * @param {Uint8Array} bytes - The array of bytes to convert.
   * @param {boolean} [address=true] - Whether the bytes represent an address.
   * @return {Address} The hexadecimal string representation of the bytes.
   */
  get_hex_from_bytes(bytes: Uint8Array, address = true): Address {
    const data = address ? bytes.slice(-20) : bytes;
    const hex = Buffer.from(data).toString("hex");
    return `0x${hex}`;
  }

  /**
   * Converts a Uint8Array to a Bech32 address string.
   *
   * @param {Uint8Array} bytes - The array of bytes to convert.
   * @param {boolean} [address=true] - Whether the bytes represent an address.
   * @return {string} The Bech32 address string representation of the bytes.
   */
  get_bech_32_from_bytes(bytes: Uint8Array, address = true): string {
    const get_index = () => {
      let start_index = 0;
      while (start_index < bytes.length && bytes[start_index] === 0) {
        start_index++;
      }
      return start_index;
    };
    return address
      ? toBech32("noble", bytes.slice(get_index()))
      : Buffer.from(bytes).toString("base64");
  }

  /**
   * Asynchronously reverses an ENS name to its corresponding Ethereum address if the name ends with ".eth".
   * Otherwise, returns the input name as is.
   *
   * @param {string} name - The ENS name to reverse.
   * @return {Promise<string | null>} A promise that resolves to the corresponding Ethereum address if the name ends with ".eth",
   *                                  or the input name as is otherwise.
   */
  async reverse_ens_name(name: string): Promise<string | null> {
    if (name.endsWith(".eth")) {
      return this.get_ethereum_client(Chains.ethereum, true).getEnsAddress({
        name: normalize(name),
      });
    }
    return name;
  }

  /**
   * Asynchronously deposits a specified amount of tokens for burning on the Ethereum network.
   *
   * @param {Path} path - An object containing the path information for the deposit, including the source and destination chains, receiver address, and amount.
   * @param {boolean} [simulate_only=false] - Whether to simulate the deposit only without actually executing it.
   * @return {Promise<ExecutionResponse>} A promise that resolves to an object containing the transaction hash and gas used for the deposit.
   */
  private async eth_deposit_for_burn_with_caller(
    path: Path,
    { estimate_only = false }
  ): Promise<ExecutionResponse> {
    const { from_chain, to_chain, receiver_address, amount } = path;
    const client = this.get_ethereum_wallet_client(Chains[path.from_chain]);
    const receipient = this.get_bytes_from_bech_32(
      receiver_address as `noble1${string}`
    );
    const destination_caller = this.get_bytes_from_bech_32(
      DESTINATION_CALLERS[to_chain] as `noble1${string}`
    );

    const msg = {
      address: TOKEN_MESSENGERS[from_chain] as Address,
      abi: ICCTP,
      functionName: "depositForBurnWithCaller" as never,
      args: [
        amount,
        DOMAINS[to_chain],
        toHex(receipient),
        USDC_CONTRACTS[from_chain] as Address,
        toHex(destination_caller),
      ],
    };

    if (estimate_only) {
      const gas_used = await client.estimateContractGas({
        ...msg,
        account: path.sender_address as Address,
        stateOverride: [
          {
            address: USDC_CONTRACTS[from_chain] as Address,
            stateDiff: [
              {
                slot: keccak256(
                  encodeAbiParameters(
                    [
                      { name: "x", type: "address" },
                      { name: "y", type: "bytes32" },
                    ],
                    [
                      TOKEN_MESSENGERS[from_chain] as Address,
                      keccak256(
                        encodeAbiParameters(
                          [
                            { name: "x", type: "address" },
                            { name: "y", type: "uint256" },
                          ],
                          [path.sender_address as Address, 10n]
                        )
                      ),
                    ]
                  )
                ),
                value: numberToHex(maxUint256, { size: 32 }),
              },
            ],
          },
        ],
      });
      const gas_price = await this.get_gas_price(from_chain);
      const gas_in_usdc = await this.get_usd_quote_for_wei(
        gas_used * gas_price
      );
      return {
        gas: {
          deposit: {
            amount: gas_in_usdc,
            decimals: 6,
          },
          receive: {
            amount: 0n,
            decimals: 6,
          },
        },
      };
    }
    const { request } = await client.simulateContract(msg);
    const hash = await client.writeContract(request);
    const receipt = await this.retrive_transaction_receipt(hash, from_chain);
    return {
      hash,
      gas: {
        deposit: {
          amount: receipt.gasUsed * receipt.effectiveGasPrice,
          decimals: 18,
        },
      },
    };
  }

  /**
   * Asynchronously deposits a specified amount of tokens for burning on the Noble network.
   *
   * @param {Path} path - An object containing the path information for the deposit, including the source and destination chains, sender address, and amount.
   * @param {boolean} [simulate_only=false] - Whether to simulate the deposit only without actually executing it.
   * @return {Promise<ExecutionResponse>} A promise that resolves to an object containing the transaction hash and gas used for the deposit.
   */
  private async noble_deposit_for_burn_with_caller(
    path: Path,
    { estimate_only = false }
  ): Promise<ExecutionResponse> {
    const { from_chain, to_chain, sender_address, receiver_address, amount } =
      path;
    const client = await this.get_noble_wallet_client();
    const receipient = this.get_bytes_from_hex(receiver_address as Address);
    const destination_caller = this.get_bytes_from_hex(
      DESTINATION_CALLERS[to_chain] as Address
    );

    const msg = {
      typeUrl: TOKEN_MESSENGERS[from_chain],
      value: {
        from: sender_address,
        amount: amount.toString(),
        destinationDomain: DOMAINS[to_chain],
        mintRecipient: receipient,
        burnToken: USDC_CONTRACTS[from_chain],
        destinationCaller: destination_caller,
      },
    };

    const [gas_used, rg] = await Promise.all([
      client.simulate(sender_address, [msg], ""),
      this.estimate_receive_message_eth(path),
    ]);
    const fee = {
      amount: coins(20000, "uusdc"),
      gas: Math.ceil(gas_used * 1.5).toString(),
    };

    if (!estimate_only) {
      const msg_2 = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: sender_address,
          toAddress: DESTINATION_CALLERS[from_chain],
          amount: coins(rg.gas.receive.amount.toString(), "uusdc"),
        },
      };
      const result = await client.signAndBroadcast(
        sender_address,
        [msg_2, msg],
        fee,
        ""
      );
      return {
        hash: result.transactionHash,
        gas: {
          deposit: {
            amount: result.gasUsed,
            decimals: 6,
          },
          receive: rg.gas.receive,
        },
      };
    }
    return {
      gas: {
        deposit: {
          amount: BigInt(gas_used),
          decimals: 6,
        },
        receive: rg.gas.receive,
      },
    };
  }

  /**
   * Generates a receive message for a Noble transaction.
   *
   * @param {string} hash - The hash of the transaction.
   * @return {Promise<ReceiveMessage>} A promise that resolves to the generated receive message.
   */
  async generate_eth_receive_message(
    hash: string
  ): Promise<Omit<ReceiveMessage, "original_path">> {
    const client = await this.get_noble_client();
    const receipt = await client.getTx(hash);
    if (!receipt || receipt?.code !== 0) {
      if (receipt?.rawLog) {
        throw new Error(receipt.rawLog);
      }
      throw new Error(`Transaction failed with code ${receipt?.code}`);
    }
    const b64_message = receipt.events.find(
      (e) => e.type === "circle.cctp.v1.MessageSent"
    )!.attributes[0].value;
    const deposit_event = receipt.events.find(
      (e) => e.type === "circle.cctp.v1.DepositForBurn"
    )!;
    const [nonce, destination_domain] = [
      deposit_event.attributes[7].value,
      deposit_event.attributes[4].value,
    ];

    const buf_message = Buffer.from(b64_message, "base64");
    const bytes_message = new Uint8Array(buf_message);
    const message_hash = keccak256(bytes_message, "hex");
    const block_time = await this.get_eth_block_height(
      parseInt(destination_domain)
    );

    return {
      nonce: BigInt(nonce.split("").slice(1, -1).join("")),
      destination_block_height_at_deposit: block_time,
      message_bytes: toHex(bytes_message),
      message_hash,
      status: "pending",
    };
  }

  /**
   * Generates an Ethereum receive message based on the given transaction hash.
   *
   * @param {string} hash - The hash of the transaction.
   * @return {Promise<ReceiveMessage>} A promise that resolves to the generated receive message.
   * @throws {Error} If the transaction fails or the receipt is not found.
   */
  async generate_noble_receive_message(
    hash: string,
    from_chain: Chains
  ): Promise<Omit<ReceiveMessage, "original_path">> {
    const receipt = await this.retrive_transaction_receipt(
      hash as Hex,
      from_chain,
      true
    );
    const logs = parseEventLogs({
      abi: ICCTP,
      eventName: ["MessageSent", "DepositForBurn"],
      logs: receipt.logs,
    });
    const message_bytes = logs.find((log) => log.eventName === "MessageSent")!
      .args.message;
    const nonce = logs.find((log) => log.eventName === "DepositForBurn")!.args
      .nonce;
    const message_hash = keccak256(message_bytes as `0x${string}`);
    const block_time = await this.get_noble_block_height();
    return {
      nonce,
      destination_block_height_at_deposit: block_time,
      message_bytes,
      message_hash,
      status: "pending",
    };
  }

  /**
   * Receives a message on the Noble network.
   *
   * @param {ReceiveMessage} receive_message - The receive message object.
   * @param {boolean} [simulate_only=false] - Whether to simulate the transaction only.
   * @return {Promise<{ hash?: string, gas: number }>} A promise that resolves to an object containing the transaction hash and gas used.
   */
  async receive_message_noble(
    receive_message: ReceiveMessage,
    { simulate_only = false }: { simulate_only?: boolean }
  ): Promise<ExecutionResponse> {
    const {
      message_bytes,
      circle_attestation,
      original_path: path,
    } = receive_message;
    const message = this.get_bytes_from_hex(message_bytes, false);
    const attestation = this.get_bytes_from_hex(circle_attestation!, false);

    const client = await this.get_noble_wallet_client();
    const caller = DESTINATION_CALLERS[path.to_chain];

    const msg = {
      typeUrl: MESSAGE_TRANSMITTERS[path.to_chain],
      value: {
        from: caller,
        message,
        attestation,
      },
    };
    const gas_used = await client.simulate(caller, [msg], "");
    const fee = {
      amount: coins(15000, "uusdc"),
      gas: Math.ceil(gas_used * 1.2).toString(),
    };
    if (!simulate_only) {
      const result = await client.signAndBroadcast(caller, [msg], fee, "");
      return {
        hash: result.transactionHash,
        gas: {
          receive: {
            amount: BigInt(gas_used),
            decimals: 6,
          },
        },
      };
    }
    return {
      gas: {
        receive: {
          amount: BigInt(gas_used),
          decimals: 6,
        },
      },
    };
  }

  /// constructs a receive message with the given path
  /// use state override to disable nonce validation and add dummy attesters
  async estimate_receive_message_eth(path: Path) {
    const { from_chain, to_chain, receiver_address, sender_address, amount } =
      path;

    const nonce = 273585n;
    const version = 0;
    const client = this.get_ethereum_client(to_chain, true);
    const [pkeya, pkeyb] = [
      numberToHex(10e18, { size: 32 }),
      numberToHex(1e18, { size: 32 }),
    ];
    const random_attester = privateKeyToAccount(pkeya);
    const random_attester_two = privateKeyToAccount(pkeyb);

    const hash_source_and_nonce = () => {
      return keccak256(
        encodePacked(["uint32", "uint64"], [DOMAINS[from_chain], nonce])
      );
    };

    const get_nonce_override = () => {
      return {
        slot: keccak256(
          encodeAbiParameters(
            [
              { name: "x", type: "bytes32" },
              { name: "y", type: "uint256" },
            ],
            [hash_source_and_nonce(), 10n]
          )
        ),
        value: numberToHex(0n, { size: 32 }),
      };
    };

    const get_threshold_override = () => {
      return {
        slot: numberToHex(4, { size: 32 }),
        value: numberToHex(2n, { size: 32 }),
      };
    };

    const get_attester_overrides = () => {
      return [
        {
          slot: keccak256(
            encodeAbiParameters([{ name: "x", type: "uint256" }], [5n])
          ),
          value: toHex(this.get_bytes_from_hex(random_attester.address, true)),
        },
        {
          slot: numberToHex(
            hexToBigInt(
              keccak256(
                encodeAbiParameters([{ name: "x", type: "uint256" }], [5n])
              )
            ) + 1n,
            { size: 32 }
          ),
          value: toHex(
            this.get_bytes_from_hex(random_attester_two.address, true)
          ),
        },
        {
          slot: keccak256(
            encodeAbiParameters(
              [
                { name: "x", type: "address" },
                { name: "y", type: "uint256" },
              ],
              [random_attester.address, 6n]
            )
          ),
          value: numberToHex(1n, { size: 32 }),
        },
        {
          slot: keccak256(
            encodeAbiParameters(
              [
                { name: "x", type: "address" },
                { name: "y", type: "uint256" },
              ],
              [random_attester_two.address, 6n]
            )
          ),
          value: numberToHex(1n, { size: 32 }),
        },
      ];
    };

    const encode_burn_msg_body = () => {
      return encodePacked(
        ["uint32", "bytes32", "bytes32", "uint256", "bytes32"],
        [
          version,
          "0x487039debedbf32d260137b0a6f66b90962bec777250910d253781de326a716d",
          toHex(this.get_bytes_from_hex(receiver_address as Address)),
          amount,
          toHex(
            this.get_bytes_from_bech_32(sender_address as `noble1${string}`)
          ),
        ]
      );
    };

    const encode_receive_msg = () => {
      return encodePacked(
        [
          "uint32",
          "uint32",
          "uint32",
          "uint64",
          "bytes32",
          "bytes32",
          "bytes32",
          "bytes",
        ],
        [
          version,
          DOMAINS[from_chain],
          DOMAINS[to_chain],
          nonce,
          "0x00000000000000000000000057d4eaf1091577a6b7d121202afbd2808134f117",
          toHex(this.get_bytes_from_hex(TOKEN_MESSENGERS[to_chain] as Address)),
          toHex(
            this.get_bytes_from_hex(DESTINATION_CALLERS[to_chain] as Address)
          ) as Address,
          encode_burn_msg_body(),
        ]
      );
    };

    const get_attestation = (msg: `0x${string}`) => {
      const vrs_1 = ecsign(toBytes(keccak256(msg)), toBytes(pkeya));
      const sig_1 = toRpcSig(vrs_1.v, vrs_1.r, vrs_1.s) as Hex;
      const vrs_2 = ecsign(toBytes(keccak256(msg)), toBytes(pkeyb));
      const sig_2 = toRpcSig(vrs_2.v, vrs_2.r, vrs_2.s) as Hex;
      return concatHex([sig_1, sig_2]);
    };

    const slope = this.get_fee_for_usdc_amount(amount);
    const msg_bytes = encode_receive_msg();
    const sig = get_attestation(msg_bytes);

    const req = {
      address: MESSAGE_TRANSMITTERS[to_chain] as Address,
      abi: ICCTP,
      functionName: "receiveMessage" as never,
      args: [msg_bytes, sig],
      account: DESTINATION_CALLERS[to_chain] as Address,
      stateOverride: [
        {
          address: MESSAGE_TRANSMITTERS[to_chain] as Address,
          stateDiff: [
            get_nonce_override(),
            get_threshold_override(),
            ...get_attester_overrides(),
          ],
        },
        {
          address: DESTINATION_CALLERS[to_chain] as Address,
          balance: BigInt(1e18),
        },
      ],
    };

    const estimate_gas = async () => {
      return await Promise.all([
        client.estimateContractGas(req),
        this.get_gas_price(to_chain),
      ]);
    };

    const [gas_used, gas_price] = await estimate_gas();
    const gas_in_usdc = await this.get_usd_quote_for_wei(gas_used * gas_price);
    return {
      gas: {
        receive: {
          amount: slope + gas_in_usdc,
          decimals: 6,
        },
      },
    };
  }

  /**
   * Submits a pending receive message to the Pathway API.
   *
   * @param {ReceiveMessage} receive_message - The receive message to submit.
   * @param {string} api_key - The API key for authentication.
   * @return {Promise<void>} A promise that resolves when the message is submitted successfully.
   * @throws {Error} If the receive message is invalid or if any of its values are undefined.
   */
  async submit_pending(
    receive_message: Omit<ReceiveMessage, "circle_attestation">,
    hash: string,
    api_key: string
  ): Promise<void> {
    const values = Object.values(receive_message);
    for (const item of values) {
      if (typeof item === "undefined") {
        throw new Error("Invalid receive message");
      }
    }
    await this.axios_instance.post(
      `/message/new/${hash}?api_key=${api_key}`,
      receive_message
    );
  }

  /**
   * Deposits a specified amount of tokens for burning on the Noble or Ethereum network.
   *
   * @param {Path} path - An object containing the path information for the deposit, including the source and destination chains, sender or receiver address, and amount.
   * @param {string} api_key - The API key for authentication.
   * @return {Promise<Result<ExecutionResponse>>} A promise that resolves to an object containing the transaction hash and gas used for the deposit.
   */
  async deposit_for_burn_with_caller(
    path: Path,
    api_key: string
  ): Promise<Result<ExecutionResponse>> {
    this.validate_path(path);
    const cleaned_receiver = await this.reverse_ens_name(path.receiver_address);
    if (!cleaned_receiver) {
      return Err(
        "Unable to deduce receiver, did you provide a valid receipeint?",
        Error("Invalid Receipient address or ENS address")
      );
    }
    path.receiver_address = cleaned_receiver as Receiver;
    let exe_res: ExecutionResponse;
    let message: Omit<ReceiveMessage, "original_path">;
    try {
      if (path.from_chain === Chains.noble) {
        exe_res = await this.noble_deposit_for_burn_with_caller(path, {
          estimate_only: false,
        });
        message = await this.generate_eth_receive_message(exe_res.hash!);
      } else {
        await this.approve(path);
        exe_res = await this.eth_deposit_for_burn_with_caller(path, {
          estimate_only: false,
        });
        message = await this.generate_noble_receive_message(
          exe_res.hash!,
          path.from_chain
        );
      }
      await this.submit_pending(
        {
          ...message,
          block_confirmation_in_ms: SOURCE_CHAIN_CONFIRMATIONS[path.from_chain],
          original_path: path,
        },
        exe_res.hash!,
        api_key
      );
      return Ok(exe_res);
    } catch (error) {
      return Err("An error occurred while depositing", error);
    }
  }

  /**
   * Retrieves a quote for a given path.
   *
   * @param {Path} path - The path for which to retrieve the quote.
   * @return {Promise<Quote>} A promise that resolves to the quote object.
   */
  async get_quote(path: Path): Promise<Result<Quote>> {
    const { from_chain, amount } = path;
    const time = SOURCE_CHAIN_CONFIRMATIONS[from_chain];
    const cleaned_receiver = await this.reverse_ens_name(path.receiver_address);
    if (!cleaned_receiver) {
      return Err(
        "Unable to deduce receiver, did you provide a valid receipeint?",
        Error("Invalid Reciepient address or ENS name")
      );
    }
    path.receiver_address = cleaned_receiver as Receiver;

    try {
      let ec: ExecutionResponse;
      if (from_chain === Chains.noble) {
        ec = await this.noble_deposit_for_burn_with_caller(path, {
          estimate_only: true,
        });
      } else {
        ec = await this.eth_deposit_for_burn_with_caller(path, {
          estimate_only: true,
        });
      }

      return Ok({
        estimated_time_in_milliseconds: time,
        estimated_output_amount: amount - BigInt(ec.gas.receive?.amount ?? 0),
        estimated_fee: {
          execution_cost: ec.gas.deposit,
          routing_fee: ec.gas.receive,
        },
      });
    } catch (error) {
      return Err("Unable to get quote", error);
    }
  }

  /**
   * Calculates the slope of the fee for a given amount of USDC.
   *
   * @param {bigint} amount_wei - The amount of usdc for which to calculate the fee.
   * @return {bigint} The fee in usdc for the given amount.
   */
  public get_fee_for_usdc_amount(amount_wei: bigint): bigint {
    const flat_rate_wei = BigInt(0.06 * 1e6);
    const max_fee_wei = BigInt(0.81 * 1e6);
    const min_amount_wei = BigInt(10 * 1e6);
    const max_amount_wei = BigInt(15000 * 1e6);

    const slope =
      Number(max_fee_wei - flat_rate_wei) /
      Number(max_amount_wei - min_amount_wei);

    let fee_wei: bigint;
    if (amount_wei <= min_amount_wei) {
      fee_wei = flat_rate_wei;
    } else {
      fee_wei =
        flat_rate_wei +
        BigInt(Math.floor(slope * Number(amount_wei - min_amount_wei)));
    }
    return fee_wei > max_fee_wei ? max_fee_wei : fee_wei;
  }

  /**
   * Retrieves the USD quote for a given amount of Wei.
   * The quote is calculated based on the latest price feed from Chainlink.
   *
   * @param {bigint} wei - The amount of Wei for which to retrieve the USD quote.
   * @return {Promise<bigint>} A promise that resolves to the USD quote for the given amount of Wei.
   */
  async get_usd_quote_for_wei(wei: bigint): Promise<bigint> {
    const client = this.get_ethereum_client(Chains.arbitrum, true);
    const round_data = await client.readContract({
      address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      abi: AGGREGATOR_V3_INTERFACE,
      functionName: "latestRoundData",
    });
    const price_of_eth_in_usd = BigInt(round_data[1]);
    const eth_value = Number(wei) / 1e18;
    const usd_value = (eth_value * Number(price_of_eth_in_usd)) / 1e8;
    return BigInt(Math.round(usd_value * 1e6));
  }
}
