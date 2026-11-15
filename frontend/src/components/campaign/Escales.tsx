import Link from "next/link";
import { ArrowIcon } from "@/components/board/Icons";
import { StatusLamp } from "@/components/board/StatusLamp";
import { COLORS, ESCALE_LABELS, type EscaleState, escaleStates, releaseProposalFor } from "@/lib/campaignView";
import { type Campaign, type Proposal, trancheAmounts } from "@/lib/data";
import { cfd, eth, percent } from "@/lib/format";
import type { CampaignMetadata } from "@/lib/metadata";

const STATE_COLOR: Record<EscaleState, string> = { paid: COLORS.ok, approved: COLORS.amber, voting: COLORS.amber, locked: COLORS.gray };
const ROW = "mono flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[17px] font-bold tracking-[.04em]";

function EscaleLine({ index, title, bps, amount, state }: { index: number; title: string; bps: number; amount: string; state: EscaleState }) {
  return (
    <div className={ROW}>
      <span className="flex-[0_0_40px] text-gray">{String(index + 1).padStart(2, "0")}</span>
      <span className="flex-[1_1_240px] uppercase">{title}</span>
      <span className="flex-[0_0_60px]">{bps / 100} %</span>
      <span className="flex-[0_0_110px]">{amount}</span>
      <span className="flex flex-[0_0_200px] items-center gap-3 uppercase" style={{ color: STATE_COLOR[state] }}>
        <StatusLamp color={STATE_COLOR[state]} isBlinking={state === "voting"} isHollow={state === "locked"} />
        {ESCALE_LABELS[state]}
      </span>
    </div>
  );
}

/** Compteurs du vote en cours pour l'escale, avec lien vers la tour de contrôle. */
function VoteSummary({ proposal: p }: { proposal: Proposal }) {
  const cast = p.forVotes + p.againstVotes;
  const forShare = cast === 0n ? 0 : percent(p.forVotes, cast);
  const isQuorumReached = p.participation >= p.quorum;
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="flex h-4 overflow-hidden rounded-[3px] bg-[#2A2A2E]" aria-hidden="true">
          <div className="db-bar bg-amber" style={{ width: `${forShare}%` }} />
          <div className="db-bar bg-[#6E6E78]" style={{ width: `${cast === 0n ? 0 : 100 - forShare}%` }} />
        </div>
        <div className="mono flex flex-wrap justify-between gap-2 text-[13px] text-soft">
          <span>
            POUR {cfd(p.forVotes)} CFD · CONTRE {cfd(p.againstVotes)} CFD
          </span>
          <span style={{ color: isQuorumReached ? COLORS.ok : "#FF9B7A" }}>
            {isQuorumReached ? "QUORUM ATTEINT" : `QUORUM ${cfd(p.participation)} / ${cfd(p.quorum)}`}
          </span>
        </div>
      </div>
      <Link href="/governance" className="btn btn-amber btn-sm self-start !min-h-[52px]">
        Voter à la tour de contrôle
        <ArrowIcon />
      </Link>
    </>
  );
}

/** Liste des escales (jalons) de la campagne, l'escale en vote dépliée. */
export function Escales({ campaign: c, proposals, metadata, feePercent }: { campaign: Campaign; proposals: Proposal[]; metadata: CampaignMetadata | null; feePercent: number }) {
  const states = escaleStates(c, proposals);
  const tranches = trancheAmounts(c);
  const sample = tranches[0] ?? 0n;
  const sampleNet = (sample * BigInt(10_000 - Math.round(feePercent * 100))) / 10_000n;
  return (
    <section aria-labelledby="escales-title" className="flex flex-col gap-5">
      <h2 id="escales-title" className="display display-m">
        Escales <span className="text-amber">du vol</span>
      </h2>
      <ol className="m-0 flex list-none flex-col gap-[5px] p-0">
        {states.map((state, i) => {
          const title = metadata?.milestones[i]?.title ?? `Jalon ${i + 1}`;
          const amount = `${eth(tranches[i], 3)} ETH`;
          const proposal = state === "voting" ? releaseProposalFor(proposals, c.id, i) : undefined;
          if (proposal) {
            return (
              <li key={i} className="flex flex-col gap-5 rounded-md border-[1.5px] border-amber bg-[#121008] p-5">
                <EscaleLine index={i} title={title} bps={c.milestonesBps[i]} amount={amount} state={state} />
                <VoteSummary proposal={proposal} />
              </li>
            );
          }
          return (
            <li key={i} className="db-tile rounded-md px-5 py-[18px]">
              <EscaleLine index={i} title={title} bps={c.milestonesBps[i]} amount={amount} state={state} />
              {metadata?.milestones[i]?.description && <p className="m-0 mt-2 pl-0 text-[14px] text-gray sm:pl-16">Preuve attendue : {metadata.milestones[i].description}</p>}
            </li>
          );
        })}
      </ol>
      <p className="m-0 text-[15px] text-[#C9C7C0]">
        Les jalons sont approuvés dans l&apos;ordre, et le dernier récupère la poussière d&apos;arrondi. Les {feePercent} % de frais sont prélevés à
        chaque déblocage{sample > 0n && ` : ${eth(sample, 3)} ETH débloqués, ${eth(sampleNet, 3)} ETH reçus par le club`}. Sans approbation pendant 90
        jours, n&apos;importe qui peut annuler la campagne et ouvrir les remboursements.
      </p>
    </section>
  );
}
