"use client";

import { ScannerSection } from "@/components/home/ScannerSection";
import { SecuritySection } from "@/components/home/SecuritySection";
import { TerminalSection } from "@/components/home/TerminalSection";
import { useProtocol } from "@/lib/useProtocol";

/** Sécurité et transparence : tests, attaques démontrées, scanner IA et contrats déployés. */
export default function SecurityPage() {
  const rules = useProtocol();
  return (
    <main>
      <div className="wrap flex flex-col gap-4 pt-5">
        <span className="tag text-amber">Sécurité &amp; transparence</span>
        <h1 className="display display-hero">
          Vérifiez
          <br />
          <span className="text-amber">avant de monter.</span>
        </h1>
        <p className="m-0 max-w-[560px] text-[19px] text-soft">Tests, attaques rejouées, score de risque et adresses des contrats.</p>
      </div>
      <SecuritySection />
      <ScannerSection />
      <TerminalSection rules={rules} />
    </main>
  );
}
