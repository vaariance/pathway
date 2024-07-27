import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";
import { ReceiveMessageFormat } from "./types";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();

export const handler: Handler = async () => {
  const params: ScanCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "pending",
    },
  };

  try {
    const { Items } = await dynamodb_client.send(new ScanCommand(params));
    const now = Date.now();
    const ready = (Items as ReceiveMessageFormat[] | undefined)?.filter(
      (item) =>
        new Date(item.submitted_at).getTime() + item.block_confirmation_in_ms <
        now
    );
    while (ready && ready.length > 0) {
      await sqs_client.send(
        new SendMessageBatchCommand({
          QueueUrl: process.env.ATTESTATION_QUEUE_URL,
          Entries: ready.splice(0, 10).map((item) => ({
            Id: item.message_hash,
            MessageBody: JSON.stringify(item),
          })),
        })
      );
    }
  } catch (error) {
    console.error(error);
  }
};

export default handler;
