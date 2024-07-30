import { Body } from "@/components/Body";
import Header from "@/components/Header";
import PathwayBackground from "@/components/ui/path";
import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Pathway - USDC Bridge" },
    { name: "description", content: "Noble to Ethereum USDC Bridge" },
  ];
};

export default function Index() {
  return (
    <main className="h-screen relative">
      <PathwayBackground />
      <Header />
      <Body />
    </main>
  );
}
