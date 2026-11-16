import Link from "next/link";
import { FlipNote } from "@/components/board/FlipNote";
import { ArrowIcon } from "@/components/board/Icons";
import { ProofLink } from "@/components/governance/ProposalCard";
import { COLORS, ESCALE_LABELS, type EscaleState, escaleStates, releaseProposalFor, STALE_PERIOD_DAYS, staleDaysLeft } from "@/lib/campaignView";
import { type Campaign, type Proposal, trancheAmounts } from "@/lib/data";
import { cfd, eth, percent } from "@/lib/format";
import type { CampaignMetadata } from "@/lib/metadata";

const STATE_COLOR: Record<EscaleState, string> = { paid: COLORS.ok, approved: COLORS.amber, voting: COLORS.amber, locked: COLORS.gray };
const TRACK_OFF = "#3A3A40";
const EDGE_MARKS = `repeating-linear-gradient(90deg, ${TRACK_OFF} 0, ${TRACK_OFF} 18px, transparent 18px, transparent 36px)`;

/** Voyant d'un jalon : allumé (versée, approuvée, en vote) ou éteinte (verrouillée). */
function Beacon({ state }: { state: EscaleState }) {
  const color = STATE_COLOR[state];
  const isLit = state !== "locked";
  return (
    <span
      aria-hidden="true"
      className={`relative z-[1] box-border block h-7 w-7 flex-none rounded-full border-[3px] ${state === "voting" ? "db-blink" : ""}`}
      style={{ borderColor: color, background: isLit ? color : "#111113", boxShadow: isLit ? `0 0 18px ${color}` : "none" }}
    />
  );
}

