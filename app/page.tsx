import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import {
  CtaBand,
  FailoverBand,
  Formats,
  HowItWorks,
} from "@/components/landing/sections";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Formats />
        <FailoverBand />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
