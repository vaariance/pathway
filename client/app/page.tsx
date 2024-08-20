import Header from "@/components/Header";
import { CtaButton } from "@/components/Home/CtaButton";
import { Hero } from "@/components/Home/Hero";

export default function Home() {
  return (
    <>
      <Header>
        <CtaButton />
      </Header>
      <Hero />
    </>
  );
}
