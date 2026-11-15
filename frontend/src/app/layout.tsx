import type { Metadata, Viewport } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Header } from "@/components/board/Header";
import { Web3Provider } from "@/lib/web3";
import "./globals.css";

// Polices téléchargées au build et servies par le site (aucun appel à Google à l'exécution).
// Space Mono : palettes, étiquettes, données. Archivo (axe de largeur) : titres condensés et texte courant.
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CampusFund : les fonds décollent sur vote", template: "%s | CampusFund" },
  description:
    "CampusFund finance les projets des clubs étudiants. Les ETH restent à quai : une tranche ne part vers le club que lorsque les contributeurs ont voté son départ.",
  applicationName: "CampusFund",
};

export const viewport: Viewport = { themeColor: "#09090A", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${mono.variable} ${display.variable}`}>
      <body className="min-h-screen">
        <Web3Provider>
          <Header />
          {children}
          <footer className="wrap tag flex flex-wrap justify-between gap-3 pb-10 pt-7">
            <span>CampusFund · Mini-projet Blockchain · ENSA Béni Mellal, filière IA et Cybersécurité</span>
            <span>Foundry · Next.js 14 · Ethers v6</span>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
