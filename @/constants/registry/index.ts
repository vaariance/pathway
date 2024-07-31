import { Chains, Chain, AssetList } from "@chain-registry/types";

import noble_chain from "./noble/chain.json" assert { type: "json" };
import noble_assets from "./noble/assetlist.json" assert { type: "json" };

export const chains: Chains = [noble_chain as Chain];
export const assets: AssetList[] = [noble_assets];
