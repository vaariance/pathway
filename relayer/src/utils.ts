import { Address, Chain, createPublicClient, http, PublicClient } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import {
  BundlerClient,
  createBundlerClient,
  entryPoint07Address,
  GetPaymasterDataReturnType
} from 'viem/account-abstraction'
import { toLightSmartAccount } from 'permissionless/accounts'
import {
  AA_TRANSPORT,
  AA_TRANSPORT_HEADERS,
  Chains,
  DESTINATION_CALLERS,
  VIEM_NETWORKS
} from 'thepathway-js'

import { getPaymasterAndData } from 'thirdweb/wallets/smart'
import { createThirdwebClient, defineChain } from 'thirdweb'
import { ReceiveMessageFormat } from './types'
import { SQSEvent, SQSRecord } from 'aws-lambda'

export const mnemonic = process.env.DESTINATION_CALLER_API_KEY.split('-').join(' ')
const caller = mnemonicToAccount(mnemonic)

export const thirdweb_client = async (
  to_chain: Chains
): Promise<{ bundler_client: BundlerClient; public_client: PublicClient }> => {
  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET
  })

  const viem_network = VIEM_NETWORKS[to_chain]!
  const chain = defineChain({
    ...(viem_network as any),
    blockExplorers: undefined
  })

  const public_client = createPublicClient({
    chain: viem_network as Chain,
    transport: http(chain.rpc)
  })

  const account = await toLightSmartAccount({
    client: public_client,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7' as const
    },
    owner: caller,
    version: '2.0.0',
    address: DESTINATION_CALLERS[to_chain] as Address
  })

  const bundler_client = createBundlerClient({
    account,
    client: public_client,
    paymaster: {
      getPaymasterData: async (op: any) => {
        const res = getPaymasterAndData({
          userOp: {
            ...op,
            factoryData: '0x',
            paymasterData: '0x',
            paymasterVerificationGasLimit: op.paymasterVerificationGasLimit ?? 21000n,
            paymasterPostOpGasLimit: op.paymasterPostOpGasLimit ?? 21000n,
            signature: await account.getStubSignature()
          },
          client,
          chain,
          entrypointAddress: op.entryPointAddress
        })
        return res as Promise<GetPaymasterDataReturnType>
      }
    },
    transport: http(AA_TRANSPORT(chain?.id), {
      fetchOptions: AA_TRANSPORT_HEADERS()
    })
  })

  return { bundler_client, public_client }
}

export const split_bundle = (event: SQSEvent, by: 'to_chain' | 'from_chain' = 'to_chain') =>
  event.Records.reduce((acc, item) => {
    const { original_path: path }: ReceiveMessageFormat = JSON.parse(item.body)
    if (!acc[path[by]]) {
      acc[path[by]] = []
    }
    acc[path[by]].push(item)
    return acc
  }, {} as Record<Chains, SQSRecord[]>)
