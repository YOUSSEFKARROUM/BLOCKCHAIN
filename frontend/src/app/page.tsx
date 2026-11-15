"use client";

import { DeparturesBoard } from "@/components/home/DeparturesBoard";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ScannerSection } from "@/components/home/ScannerSection";
import { SecuritySection } from "@/components/home/SecuritySection";
import { FinalCta, TerminalSection } from "@/components/home/TerminalSection";
import { useProtocol } from "@/lib/useProtocol";

/** Accueil : le tableau des départs (maquette Main). */
export default function HomePage() {
  const rules = useProtocol();
  return (
    <main>
      <Hero />
      <DeparturesBoard />
      <HowItWorks rules={rules} />
      <SecuritySection />
      <ScannerSection />
      <TerminalSection rules={rules} />
      <FinalCta />
    </main>
  );
}
