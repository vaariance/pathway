import { svg_assets } from "@/components/ui/assets";
import { SVGProps } from "react";
import { Chains, Mode } from "thepathway-js";

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
    fallback: "NBL",
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
    fallback: "BASE",
    type: "ethereum",
    block_explorer: "https://base.blockscout.com",
  },
  {
    value: "avalanche",
    name: "Avalanche",
    img_src: svg_assets.avalanche,
    fallback: "AVA",
    type: "ethereum",
    block_explorer: "https://snowtrace.io",
  },
  {
    value: "polygon",
    name: "Polygon",
    img_src: svg_assets.polygon,
    fallback: "POL",
    type: "ethereum",
    block_explorer: "https://polygon.blockscout.com/",
  },
  {
    value: "optimism",
    name: "Optimism",
    img_src: svg_assets.optimism,
    fallback: "OP",
    type: "ethereum",
    block_explorer: "https://optimism.blockscout.com/",
  }
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
