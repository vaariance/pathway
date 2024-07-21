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

import { themeSessionResolver } from "./sessions.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import clsx from "clsx";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config, project_id } from "./config";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "chain-registry";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as leapwallets } from "@cosmos-kit/leap";
import { wallets as compass } from "@cosmos-kit/compass";

import "@interchain-ui/react/styles";
import { ExoticDialogCosmos } from "@/components/ui/exotic-dialog";

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
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          specifiedTheme={data.theme}
          themeAction="/action/set-theme"
        >
          <Layout>
            <ChainProvider
              chains={chains}
              assetLists={assets}
              wallets={[
                ...keplrWallets,
                cosmostationWallets[0],
                ...leapwallets.slice(0, 2),
                ...compass,
              ]}
              walletConnectOptions={{ signClient: { projectId: project_id } }}
              walletModal={ExoticDialogCosmos}
            >
              <Outlet />
            </ChainProvider>
          </Layout>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
