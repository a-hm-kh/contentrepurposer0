import { VisitTracker } from "@/components/analytics/VisitTracker";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import {
  CtaBand,
  FailoverBand,
  Formats,
  HowItWorks,
  Pricing,
} from "@/components/landing/sections";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <VisitTracker />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Formats />
        <FailoverBand />
        <Pricing />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
