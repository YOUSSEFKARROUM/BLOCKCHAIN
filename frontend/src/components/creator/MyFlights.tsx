"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyPanel, TxStrip } from "@/components/board/Feedback";
import { StatusLamp } from "@/components/board/StatusLamp";
import { boardStatus, ESCALE_LABELS, escaleStates, flightCode } from "@/lib/campaignView";
import { getContracts } from "@/lib/contracts";
import { type Campaign, type Proposal, trancheAmounts } from "@/lib/data";
import { eth } from "@/lib/format";
import { useMetadata } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

const INK_SOFT = "#55554F";

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono text-[11px] font-normal tracking-[.14em]" style={{ color: INK_SOFT }}>
        {label}
      </div>
      {children}
    </div>
  );
}

interface FlightTicketProps {
  campaign: Campaign;
  proposals: Proposal[];
  now: number;
  feePercent: number;
}

/** Billet d'un vol du porteur : progression et actions (déblocage, retrait, annulation). */
function FlightTicket({ campaign: c, proposals, now, feePercent }: FlightTicketProps) {
  const { account } = useWeb3();
  const { metadata } = useMetadata(c.metadataCID);
  const { status, send, busy } = useTx();
  const [proof, setProof] = useState("");
  const me = account?.toLowerCase();
  const isBeneficiary = me === c.beneficiary.toLowerCase();
  const isCreator = me === c.creator.toLowerCase();
  const states = escaleStates(c, proposals);
  const tranches = trancheAmounts(c);
  const next = c.approvedMilestones;
  const hasOpenRelease = states.includes("voting");
  const canRequest = c.status === 1 && next < c.milestoneCount && !hasOpenRelease && (isCreator || isBeneficiary);
  const canWithdraw = c.status === 1 && c.withdrawnMilestones < c.approvedMilestones && isBeneficiary;
  const canCancel = c.status === 0 && c.raised === 0n && isCreator;
  const net = (wei: bigint) => (wei * BigInt(10_000 - Math.round(feePercent * 100))) / 10_000n;
  const nextTitle = metadata?.milestones[next]?.title ?? "";

  return (
    <article className="on-ticket overflow-hidden rounded-[14px] bg-ticket text-night">
      <div className="tag-b flex justify-between gap-3 bg-amber px-[22px] py-3">
        <span>Vol {flightCode(c.id)}</span>
        <span>{boardStatus(c, proposals, now).label}</span>
      </div>
      <div className="flex flex-col gap-4 p-[22px]">
        <Link href={`/campaign/${c.id}`} className="display text-[38px] no-underline hover:underline" style={{ lineHeight: 0.92, fontStretch: "72%" }}>
          {metadata?.name ?? `Campagne n°${c.id}`}
        </Link>
        <div className="flex h-4 gap-1" aria-hidden="true">
          {c.milestonesBps.map((bps, i) => (
            <div key={i} className="box-border rounded-[3px]" style={{ flex: `${bps} 1 0`, background: states[i] === "paid" ? "var(--night)" : "transparent", border: "2px solid var(--night)" }} />
          ))}
        </div>
        <div className="mono grid grid-cols-2 gap-3 text-[15px] font-bold">
          <Cell label="COLLECTÉ">{eth(c.raised, 3)} ETH</Cell>
          <Cell label="REÇU">{eth(net(c.released), 3)} ETH</Cell>
          {states.map((s, i) => (
            <Cell key={i} label={`ESCALE ${i + 1} · ${c.milestonesBps[i] / 100} %`}>
              <span className="uppercase">{ESCALE_LABELS[s]}</span>
            </Cell>
          ))}
        </div>
        {canRequest && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = proof.trim();
              if (value) void send((s) => getContracts(s).governance.proposeMilestoneRelease(c.id, `Jalon ${next + 1} atteint : ${nextTitle}`, value));
            }}
          >
            <label htmlFor={`proof-${c.id}`} className="text-[13px] font-semibold">
              Preuve du jalon {next + 1} (CID IPFS ou lien https)
            </label>
            <input
              id={`proof-${c.id}`}
              value={proof}
              maxLength={300}
              onChange={(e) => setProof(e.target.value)}
              placeholder="ipfs://… ou https://…"
              className="field !min-h-[48px] bg-night !text-[14px] !font-normal"
            />
            <button type="submit" disabled={busy || proof.trim() === ""} className="btn btn-dark btn-sm !min-h-[56px]">
              Demander le déblocage du jalon {next + 1}
            </button>
          </form>
        )}
        {hasOpenRelease && (
          <Link href="/governance" className="btn btn-outline-dark btn-sm !min-h-[56px]">
            <StatusLamp color="var(--night)" isBlinking size={10} />
            Proposition ouverte · suivre le vote
          </Link>
        )}
        {canWithdraw && (
          <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.withdrawTranche(c.id))} className="btn btn-ok btn-sm !min-h-[56px]">
            Retirer la tranche {c.withdrawnMilestones + 1} ({eth(net(tranches[c.withdrawnMilestones]), 3)} ETH nets)
          </button>
        )}
        {canCancel && (
          <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.cancelCampaign(c.id))} className="btn btn-outline-dark btn-sm">
            Annuler le vol (aucune contribution)
          </button>
        )}
        {c.status === 1 && !isBeneficiary && c.withdrawnMilestones < c.approvedMilestones && (
          <p className="m-0 text-[13px]" style={{ color: INK_SOFT }}>
            Seul le bénéficiaire peut retirer les tranches approuvées.
          </p>
        )}
        <TxStrip status={status} />
      </div>
    </article>
  );
}

function protocolRules(feePercent: number): { title: string; text: string }[] {
  return [
    { title: "Ordre des escales", text: "Les jalons sont approuvés dans l'ordre. Le dernier récupère la poussière d'arrondi." },
    { title: "Frais", text: `${feePercent} % prélevés sur chaque tranche au moment du déblocage, rien à la contribution.` },
    { title: "90 jours sans approbation", text: "N'importe qui peut annuler la campagne : les contributeurs sont remboursés." },
  ];
}

/** Colonne « Mes vols en cours » : les campagnes dont le compte est porteur ou bénéficiaire. */
export function MyFlights({ campaigns, proposals, now, feePercent }: { campaigns: Campaign[] | null; proposals: Proposal[]; now: number; feePercent: number }) {
  const { account } = useWeb3();
  const me = account?.toLowerCase();
  const mine = (campaigns ?? []).filter((c) => me && (c.creator.toLowerCase() === me || c.beneficiary.toLowerCase() === me));
  return (
    <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
      <h2 className="display text-[52px]">
        Mes vols <span className="text-amber">en cours</span>
      </h2>
      {!account && <EmptyPanel title="Portefeuille non connecté">Connectez MetaMask pour voir les campagnes dont vous êtes porteur ou bénéficiaire.</EmptyPanel>}
      {account && campaigns && mine.length === 0 && <EmptyPanel title="Aucun vol pour ce compte">Votre première campagne apparaîtra ici après sa publication.</EmptyPanel>}
      {mine.map((c) => (
        <FlightTicket key={c.id} campaign={c} proposals={proposals} now={now} feePercent={feePercent} />
      ))}
      <ul className="m-0 flex list-none flex-col gap-[5px] p-0 text-[15px]">
        {protocolRules(feePercent).map((r) => (
          <li key={r.title} className="db-tile rounded-md px-[18px] py-4">
            <strong className="tag-b text-amber">{r.title}</strong>
            <br />
            {r.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
