import { fromBech32, toBech32 } from '@cosmjs/encoding'
import { coins, OfflineDirectSigner, Registry } from '@cosmjs/proto-signing'
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate'
import {
  cctp_types,
  CrossChainAddress,
  ExecutionResponse,
  Path,
  PathwayOptions,
  Quote,
  ReceiveMessage
} from './types'

import {
  Account,
  Address,
  Chain,
  Client,
  concatHex,
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  hashTypedData,
  Hex,
  hexToBigInt,
  hexToNumber,
  http,
  keccak256,
  numberToHex,
  parseEventLogs,
  publicActions,
  slice,
  toHex,
  TransactionReceipt,
  Transport
} from 'viem'
import { normalize } from 'viem/ens'

import {
  AA_TRANSPORT,
  AA_TRANSPORT_HEADERS,
  Chains,
  DESTINATION_CALLERS,
  DOMAINS,
  MESSAGE_TRANSMITTERS,
  MULLTICALLER_WITH_PERMIT,
  NATIVE_USD_PRICE_FEEDS,
  REVERSE_DOMAINS,
  REVERSE_DOMAINS_TESTNETS,
  RPC_TRANSPORTS,
  SOURCE_CHAIN_CONFIRMATIONS,
  TOKEN_MESSENGERS,
  USDC_CONTRACTS,
  VIEM_NETWORKS
} from './constants'

import { AGGREGATOR_V3_INTERFACE, ICCTP, IERC20, MULLTICALLER_WITH_PERMIT_ABI } from './abis'

import { createBundlerClient, entryPoint07Address } from 'viem/account-abstraction'
import { privateKeyToAccount } from 'viem/accounts'

import { toLightSmartAccount } from 'permissionless/accounts'
import { getUserOpGasFees } from 'thirdweb/wallets/smart'
import { ecsign, toBytes, toRpcSig } from '@ethereumjs/util'
import { Err, Ok, Result } from './fn'
import { createThirdwebClient, defineChain, ThirdwebClient } from 'thirdweb'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const create_default_registry = (): Registry => {
  return new Registry(cctp_types)
}

export const pathway = <
  T extends Account | Address | undefined,
  R extends OfflineDirectSigner | undefined
