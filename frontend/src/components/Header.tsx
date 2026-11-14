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
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="btn-primary">
        Installer MetaMask
      </a>
    );
  }
  if (account) {
    return (
      <span className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-[var(--line)] px-4 font-mono text-xs">
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

/** Bandeaux d'état : contrats non déployés, MetaMask absent, mauvais réseau. */
function NetworkBanner() {
  const { hasWallet, wrongNetwork, switchNetwork, walletError } = useWeb3();
  if (!deployment) {
    return (
      <div className="tone-danger px-4 py-2 text-center text-sm">
        Aucun contrat déployé sur le réseau {CHAIN_ID}. Lancez le déploiement, puis <code>npm run sync</code>.
      </div>
    );
  }
  if (!hasWallet) {
    return (
      <div className="tone-neutral px-4 py-2 text-center text-[13px]">
        Lecture seule : installez MetaMask pour contribuer ou voter.
      </div>
    );
  }
  if (wrongNetwork) {
    return (
      <div className="tone-warn flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm">
        MetaMask est sur un autre réseau. CampusFund fonctionne sur {CHAIN.name}.
        <button type="button" onClick={switchNetwork} className="rounded-full bg-[var(--warn)] px-3 py-1 text-xs font-semibold text-black">
          Passer sur {CHAIN.name}
        </button>
      </div>
    );
  }
  if (walletError) return <div className="tone-danger px-4 py-2 text-center text-sm">{walletError}</div>;
  return null;
}

export function Header() {
  const pathname = usePathname();
  return (
    <header className="chrome sticky top-0 z-30">
      <NetworkBanner />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-2.5">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
          CampusFund
        </Link>
        <nav className="flex gap-1 text-sm" aria-label="Navigation principale">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" || pathname.startsWith("/campaign") : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 font-medium transition-colors ${active ? "text-[var(--text)]" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {IS_LOCAL && <DevTimeTravel />}
          <span className="hidden text-[13px] text-[var(--text-2)] md:inline">{CHAIN.name}</span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
