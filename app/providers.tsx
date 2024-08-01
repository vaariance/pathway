"use client";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "@/constants/registry";

import { wallets as cosmostationwallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as leapwallets } from "@cosmos-kit/leap-extension";
import { wallets as keplrwallets } from "@cosmos-kit/keplr-extension";

import { ExoticDialogCosmos } from "@/components/ui/exotic-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config";

const queryClient = new QueryClient();

function EthereumProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

function CosmosProvider({ children }: { children: React.ReactNode }) {
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

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EthereumProvider>
      <CosmosProvider>{children}</CosmosProvider>
    </EthereumProvider>
  );
}
