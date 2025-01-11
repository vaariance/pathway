import type { SQSBatchItemFailure, SQSHandler, SQSRecord } from 'aws-lambda'
import { ReceiveMessageFormat } from './types'
import { Hex } from 'viem'
import { split_bundle, thirdweb_client } from './utils'
import { Chains, MULLTICALLER_WITH_PERMIT, Path } from 'thepathway-js'
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { pathway as Pathway } from 'thepathway-js'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const client = new DynamoDBClient()
const dynamodb_client = DynamoDBDocumentClient.from(client)

const pathway = Pathway({
  viem_signer: undefined,
  noble_signer: undefined,
  platform: 'mainnet'
})

async function execute(
  messages: SQSRecord[],
  from_chain: Chains
): Promise<
  {
    record: SQSRecord
    hash: string
    success: boolean
    message?: Awaited<ReturnType<typeof pathway.generate_eth_receive_message>>
    tx_hash?: Hex
    error?: unknown
  }[]
> {
  const { bundler_client } = await thirdweb_client(from_chain)

  const generate_receive_message = (hash: Hex) => {
    const isTestnet = from_chain === Chains.fuji || from_chain === Chains.sepolia
    return pathway.generate_eth_receive_message(hash, from_chain, isTestnet ? 'testnet' : 'mainnet')
  }

  return Promise.all(
    messages.map(async (record) => {
      const { partition_key, calls }: ReceiveMessageFormat = JSON.parse(record.body)
      const item = calls?.at(0)
      if (item?.type !== 'contract') {
        return Promise.resolve({ record, hash: partition_key, success: false })
      }
      try {
        const sendResult = await bundler_client.sendUserOperation({
          calls: [
            {
              to: MULLTICALLER_WITH_PERMIT[from_chain]!,
              data: item.data as Hex,
              value: 0n
            }
          ]
        })
        const opRes = await bundler_client.waitForUserOperationReceipt({ hash: sendResult })
        const message = await generate_receive_message(opRes.receipt.transactionHash)
        return {
          record,
          hash: partition_key,
          success: true,
          message,
          tx_hash: opRes.receipt.transactionHash
        }
      } catch (error) {
        console.error(error)
        return { record, hash: partition_key, success: false, error }
      }
    })
  )
}

export const handler: SQSHandler = async (event) => {
  const failed: SQSBatchItemFailure[] = []

  const execute_results = await Promise.all(
    Object.entries(split_bundle(event, 'from_chain')).map(async ([chain, messages]) => {
      return execute(messages, chain as Chains)
    })
  ).then((result) => result.flat())

  await Promise.all(
    execute_results.map(async (item) => {
      const { record, hash, success, message, tx_hash } = item

      if (success && message) {
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { hash },
          UpdateExpression:
            'SET #status = :status, #message_bytes = :message_bytes, #message_hash = :message_hash, #nonce = :nonce, #destination_block_height_at_deposit = :destination_block_height_at_deposit, #tx_hash = :tx_hash, #submitted_at = :submitted_at',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#message_bytes': 'message_bytes',
            '#message_hash': 'message_hash',
            '#nonce': 'nonce',
            '#destination_block_height_at_deposit': 'destination_block_height_at_deposit',
            '#tx_hash': 'tx_hash',
            '#submitted_at': 'submitted_at'
          },
          ExpressionAttributeValues: {
            ':status': 'pending',
            ':message_bytes': message.message_bytes,
            ':message_hash': message.message_hash,
            ':nonce': message.nonce,
            ':destination_block_height_at_deposit': message.destination_block_height_at_deposit,
            ':tx_hash': tx_hash,
            ':submitted_at': new Date().toISOString()
          }
        }
        return dynamodb_client
          .send(new UpdateCommand(params))
          .catch((error) => console.error(error))
      } else {
        const params: DeleteCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { hash }
        }

        return dynamodb_client.send(new DeleteCommand(params)).catch((error) => {
          console.error(error)
          failed.push({ itemIdentifier: record.messageId })
        })
      }
    })
  )

  return {
    batchItemFailures: failed
  }
}
