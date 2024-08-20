import { Body } from "@/components/Body";
import Header, { ConnectButton } from "@/components/Header";
import PathwayBackground from "@/components/ui/path";

export default function App() {
  return (
    <main className="h-screen relative">
      <PathwayBackground className="fixed" />
      <Header>
        <ConnectButton />
      </Header>
      <Body />
    </main>
  );
}
