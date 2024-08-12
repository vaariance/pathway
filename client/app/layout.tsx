import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { TRANSPORTS } from "thepathway-js";
import { Toaster } from "@/components/ui/toaster";
import "./tailwind.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pathway - USDC Bridge",
  description: "Noble to Ethereum USDC Bridge",
};

const alchemy_api_key = process.env.ALCHEMY_API_KEY;
const transports = TRANSPORTS(alchemy_api_key);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body className={inter.className}>
        <Provider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          transports={transports}
        >
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
