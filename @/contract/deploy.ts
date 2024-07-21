import proxy from "../../out/proxy.sol/Proxy.json" assert { type: "json" };
import {
  USDC_CONTRACTS,
  TOKEN_MESSENGERS,
  MESSAGE_TRANSMITTERS,
  IMPLEMENTATION_CONTRACT,
  Mode,
  VIEM_NETWORKS,
} from "../constants/index.js";

import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { config } from "dotenv";
config();

const INITIALIZE_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner_", type: "address" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const deploy_contracts = async (modes: Mode[]) => {
  console.log("Deploying contracts...", modes);
  for (const mode of modes) {
    const network = VIEM_NETWORKS[mode]!;
    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );
    const client = createWalletClient({
      account,
      chain: network,
      transport: http(),
    }).extend(publicActions);
    const hash = await client.deployContract({
      args: [
        IMPLEMENTATION_CONTRACT,
        TOKEN_MESSENGERS[mode],
        MESSAGE_TRANSMITTERS[mode],
        USDC_CONTRACTS[mode],
      ],
      abi: proxy.abi,
      bytecode: proxy.bytecode.object as `0x${string}`,
    });
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log(`Deployed on <${mode}>, address:`, receipt.contractAddress);
    await client.writeContract({
      address: receipt.contractAddress as `0x${string}`,
      abi: INITIALIZE_ABI,
      functionName: "initialize",
      args: [account.address],
    });
  }
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide at least one mode");
  process.exit(1);
}

deploy_contracts(args as Mode[]).catch(console.error);
