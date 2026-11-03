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
          <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">{children}</main>
          <footer className="border-t border-[var(--rule)] py-6 text-center text-xs text-[var(--ink-soft)]">
            CampusFund · mini-projet Blockchain, ENSA Béni Mellal · contrats Solidity + OpenZeppelin, testés avec Foundry
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
