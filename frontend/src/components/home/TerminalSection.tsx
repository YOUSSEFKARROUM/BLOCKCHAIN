import Link from "next/link";
import { ArrowIcon } from "@/components/board/Icons";
import { SignPanel } from "@/components/board/SignPanel";
import { CHAIN } from "@/config/chain";
import { deployment } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { formatPeriod, type ProtocolRules } from "@/lib/useProtocol";

type ContractKey = "CFDToken" | "CampusFund" | "Governance" | "Treasury";

function gates(r: ProtocolRules): { gate: string; name: ContractKey; text: string }[] {
  return [
    { gate: "A1", name: "CFDToken", text: "Jeton de vote ERC20Votes." },
    { gate: "A2", name: "CampusFund", text: "Campagnes, jalons, remboursements." },
    { gate: "A3", name: "Governance", text: `DAO à snapshot, quorum ${r.quorumPercent} %, vote de ${formatPeriod(r.votingPeriodSeconds)}.` },
    { gate: "A4", name: "Treasury", text: "Multisig 2 sur 3." },
  ];
}

function explorerUrl(address: string): string | null {
  return CHAIN.explorer ? `${CHAIN.explorer}/address/${address}#code` : null;
}

/** Les quatre contrats déployés, présentés comme les portes du terminal. */
export function TerminalSection({ rules }: { rules: ProtocolRules }) {
  return (
    <section aria-labelledby="terminal-title" className="wrap flex flex-col gap-8 pb-24 pt-[72px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 id="terminal-title" className="display display-l">
          Terminal <span className="text-amber">{CHAIN.name}.</span>
        </h2>
        {deployment && (
          <span className="tag">
            Déployé au bloc {deployment.deployBlock}
          </span>
        )}
      </div>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        {gates(rules).map((g) => {
          const address = deployment?.[g.name];
          const link = address ? explorerUrl(address) : null;
          return (
            <div key={g.gate} className="on-amber flex min-h-[230px] flex-col gap-3 rounded-[10px] bg-amber p-6 text-night">
              <div className="flex items-start justify-between">
                <span className="tag-b">Porte</span>
                <span className="display text-[64px]" style={{ lineHeight: 0.8, fontStretch: "70%" }}>
                  {g.gate}
                </span>
              </div>
              <h3 className="display mb-0 mt-auto text-[32px] normal-case" style={{ fontStretch: "78%", lineHeight: 1 }}>
                {g.name}
              </h3>
              <p className="m-0 text-[14px] font-medium">{g.text}</p>
              {address &&
                (link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="mono text-[14px] font-bold underline-offset-4 hover:underline">
                    {shortAddress(address)}
                    <span className="sr-only"> (voir sur l&apos;explorateur)</span>
                  </a>
                ) : (
                  <span className="mono text-[14px] font-bold">{shortAddress(address)}</span>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <SignPanel variant="band" aria-labelledby="cta-title">
      <div className="wrap flex flex-wrap items-end justify-between gap-9 py-[88px]">
        <h2 id="cta-title" className="display flex-[1_1_560px]" style={{ fontSize: "clamp(52px, 8.4vw, 136px)", lineHeight: 0.84, fontStretch: "66%" }}>
          Votre club a un projet. La DAO a un vote.
        </h2>
        <div className="flex flex-wrap gap-3">
          <a href="#departs" className="btn btn-dark !min-h-[64px] !text-[15px]">
            Voir les campagnes
            <ArrowIcon />
          </a>
          <Link href="/creator" className="btn btn-outline-dark !min-h-[64px] !text-[15px]">
            Créer une campagne
          </Link>
        </div>
      </div>
    </SignPanel>
  );
}
