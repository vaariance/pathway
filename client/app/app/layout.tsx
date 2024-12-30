import { Web3Provider } from "@/components/ui/provider";
import { RPC_TRANSPORTS } from "thepathway-js";
import { Toaster } from "@/components/ui/toaster";


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Web3Provider transports={RPC_TRANSPORTS}>
      {children}
      <Toaster />
    </Web3Provider>
  );
}
