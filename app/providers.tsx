"use client";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "@/constants/registry";

import { wallets as cosmostationwallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as leapwallets } from "@cosmos-kit/leap-extension";
import { wallets as keplrwallets } from "@cosmos-kit/keplr-extension";

import { ExoticDialogCosmos } from "@/components/ui/exotic-dialog";

export default function CosmosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={[...leapwallets, ...cosmostationwallets, ...keplrwallets]}
      walletModal={ExoticDialogCosmos}
    >
      {children}
    </ChainProvider>
  );
}
