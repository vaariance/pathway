import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type {
  APIGatewaySimpleAuthorizerResult,
  APIGatewayRequestAuthorizerEventV2,
  Handler,
} from "aws-lambda";

const client = new DynamoDBClient({});
const dynamodb_client = DynamoDBDocumentClient.from(client);

export const handler: Handler<APIGatewayRequestAuthorizerEventV2> = async (
  event
): Promise<APIGatewaySimpleAuthorizerResult> => {
  const api_key = event.queryStringParameters?.api_key;

  const params: GetCommandInput = {
    TableName: process.env.API_KEY_TABLE,
    Key: { api_key },
  };

  try {
    const { Item } = await dynamodb_client.send(new GetCommand(params));
    if (Item) {
      return {
        isAuthorized: true,
      };
    } else {
      return {
        isAuthorized: false,
      };
    }
  } catch (error) {
    return {
      isAuthorized: false,
    };
  }
};

export default handler;
