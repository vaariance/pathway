import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "./tailwind.css";

import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";

import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import clsx from "clsx";
import { lazy, memo } from "react";
import { themeSessionResolver } from "./sessions.server";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { arbitrum, base, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const LazyCosmosProvider = lazy(async () => await import("./providers"));
const CosmosProvider = memo(LazyCosmosProvider);

export const project_id = "5874215139e2bf179decb72ddbd9197d";

const config = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [
    coinbaseWallet(),
    injected(),
    walletConnect({
      projectId: project_id,
      disableProviderPing: true,
      metadata: {
        name: "Pathway",
        description: "Pathway - USDC Bridge",
        url: "https://app.thepathway.to",
        icons: [
          "https://app.thepathway.to/favicon.png",
          "https://app.thepathway.to/logo.svg",
        ],
      },
      showQrModal: false,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request);
  return {
    theme: getTheme(),
  };
}

function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const [theme] = useTheme();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body className={clsx(theme)}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <Layout>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <CosmosProvider>
              <Outlet />
            </CosmosProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </Layout>
    </ThemeProvider>
  );
}
