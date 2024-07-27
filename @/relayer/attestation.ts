import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import {
  AttestationResponse,
  AttestationStatus,
  ReceiveMessageFormat,
} from "./types";
import axios, { AxiosInstance, isAxiosError } from "axios";

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const sqs_client = new SQSClient();

const base_url = "https://iris-api.circle.com/attestations/";
const axios_instance: AxiosInstance = axios.create({ baseURL: base_url });

async function get_circle_attestation(
  message: ReceiveMessageFormat
): Promise<AttestationResponse> {
  const response = await axios_instance.get<AttestationResponse>(
    message.message_hash
  );
  return response?.data;
}

export const handler: SQSHandler = async (event) => {
  const failed: SQSBatchItemFailure[] = [];
  const success: SQSRecord[] = [];

  for (const record of event.Records) {
    const message: ReceiveMessageFormat = JSON.parse(record.body);

    try {
      const attestation = await get_circle_attestation(message);

      if (attestation.status === AttestationStatus.complete) {
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { tx_hash: message.tx_hash },
          UpdateExpression:
            "SET status = :status, circle_attestation = :attestation",
          ExpressionAttributeValues: {
            ":status": "attested",
            ":attestation": attestation,
          },
        };

        try {
          await dynamodb_client.send(new UpdateCommand(params));
          success.push({
            ...record,
            body: JSON.stringify({
              ...message,
              circle_attestation: attestation,
              status: "attested",
            }),
          });
        } catch (error) {
          continue;
        }
      }
      await new Promise((r) => setTimeout(r, 150));
    } catch (error) {
      let response: AttestationResponse | null = null;
      if (isAxiosError(error) && error?.response?.status === 404) {
        response = {
          attestation: null,
          status: AttestationStatus.pending_confirmations,
        };
        console.error("Attestation not ready", response);
      } else {
        failed.push({ itemIdentifier: record.messageId });
      }
    }
  }

  while (success.length > 0) {
    const batch = success.splice(0, 10);
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

export default handler;
