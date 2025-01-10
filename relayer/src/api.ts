import { ReceiveMessage, Call } from "thepathway-js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import express from "express";
import { decode, JwtPayload } from "jsonwebtoken";
import serverless from "serverless-http";
import { v4 as uuidv4 } from "uuid";

const app = express();

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.get("/message/:partition_key", async function (req, res) {
  const params: GetCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    Key: {
      hash: req.params.partition_key.toLowerCase(),
    },
  };

  try {
    const { Item } = await dynamodb_client.send(new GetCommand(params));
    if (Item) {
      const { ...rest } = Item;
      res.json({ ...rest });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find tx with provided "hash or key"' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not retreive tx" });
  }
});

app.post("/message/new", async function (req, res) {
  const message = req.body as ReceiveMessage & Call[];
  const {
    tx_hash,
    partition_key,
  }: { tx_hash?: string; partition_key?: string } = req.query;

  if (!message.block_confirmation_in_ms) {
    res.status(400).json({ error: "Missing block confirmation in ms" });
  }
  if (!message.original_path) {
    res.status(400).json({ error: "Missing routing path message" });
  }
  if (!tx_hash && !partition_key) {
    res.status(400).json({ error: "Missing hash or key" });
  }

  let params: GetCommandInput | PutCommandInput = {
    TableName: process.env.MESSAGE_TABLE,
    Key: {
      hash: tx_hash?.toLowerCase() ?? partition_key?.toLowerCase(),
    },
  };

  try {
    const { Item } = await dynamodb_client.send(
      new GetCommand(params as GetCommandInput)
    );
    if (Item) {
      res
        .status(409)
        .json({ error: 'Tx with provided "hash or key" already exists' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not retreive tx" });
  }

  params = {
    ...params,
    Item: {
      tx_hash,
      partition_key: tx_hash ?? partition_key,
      ...message,
      submitted_at: new Date().toISOString(),
    },
  } as PutCommandInput;

  try {
    await dynamodb_client.send(new PutCommand(params));
    res.json({ hash: tx_hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not sumbit tx" });
  }
});

app.post("/create-api-key", async function (req, res) {
  const random_uuid = uuidv4() + uuidv4();
  const token = req.headers.authorization!.toString().replace("Bearer ", "");
  const decoded = decode(token, { complete: true });
  const payload = decoded?.payload as JwtPayload;

  const params: PutCommandInput = {
    TableName: process.env.API_KEY_TABLE,
    Item: {
      api_key: random_uuid,
      sub: payload.sub,
      username: payload["username"],
      created_at: new Date().toISOString(),
    },
  };

  try {
    await dynamodb_client.send(new PutCommand(params));
    res.json({ api_key: random_uuid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not generate new key" });
  }
});

export const handler = serverless(app);
export default handler;
