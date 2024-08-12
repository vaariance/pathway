import { Body } from "@/components/Body";
import Header from "@/components/Header";
import PathwayBackground from "@/components/ui/path";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="h-screen relative">
      <PathwayBackground />
      <Suspense fallback={null}>
        <Header />
        <Body />
      </Suspense>
    </main>
  );
}
