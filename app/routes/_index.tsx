import { Body } from "@/components/Body";
import Header from "@/components/Header";
import PathwayBackground from "@/components/ui/path";
import type { ServerRuntimeMetaFunction } from "@remix-run/server-runtime";

export const meta: ServerRuntimeMetaFunction = () => {
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
