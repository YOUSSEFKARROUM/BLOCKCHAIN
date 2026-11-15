"use client";

import { useEffect, useState } from "react";
import { TxStrip } from "@/components/board/Feedback";
import { StatusLamp } from "@/components/board/StatusLamp";
import { COLORS, flightCode } from "@/lib/campaignView";
import { getContracts } from "@/lib/contracts";
import { type Campaign, type Proposal, trancheAmounts } from "@/lib/data";
import { cfd, dateTime, eth, relative, shortAddress } from "@/lib/format";
import { useMetadata } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

interface MyVote {
  hasVoted: boolean;
  weight: bigint;
}

function tagFor(p: Proposal): { text: string; color: string; border: string } {
  const isFreeze = p.ptype === 1;
  const kind = isFreeze ? "Demande de gel" : "Demande de déblocage";
  if (p.state === 0) return { text: `${kind} · Vote en cours`, color: isFreeze ? "#FF9B7A" : COLORS.amber, border: isFreeze ? COLORS.alert : COLORS.amber };
  if (p.state === 1) return { text: `${kind} · Rejetée`, color: COLORS.gray, border: "#3A3A40" };
  if (p.state === 2) return { text: isFreeze ? "Adoptée · Gel à exécuter" : "Adoptée · Prête au décollage", color: "#6BE584", border: COLORS.ok };
  return { text: "Exécutée", color: "#6BE584", border: "#3A3A40" };
}

/** Barres Pour / Contre / quorum : elles grandissent au montage (CSS), puis suivent chaque vote (transition de largeur). */
function VoteBars({ proposal: p, supply }: { proposal: Proposal; supply: bigint }) {
  const max = p.forVotes > p.againstVotes ? p.forVotes : p.againstVotes;
  const width = (v: bigint) => (max > 0n ? `${Number((v * 10_000n) / max) / 100}%` : "0%");
  const isReached = p.participation >= p.quorum && p.quorum > 0n;
  const quorumWidth = p.quorum > 0n ? `${Math.min(100, Number((p.participation * 10_000n) / p.quorum) / 100)}%` : "0%";
  const quorumColor = isReached ? COLORS.ok : "#FF9B7A";
  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
      {[
        { label: "Pour", value: p.forVotes, color: COLORS.amber, text: "text-amber" },
        { label: "Contre", value: p.againstVotes, color: "#D9D7CF", text: "" },
      ].map((b) => (
        <div key={b.label} className="flex flex-col gap-1.5">
          <div className="tag-b flex items-baseline justify-between text-[13px] tracking-[.12em]">
            <span>{b.label}</span>
            <span className={`text-[26px] tracking-normal ${b.text}`}>{cfd(b.value)}</span>
          </div>
          <div className="h-[18px] overflow-hidden rounded-[3px] bg-[#2A2A2E]" aria-hidden="true">
            <div className="db-bar h-full" style={{ width: width(b.value), background: b.color }} />
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="mono flex flex-wrap justify-between gap-2 text-[12px] tracking-[.06em]">
          <span className="text-soft">QUORUM · {cfd(p.quorum)} CFD REQUIS</span>
          <span className="font-bold" style={{ color: quorumColor }}>
            {isReached ? "ATTEINT" : `${cfd(p.participation)} / ${cfd(p.quorum)}`}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#2A2A2E]" aria-hidden="true">
          <div className="db-bar h-full" style={{ width: quorumWidth, background: quorumColor }} />
        </div>
        <span className="sr-only">Offre de CFD au snapshot : {cfd(supply)}.</span>
      </div>
    </div>
  );
}

function ResultTile({ title, text, isOk = true }: { title: string; text: string; isOk?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg px-4 py-5 text-center" style={{ background: isOk ? "#0F2E17" : "#1C1C1F" }}>
      <span className="mono text-[30px] font-bold leading-[1.1]" style={{ color: isOk ? "#6BE584" : COLORS.gray }}>
        {title}
      </span>
      <span className="mono text-[12px] text-soft">{text}</span>
    </div>
  );
}

function Actions({ proposal: p, campaign, mine, feePercent }: { proposal: Proposal; campaign: Campaign | undefined; mine: MyVote | null; feePercent: number }) {
  const { account, connect } = useWeb3();
  const { status, send, busy } = useTx();
  const isFreeze = p.ptype === 1;
  const tranche = campaign && !isFreeze ? trancheAmounts(campaign)[p.milestoneIndex] : undefined;
  const fee = tranche !== undefined ? (tranche * BigInt(Math.round(feePercent * 100))) / 10_000n : 0n;

  let body: React.ReactNode = null;
  if (p.state === 0 && !account) {
    body = (
      <button type="button" onClick={connect} className="btn btn-ghost">
        Connecter pour voter
      </button>
    );
  } else if (p.state === 0 && mine?.hasVoted) {
    body = <ResultTile title="VOTÉ" text={`${cfd(mine.weight)} CFD COMPTÉS`} />;
  } else if (p.state === 0 && mine && mine.weight === 0n) {
    body = <p className="mono m-0 text-center text-[12px] text-gray">AUCUN CFD DÉLÉGUÉ AU BLOC {p.snapshotBlock} : PAS DE POUVOIR DE VOTE ICI</p>;
  } else if (p.state === 0 && mine) {
    body = (
      <>
        <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.castVote(p.id, true))} className="btn btn-amber">
          Pour · autoriser
        </button>
        <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.castVote(p.id, false))} className="btn btn-tile">
          Contre · refuser
        </button>
        <span className="mono text-center text-[12px] text-gray">VOTRE POIDS : {cfd(mine.weight)} CFD</span>
      </>
    );
  } else if (p.state === 2) {
    body = (
      <>
        <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.execute(p.id))} className="btn btn-ok">
          {isFreeze ? "Exécuter · geler le vol" : "Exécuter · décollage"}
        </button>
        <span className="mono text-center text-[12px] text-gray">N&apos;IMPORTE QUI PEUT EXÉCUTER UNE PROPOSITION ADOPTÉE</span>
      </>
    );
  } else if (p.state === 3) {
    body = isFreeze ? (
      <ResultTile title="VOL GELÉ" text="REMBOURSEMENTS OUVERTS" />
    ) : (
      <ResultTile title="DÉCOLLÉ" text={tranche !== undefined ? `${eth(tranche - fee, 3)} ETH AU CLUB · ${eth(fee, 3)} ETH DE FRAIS` : "JALON APPROUVÉ"} />
    );
  } else if (p.state === 1) {
    body = <ResultTile title="REJETÉE" text="LES FONDS RESTENT À QUAI" isOk={false} />;
  }

  return (
    <div className="flex min-w-[210px] flex-[0_1_250px] flex-col justify-center gap-2">
      {body}
      <TxStrip status={status} />
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  campaign: Campaign | undefined;
  now: number;
  quorumPercent: number;
  feePercent: number;
}

