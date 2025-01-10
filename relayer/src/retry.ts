import type { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";

const sqs_client = new SQSClient();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const handler: SQSHandler = async (event) => {
  const retry_bundle: SQSRecord[] = [];
  const failed: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    retry_bundle.push(record);
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
      console.error(error);
      failed.push(...batch.map((item) => ({ itemIdentifier: item.messageId })));
    }
  }

  return {
    batchItemFailures: failed,
  };
};
