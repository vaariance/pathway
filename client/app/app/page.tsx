import { Body } from "@/components/Body";
import Header from "@/components/Header";
import PathwayBackground from "@/components/ui/path";

export default function App() {
  return (
    <main className="h-screen relative">
      <PathwayBackground />
      <Header />
      <Body />
    </main>
  );
}
