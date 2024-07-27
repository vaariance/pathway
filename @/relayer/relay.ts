import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { ALCHEMY_CHAINS, ReceiveMessageFormat } from "./types";
import { Pathway, PathwayOptions } from "@/sdk";
import {
  DOMAINS,
  ICCTP,
  MESSAGE_TRANSMITTERS,
  PROXY_CONTRACTS,
} from "../constants";
import { Abi, Address, encodeFunctionData } from "viem";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner } from "@alchemy/aa-core";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();

async function relay_eth_message(
  message: ReceiveMessageFormat
): Promise<boolean> {
  const { original_path: path, message_bytes, circle_attestation } = message;

  const account = LocalAccountSigner.mnemonicToAccountSigner(
    process.env.DESTINATION_CALLER!
  );
  const proxy = PROXY_CONTRACTS[path.to_chain];

  const viem_client = await createLightAccountAlchemyClient({
    apiKey: process.env.ALCHEMY_API_KEY!,
    chain: ALCHEMY_CHAINS[path.to_chain]!,
    initCode: "0x",
    signer: account,
    accountAddress: proxy?.address as Address,
    version: "v2.0.0",
    useSimulation: true,
  });

  const options = new PathwayOptions({ viem_client });
  const pathway = new Pathway(options);

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
    const slope = pathway.get_fee_for_usdc_amount(path.amount);
    const gas_used = await viem_client.estimateContractGas({
      address: proxy?.address as Address,
      abi: proxy?.abi as Abi,
      functionName: "receiveMessage",
      args: [path.receiver_address, message_bytes, circle_attestation, slope],
    });
    const gas_in_usdc = await pathway.get_usd_quote_for_wei(gas_used);
    const total_fee = slope + gas_in_usdc;

    const { hash: uoHash } = await viem_client.sendUserOperation({
      uo: {
        target: proxy?.address as Address,
        data: encodeFunctionData({
          abi: proxy?.abi as Abi,
          functionName: "receiveMessage",
          args: [
            path.receiver_address,
            message_bytes,
            circle_attestation,
            total_fee,
          ],
        }),
        value: 0n,
      },
    });

    await viem_client.waitForUserOperationTransaction({ hash: uoHash });
  } catch (error) {
    return false;
  }

  return true;
}

async function relay_noble_message(
  message: ReceiveMessageFormat
): Promise<boolean> {
  const account = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.DESTINATION_CALLER!,
    {
      prefix: "noble",
    }
  );
  const noble_client = await SigningStargateClient.connectWithSigner(
    process.env.NOBLE_RPC_URL!,
    account
  );

  const options = new PathwayOptions({ noble_client });
  const pathway = new Pathway(options);

  try {
    await pathway.receive_message_noble(message, {
      outside_caller: (await account.getAccounts())[0].address,
    });
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
