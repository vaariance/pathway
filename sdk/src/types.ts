import { Address, Hex } from 'viem'
import { Chains, MESSAGE_TRANSMITTERS, TOKEN_MESSENGERS } from './constants'
import { MsgDepositForBurnWithCaller, MsgReceiveMessage } from './generated'
import { GeneratedType } from '@cosmjs/proto-signing'
import { defaultRegistryTypes } from '@cosmjs/stargate'

export type CrossChainAddress = Hex | `noble1${string}` | `${string}.eth`

export type Path = {
  from_chain: Chains
  to_chain: Chains
  receiver_address: CrossChainAddress
  sender_address: CrossChainAddress
  amount: bigint
  fee: bigint
}

export type PathwayOptions<T, R> = {
  viem_signer?: T
  noble_signer?: R
  platform: 'mainnet' | 'testnet'
}

export type ExecutionResponse = {
  hash?: string
  calls?: Call[]
  gas: {
    deposit?: {
      amount: bigint
      decimals: number
    }
    receive?: {
      amount: bigint
      decimals: number
    }
  }
}

export type Call = {
  order: number
  type: 'contract' | 'api'
  data: string
  chain: Chains
  api_options?: Record<string, unknown>
}

export type ReceiveMessage = {
  message_bytes: Hex
  message_hash: Hex
  circle_attestation?: Hex
  block_confirmation_in_ms?: number
  status: 'waiting' | 'pending' | 'attested' | 'received' | 'failed'
  destination_block_height_at_deposit: bigint
  nonce: bigint
  original_path: Path
}

export type Quote = {
  estimated_fee: Record<
    string,
    {
      amount: bigint
      decimals: number
    }
  >
  estimated_time_in_milliseconds: number
  estimated_output_amount: bigint
}

export const cctp_types: ReadonlyArray<[string, GeneratedType]> = [
  ...defaultRegistryTypes,
  [TOKEN_MESSENGERS.noble, MsgDepositForBurnWithCaller],
  [MESSAGE_TRANSMITTERS.noble, MsgReceiveMessage]
]

export interface AssetInfo {
  chain: Mode
  address: Address | string
  url: string
}

export type Mode =
  | 'noble'
  | 'ethereum'
  | 'arbitrum'
  | 'base'
  | 'avalanche'
  | 'polygon'
  | 'optimism'
  | 'grand' // noble testnet
  | 'sepolia' // ethereum testnet
  | 'fuji' // avalanche testnet
