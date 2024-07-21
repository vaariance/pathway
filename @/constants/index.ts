import { mainnet, arbitrum, base, Chain as ViemChain } from "viem/chains";
import base_contract from "../../out/deployments/base/latest.json";

export enum USDC_CONTRACTS {
  ethereum = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  noble = "uusdc",
  arbitrum = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  base = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
}

export const PROXY_CONTRACTS = {
  arbitrum: null,
  base: base_contract,
  ethereum: null,
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
  noble = "",
}

export enum DOMIANS {
  ethereum = 0,
  noble = 4,
  arbitrum = 3,
  base = 6,
}

export type Chain = {
  value: Mode;
  name: string;
  img_src: string;
  fallback: string;
  type: Mode;
};

export const chain_data: Chain[] = [
  {
    value: "noble",
    name: "Noble",
    img_src:
      "https://raw.githubusercontent.com/cosmos/chain-registry/8304df2430e1d3418bb2102ac76af5a138141216/noble/images/stake.svg",
    fallback: "NB",
    type: "noble",
  },
  {
    value: "ethereum",
    name: "Ethereum",
    img_src:
      "https://ethereum.org/_next/static/media/eth-diamond-purple.7929ed26.png",
    fallback: "ETH",
    type: "ethereum",
  },
  {
    value: "arbitrum",
    name: "Arbitrum",
    img_src:
      "https://file.notion.so/f/f/80206c3c-8bc5-49a2-b0cd-756884a06880/810c0e00-6698-45da-9ed7-1766749a67c4/0923_One_Logos_Logomark_RGB.svg?id=c347059c-7e53-4cc8-ab36-f1c7481a1a01&table=block&spaceId=80206c3c-8bc5-49a2-b0cd-756884a06880&expirationTimestamp=1721397600000&signature=Vp6ptKKV7-bvZbVsFCeq3kJ1tOay16rbT9OijYuF0bw&downloadName=0923_One_Logos_Logomark_primary_RGB.svg",
    fallback: "ARB",
    type: "ethereum",
  },
  {
    value: "base",
    name: "Base",
    img_src:
      "https://raw.githubusercontent.com/base-org/brand-kit/8984fe6e08be3058fd7cf5cd0b201f8b92b5a70e/logo/in-product/Base_Network_Logo.svg",
    fallback: "OP",
    type: "ethereum",
  },
];

interface AssetInfo {
  chain: string;
  address: `0x${string}` | string;
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
  noble: {
    chain: "noble",
    address: USDC_CONTRACTS.noble,
    url: "http://mintscan.io/noble/assets",
  },
};

export type Mode = "noble" | "ethereum" | "arbitrum" | "base";

export type Path = {
  from: Mode;
  to: Chain | null;
  inverse: Mode;
  amount: string;
  balance?: string;
  receiver: string;
  error: Record<string, unknown> | null;
};

export const VIEM_NETWORKS: Record<Partial<Mode>, ViemChain | undefined> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  noble: undefined,
};
