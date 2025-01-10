import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";
import { ReceiveMessageFormat } from "./types.js";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const handler: Handler = async () => {
  const waiting: ScanCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "waiting",
    },
  };

  const pending: ScanCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "pending",
    },
  };

  const failed: ScanCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "failed",
    },
  };

  try {
    const [
      { Items: waiting_items },
      { Items: pending_items },
      { Items: failed_items },
    ] = await Promise.all([
      dynamodb_client.send(new ScanCommand(waiting)),
      dynamodb_client.send(new ScanCommand(pending)),
      dynamodb_client.send(new ScanCommand(failed)),
    ]);
    const now = Date.now();
    const pending_ready = (
      pending_items as ReceiveMessageFormat[] | undefined
    )?.filter(
      (item) =>
        new Date(item.submitted_at).getTime() + item.block_confirmation_in_ms <
        now
    );
    let failed_ready = (
      failed_items as ReceiveMessageFormat[] | undefined
    )?.filter((item) => item.retry_at && new Date() > new Date(item.retry_at));

    const comands = [];

    while (waiting_items && waiting_items.length > 0) {
      comands.push(
        sqs_client.send(
          new SendMessageBatchCommand({
            QueueUrl: process.env.EXECUTION_QUEUE_URL,
            Entries: waiting_items.splice(0, 10).map((item) => ({
              Id: item.message_hash,
              MessageBody: JSON.stringify(item),
            })),
          })
        )
      );
    }
    while (pending_ready && pending_ready.length > 0) {
      comands.push(
        sqs_client.send(
          new SendMessageBatchCommand({
            QueueUrl: process.env.ATTESTATION_QUEUE_URL,
            Entries: pending_ready.splice(0, 10).map((item) => ({
              Id: item.message_hash,
              MessageBody: JSON.stringify(item),
            })),
          })
        )
      );
    }
    while (failed_ready && failed_ready.length > 0) {
      comands.push(
        sqs_client.send(
          new SendMessageBatchCommand({
            QueueUrl: process.env.RETRY_QUEUE_URL,
            Entries: failed_ready.splice(0, 10).map((item) => ({
              Id: item.message_hash,
              MessageBody: JSON.stringify(item),
            })),
          })
        )
      );
    }

    await Promise.all(comands);
  } catch (error) {
    console.error(error);
  }
};

export default handler;
