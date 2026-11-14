import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { Web3Provider } from "@/lib/web3";
import "./globals.css";

// Police de titre : téléchargée au build et servie par le site (aucun appel à Google à l'exécution)
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CampusFund : le financement étudiant qui se vote", template: "%s | CampusFund" },
  description: "Finance les projets des clubs étudiants. Les fonds restent bloqués dans un contrat et sont versés tranche par tranche, après le vote de ceux qui ont donné.",
  applicationName: "CampusFund",
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={display.variable}>
      <body className="min-h-screen antialiased">
        <Web3Provider>
          <Header />
          <main className="mx-auto max-w-6xl px-5 pb-24">{children}</main>
          <footer className="border-t border-[var(--line)]">
            <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 py-8 text-[13px] text-[var(--text-2)]">
              <div className="text-[var(--text)]">
                <Logo size={24} />
                <p className="mt-2 text-[var(--text-2)]">Le financement étudiant qui se vote.</p>
              </div>
              <p>Mini-projet Blockchain, ENSA Béni Mellal. Contrats Solidity et OpenZeppelin, testés avec Foundry.</p>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
