"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAIN, CHAIN_ID, IS_LOCAL } from "@/config/chain";
import { deployment } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { useWeb3 } from "@/lib/web3";
import { DevTimeTravel } from "../DevTimeTravel";
import { Logo } from "./Logo";
import { StatusLamp } from "./StatusLamp";

/** Navigation : le terme réel, avec une précision dessous. */
const NAV = [
  { href: "/#campagnes", label: "Campagnes", real: "Toutes les collectes", match: (p: string) => p === "/" || p.startsWith("/campaign") },
  { href: "/governance", label: "Gouvernance", real: "Votes de la DAO", match: (p: string) => p.startsWith("/governance") },
  { href: "/creator", label: "Créer", real: "Nouvelle campagne", match: (p: string) => p.startsWith("/creator") },
  { href: "/securite", label: "Sécurité", real: "Audit et tests", match: (p: string) => p.startsWith("/securite") },
];

function WalletButton() {
  const { hasWallet, account, connecting, connect } = useWeb3();
  if (!hasWallet) {
    return (
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        Installer MetaMask
      </a>
    );
  }
  if (account) {
    return (
      <span className="mono inline-flex min-h-[48px] items-center gap-2.5 rounded-md border-[1.5px] border-line px-4 text-[13px] font-bold tracking-[.06em]">
        <StatusLamp color="var(--ok)" size={10} />
        <span className="sr-only">Portefeuille connecté :</span>
        {shortAddress(account)}
      </span>
    );
  }
  return (
    <button type="button" onClick={connect} disabled={connecting} className="btn btn-ghost btn-sm">
      {connecting ? "Connexion…" : "Connecter MetaMask"}
    </button>
  );
}

const BANNER = "mono flex flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-center text-[13px] font-bold tracking-[.06em]";

/** Bandeaux d'état : contrats absents, lecture seule, mauvais réseau, erreur de portefeuille. */
function NetworkBanner() {
  const { hasWallet, wrongNetwork, switchNetwork, walletError } = useWeb3();
  if (!deployment) {
    return (
      <div role="alert" className={`${BANNER} bg-alert text-night`}>
        Aucun contrat déployé sur le réseau {CHAIN_ID}. Lancez le déploiement, puis npm run sync.
      </div>
    );
  }
  // Sans MetaMask : pas de bandeau, le bouton « Installer MetaMask » de l'en-tête suffit.
  if (!hasWallet) return null;
  if (wrongNetwork) {
    return (
      <div role="alert" className={`${BANNER} on-amber bg-amber text-night`}>
        MetaMask est sur un autre réseau. CampusFund fonctionne sur {CHAIN.name}.
        <button type="button" onClick={switchNetwork} className="btn btn-dark btn-sm !min-h-[36px] !px-3.5">
          Passer sur {CHAIN.name}
        </button>
      </div>
    );
  }
  if (walletError) {
    return (
      <div role="alert" className={`${BANNER} bg-alert text-night`}>
        {walletError}
      </div>
    );
  }
  return null;
}

export function Header() {
  const pathname = usePathname();
  return (
    <>
      <NetworkBanner />
      <header className="wrap flex flex-wrap items-center justify-between gap-4 py-[26px]">
        <Link href="/" aria-label="CampusFund, accueil" className="text-ticket no-underline transition-opacity active:opacity-60">
          <Logo size={50} />
        </Link>
        <nav aria-label="Navigation principale" className="mono flex flex-wrap gap-x-[34px] gap-y-1 text-[14px] uppercase tracking-[.1em]">
          {NAV.map((n) => {
            const isActive = n.match(pathname);
            return (
              <Link key={n.href} href={n.href} aria-current={isActive ? "page" : undefined} className="nav-link flex flex-col leading-tight">
                <span>{n.label}</span>
                <span className="font-display text-[12px] normal-case tracking-normal text-gray">{n.real}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          {IS_LOCAL && <DevTimeTravel />}
          <WalletButton />
        </div>
      </header>
    </>
  );
}
