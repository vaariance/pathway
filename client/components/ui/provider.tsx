"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { arbitrum, base, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "@/constants/registry";
import { wallets as cosmostationwallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as leapwallets } from "@cosmos-kit/leap-extension";
import { wallets as keplrwallets } from "@cosmos-kit/keplr-extension";
import { ExoticDialogCosmos } from "@/components/ui/exotic-dialog";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

const wc_options = {
  projectId: "5874215139e2bf179decb72ddbd9197d",
  disableProviderPing: true,
  metadata: {
    name: "Pathway",
    description: "Pathway - USDC Bridge",
    url: "https://app.thepathway.to",
    icons: [
      "https://app.thepathway.to/icon.png",
      "https://app.thepathway.to/logo.svg",
    ],
  },
  showQrModal: false,
};

const config = (transports: {
  ethereum: string;
  arbitrum: string;
  base: string;
  noble: string;
}) =>
  createConfig({
    chains: [mainnet, arbitrum, base],
    connectors: [coinbaseWallet(), injected(), walletConnect(wc_options)],
    transports: {
      [mainnet.id]: http(transports.ethereum),
      [arbitrum.id]: http(transports.arbitrum),
      [base.id]: http(transports.base),
    },
  });

const queryClient = new QueryClient();

export function Provider({
  children,
  transports,
  ...props
}: ThemeProviderProps & {
  transports: any;
}) {
  return (
    <NextThemesProvider {...props}>
      <WagmiProvider config={config(transports)}>
        <QueryClientProvider client={queryClient}>
          <ChainProvider
            chains={chains}
            assetLists={assets}
            wallets={[...leapwallets, ...cosmostationwallets, ...keplrwallets]}
            walletModal={ExoticDialogCosmos}
          >
            {children}
          </ChainProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </NextThemesProvider>
  );
}
