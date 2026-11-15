"use client";

import { DeparturesBoard } from "@/components/home/DeparturesBoard";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FinalCta } from "@/components/home/TerminalSection";
import { useProtocol } from "@/lib/useProtocol";

/** Accueil : titre, tableau des départs, fonctionnement. Sécurité et contrats sont sur /securite. */
export default function HomePage() {
  const rules = useProtocol();
  return (
    <main>
      <Hero />
      <DeparturesBoard />
      <HowItWorks rules={rules} />
      <FinalCta />
    </main>
  );
}