>(
  options: PathwayOptions<T, R>
) => {
  const thirdweb_actions =
    (thirdwebClient: ThirdwebClient) =>
    <TTransport extends Transport, TChain extends Chain | undefined = Chain | undefined>(
      client: Client<TTransport, TChain>
    ) => ({
      getUserOperationGasPrice: async () =>
        getUserOpGasFees({
          options: {
            client: thirdwebClient,
            chain: defineChain({
              ...(client.chain as any),
              blockExplorers: undefined
            }),
            entrypointAddress: entryPoint07Address
          }
        })
    })
  const clients = {
    _custom_actions() {
      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_SECRET
      })
      return thirdweb_actions(client)
    },

    ethereum_wallet_client(chain: Chains) {
      if (!options.viem_signer) {
        throw new Error('Viem account is not provided')
      }
      if (typeof options.viem_signer === 'string') {
        return createWalletClient({
          account: options.viem_signer as Address,
          chain: VIEM_NETWORKS[chain],
          transport: custom((window as any).ethereum)
        }).extend(publicActions)
      }
      return createWalletClient({
        account: options.viem_signer as Account,
        chain: VIEM_NETWORKS[chain],
        transport: http(RPC_TRANSPORTS[chain])
      }).extend(publicActions)
    },
    async noble_wallet_client(chain: Chains) {
      if (!options.noble_signer) {
        throw new Error('Noble offline signer is not provided')
      }
      return SigningStargateClient.connectWithSigner(RPC_TRANSPORTS[chain], options.noble_signer!, {
        registry: create_default_registry()
      })
    },
    ethereum_public_client(chain: Chains, strict = false) {
      if (options.viem_signer && !strict) {
        return this.ethereum_wallet_client(chain)
      }
      return createPublicClient({
        chain: VIEM_NETWORKS[chain],
        transport: http(RPC_TRANSPORTS[chain], { batch: true })
      })
    },
    async noble_public_client(chain: Chains) {
      if (options.noble_signer) {
        return this.noble_wallet_client(chain)
      }
      return StargateClient.connect(RPC_TRANSPORTS[chain])
    },
    async smart_account_client(to_chain: Chains) {
      const owner = privateKeyToAccount(numberToHex(18n, { size: 32 }))
      const client = this.ethereum_public_client(to_chain, true)
      const rpc = AA_TRANSPORT(client.chain?.id)
      const account = await toLightSmartAccount({
        client,
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7'
        },
        owner,
        version: '2.0.0',
        address: DESTINATION_CALLERS[to_chain] as Address
      })
      const bundlerClient = createBundlerClient({
        account,
        client,
        transport: http(rpc, {
          fetchOptions: AA_TRANSPORT_HEADERS()
        }),
        chain: VIEM_NETWORKS[to_chain]
      }).extend(this._custom_actions())
      return bundlerClient
    }
  }

  const utilities = {
    validate_path(path: Path) {
      const { from_chain, to_chain, receiver_address, amount } = path
      if (receiver_address.startsWith('noble1') && to_chain !== Chains.noble) {
        throw new Error('Receiver must be Noble address')
      }

      if (amount <= BigInt(0)) {
        throw new Error('Amount is required and must be greater than 0')
      }

      if (from_chain === to_chain) {
        throw new Error('To and from Chains cannot be the same')
      }

      const testnet_chains = [Chains.grand, Chains.fuji, Chains.sepolia]
      if (options.platform === 'testnet') {
        const valid_route =
          testnet_chains.includes(path.from_chain) && testnet_chains.includes(path.to_chain)
        if (!valid_route) {
          throw new Error('To and from Chains must be testnests')
        }
      } else {
        const valid_route = !(
          testnet_chains.includes(path.from_chain) && testnet_chains.includes(path.to_chain)
        )
        if (!valid_route) {
          throw new Error('To and from Chains must be mainnets')
        }
      }
    },
    chain_from_domain(domain: number) {
      switch (options.platform) {
        case 'mainnet':
          return REVERSE_DOMAINS[domain]
        case 'testnet':
          return REVERSE_DOMAINS_TESTNETS[domain]
      }
    },
    async get_noble_block_height(domain: number): Promise<bigint> {
      const client = await clients.noble_public_client(this.chain_from_domain(domain))
      const height = await client.getHeight()
      return BigInt(height)
    },
    async get_eth_block_height(domain: number): Promise<bigint> {
      const client = clients.ethereum_public_client(this.chain_from_domain(domain), true)
      return await client.getBlockNumber()
    },
    async get_eth_tx_receipt(
      hash: Hex,
      chain: Chains,
      skip_tx_wait = false,
      timeout = 20000,
      recursive_depth = 0
    ): Promise<TransactionReceipt> {
      if (recursive_depth === 3) {
        throw new Error('Transaction receipt not found, contact pathway. Tx Hash: ' + hash)
      }
      const client = clients.ethereum_public_client(chain)
      const get_tx_receipt = async () =>
        await client
          .getTransactionReceipt({
            hash
          })
          .catch(() =>
            this.get_eth_tx_receipt(hash, chain, false, timeout + 5000, recursive_depth + 1)
          )

      if (skip_tx_wait) return get_tx_receipt()
      try {
        return await client.waitForTransactionReceipt({
          hash,
          timeout
        })
      } catch (error) {
        return get_tx_receipt()
      }
    },
    bytes_from_hex(address: CrossChainAddress, pad = true): Uint8Array {
      const raw = address.slice(2)
      const buf = Buffer.from(pad ? raw.padStart(64, '0') : raw, 'hex')
      return new Uint8Array(buf)
    },
    bytes_from_bech_32(address: CrossChainAddress, pad = true): Uint8Array {
      const raw = toHex(fromBech32(address).data).replace('0x', '')
      const buf = Buffer.from(pad ? raw.padStart(64, '0') : raw, 'hex')
      return new Uint8Array(buf)
    },
    hex_from_bytes(bytes: Uint8Array, address = true): Address {
      const data = address ? bytes.slice(-20) : bytes
      const hex = Buffer.from(data).toString('hex')
      return `0x${hex}`
    },
    bech_32_from_bytes(bytes: Uint8Array, address = true): string {
      const get_index = () => {
        let start_index = 0
        while (start_index < bytes.length && bytes[start_index] === 0) {
          start_index++
        }
        return start_index
      }
      return address
        ? toBech32('noble', bytes.slice(get_index()))
        : Buffer.from(bytes).toString('base64')
    },
    async reverse_ens_name(name: CrossChainAddress): Promise<CrossChainAddress | null> {
      if (name.endsWith('.eth')) {
        return clients.ethereum_public_client(Chains.ethereum, true).getEnsAddress({
          name: normalize(name)
        })
      }
      return name
    },
    async parse_receiver(receiver_address: CrossChainAddress) {
      const cleaned_receiver = await this.reverse_ens_name(receiver_address)
      if (!cleaned_receiver) {
        return Err(
          'Unable to deduce receiver, did you provide a valid receipeint?',
          Error('Invalid Reciepient address or ENS name')
        )
      }
      return Ok(cleaned_receiver)
    },
    async get_usd_quote_for_wei(wei: bigint, chain?: Chains): Promise<bigint> {
      const c = chain === Chains.polygon || !chain ? Chains.arbitrum : chain
      const client = clients.ethereum_public_client(c, true)
      const round_data = await client.readContract({
        address: NATIVE_USD_PRICE_FEEDS[c],
        abi: AGGREGATOR_V3_INTERFACE,
        functionName: 'latestRoundData'
      })
      const price_of_eth_in_usd = BigInt(round_data[1])
      const eth_value = Number(wei) / 1e18
      const usd_value = (eth_value * Number(price_of_eth_in_usd)) / 1e8
      return BigInt(Math.round(usd_value * 1e6))
    },
    fee_for_usdc_amount(amount_wei: bigint): bigint {
      const flat_rate_wei = BigInt(0.16 * 1e6)
      const max_fee_wei = BigInt(1.31 * 1e6)
      const min_amount_wei = BigInt(10 * 1e6)
      const max_amount_wei = BigInt(21000 * 1e6)

      const slope = Number(max_fee_wei - flat_rate_wei) / Number(max_amount_wei - min_amount_wei)

      let fee_wei: bigint
      if (amount_wei <= min_amount_wei) {
        fee_wei = flat_rate_wei
      } else {
        fee_wei = flat_rate_wei + BigInt(Math.floor(slope * Number(amount_wei - min_amount_wei)))
      }
      return fee_wei > max_fee_wei ? max_fee_wei : fee_wei
    },
    get_address_bytes(chain: Chains, address: CrossChainAddress, pad = true) {
      return chain === Chains.noble
        ? this.bytes_from_bech_32(address, pad)
        : this.bytes_from_hex(address, pad)
    }
  }

  const permit = {
    async generate_permit_message(path: Path) {
      const { sender_address, from_chain, amount } = path
      const client = clients.ethereum_public_client(from_chain, true)
      const chain = VIEM_NETWORKS[from_chain]!
      const contract = USDC_CONTRACTS[from_chain] as Address
      const [nonce, version, name] = await Promise.all([
        client.readContract({
          address: contract,
          abi: IERC20,
          functionName: 'nonces',
          args: [sender_address as Address]
        }),
        client.readContract({
          address: contract,
          abi: IERC20,
          functionName: 'version'
        }),
        client.readContract({
          address: contract,
          abi: IERC20,
          functionName: 'name'
        })
      ])
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }
      const domain = {
        name,
        version,
        chainId: chain.id,
        verifyingContract: contract
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600
      const relayer = DESTINATION_CALLERS[from_chain] as Address
      const packed = (BigInt(deadline) << 160n) | hexToBigInt(relayer)

      const message = {
        owner: sender_address,
        spender: MULLTICALLER_WITH_PERMIT[from_chain]!,
        value: amount,
        nonce,
        deadline: packed
      }

      return {
        message,
        domain,
        type: 'Permit' as 'Permit',
        types
      }
    },
    async sign_permit(path: Path) {
      const { message, domain, type, types } = await this.generate_permit_message(path)
      const client = clients.ethereum_wallet_client(path.from_chain)
      const signature = await client.signTypedData({
        message,
        domain,
        primaryType: type,
        types
      })
      const [r, s, v] = [
        slice(signature, 0, 32),
        slice(signature, 32, 64),
        slice(signature, 64, 65)
      ]
      return { r, s, v: hexToNumber(v), deadline: message.deadline }
    }
  }

  const deposit = {
    async deposit_on_eth(path: Path) {
      utilities.validate_path(path)

      const { gas } = await this.estimate_deposit_on_eth(path)
      let rg
      switch (path.to_chain) {
        case Chains.noble:
          const { gas: noble_gas } = (rg = await receive.estimate_receive_on_noble(path))
          path.fee = noble_gas.receive.amount
          break
        default:
          const { gas: eth_gas } = (rg = await receive.estimate_receive_on_eth(path))
          path.fee = eth_gas.receive.amount
      }
      path.fee += gas.deposit.amount
      const signature = await permit.sign_permit(path)
      const multicall_msg = this.generate_eth_deposit_multicall_message(path, signature)
      const encoded_multicall = encodeFunctionData(multicall_msg)
      return {
        hash: keccak256(encoded_multicall),
        calls: [
          {
            order: 0,
            type: 'contract' as 'contract' | 'api',
            data: encoded_multicall as string,
            chain: path.from_chain,
            api_options: undefined
          }
        ],
        gas: {
          deposit: gas.deposit,
          receive: rg.gas.receive
        }
      }
    },
    async deposit_on_noble(path: Path) {
      utilities.validate_path(path)

      const { from_chain, sender_address } = path
      const client = await clients.noble_wallet_client(from_chain)
      const [{ gas }, rg] = await Promise.all([
        this.estimate_deposit_on_noble(path),
        receive.estimate_receive_on_eth(path)
      ])
      const fee = {
        amount: coins(20000, 'uusdc'),
        gas: Math.ceil(Number(gas.deposit.amount) * 1.5).toString()
      }
      const msg_2 = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: sender_address,
          toAddress: DESTINATION_CALLERS[from_chain],
          amount: coins(rg.gas.receive.amount.toString(), 'uusdc')
        }
      }
      const msg = await this.generate_noble_deposit_message({
        ...path,
        fee: rg.gas.receive.amount
      })
      const result = await client.signAndBroadcast(sender_address, [msg_2, msg], fee, 'pathway')
      return {
        hash: result.transactionHash,
        gas: {
          deposit: {
            amount: result.gasUsed,
            decimals: 6
          },
          receive: rg.gas.receive
        }
      }
    },
    generate_eth_deposit_message(path: Path) {
      const { from_chain, to_chain, receiver_address, amount, fee } = path
      const receipient = utilities.get_address_bytes(to_chain, receiver_address)
      const destination_caller = utilities.get_address_bytes(
        to_chain,
        DESTINATION_CALLERS[to_chain] as CrossChainAddress
      )
      const encoded_message = encodeFunctionData({
        abi: ICCTP,
        functionName: 'depositForBurnWithCaller',
        args: [
          amount - fee,
          DOMAINS[to_chain],
          toHex(receipient),
          USDC_CONTRACTS[from_chain] as Address,
          toHex(destination_caller)
        ]
      })
      return encoded_message
    },
    generate_eth_deposit_multicall_message(
      path: Path,
      signature: Awaited<ReturnType<typeof permit.sign_permit>>
    ) {
      const { sender_address, from_chain, amount } = path
      const cctp_message = this.generate_eth_deposit_message(path)

      const msg = {
        account: DESTINATION_CALLERS[from_chain] as Address,
        address: MULLTICALLER_WITH_PERMIT[from_chain] as Address,
        abi: MULLTICALLER_WITH_PERMIT_ABI,
        functionName: 'executeCallWithPermit' as never,
        args: [
          {
            user: sender_address as Address,
            amount: amount,
            message: cctp_message,
            deadline: signature.deadline,
            v: signature.v,
            r: signature.r,
            s: signature.s
          }
        ]
      }
      return msg
    },
    async generate_noble_deposit_message(path: Path) {
      const { from_chain, to_chain, sender_address, receiver_address, amount, fee } = path
      const receipient = utilities.get_address_bytes(to_chain, receiver_address as Address)
      const destination_caller = utilities.get_address_bytes(
        to_chain,
        DESTINATION_CALLERS[to_chain] as Address
      )

      const msg = {
        typeUrl: '/circle.cctp.v1.MsgDepositForBurnWithCaller',
        value: {
          from: sender_address,
          amount: (amount - fee).toString(),
          destinationDomain: DOMAINS[to_chain],
          mintRecipient: receipient,
          burnToken: USDC_CONTRACTS[from_chain],
          destinationCaller: destination_caller
        }
      }

      return msg
    },
    async estimate_deposit_on_eth(path: Path) {
      const { from_chain, amount } = path
      const pkeya = numberToHex(10e18, { size: 32 })
      const random_signer = privateKeyToAccount(pkeya)
      path.sender_address = random_signer.address
      path.fee = BigInt(5e6)
      const { message, domain, type, types } = await permit.generate_permit_message(path)
      const vrs = ecsign(
        toBytes(
          hashTypedData({
            message,
            domain,
            primaryType: type,
            types
          })
        ),
        toBytes(pkeya)
      )
      const multicall_msg = this.generate_eth_deposit_multicall_message(path, {
        r: toHex(vrs.r),
        s: toHex(vrs.s),
        v: Number(vrs.v),
        deadline: message.deadline
      })
      const client = await clients.ethereum_public_client(from_chain, true)
      const gas_used = await client.estimateContractGas({
        ...multicall_msg,
        account: DESTINATION_CALLERS[from_chain] as Address,
        stateOverride: [
          {
            address: USDC_CONTRACTS[from_chain] as Address,
            stateDiff: [
              {
                slot: keccak256(
                  encodeAbiParameters(
                    [
                      { name: 'x', type: 'address' },
                      { name: 'y', type: 'uint256' }
                    ],
                    [path.sender_address, 9n]
                  )
                ),
                value: numberToHex(amount, { size: 32 })
              }
            ]
          }
        ]
      })
      const gas_price = await client.getGasPrice()
      const gas_in_usdc = await utilities.get_usd_quote_for_wei(gas_used * gas_price, from_chain)
      return {
        gas: {
          deposit: {
            amount: gas_in_usdc,
            decimals: 6
          }
        }
      }
    },
    async estimate_deposit_on_noble(path: Path) {
      const client = await clients.noble_wallet_client(path.from_chain)
      const msg = await this.generate_noble_deposit_message(path)
      const gas_used = await client.simulate(path.sender_address, [msg], '')
      return {
        gas: {
          deposit: {
            amount: BigInt(gas_used),
            decimals: 6
          }
        }
      }
    }
  }

  const receive = {
    async receive_on_noble(
      receive_message: ReceiveMessage,
      platform: 'mainnet' | 'testnet' = 'mainnet'
    ): Promise<ExecutionResponse> {
      if (platform !== options.platform) options.platform = platform
      const { message_bytes, circle_attestation, original_path: path } = receive_message
      const message = utilities.get_address_bytes(path.from_chain, message_bytes, false)
      const attestation = utilities.get_address_bytes(path.from_chain, circle_attestation!, false)

      const client = await clients.noble_wallet_client(path.to_chain)
      const caller = DESTINATION_CALLERS[path.to_chain]

      const msg = {
        typeUrl: '/circle.cctp.v1.MsgReceiveMessage',
        value: {
          from: caller,
          message,
          attestation
        }
      }
      const gas_used = await client.simulate(caller, [msg], '')
      const fee = {
        amount: coins(15000, 'uusdc'),
        gas: Math.ceil(gas_used * 1.2).toString()
      }
      const result = await client.signAndBroadcast(caller, [msg], fee, '')
      return {
        hash: result.transactionHash,
        gas: {
          receive: {
            amount: BigInt(gas_used),
            decimals: 6
          }
        }
      }
    },
    async generate_eth_receive_message(
      deposit_hash: string,
      from_chain: Chains
    ): Promise<Omit<ReceiveMessage, 'original_path'>> {
      if (from_chain !== Chains.noble) {
        // if to and from are both evm
        return await this.generate_noble_receive_message(deposit_hash, from_chain, {
          override_block_time: utilities.get_eth_block_height
        })
      }
      const client = await clients.noble_public_client(from_chain)
      const receipt = await client.getTx(deposit_hash)
      if (!receipt || receipt?.code !== 0) {
        if (receipt?.rawLog) {
          throw new Error(receipt.rawLog)
        }
        throw new Error(`Transaction failed with code ${receipt?.code}`)
      }
      const b64_message = receipt.events.find((e) => e.type === 'circle.cctp.v1.MessageSent')!
        .attributes[0].value
      const deposit_event = receipt.events.find((e) => e.type === 'circle.cctp.v1.DepositForBurn')!
      const [nonce, destination_domain] = [
        deposit_event.attributes[7].value,
        deposit_event.attributes[4].value
      ]

      const buf_message = Buffer.from(b64_message, 'base64')
      const bytes_message = new Uint8Array(buf_message)
      const message_hash = keccak256(bytes_message, 'hex')
      const block_time = await utilities.get_eth_block_height(parseInt(destination_domain))

      return {
        nonce: BigInt(nonce.split('').slice(1, -1).join('')),
        destination_block_height_at_deposit: block_time,
        message_bytes: toHex(bytes_message),
        message_hash,
        status: 'pending'
      }
    },
    async generate_noble_receive_message(
      eth_deposit_hash: string,
      from_chain: Chains,
      options?: {
        override_block_time: (domain: number) => Promise<bigint>
      }
    ): Promise<Omit<ReceiveMessage, 'original_path'>> {
      const receipt = await utilities.get_eth_tx_receipt(eth_deposit_hash as Hex, from_chain, true)
      const logs = parseEventLogs({
        abi: ICCTP,
        eventName: ['MessageSent', 'DepositForBurn'],
        logs: receipt.logs
      })
      const message_bytes = logs.find((log) => log.eventName === 'MessageSent')!.args.message
      const { nonce, destinationDomain } = logs.find(
        (log) => log.eventName === 'DepositForBurn'
      )!.args
      const message_hash = keccak256(message_bytes as `0x${string}`)
      const block_time = await (options?.override_block_time(destinationDomain) ??
        utilities.get_noble_block_height(destinationDomain))
      return {
        nonce,
        destination_block_height_at_deposit: block_time,
        message_bytes,
        message_hash,
        status: 'pending'
      }
    },
    async estimate_receive_on_eth(path: Path) {
      const { from_chain, to_chain, receiver_address, sender_address, amount } = path

      const nonce = 273585n
      const version = 0
      const client = await clients.smart_account_client(to_chain)

      const [pkeya, pkeyb] = [numberToHex(10e18, { size: 32 }), numberToHex(1e18, { size: 32 })]
      const random_attester = privateKeyToAccount(pkeya)
      const random_attester_two = privateKeyToAccount(pkeyb)

      const hash_source_and_nonce = () => {
        return keccak256(encodePacked(['uint32', 'uint64'], [DOMAINS[from_chain], nonce]))
      }

      const get_nonce_override = () => {
        return {
          slot: keccak256(
            encodeAbiParameters(
              [
                { name: 'x', type: 'bytes32' },
                { name: 'y', type: 'uint256' }
              ],
              [hash_source_and_nonce(), 10n]
            )
          ),
          value: numberToHex(0n, { size: 32 })
        }
      }

      const get_threshold_override = () => {
        return {
          slot: numberToHex(4, { size: 32 }),
          value: numberToHex(2n, { size: 32 })
        }
      }

      const get_attester_overrides = () => {
        return [
          {
            slot: keccak256(encodeAbiParameters([{ name: 'x', type: 'uint256' }], [5n])),
            value: toHex(utilities.get_address_bytes(to_chain, random_attester.address))
          },
          {
            slot: numberToHex(
              hexToBigInt(keccak256(encodeAbiParameters([{ name: 'x', type: 'uint256' }], [5n]))) +
                1n,
              { size: 32 }
            ),
            value: toHex(utilities.get_address_bytes(to_chain, random_attester_two.address))
          },
          {
            slot: keccak256(
              encodeAbiParameters(
                [
                  { name: 'x', type: 'address' },
                  { name: 'y', type: 'uint256' }
                ],
                [random_attester.address, 6n]
              )
            ),
            value: numberToHex(1n, { size: 32 })
          },
          {
            slot: keccak256(
              encodeAbiParameters(
                [
                  { name: 'x', type: 'address' },
                  { name: 'y', type: 'uint256' }
                ],
                [random_attester_two.address, 6n]
              )
            ),
            value: numberToHex(1n, { size: 32 })
          }
        ]
      }

      const get_burn_token = () => {
        const canonical_usdc_on_noble =
          '0x487039debedbf32d260137b0a6f66b90962bec777250910d253781de326a716d'
        switch (from_chain) {
          case 'noble':
            return canonical_usdc_on_noble
          case 'grand':
            return canonical_usdc_on_noble
          default:
            return toHex(utilities.bytes_from_hex(USDC_CONTRACTS[from_chain] as Address))
        }
      }

      const encode_burn_msg_body = () => {
        return encodePacked(
          ['uint32', 'bytes32', 'bytes32', 'uint256', 'bytes32'],
          [
            version,
            get_burn_token(),
            toHex(utilities.get_address_bytes(to_chain, receiver_address)),
            amount,
            toHex(utilities.get_address_bytes(from_chain, sender_address))
          ]
        )
      }

      const encode_receive_msg = () => {
        return encodePacked(
          ['uint32', 'uint32', 'uint32', 'uint64', 'bytes32', 'bytes32', 'bytes32', 'bytes'],
          [
            version,
            DOMAINS[from_chain],
            DOMAINS[to_chain],
            nonce,
            toHex(utilities.bytes_from_hex(TOKEN_MESSENGERS[from_chain])),
            toHex(utilities.bytes_from_hex(TOKEN_MESSENGERS[to_chain])),
            toHex(utilities.bytes_from_hex(DESTINATION_CALLERS[to_chain] as Address)),
            encode_burn_msg_body()
          ]
        )
      }

      const get_attestation = (msg: `0x${string}`) => {
        const vrs_1 = ecsign(toBytes(keccak256(msg)), toBytes(pkeya))
        const sig_1 = toRpcSig(vrs_1.v, vrs_1.r, vrs_1.s) as Hex
        const vrs_2 = ecsign(toBytes(keccak256(msg)), toBytes(pkeyb))
        const sig_2 = toRpcSig(vrs_2.v, vrs_2.r, vrs_2.s) as Hex
        return concatHex([sig_1, sig_2])
      }

      const slope = utilities.fee_for_usdc_amount(amount)
      const msg_bytes = encode_receive_msg()
      const sig = get_attestation(msg_bytes)

      const req = {
        uo: {
          target: MESSAGE_TRANSMITTERS[to_chain],
          data: encodeFunctionData({
            abi: ICCTP,
            functionName: 'receiveMessage',
            args: [msg_bytes, sig]
          }),
          value: 0n
        },
        overrides: {
          stateOverride: [
            {
              address: MESSAGE_TRANSMITTERS[to_chain],
              stateDiff: [
                get_nonce_override(),
                get_threshold_override(),
                ...get_attester_overrides()
              ]
            },
            {
              address: DESTINATION_CALLERS[to_chain] as Address,
              balance: BigInt(1e18)
            }
          ]
        }
      }

      const estimate_gas = async () => {
        return await Promise.all([
          client.prepareUserOperation({
            calls: [
              {
                to: req.uo.target,
                data: req.uo.data,
                value: req.uo.value
              }
            ],
            stateOverride: req.overrides.stateOverride
          }),
          clients.ethereum_public_client(to_chain, true).getBlock(),
          client.getUserOperationGasPrice()
        ])
      }

      const [op, { baseFeePerGas }, { maxFeePerGas, maxPriorityFeePerGas }] = await estimate_gas()

      const {
        preVerificationGas,
        callGasLimit,
        verificationGasLimit,
        paymasterVerificationGasLimit,
        paymasterPostOpGasLimit
      } = await client.estimateUserOperationGas(op)

      const gas_price = Math.min(
        Number(maxFeePerGas),
        Number(maxPriorityFeePerGas) + Number(baseFeePerGas)
      )

      const gas_consumed =
        BigInt(preVerificationGas) +
        BigInt(callGasLimit) +
        BigInt(verificationGasLimit) +
        BigInt(paymasterVerificationGasLimit ?? 0) +
        BigInt(paymasterPostOpGasLimit ?? 0)

      const gas_in_usdc =
        (await utilities.get_usd_quote_for_wei(gas_consumed * BigInt(gas_price), to_chain)) + slope

      return {
        gas: {
          receive: {
            amount:
              to_chain === Chains.ethereum && gas_in_usdc < 5e6
                ? BigInt(5e6)
                : to_chain !== Chains.ethereum && gas_in_usdc > 1e6
                ? slope
                : gas_in_usdc,
            decimals: 6
          }
        }
      }
    },
    async estimate_receive_on_noble(path: Path) {
      // we cannnot perform overrides on noble, hence:
      // estimating receive gas on noble is difficult so we pay the relay fee
      // and instead use the protocol fee to cover the gas
      // 0.01 uusdc is added to the gas fee to protect relayer from loss
      const slope = utilities.fee_for_usdc_amount(path.amount)
      return {
        gas: {
          receive: {
            amount: slope + BigInt(0.01e6),
            decimals: 6
          }
        }
      }
    }
  }

  return Object.assign(deposit, receive, {
    async deposit_for_burn_with_caller(this: typeof receive & typeof deposit, path: Path) {
      const { from_chain, receiver_address } = path

      const receiver_or_err = await utilities.parse_receiver(receiver_address)
      if (receiver_or_err.error) return receiver_or_err
      path.receiver_address = receiver_or_err.unwrap()

      let exe_res: ExecutionResponse
      let message: Omit<ReceiveMessage, 'original_path'>
      try {
        switch (from_chain) {
          case Chains.noble:
            exe_res = await this.deposit_on_noble(path)
            message = await this.generate_eth_receive_message(exe_res.hash!, from_chain)
            break

          default:
            exe_res = await this.deposit_on_eth(path)
            message = {
              message_bytes: '0x',
              message_hash: '0x',
              nonce: 0n,
              status: 'waiting',
              destination_block_height_at_deposit: 0n
            }
            break
        }

        return Ok({
          ...message,
          block_confirmation_in_ms: SOURCE_CHAIN_CONFIRMATIONS[path.from_chain],
          original_path: {
            ...path,
            fee: (exe_res.gas.deposit?.amount ?? 0n) + (exe_res.gas.receive?.amount ?? 0n)
          },
          hash: exe_res.hash!,
          calls: exe_res.calls
        })
      } catch (error) {
        return Err('An error occurred while depositing', error)
      }
    },
    async get_quote(this: typeof receive & typeof deposit, path: Path): Promise<Result<Quote>> {
      utilities.validate_path(path)

      const { from_chain, to_chain, amount, receiver_address } = path
      const time = SOURCE_CHAIN_CONFIRMATIONS[from_chain]

      const receiver_or_err = await utilities.parse_receiver(receiver_address)
      if (receiver_or_err.error) return receiver_or_err
      path.receiver_address = receiver_or_err.unwrap()

      try {
        let dg, rg
        if (from_chain === Chains.noble) {
          ;[dg, rg] = await Promise.all([
            this.estimate_deposit_on_noble(path),
            this.estimate_receive_on_eth(path)
          ])
        } else if (to_chain == Chains.noble) {
          ;[dg, rg] = await Promise.all([
            this.estimate_deposit_on_eth(path),
            this.estimate_receive_on_noble(path)
          ])
        } else {
          ;[dg, rg] = await Promise.all([
            this.estimate_deposit_on_eth(path),
            this.estimate_receive_on_eth(path)
          ])
        }

        return Ok({
          estimated_time_in_milliseconds: time,
          estimated_output_amount: amount,
          estimated_fee: {
            execution_cost: dg.gas.deposit,
            routing_fee: rg.gas.receive
          }
        })
      } catch (error) {
        return Err('Unable to get quote', error)
      }
    }
  })
}
