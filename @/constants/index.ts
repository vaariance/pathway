import { mainnet, arbitrum, base, Chain as ViemChain } from "viem/chains";
import base_contract from "../../out/deployments/base/latest.json" assert { type: "json" };
import ethereum_contract from "../../out/deployments/ethereum/latest.json" assert { type: "json" };
import arbitrum_contract from "../../out/deployments/arbitrum/latest.json" assert { type: "json" };

import { Address } from "viem";

export enum Chains {
  noble = "noble",
  ethereum = "ethereum",
  arbitrum = "arbitrum",
  base = "base",
}

export enum USDC_CONTRACTS {
  ethereum = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  noble = "uusdc",
  arbitrum = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  base = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
}

export const PROXY_CONTRACTS = {
  arbitrum: arbitrum_contract,
  base: base_contract,
  ethereum: ethereum_contract,
  noble: null,
};

export const IMPLEMENTATION_CONTRACT =
  "0x8E8e658E22B12ada97B402fF0b044D6A325013C7";

export enum TOKEN_MESSENGERS {
  arbitrum = "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
  ethereum = "0xbd3fa81b58ba92a82136038b25adec7066af3155",
  noble = "/circle.cctp.v1.MsgDepositForBurnWithCaller",
  base = "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
}

export enum MESSAGE_TRANSMITTERS {
  arbitrum = "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
  ethereum = "0x0a992d191deec32afe36203ad87d7d289a738f81",
  base = "0xAD09780d193884d503182aD4588450C416D6F9D4",
  noble = "/circle.cctp.v1.MsgReceiveMessage",
}

export enum DOMAINS {
  ethereum = 0,
  noble = 4,
  arbitrum = 3,
  base = 6,
}

export const REVERSE_DOMAINS: Record<number, Chains> = {
  0: Chains.ethereum,
  4: Chains.noble,
  3: Chains.arbitrum,
  6: Chains.base,
};

export type ChainMetadata = {
  value: Mode;
  name: string;
  img_src: string;
  fallback: string;
  type: Mode;
};

export const chain_data: ChainMetadata[] = [
  {
    value: "noble",
    name: "Noble",
    img_src: "/noble.svg",
    fallback: "NB",
    type: "noble",
  },
  {
    value: "ethereum",
    name: "Ethereum",
    img_src: "/eth.png",
    fallback: "ETH",
    type: "ethereum",
  },
  {
    value: "arbitrum",
    name: "Arbitrum",
    img_src: "/arb.svg",
    fallback: "ARB",
    type: "ethereum",
  },
  {
    value: "base",
    name: "Base",
    img_src: "/base.svg",
    fallback: "OP",
    type: "ethereum",
  },
];

interface AssetInfo {
  chain: string;
  address: Address | string;
  url: string;
}

export const AssetsList: { [key: string]: AssetInfo } = {
  "1": {
    chain: "ethereum",
    address: USDC_CONTRACTS.ethereum,
    url: "https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  "42161": {
    chain: "arbitrum",
    address: USDC_CONTRACTS.arbitrum,
    url: "https://arbiscan.io/token/0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  "8453": {
    chain: "base",
    address: USDC_CONTRACTS.base,
    url: "https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  "noble-1": {
    chain: "noble",
    address: USDC_CONTRACTS.noble,
    url: "http://mintscan.io/noble/assets",
  },
};

export type Mode = "noble" | "ethereum" | "arbitrum" | "base";

export type PathContructor = {
  from: Mode;
  to: ChainMetadata | null;
  inverse: Mode;
  amount: string;
  balance?: string;
  receiver: string;
  error: Record<string, unknown> | null;
};

export const VIEM_NETWORKS: Record<Mode, ViemChain | undefined> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  noble: undefined,
};

const miliseconds = 60 * 1000;

export const SOURCE_CHAIN_CONFIRMATIONS = {
  ethereum: 14 * miliseconds,
  noble: 0.35 * miliseconds,
  arbitrum: 14 * miliseconds,
  base: 14 * miliseconds,
};

export const IERC20 = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export const ICCTP = [
  {
    type: "function",
    name: "depositForBurnWithCaller",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "destinationDomain", type: "uint32", internalType: "uint32" },
      { name: "mintRecipient", type: "bytes32", internalType: "bytes32" },
      { name: "burnToken", type: "address", internalType: "address" },
      { name: "destinationCaller", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [{ name: "_nonce", type: "uint64", internalType: "uint64" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "receiveMessage",
    inputs: [
      { name: "message", type: "bytes", internalType: "bytes" },
      { name: "attestation", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "MessageSent",
    inputs: [
      { name: "message", type: "bytes", indexed: false, internalType: "bytes" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MessageReceived",
    inputs: [
      {
        name: "caller",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sourceDomain",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      { name: "nonce", type: "uint64", indexed: true, internalType: "uint64" },
      {
        name: "sender",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "messageBody",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DepositForBurn",
    inputs: [
      { name: "nonce", type: "uint64", indexed: true, internalType: "uint64" },
      {
        name: "burnToken",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "depositor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "mintRecipient",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "destinationDomain",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      {
        name: "destinationTokenMessenger",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "destinationCaller",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
] as const;

export const DESTINATION_CALLERS: Record<Chains, Address | string> = {
  [Chains.noble]: "noble1ud8dqwgnrv8gpatl955kx0zjuhpw4n560dv5qy",
  [Chains.ethereum]: PROXY_CONTRACTS.ethereum.address,
  [Chains.arbitrum]: PROXY_CONTRACTS.arbitrum.address,
  [Chains.base]: PROXY_CONTRACTS.base.address,
};

export const AGGREGATOR_V3_INTERFACE = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ETH_USD_PRICE_FEEDS: Record<string, Address> = {
  ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  arbitrum: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  base: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
};

export const NOBLE_RPC = "https://noble-rpc.polkachu.com:443";