/** Une demande en approche : déblocage d'escale ou gel de vol (maquette Governance). */
export function ProposalCard({ proposal: p, campaign, now, quorumPercent, feePercent }: ProposalCardProps) {
  const { readProvider, account, refreshKey } = useWeb3();
  const { metadata } = useMetadata(campaign?.metadataCID);
  const [mine, setMine] = useState<MyVote | null>(null);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    const { governance, token } = getContracts(readProvider);
    Promise.all([governance.hasVoted(p.id, account), token.getPastVotes(account, p.snapshotBlock)])
      .then(([hasVoted, weight]) => !cancelled && setMine({ hasVoted, weight }))
      .catch(() => !cancelled && setMine(null));
    return () => {
      cancelled = true;
    };
  }, [readProvider, account, p.id, p.snapshotBlock, refreshKey]);

  const tag = tagFor(p);
  const name = metadata?.name ?? `campagne n°${p.campaignId}`;
  const title = p.ptype === 0 ? `${flightCode(p.campaignId)} · Débloquer le jalon ${p.milestoneIndex + 1} de « ${name} »` : `${flightCode(p.campaignId)} · Geler la campagne « ${name} »`;
  const supply = quorumPercent > 0 ? (p.quorum * 100n) / BigInt(Math.round(quorumPercent)) : 0n;
  const timing = p.state === 0 ? `Se termine ${relative(p.voteEnd, now)}` : `Vote clos le ${dateTime(p.voteEnd)}`;

  return (
    <article className="flex flex-wrap gap-8 rounded-[10px] bg-[#0E0E10]" style={{ border: `1.5px solid ${tag.border}`, padding: "clamp(20px, 2.6vw, 32px)" }}>
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
        <div className="tag-b flex flex-wrap items-center gap-3.5 tracking-[.12em]">
          <span className="inline-flex items-center gap-2.5" style={{ color: tag.color }}>
            <StatusLamp color={tag.color} isBlinking={p.state === 0} />
            {tag.text}
          </span>
          <span className="text-gray">Proposition #{p.id}</span>
          {p.quadratic && <span className="text-gray">Vote quadratique</span>}
        </div>
        <h3 className="display display-s">{title}</h3>
        <p className="m-0 text-[16px] text-soft">{p.description}</p>
        <div className="tag mt-auto flex flex-wrap gap-x-5 gap-y-1.5 pt-2" style={{ letterSpacing: ".06em" }}>
          <span>Offre au snapshot : {cfd(supply)} CFD</span>
          <span>Bloc {p.snapshotBlock}</span>
          <span>{timing}</span>
          <span>Par {shortAddress(p.proposer)}</span>
        </div>
      </div>
      <VoteBars proposal={p} supply={supply} />
      <Actions proposal={p} campaign={campaign} mine={mine} feePercent={feePercent} />
    </article>
  );
}
