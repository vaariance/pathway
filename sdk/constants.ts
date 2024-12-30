import { mainnet, arbitrum, base, avalanche, polygon, optimism, Chain } from "viem/chains";

import { Address } from "viem";

export enum Chains {
  noble = "noble",
  ethereum = "ethereum",
  arbitrum = "arbitrum",
  base = "base",
  avalanche = "avalanche",
  polygon = "polygon",
  optimism = "optimism"
}

export enum USDC_CONTRACTS {
  ethereum = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  noble = "uusdc",
  arbitrum = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  base = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  avalanche = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  optimism = "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  polygon = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
}

export enum TOKEN_MESSENGERS {
  arbitrum = "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
  ethereum = "0xbd3fa81b58ba92a82136038b25adec7066af3155",
  noble = "/circle.cctp.v1.MsgDepositForBurnWithCaller",
  base = "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
  avalanche = "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
  optimism = "0x2B4069517957735bE00ceE0fadAE88a26365528f",
  polygon = "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE",
}

export enum MESSAGE_TRANSMITTERS {
  arbitrum = "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
  ethereum = "0x0a992d191deec32afe36203ad87d7d289a738f81",
  base = "0xAD09780d193884d503182aD4588450C416D6F9D4",
  noble = "/circle.cctp.v1.MsgReceiveMessage",
  optimism = "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
  polygon = "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
  avalanche = "0x8186359af5f57fbb40c6b14a588d2a59c0c29880"
}

export enum DOMAINS {
  ethereum = 0,
  avalanche = 1,
  optimism = 2,
  arbitrum = 3,
  noble = 4,
  base = 6,
  polygon = 7
}

export const REVERSE_DOMAINS: Record<number, Chains> = {
  0: Chains.ethereum,
  1: Chains.avalanche,
  2: Chains.optimism,
  3: Chains.arbitrum,
  4: Chains.noble,
  6: Chains.base,
  7: Chains.polygon
};

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
  "10": {
    chain: "optimism",
    address: USDC_CONTRACTS.optimism,
    url: "https://optimistic.etherscan.io/token/0x0b2c639c533813f4aa9d7837caf62653d097ff85"
  },
  "43114": {
    chain: "avalanche",
    address: USDC_CONTRACTS.avalanche,
    url: "https://snowtrace.io/token/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"
  },
  "137": {
    chain: "polygon",
    address: USDC_CONTRACTS.polygon,
    url: "https://polygonscan.com/token/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
  }
};

export type Mode = "noble" | "ethereum" | "arbitrum" | "base" | "avalanche" | "polygon" | "optimism";

export const VIEM_NETWORKS: Record<Mode, Chain | undefined> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  noble: undefined,
  avalanche: avalanche,
  polygon: polygon,
  optimism: optimism
};

const minute = 60 * 1000;

export const SOURCE_CHAIN_CONFIRMATIONS = {
  ethereum: 13 * minute,
  noble: 0.1 * minute,
  arbitrum: 13 * minute,
  base: 13 * minute,
  avalanche: 0.1 * minute,
  polygon: 8 * minute,
  optimism: 13 * minute
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
  [Chains.noble]: "noble1nejktfwd47h9hsku6fxtgaxe5hf4pjzz3rq6ek",
  [Chains.ethereum]: "0xeB4EaE8072bF3e2608f05B6812CD95133BF71504",
  [Chains.arbitrum]: "0xeB4EaE8072bF3e2608f05B6812CD95133BF71504",
  [Chains.base]: "0xeb4eae8072bf3e2608f05b6812cd95133bf71504",
  [Chains.polygon]: "0xeB4EaE8072bF3e2608f05B6812CD95133BF71504",
  [Chains.optimism]: "0xeB4EaE8072bF3e2608f05B6812CD95133BF71504",
  [Chains.avalanche]: "0xD54c1628F113dA05bE5048dF948bc8dade604911",
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

export const NATIVE_USD_PRICE_FEEDS: Record<Chains, Address> = {
  ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  arbitrum: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  base: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  polygon: "0x82BA56a2fADF9C14f17D08bc51bDA0bDB83A8934", // pol feed on arbitrum
  avalanche: "0x0A77230d17318075983913bC2145DB16C7366156", // avax/usd
  optimism: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
  noble: "0xuusdc"
};

export const LA_FACTORIES = Object.values(Chains).reduce((acc, key) => {
  if (key === Chains.avalanche) {
    acc[key] = "0x37e25c06bf19e2d1cd0499c9eb4f941475b78271";
  } else {
    acc[key] = "0x0000000000400CdFef5E2714E63d8040b700BC24";
  }
  return acc;
}, {} as Record<Chains, Address>);

export const RPC_TRANSPORTS: Record<Chains, string> = {
  [Chains.ethereum]: "https://rpc.ankr.com/eth",
  [Chains.arbitrum]: "https://rpc.ankr.com/arbitrum",
  [Chains.base]: "https://rpc.ankr.com/base",
  [Chains.noble]: "https://noble-rpc.polkachu.com:443",
  [Chains.optimism]: "https://rpc.ankr.com/optimism",
  [Chains.polygon]: "https://rpc.ankr.com/polygon",
  [Chains.avalanche]: "https://rpc.ankr.com/avalanche",
}

export const AA_TRANSPORTS = (key: string) => ({
  [Chains.ethereum]: `https://api.pimlico.io/v2/1/rpc?apikey=${key}`,
  [Chains.arbitrum]: `https://api.pimlico.io/v2/42161/rpc?apikey=${key}`,
  [Chains.base]: `https://api.pimlico.io/v2/8453/rpc?apikey=${key}`,
  [Chains.noble]: undefined,
  [Chains.optimism]: `https://api.pimlico.io/v2/10/rpc?apikey=${key}`,
  [Chains.polygon]: `https://api.pimlico.io/v2/137/rpc?apikey=${key}`,
  [Chains.avalanche]: `https://api.pimlico.io/v2/43114/rpc?apikey=${key}`,
} satisfies Record<Chains, string | undefined>)