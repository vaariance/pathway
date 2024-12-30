import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ALCHEMY_CHAINS, ReceiveMessageFormat } from "./types.js";
import {
  Pathway,
  PathwayOptions,
  DESTINATION_CALLERS,
  DOMAINS,
  ICCTP,
  MESSAGE_TRANSMITTERS,
  Chains,
} from "thepathway-js";

import { Address, encodeFunctionData, Hex, toHex } from "viem";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, UserOperationRequest_v7 } from "@alchemy/aa-core";

import { createThirdwebClient, hexToBigInt, isHex } from "thirdweb";
import { getPaymasterAndData, bundleUserOp } from "thirdweb/wallets/smart";
import { base, arbitrum, mainnet } from "thirdweb/chains";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const client = new DynamoDBClient();
const dynamodb_client = DynamoDBDocumentClient.from(client);
const mnemonic = process.env.DESTINATION_CALLER_API_KEY.split("-").join(" ");
const account = LocalAccountSigner.mnemonicToAccountSigner(mnemonic);

const thirdweb_client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET,
});

async function relay_eth_message(
  messages: SQSRecord[],
  to_chain: Chains
): Promise<{ record: SQSRecord; hash: string; success: boolean }[]> {
  const thirdweb_chain = (() => {
    switch (to_chain) {
      case "base":
        return base;
      case "arbitrum":
        return arbitrum;
      default:
        return mainnet;
    }
  })();
  const viem_client = await createLightAccountAlchemyClient({
    apiKey: process.env.ALCHEMY_API_KEY,
    chain: ALCHEMY_CHAINS[to_chain]!,
    initCode: "0x",
    signer: account,
    accountAddress: DESTINATION_CALLERS[to_chain] as Address,
    version: "v2.0.0",
    useSimulation: false,
    customMiddleware: async (userop) => {
      const callData = await userop.callData;
      const callGasLimit = await userop.callGasLimit;
      const verificationGasLimit = await userop.verificationGasLimit;
      const preVerificationGas = await userop.preVerificationGas;
      const maxFeePerGas = Number(await userop.maxFeePerGas) * 1.2;
      const maxPriorityFeePerGas = Number(await userop.maxPriorityFeePerGas) * 1.2;
      const signature = await userop.signature;

      const res = await getPaymasterAndData({
        userOp: {
          sender: await userop.sender,
          nonce: BigInt(await userop.nonce),
          factory: undefined,
          factoryData: "0x",
          callData: isHex(callData) ? (callData as Hex) : toHex(callData),
          callGasLimit: BigInt(callGasLimit!),
          verificationGasLimit: BigInt(verificationGasLimit!),
          preVerificationGas: BigInt(preVerificationGas!),
          maxFeePerGas: BigInt(maxFeePerGas!),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas!),
          paymaster: undefined,
          paymasterData: "0x",
          paymasterVerificationGasLimit: 21000n,
          paymasterPostOpGasLimit: 21000n,
          signature: isHex(signature) ? (signature as Hex) : toHex(signature),
        },
        client: thirdweb_client,
        chain: thirdweb_chain,
        entrypointAddress: viem_client.account.getEntryPoint().address,
      });
      return {
        ...userop,
        ...res,
      };
    },
  });

  return Promise.all(
    messages.map(async (record) => {
      const {
        tx_hash,
        original_path: path,
        nonce,
        destination_block_height_at_deposit,
        message_bytes,
        circle_attestation,
      }: ReceiveMessageFormat = JSON.parse(record.body);

      const filter = await viem_client.createContractEventFilter({
        abi: ICCTP,
        address: MESSAGE_TRANSMITTERS[to_chain] as Address,
        eventName: "MessageReceived",
        args: {
          sourceDomain: DOMAINS[path.from_chain],
          nonce,
        },
        fromBlock: destination_block_height_at_deposit,
        toBlock: "latest",
      });
      const logs = await viem_client.getFilterLogs({ filter });
      if (logs.length > 0) {
        return { record, hash: tx_hash, success: true };
      }

      const partialOp = await viem_client.buildUserOperation({
        uo: {
          target: MESSAGE_TRANSMITTERS[to_chain] as Address,
          data: encodeFunctionData({
            abi: ICCTP,
            functionName: "receiveMessage",
            args: [message_bytes, circle_attestation as Hex],
          }),
          value: 0n,
        },
      });

      const signedOp: UserOperationRequest_v7 =
        await viem_client.signUserOperation({
          uoStruct: partialOp,
        });

      return bundleUserOp({
        userOp: {
          ...signedOp,
          factory: undefined,
          factoryData: "0x",
          nonce: hexToBigInt(signedOp.nonce),
          callGasLimit: hexToBigInt(signedOp.callGasLimit),
          maxFeePerGas: hexToBigInt(signedOp.maxFeePerGas),
          maxPriorityFeePerGas: hexToBigInt(signedOp.maxPriorityFeePerGas),
          verificationGasLimit: hexToBigInt(signedOp.verificationGasLimit),
          preVerificationGas: hexToBigInt(signedOp.preVerificationGas),
          paymasterData: signedOp.paymasterData!,
          paymaster: signedOp.paymaster,
          paymasterVerificationGasLimit: hexToBigInt(
            signedOp.paymasterVerificationGasLimit!
          ),
          paymasterPostOpGasLimit: hexToBigInt(
            signedOp.paymasterPostOpGasLimit!
          ),
        },
        options: {
          client: thirdweb_client,
          chain: thirdweb_chain,
          entrypointAddress: viem_client.account.getEntryPoint().address,
        },
      })
        .then(() => {
          return {
            record,
            hash: tx_hash,
            success: true,
          };
        })
        .catch((error) => {
          console.error(error);
          return {
            record,
            hash: tx_hash,
            success: false,
          };
        });
    })
  );
}

