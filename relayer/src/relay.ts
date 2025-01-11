import { SQSBatchItemFailure, SQSHandler, SQSRecord } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb'
import { ReceiveMessageFormat } from './types.js'
import { pathway as Pathway, DOMAINS, ICCTP, MESSAGE_TRANSMITTERS, Chains } from 'thepathway-js'

import { Address, Hex } from 'viem'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { mnemonic, split_bundle, thirdweb_client } from './utils.js'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const client = new DynamoDBClient()
const dynamodb_client = DynamoDBDocumentClient.from(client)

async function relay_eth_message(
  messages: SQSRecord[],
  to_chain: Chains
): Promise<{ record: SQSRecord; hash: string; success: boolean }[]> {
  const { bundler_client, public_client } = await thirdweb_client(to_chain)

  return Promise.all(
    messages.map(async (record) => {
      const {
        partition_key,
        original_path: path,
        nonce,
        destination_block_height_at_deposit,
        message_bytes,
        circle_attestation
      }: ReceiveMessageFormat = JSON.parse(record.body)

      const filter = await public_client.createContractEventFilter({
        abi: ICCTP,
        address: MESSAGE_TRANSMITTERS[to_chain] as Address,
        eventName: 'MessageReceived',
        args: {
          sourceDomain: DOMAINS[path.from_chain],
          nonce
        },
        fromBlock: destination_block_height_at_deposit,
        toBlock: 'latest'
      })
      const logs = await public_client.getFilterLogs({ filter })
      if (logs.length > 0) {
        return { record, hash: partition_key, success: true }
      }

      return bundler_client
        .sendUserOperation({
          calls: [
            {
              to: MESSAGE_TRANSMITTERS[to_chain] as Address,
              abi: ICCTP,
              functionName: 'receiveMessage',
              args: [message_bytes, circle_attestation as Hex]
            }
          ]
        })
        .then(() => {
          return {
            record,
            hash: partition_key,
            success: true
          }
        })
        .catch((error) => {
          console.error(error)
          return {
            record,
            hash: partition_key,
            success: false
          }
        })
    })
  )
}

async function relay_noble_message(
  messages: SQSRecord[]
): Promise<{ record: SQSRecord; hash: string; success: boolean }[]> {
  const account = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'noble'
  })

  const pathway = Pathway({
    viem_signer: undefined,
    noble_signer: account,
    platform: 'mainnet'
  })

  return Promise.all(
    messages.map((record) => {
      const message: ReceiveMessageFormat = JSON.parse(record.body)
      const isTestnet = message.original_path.to_chain === Chains.grand
      return pathway
        .receive_on_noble(message, isTestnet ? 'testnet' : 'mainnet')
        .then(() => ({
          record,
          hash: message.partition_key,
          success: true
        }))
        .catch((error) => {
          console.error(error)
          return {
            record,
            hash: message.partition_key,
            success: error.toString().includes('nonce already used') ? true : false
          }
        })
    })
  )
}

export const handler: SQSHandler = async (event) => {
  const failed: SQSBatchItemFailure[] = []
  const retry_bundle: SQSRecord[] = []

  const relay_result = await Promise.all(
    Object.entries(split_bundle(event)).map(async ([chain, messages]) => {
      if (chain === 'noble' || chain === 'grand') {
        return relay_noble_message(messages)
      } else {
        return relay_eth_message(messages, chain as Chains)
      }
    })
  ).then((result) => result.flat())

  await Promise.all(
    relay_result.map(async (result) => {
      const { record, hash, success } = result

      if (success) {
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { hash },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': 'received'
          }
        }
        return dynamodb_client
          .send(new UpdateCommand(params))
          .catch((error) => console.error(error))
      } else {
        const retry_at = new Date(Date.now() + 5 * 60 * 1000).toDateString() // 5 minutes
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { hash },
          UpdateExpression: 'SET #status = :status, retry_at = :retry_at',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#retry_at': 'retry_at'
          },
          ExpressionAttributeValues: {
            ':status': 'failed',
            ':retry_at': retry_at
          }
        }

        return dynamodb_client
          .send(new UpdateCommand(params))
          .then(() => {
            retry_bundle.push({
              ...record,
              body: JSON.stringify({
                ...JSON.parse(record.body),
                status: 'failed',
                retry_at
              })
            })
          })
          .catch((error) => {
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

export default handler
