"use client";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "@/constants/registry";

import { wallets as cosmostationwallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as leapwallets } from "@cosmos-kit/leap-extension";
import { wallets as keplrwallets } from "@cosmos-kit/keplr-extension";

import { ExoticDialogCosmos } from "@/components/ui/exotic-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { http, createConfig, WagmiProvider } from "wagmi";
import { base, mainnet, arbitrum } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

export const project_id = "5874215139e2bf179decb72ddbd9197d";

const config = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [
    coinbaseWallet(),
    injected(),
    walletConnect({ projectId: project_id }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

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
