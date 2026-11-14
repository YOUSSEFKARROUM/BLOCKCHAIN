import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Web3Provider } from "@/lib/web3";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusFund · financement participatif étudiant",
  description: "Financement décentralisé de projets étudiants et de clubs, gouverné par le jeton CFD.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <Web3Provider>
          <Header />
          <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">{children}</main>
          <footer className="border-t border-[var(--line)]">
            <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 py-8 text-[13px] text-[var(--text-2)]">
              <p className="font-semibold text-[var(--text)]">CampusFund</p>
              <p>Mini-projet Blockchain, ENSA Béni Mellal. Contrats Solidity et OpenZeppelin, testés avec Foundry.</p>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
