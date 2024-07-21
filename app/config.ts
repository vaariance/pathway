import { http, createConfig } from "wagmi";
import { base, mainnet, arbitrum } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

export const project_id = "5874215139e2bf179decb72ddbd9197d";

export const config = createConfig({
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
