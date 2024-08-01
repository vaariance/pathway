import { coin } from "@cosmjs/amino";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import axios from "axios";
import {
  Abi,
  Address,
  createPublicClient,
  http,
  keccak256,
  parseEventLogs,
  PublicActions,
  toHex,
  Client,
  WriteContractParameters,
  WalletActions,
} from "viem";
import { normalize } from "viem/ens";
import {
  AGGREGATOR_V3_INTERFACE,
  Chains,
  DESTINATION_CALLERS,
  DOMAINS,
  ETH_USD_PRICE_FEEDS,
  ICCTP,
  IERC20,
  MESSAGE_TRANSMITTERS,
  NOBLE_RPC,
  PROXY_CONTRACTS,
  REVERSE_DOMAINS,
  SOURCE_CHAIN_CONFIRMATIONS,
  TOKEN_MESSENGERS,
  USDC_CONTRACTS,
  VIEM_NETWORKS,
} from "../constants/index.js";

export type SerializableResult<T, E> =
  | {
      ok: false;
      value?: undefined;
      error: E;
    }
  | {
      ok: true;
      value: T;
      error?: undefined;
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

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
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

export type Receiver = `0x${string}` | `noble1${string}` | `${string}.eth`;

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
    amount: number | bigint;
    denom: "eth" | "usd";
    decimals: number;
    free: boolean;
  };
};

export type ReceiveMessage = {
  message_bytes: `0x${string}`;
  message_hash: `0x${string}`;
  circle_attestation?: `0x${string}`;
  block_confirmation_in_ms?: number;
  status: "pending" | "attested" | "received" | "failed";
  destination_block_height_at_deposit: bigint;
  nonce: bigint;
  original_path?: Path;
};

export type ViemWalletClient<T> = T extends WalletActions
  ? Client & T & PublicActions
  : Client & T;

export type CosmosWalletClient<R> = R extends SigningStargateClient
  ? SigningStargateClient
  : StargateClient;

export type PathwayClient<T, R> = ViemWalletClient<T> | CosmosWalletClient<R>;

export type Quote = {
  estimated_fee: Record<string, Record<string, unknown>>;
  estimated_time_in_milliseconds: number;
  estimated_output_amount: bigint;
};

export class PathwayOptions<T, R> {
  public viem_client?: T;
  public noble_client?: R;

  constructor({
    viem_client,
    noble_client,
  }: {
    viem_client?: T;
    noble_client?: R;
  }) {
    this.viem_client = viem_client;
    this.noble_client = noble_client;
  }
}

