"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAIN, CHAIN_ID, IS_LOCAL } from "@/config/chain";
import { deployment } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { useWeb3 } from "@/lib/web3";
import { DevTimeTravel } from "./DevTimeTravel";

const NAV = [
  { href: "/", label: "Campagnes" },
  { href: "/governance", label: "Gouvernance" },
  { href: "/creator", label: "Espace porteur" },
];

function WalletButton() {
  const { hasWallet, account, connecting, connect } = useWeb3();
  if (!hasWallet) {
    return (
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="btn-ghost">
        Installer MetaMask
      </a>
    );
  }
  if (account) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--rule)] bg-white px-3 py-2 font-mono text-xs">
        <span className="h-2 w-2 rounded-full bg-[var(--ok)]" aria-hidden />
        {shortAddress(account)}
      </span>
    );
  }
  return (
    <button type="button" className="btn-primary" onClick={connect} disabled={connecting}>
      {connecting ? "Connexion…" : "Connecter MetaMask"}
    </button>
  );
}

/** Bandeaux d'état : MetaMask absent, mauvais réseau, contrats non déployés. */
function NetworkBanner() {
  const { hasWallet, wrongNetwork, switchNetwork, walletError } = useWeb3();
  if (!deployment) {
    return (
      <div className="bg-rose-700 px-4 py-2 text-center text-sm text-white">
        Aucun contrat déployé pour le réseau {CHAIN_ID}. Lancez le déploiement puis <code>npm run sync</code>.
      </div>
    );
  }
  if (!hasWallet) {
    return (
      <div className="bg-[var(--ink)] px-4 py-2 text-center text-sm text-white/90">
        MetaMask n&apos;est pas détecté : vous consultez CampusFund en <strong>lecture seule</strong>. Installez MetaMask pour
        contribuer ou voter.
      </div>
    );
  }
  if (wrongNetwork) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
        MetaMask est sur un autre réseau. CampusFund fonctionne sur {CHAIN.name}.
        <button type="button" onClick={switchNetwork} className="rounded-md bg-amber-950 px-3 py-1 text-xs font-semibold text-white">
          Basculer sur {CHAIN.name}
        </button>
      </div>
    );
  }
  if (walletError) {
    return <div className="bg-rose-50 px-4 py-2 text-center text-sm text-rose-900">{walletError}</div>;
  }
  return null;
}

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--paper)]/85 backdrop-blur">
      <NetworkBanner />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold">
            Campus<span className="text-[var(--accent)]">Fund</span>
          </span>
          <span className="hidden text-xs text-[var(--ink-soft)] xl:inline">projets étudiants · gouvernance DAO</span>
        </Link>
        <nav className="flex gap-1 text-sm" aria-label="Navigation principale">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" || pathname.startsWith("/campaign") : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1.5 font-medium transition ${active ? "bg-[var(--ink)] text-white" : "hover:bg-white"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {IS_LOCAL && <DevTimeTravel />}
          <span className="hidden rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--rule)] md:inline">
            {CHAIN.name}
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
