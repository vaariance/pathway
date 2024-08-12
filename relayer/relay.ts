import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { ALCHEMY_CHAINS, ReceiveMessageFormat } from "./types.js";
import {
  Pathway,
  PathwayOptions,
  DESTINATION_CALLERS,
  DOMAINS,
  get_pimlico_paymaster_for_chain,
  ICCTP,
  MESSAGE_TRANSMITTERS,
  VIEM_NETWORKS,
} from "thepathway-js";

import { Address, encodeFunctionData, http, createClient, Hex } from "viem";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner } from "@alchemy/aa-core";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();
const mnemonic = process.env.DESTINATION_CALLER_API_KEY.split("-").join(" ");

async function relay_eth_message(
  message: ReceiveMessageFormat
): Promise<boolean> {
  const { original_path: path, message_bytes, circle_attestation } = message;
  const account = LocalAccountSigner.mnemonicToAccountSigner(mnemonic!);

  const pimlico_paymaster = createClient({
    // @ts-ignore
    chain: VIEM_NETWORKS[path.to_chain]!,
    transport: http(
      get_pimlico_paymaster_for_chain(
        path.to_chain,
        process.env.PIMLICO_API_KEY!
      )
    ),
    // @ts-ignore
  }).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

  const viem_client = await createLightAccountAlchemyClient({
    apiKey: process.env.ALCHEMY_API_KEY,
    chain: ALCHEMY_CHAINS[path.to_chain]!,
    initCode: "0x",
    signer: account,
    accountAddress: DESTINATION_CALLERS[path.to_chain] as Address,
    version: "v2.0.0",
    useSimulation: true,
    customMiddleware: async (userop, _) => {
      const res = await pimlico_paymaster.sponsorUserOperation({
        userOperation: {
          ...userop,
          factory: undefined,
          factoryData: undefined,
          callData: await userop.callData,
          nonce: await userop.nonce,
        },
      });
      return {
        ...userop,
        ...res,
      };
    },
  });

  const filter = await viem_client.createContractEventFilter({
    abi: ICCTP,
    address: MESSAGE_TRANSMITTERS[path.to_chain] as Address,
    eventName: "MessageReceived",
    args: {
      sourceDomain: DOMAINS[path.from_chain],
      nonce: message.nonce,
    },
    fromBlock: message.destination_block_height_at_deposit,
  });
  const logs = await viem_client.getFilterLogs({ filter });
  if (logs.length > 0) {
    return true;
  }

  try {
    const { hash } = await viem_client.sendUserOperation({
      uo: {
        target: MESSAGE_TRANSMITTERS[path.to_chain] as Address,
        data: encodeFunctionData({
          abi: ICCTP,
          functionName: "receiveMessage",
          args: [message_bytes, circle_attestation as Hex],
        }),
        value: 0n,
      },
    });

    await viem_client.waitForUserOperationTransaction({ hash });
  } catch (error) {
    return false;
  }

  return true;
}

async function relay_noble_message(
  message: ReceiveMessageFormat
): Promise<boolean> {
  const account = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "noble",
  });

  const options = new PathwayOptions({
    viem_signer: undefined,
    noble_signer: account,
    alchemy_api_key: process.env.ALCHEMY_API_KEY,
  });
  const pathway = new Pathway(options);

  try {
    await pathway.receive_message_noble(message, {});
    return true;
  } catch (error) {
    return false;
  }
}

export const handler: SQSHandler = async (event) => {
  const failed: SQSBatchItemFailure[] = [];
  const retry_bundle: SQSRecord[] = [];

  for (const record of event.Records) {
    const message: ReceiveMessageFormat = JSON.parse(record.body);

    let success: boolean;
    if (message.original_path.to_chain === "noble") {
      success = await relay_noble_message(message);
    } else {
      success = await relay_eth_message(message);
    }

    if (success) {
      const params: UpdateCommandInput = {
        TableName: process.env.MESSAGE_TABLE,
        Key: { tx_hash: message.tx_hash },
        UpdateExpression: "SET status = :status",
        ExpressionAttributeValues: {
          ":status": "received",
        },
      };
      try {
        await dynamodb_client.send(new UpdateCommand(params));
      } catch (error) {
        console.error(
          "Tx relay success but failed to update DynamoDB",
          error,
          message
        );
        continue;
      }
    } else {
      const retry_at = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes
      const params: UpdateCommandInput = {
        TableName: process.env.MESSAGE_TABLE,
        Key: { tx_hash: message.tx_hash },
        UpdateExpression: "SET status = :status, retry_at = :retry_at",
        ExpressionAttributeValues: {
          ":status": "failed",
          ":retry_at": retry_at,
        },
      };

      try {
        await dynamodb_client.send(new UpdateCommand(params));
        retry_bundle.push({
          ...record,
          body: JSON.stringify({
            ...message,
            status: "failed",
            retry_at,
          }),
        });
      } catch (error) {
        failed.push({ itemIdentifier: record.messageId });
      }
    }
  }

  while (retry_bundle.length > 0) {
    const batch = retry_bundle.splice(0, 10);
    try {
      await sqs_client.send(
        new SendMessageBatchCommand({
          QueueUrl: process.env.RETRY_QUEUE_URL,
          Entries: batch.map((item) => ({
            Id: item.messageId,
            MessageBody: item.body,
          })),
        })
      );
    } catch (error) {
      failed.push(...batch.map((item) => ({ itemIdentifier: item.messageId })));
    }
  }

  return {
    batchItemFailures: failed,
  };
};

export default handler;