export class Pathway<T, R> {
  options?: PathwayOptions<T, R>;
  constructor(options?: PathwayOptions<T, R>) {
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
   * @return {ViemWalletClient} The Ethereum client.
   * @throws {Error} If the Viem client is not available.
   */
  private get_ethereum_client(chain?: Chains) {
    if (this.options?.viem_client) {
      return this.options.viem_client as T & ViemWalletClient<PublicActions>;
    }
    if (chain) {
      return createPublicClient({
        chain: VIEM_NETWORKS[chain],
        transport: http(),
      });
    }
    throw new Error("Viem client is not provided and chain is not specified");
  }

  /**
   * Retrieves the Ethereum wallet client.
   *
   * @return {ViemWalletClient<WalletActions>} The Ethereum wallet client.
   * @throws {Error} If the Viem wallet client is not provided or does not have wallet capabilities.
   */
  private get_ethereum_wallet_client(): ViemWalletClient<WalletActions> {
    if (!this.options?.viem_client) {
      throw new Error("Viem wallet client is not provided");
    }

    if (
      typeof this.options.viem_client === "object" &&
      "writeContract" in this.options.viem_client
    ) {
      return this.options.viem_client as T & ViemWalletClient<WalletActions>;
    }

    throw new Error("Viem wallet client does not have wallet capabilities");
  }

  /**
   * Retrieves the Noble client.
   *
   * @return {Promise<StargateClient>} The Noble client.
   * @throws {Error} If the Noble client is not available or if the Noble client expects an offline signer.
   */
  private async get_noble_client() {
    if (this.options?.noble_client) {
      return this.options.noble_client as R &
        CosmosWalletClient<StargateClient>;
    }
    return StargateClient.connect(NOBLE_RPC);
  }

  /**
   * Retrieves the Noble wallet client.
   *
   * @return {Promise<SigningStargateClient>} The Noble wallet client.
   * @throws {Error} If the Noble client is not provided or if it is not an instance of SigningStargateClient.
   */
  private async get_noble_wallet_client() {
    if (!this.options?.noble_client) {
      throw new Error("Noble client is not provided");
    }
    if (!(this.options.noble_client instanceof SigningStargateClient)) {
      throw new Error(
        "Noble client is provided but is not a SigningStargateClient"
      );
    }
    return this.options.noble_client;
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
    const { from_chain, amount } = path;
    const allowance = await this.get_allowance(path);

    const client = this.get_ethereum_wallet_client();

    if (!allowance && from_chain !== Chains.noble) {
      const { request } = await client.simulateContract({
        address: USDC_CONTRACTS[from_chain],
        abi: IERC20,
        functionName: "approve",
        args: [TOKEN_MESSENGERS[from_chain], amount],
      });
      await client.writeContract(request as WriteContractParameters);
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
    const client = this.get_ethereum_client(REVERSE_DOMAINS[domain]);
    return await client.getBlockNumber();
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
    const raw = fromBech32(address).data;
    const padded = new Uint8Array(32);
    padded.set(raw, 32 - raw.length);
    return pad ? padded : raw;
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
      return await this.get_ethereum_client(Chains.ethereum).getEnsAddress({
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
    { simulate_only = false }
  ): Promise<ExecutionResponse> {
    const { from_chain, to_chain, receiver_address, amount } = path;
    const client = this.get_ethereum_wallet_client();

    const receipient = this.get_bytes_from_bech_32(
      receiver_address as `noble1${string}`
    );

    const destination_caller = this.get_bytes_from_bech_32(
      DESTINATION_CALLERS[to_chain] as `noble1${string}`
    );

    const msg = {
      address: TOKEN_MESSENGERS[from_chain] as Address,
      abi: ICCTP,
      functionName: "depositForBurnWithCaller",
      args: [
        amount,
        DOMAINS[to_chain],
        toHex(receipient),
        USDC_CONTRACTS[from_chain] as Address,
        toHex(destination_caller),
      ],
    };
    //@ts-expect-error it is not infering type from non obg literal
    const gas_used = await client.estimateContractGas({ ...msg });
    //@ts-expect-error it is not infering type from non obg literal
    const { request } = await client.simulateContract({
      ...msg,
      gas: gas_used,
    });
    if (!simulate_only) {
      const hash = await client.writeContract(
        request as WriteContractParameters
      );
      const confirmations = from_chain === "ethereum" ? 3 : 1;
      await client.waitForTransactionReceipt({ hash, confirmations });
      return {
        hash,
        gas: {
          amount: gas_used,
          denom: "eth",
          decimals: 18,
          free: false,
        },
      };
    }
    return {
      gas: {
        amount: gas_used,
        denom: "eth",
        decimals: 18,
        free: false,
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
    { simulate_only = false }
  ): Promise<ExecutionResponse> {
    const { from_chain, to_chain, sender_address, amount } = path;
    const client = await this.get_noble_wallet_client();
    const receipient = this.get_bytes_from_hex(
      PROXY_CONTRACTS[to_chain]!.address as Address
    );

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

    const gas_used = await client.simulate(sender_address, [msg], "");
    const fee = {
      amount: [coin(0, "uusd")],
      gas: gas_used.toString(),
    };
    if (!simulate_only) {
      const result = await client.signAndBroadcast(
        sender_address,
        [msg],
        fee,
        ""
      );
      return {
        hash: result.transactionHash,
        gas: {
          amount: BigInt(gas_used),
          denom: "usd",
          decimals: 6,
          free: false,
        },
      };
    }

    return {
      gas: {
        amount: BigInt(gas_used),
        denom: "usd",
        decimals: 6,
        free: false,
      },
    };
  }

  /**
   * Generates a receive message for a Noble transaction.
   *
   * @param {string} hash - The hash of the transaction.
   * @return {Promise<ReceiveMessage>} A promise that resolves to the generated receive message.
   */
  async generate_eth_receive_message(hash: string): Promise<ReceiveMessage> {
    const client = await this.get_noble_client();
    const receipt = await client.getTx(hash);
    if (!receipt || receipt?.code !== 0) {
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
      nonce: BigInt(nonce),
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
  ): Promise<ReceiveMessage> {
    const client = await this.get_ethereum_client(from_chain);
    const receipt = await client.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });

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
    {
      simulate_only = false,
      outside_caller,
    }: { simulate_only?: boolean; outside_caller?: `noble1${string}` }
  ): Promise<ExecutionResponse> {
    const {
      message_bytes,
      circle_attestation,
      original_path: path,
    } = receive_message;
    const message = this.get_bytes_from_hex(message_bytes, false);
    const attestation = this.get_bytes_from_hex(circle_attestation!, false);

    const client = await this.get_noble_wallet_client();
    const caller = outside_caller ?? DESTINATION_CALLERS[path!.to_chain];

    const msg = {
      typeUrl: MESSAGE_TRANSMITTERS[path!.to_chain],
      value: {
        from: caller,
        message,
        attestation,
      },
    };
    const gas_used = await client.simulate(caller, [msg], "");
    const fee = {
      amount: [coin(0, "uusd")],
      gas: gas_used.toString(),
    };
    if (!simulate_only) {
      const result = await client.signAndBroadcast(caller, [msg], fee, "");
      return {
        hash: result.transactionHash,
        gas: {
          amount: BigInt(gas_used),
          denom: "usd",
          decimals: 6,
          free: true,
        },
      };
    }
    return {
      gas: {
        amount: BigInt(gas_used),
        denom: "usd",
        decimals: 6,
        free: true,
      },
    };
  }

  /**
   * Receives a message on the Ethereum network.
   *
   * @param {ReceiveMessage} receive_message - The receive message object.
   * @param {boolean} [simulate_only=false] - Whether to simulate the transaction only.
   * @return {Promise<{ hash?: string, gas: number }>} A promise that resolves to an object containing the transaction hash and gas used.
   */
  async receive_message_eth(
    receive_message: ReceiveMessage,
    { simulate_only = false }
  ): Promise<ExecutionResponse> {
    const {
      message_bytes,
      circle_attestation,
      original_path: path,
    } = receive_message;

    const client = this.get_ethereum_wallet_client();
    const proxy = PROXY_CONTRACTS[path!.to_chain];

    const msg = {
      address: proxy?.address as Address,
      abi: ICCTP,
      functionName: "receiveMessage",
      args: [message_bytes as Address, circle_attestation as Address],
    };

    //@ts-expect-error it is not infering type from non obg literal
    const gas_used = await client.estimateContractGas({ ...msg });

    //@ts-expect-error it is not infering type from non obg literal
    const { request } = await client.simulateContract({
      ...msg,
      gas: gas_used,
    });
    if (!simulate_only) {
      const hash = await client.writeContract(
        request as WriteContractParameters
      );
      return {
        hash,
        gas: {
          amount: gas_used,
          denom: "eth",
          decimals: 18,
          free: false,
        },
      };
    }
    return {
      gas: {
        amount: gas_used,
        denom: "eth",
        decimals: 18,
        free: false,
      },
    };
  }

  async estimate_receive_message_eth(
    receive_message: ReceiveMessage
  ): Promise<ExecutionResponse> {
    const {
      message_bytes,
      circle_attestation,
      original_path: path,
    } = receive_message;

    const client = this.get_ethereum_client(path?.to_chain);
    const proxy = PROXY_CONTRACTS[path!.to_chain];

    const slope = this.get_fee_for_usdc_amount(path!.amount);

    const gas_used = await client.estimateContractGas({
      address: proxy?.address as Address,
      abi: proxy?.abi as Abi,
      functionName: "receiveMessage",
      args: [path!.receiver_address, message_bytes, circle_attestation, slope],
      account: proxy?.address as Address,
    });

    const gas_in_usdc = await this.get_usd_quote_for_wei(
      gas_used,
      path?.to_chain
    );
    const total_fee = slope + gas_in_usdc;

    return {
      gas: {
        amount: total_fee,
        denom: "usd",
        decimals: 6,
        free: false,
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
    receive_message: ReceiveMessage,
    hash: string,
    api_key: string
  ): Promise<void> {
    const values = Object.values(receive_message);
    if (values.length !== 6) {
      throw new Error("Invalid receive message");
    }

    for (const item of values) {
      if (typeof item === "undefined") {
        throw new Error("Invalid receive message");
      }
    }

    const axios_instance = axios.create({
      baseURL: "https://api.thepathway.to",
    });
    await axios_instance.post(
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
    await this.approve(path);

    const cleaned_receiver = await this.reverse_ens_name(path.receiver_address);
    if (!cleaned_receiver) {
      return Err(
        "Unable to deduce receiver, did you provide a valid receipeint?"
      );
    }
    path.receiver_address = cleaned_receiver as Receiver;

    let execution_response: ExecutionResponse;
    let message: ReceiveMessage;
    if (path.from_chain === Chains.noble) {
      execution_response = await this.noble_deposit_for_burn_with_caller(path, {
        simulate_only: false,
      });
      message = await this.generate_eth_receive_message(
        execution_response.hash!
      );
    } else {
      execution_response = await this.eth_deposit_for_burn_with_caller(path, {
        simulate_only: false,
      });
      message = await this.generate_noble_receive_message(
        execution_response.hash!,
        path.from_chain
      );
    }

    await this.submit_pending(
      {
        ...message,
        block_confirmation_in_ms: SOURCE_CHAIN_CONFIRMATIONS[path.from_chain],
        original_path: path,
      },
      execution_response.hash!,
      api_key
    );

    return Ok(execution_response);
  }

  /**
   * Retrieves a quote for a given path.
   *
   * @param {Path} path - The path for which to retrieve the quote.
   * @return {Promise<Quote>} A promise that resolves to the quote object.
   */
  async get_quote(path: Path): Promise<Result<Quote>> {
    const { from_chain, to_chain, amount } = path;
    const time = SOURCE_CHAIN_CONFIRMATIONS[from_chain];

    const cleaned_receiver = await this.reverse_ens_name(path.receiver_address);
    if (!cleaned_receiver) {
      return Err(
        "Unable to deduce receiver, did you provide a valid receipeint?"
      );
    }
    path.receiver_address = cleaned_receiver as Receiver;

    let execution_cost: ExecutionResponse;
    if (from_chain === Chains.noble) {
      execution_cost = await this.noble_deposit_for_burn_with_caller(path, {
        simulate_only: true,
      });
    } else {
      execution_cost = await this.eth_deposit_for_burn_with_caller(path, {
        simulate_only: true,
      });
    }

    let receive_message: ReceiveMessage;
    if (to_chain !== Chains.noble) {
      receive_message = await this.generate_eth_receive_message(
        "EF3EF3FF88F9B67D166856713D26BE9A55B1957FE0E0EE8FBC2555BBDCBF3406"
      );
    }

    let routing_fee;
    if (to_chain === Chains.noble) {
      routing_fee = {
        gas: {
          amount: BigInt(0),
          denom: "usd",
          decimals: 6,
          free: true,
        },
      };
    } else {
      const message: ReceiveMessage = {
        ...receive_message!,
        circle_attestation:
          "0x09d3d8bdd081f0134d320d0f47dafe6f0b1e9361e1932b3d93e6243fe27407d5002fe4e105188dc65045ef4fc4ae00615880624cb4c30412828053a314c9f0ce1b7abe99afe5e612b737bce57113d4ef58f5fb8a38a3f4c9628843cbc45831090e0ba066888d0845556b53d3ea31a7379dfb5b89085a5e1c867255be1f1b7b12291c",
        block_confirmation_in_ms: time,
        original_path: path,
      };
      routing_fee = await this.estimate_receive_message_eth(message);
    }

    return Ok({
      estimated_time_in_milliseconds: time,
      estimated_output_amount: amount - BigInt(routing_fee.gas.amount),
      estimated_fee: {
        execution_cost: execution_cost.gas,
        routing_fee: routing_fee.gas,
      },
    });
  }

  /**
   * Calculates the slope of the fee for a given amount of USDC.
   *
   * @param {bigint} amount_wei - The amount of usdc for which to calculate the fee.
   * @return {bigint} The fee in usdc for the given amount.
   */
  public get_fee_for_usdc_amount(amount_wei: bigint): bigint {
    // additional 0.01 for paymaster costs
    const flat_rate_wei = BigInt(0.09 * 1e6);
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
  async get_usd_quote_for_wei(wei: bigint, chain?: Chains): Promise<bigint> {
    const client = this.get_ethereum_client(chain);

    const round_data = await client.readContract({
      address: ETH_USD_PRICE_FEEDS[chain ?? client.chain!.name.toLowerCase()],
      abi: AGGREGATOR_V3_INTERFACE,
      functionName: "latestRoundData",
    });

    const price_of_eth_in_usd = BigInt(round_data[1]);

    // Convert to float for more precise calculation
    const eth_value = Number(wei) / 1e18;
    const usd_value = (eth_value * Number(price_of_eth_in_usd)) / 1e8;

    // Convert back to bigint, scaling up by 1e6 for 6 decimal places of precision
    return BigInt(Math.round(usd_value * 1e6));
  }
}
