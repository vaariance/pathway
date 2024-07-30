import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { ReceiveMessageFormat } from "./types.js";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();

export const handler: SQSHandler = async (event) => {
  const retry_bundle: SQSRecord[] = [];
  const failed: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    const message: ReceiveMessageFormat = JSON.parse(record.body);
    const { tx_hash } = message;

    try {
      const params: GetCommandInput = {
        TableName: process.env.MESSAGE_TABLE,
        Key: {
          tx_hash,
        },
      };
      const { Item } = await dynamodb_client.send(new GetCommand(params));

      if (Item && Item.status === "failed") {
        retry_bundle.push(record);
      }
    } catch (error) {
      failed.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  while (retry_bundle.length > 0) {
    const batch = retry_bundle.splice(0, 10);
    try {
      await sqs_client.send(
        new SendMessageBatchCommand({
          QueueUrl: process.env.RELAY_QUEUE_URL,
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