/** Compteurs du vote en cours sur un jalon, avec la preuve et le lien vers la gouvernance. */
function VoteSummary({ proposal: p, milestone }: { proposal: Proposal; milestone: number }) {
  const cast = p.forVotes + p.againstVotes;
  const forShare = cast === 0n ? 0 : percent(p.forVotes, cast);
  const isQuorumReached = p.participation >= p.quorum;
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border-[1.5px] border-amber bg-[#121008] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tag-b text-amber">Vote en cours · jalon {milestone}</span>
        <span className="mono text-[13px] font-bold" style={{ color: isQuorumReached ? COLORS.ok : "#FF9B7A" }}>
          {isQuorumReached ? "QUORUM ATTEINT" : `QUORUM ${cfd(p.participation)} / ${cfd(p.quorum)}`}
        </span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-[3px] bg-[#2A2A2E]" aria-hidden="true">
        <div className="db-bar bg-amber" style={{ width: `${forShare}%` }} />
        <div className="db-bar bg-[#6E6E78]" style={{ width: `${cast === 0n ? 0 : 100 - forShare}%` }} />
      </div>
      <span className="mono text-[13px] text-soft">
        POUR {cfd(p.forVotes)} CFD · CONTRE {cfd(p.againstVotes)} CFD
      </span>
      {p.proof && <ProofLink proof={p.proof} />}
      <Link href="/governance" className="btn btn-amber btn-sm self-start !min-h-[52px]">
        Voter sur ce déblocage
        <ArrowIcon />
      </Link>
    </div>
  );
}

/** Frais : la tranche coupée en deux, part du club et part de la trésorerie. */
function FeeSplit({ feePercent }: { feePercent: number }) {
  return (
    <>
      <div className="flex h-3.5 gap-[3px]" aria-hidden="true">
        <span className="db-bar rounded-l-[3px] bg-amber" style={{ flex: `${100 - feePercent} 1 0` }} />
        <span className="min-w-[8px] rounded-r-[3px] bg-ticket" style={{ flex: `${feePercent} 1 0` }} />
      </div>
      <p className="mono m-0 text-[14px] font-bold">
        <span className="text-amber">{100 - feePercent} % club</span> · {feePercent} % trésorerie
      </p>
    </>
  );
}

/** Ordre : une pastille par jalon, remplie quand la tranche est approuvée. */
function OrderDots({ states }: { states: EscaleState[] }) {
  const done = states.filter((s) => s === "paid" || s === "approved").length;
  return (
    <>
      <div className="flex items-center" aria-hidden="true">
        {states.map((s, i) => (
          <span key={i} className="flex flex-1 items-center last:flex-none">
            <span className="box-border h-3.5 w-3.5 flex-none rounded-full border-2" style={{ borderColor: STATE_COLOR[s], background: s === "locked" ? "transparent" : STATE_COLOR[s] }} />
            {i < states.length - 1 && <span className="h-0.5 flex-1" style={{ background: TRACK_OFF }} />}
          </span>
        ))}
      </div>
      <p className="mono m-0 text-[14px] font-bold">
        {done} / {states.length} · dans l&apos;ordre
      </p>
    </>
  );
}

interface RunwayProps {
  campaign: Campaign;
  proposals: Proposal[];
  metadata: CampaignMetadata | null;
  feePercent: number;
  now: number;
}

/** Frise des jalons : un voyant par jalon, allumé quand la tranche est versée. Les règles sont au verso des trois blocs. */
export function Runway({ campaign: c, proposals, metadata, feePercent, now }: RunwayProps) {
  const states = escaleStates(c, proposals);
  const tranches = trancheAmounts(c);
  const firstUnpaid = states.findIndex((s) => s !== "paid");
  const current = firstUnpaid === -1 ? states.length - 1 : firstUnpaid;
  const votingIndex = states.indexOf("voting");
  const voting = votingIndex === -1 ? undefined : releaseProposalFor(proposals, c.id, votingIndex);
  const sample = tranches[0] ?? 0n;
  const sampleNet = (sample * BigInt(10_000 - Math.round(feePercent * 100))) / 10_000n;
  const daysLeft = staleDaysLeft(c, now);

  return (
    <section aria-labelledby="piste-title" className="flex flex-col gap-5">
      <h2 id="piste-title" className="display display-m">
        Les <span className="text-amber">jalons</span>
      </h2>

      <div className="relative overflow-hidden rounded-[14px] border border-[#2A2A2E] bg-[#111113] px-5 py-8 md:px-4 md:pb-9 md:pt-14">
        <div aria-hidden="true" className="absolute inset-x-0 top-2 h-[3px]" style={{ backgroundImage: EDGE_MARKS }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-2 h-[3px]" style={{ backgroundImage: EDGE_MARKS }} />
        <ol className="m-0 grid list-none grid-cols-1 p-0 md:grid-flow-col md:auto-cols-fr">
          {states.map((state, i) => {
            const isLast = i === states.length - 1;
            const isDone = state === "paid";
            const title = metadata?.milestones[i]?.title ?? `Jalon ${i + 1}`;
            const expected = metadata?.milestones[i]?.description;
            return (
              <li key={i} className={`relative flex gap-4 md:flex-col md:items-center md:gap-3 md:px-3 md:text-center ${isLast ? "" : "pb-7 md:pb-0"}`}>
                {!isLast && (
                  <>
                    <span aria-hidden="true" className="absolute bottom-0 left-[12px] top-7 md:hidden" style={{ borderLeft: `3px ${isDone ? "solid" : "dashed"} ${isDone ? COLORS.ok : TRACK_OFF}` }} />
                    <span aria-hidden="true" className="absolute left-1/2 top-[12px] hidden w-full md:block" style={{ borderTop: `3px ${isDone ? "solid" : "dashed"} ${isDone ? COLORS.ok : TRACK_OFF}` }} />
                  </>
                )}
                {i === current && <span aria-hidden="true" className="db-bob absolute -top-7 left-1/2 hidden h-0 w-0 md:block" style={{ marginLeft: -9, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: `13px solid ${COLORS.amber}` }} />}
                <Beacon state={state} />
                <div className="flex min-w-0 flex-col gap-1 md:items-center">
                  <span className="mono text-[12px] font-bold tracking-[.14em] text-gray">JALON {String(i + 1).padStart(2, "0")}</span>
                  <strong className="font-display text-[18px] leading-tight">{title}</strong>
                  <span className="mono text-[15px] font-bold">
                    {c.milestonesBps[i] / 100} % · {eth(tranches[i], 3)} ETH
                  </span>
                  <span className="mono text-[13px] font-bold uppercase tracking-[.06em]" style={{ color: STATE_COLOR[state] }}>
                    {ESCALE_LABELS[state]}
                  </span>
                  {expected && <span className="text-[13px] text-gray">Preuve : {expected}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {voting && <VoteSummary proposal={voting} milestone={votingIndex + 1} />}

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
        <FlipNote
          label="Frais"
          back={
            <>
              {feePercent} % sont prélevés à chaque déblocage, pour la trésorerie de la plateforme
              {sample > 0n && ` : sur ${eth(sample, 3)} ETH débloqués, le club reçoit ${eth(sampleNet, 3)} ETH`}. Contribuer ne coûte aucun frais.
            </>
          }
        >
          <FeeSplit feePercent={feePercent} />
        </FlipNote>
        <FlipNote label="Ordre" back="Les jalons sont approuvés un par un, dans l'ordre. Le dernier reçoit tout le reste, pour qu'aucune poussière d'arrondi ne reste bloquée.">
          <OrderDots states={states} />
        </FlipNote>
        <FlipNote
          label="Garde-fou"
          back={`Si aucun jalon n'est approuvé pendant ${STALE_PERIOD_DAYS} jours, n'importe qui peut annuler la campagne : les contributeurs récupèrent alors ce qui n'a pas été versé.`}
        >
          <p className="mono m-0 text-[30px] font-bold leading-none text-amber">{daysLeft ?? STALE_PERIOD_DAYS} j</p>
          <p className="mono m-0 text-[14px] font-bold">{daysLeft === null ? "sans vote : annulation possible" : daysLeft === 0 ? "annulation possible" : "avant annulation possible"}</p>
        </FlipNote>
      </div>
    </section>
  );
}
