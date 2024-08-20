import { Web3Provider } from "@/components/ui/provider";
import { TRANSPORTS } from "thepathway-js";
import { Toaster } from "@/components/ui/toaster";

const alchemy_api_key = process.env.ALCHEMY_API_KEY;
const transports = TRANSPORTS(alchemy_api_key);

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Web3Provider transports={transports}>
      {children}
      <Toaster />
    </Web3Provider>
  );
}