async function relay_noble_message(
  messages: SQSRecord[]
): Promise<{ record: SQSRecord; hash: string; success: boolean }[]> {
  const account = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "noble",
  });

  const options = new PathwayOptions({
    viem_signer: undefined,
    noble_signer: account,
    alchemy_api_key: process.env.ALCHEMY_API_KEY,
  });
  const pathway = new Pathway(options);

  return Promise.all(
    messages.map((record) => {
      const message: ReceiveMessageFormat = JSON.parse(record.body);
      return pathway
        .receive_message_noble(message, {
          simulate_only: false,
        })
        .then(() => ({
          record,
          hash: message.tx_hash,
          success: true,
        }))
        .catch((error) => {
          console.error(error);
          return {
            record,
            hash: message.tx_hash,
            success: error.toString().includes("nonce already used")
              ? true
              : false,
          };
        });
    })
  );
}

export const handler: SQSHandler = async (event) => {
  const failed: SQSBatchItemFailure[] = [];
  const retry_bundle: SQSRecord[] = [];

  const split_bundle = event.Records.reduce((acc, item) => {
    const { original_path: path }: ReceiveMessageFormat = JSON.parse(item.body);
    if (!acc[path.to_chain]) {
      acc[path.to_chain] = [];
    }
    acc[path.to_chain].push(item);
    return acc;
  }, {} as Record<Chains, SQSRecord[]>);

  const relay_result = await Promise.all(
    Object.entries(split_bundle).map(async ([chain, messages]) => {
      if (chain === "noble") {
        return relay_noble_message(messages);
      } else {
        return relay_eth_message(messages, chain as Chains);
      }
    })
  ).then((result) => result.flat());

  await Promise.all(
    relay_result.map(async (result) => {
      const { record, hash, success } = result;

      if (success) {
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { tx_hash: hash },
          UpdateExpression: "SET #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "received",
          },
        };
        return dynamodb_client
          .send(new UpdateCommand(params))
          .then(() => {})
          .catch((error) => console.error(error));
      } else {
        const retry_at = new Date(Date.now() + 5 * 60 * 1000).toDateString(); // 5 minutes
        const params: UpdateCommandInput = {
          TableName: process.env.MESSAGE_TABLE,
          Key: { tx_hash: hash },
          UpdateExpression: "SET #status = :status, retry_at = :retry_at",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "failed",
            ":retry_at": retry_at,
          },
        };

        return dynamodb_client
          .send(new UpdateCommand(params))
          .then(() => {
            retry_bundle.push({
              ...record,
              body: JSON.stringify({
                ...JSON.parse(record.body),
                status: "failed",
                retry_at,
              }),
            });
          })
          .catch((error) => {
            console.error(error);
            failed.push({ itemIdentifier: record.messageId });
          });
      }
    })
  );

  return {
    batchItemFailures: failed,
  };
};

export default handler;
