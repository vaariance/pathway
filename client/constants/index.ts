import { svg_assets } from "@/components/ui/assets";
import { SVGProps } from "react";
import { Chains, Mode } from "@pathway/sdk";

export type ChainMetadata = {
  value: Mode;
  name: string;
  img_src: (className: string) => SVGProps<SVGSVGElement>;
  fallback: string;
  type: Mode;
  block_explorer: string;
};

export const chain_data: ChainMetadata[] = [
  {
    value: "noble",
    name: "Noble",
    img_src: svg_assets.noble,
    fallback: "NB",
    type: "noble",
    block_explorer: "http://mintscan.io/noble",
  },
  {
    value: "ethereum",
    name: "Ethereum",
    img_src: svg_assets.ethereum,
    fallback: "ETH",
    type: "ethereum",
    block_explorer: "https://eth.blockscout.com",
  },
  {
    value: "arbitrum",
    name: "Arbitrum",
    img_src: svg_assets.arbitrum,
    fallback: "ARB",
    type: "ethereum",
    block_explorer: "https://arbitrum.blockscout.com",
  },
  {
    value: "base",
    name: "Base",
    img_src: svg_assets.base,
    fallback: "OP",
    type: "ethereum",
    block_explorer: "https://base.blockscout.com",
  },
];

export const get_explorer = (chain: Chains) =>
  chain_data.find((c) => c.value === chain)!.block_explorer;

export type PathContructor = {
  from: Mode;
  to: ChainMetadata | null;
  inverse: Mode;
  amount: string;
  balance?: string;
  receiver: string;
  error: Record<string, unknown> | null;
};
