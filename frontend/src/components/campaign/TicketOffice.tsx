"use client";

import { formatEther, parseEther } from "ethers";
import { useState } from "react";
import { FlapText } from "@/components/board/Flap";
import { TxStrip } from "@/components/board/Feedback";
import { getContracts } from "@/lib/contracts";
import type { Campaign } from "@/lib/data";
import { cfd, eth, shortAddress } from "@/lib/format";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

const QUICK_AMOUNTS = ["0.1", "0.5", "1", "2"];
const MAX_FLAPS = 10;

function parseAmount(value: string): bigint | null {
  try {
    const wei = parseEther(value || "0");
    return wei > 0n ? wei : null;
  } catch {
    return null;
  }
}

/** « 500 », « 1 234,5 » sans séparateur de milliers : chaque caractère devient une palette. */
function flapDigits(wei: bigint, rate: number): string {
  const n = Number(formatEther(wei * BigInt(rate)));
  return String(Math.round(n * 100) / 100).replace(".", ",").slice(0, MAX_FLAPS);
}

function AmountFlaps({ wei, rate }: { wei: bigint | null; rate: number }) {
  const digits = wei ? flapDigits(wei, rate) : "0";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <FlapText text={digits} label={`${digits} CFD`} size="sm" gap={4} step={0.04} />
      <span aria-hidden="true" className="mono ml-2 text-[18px] font-bold">
        CFD
      </span>
    </div>
  );
}

function ContributeForm({ campaignId, rate }: { campaignId: number; rate: number }) {
  const { account } = useWeb3();
  const [amount, setAmount] = useState("0.5");
  const { status, send, busy } = useTx();
  const wei = parseAmount(amount);

  return (
    <form
      className="flex flex-col gap-[22px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (wei) void send((signer) => getContracts(signer).fund.contribute(campaignId, { value: wei }));
      }}
    >
      <div className="flex flex-col gap-2.5">
        <label htmlFor="cf-amt" className="tag-b">
          Montant en ETH
        </label>
        <div className="flex items-center gap-3 rounded-lg bg-night px-4 py-1">
          <input
            id="cf-amt"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={wei === null}
            className="field-bare h-[68px] text-[44px]"
          />
          <span className="mono text-[16px] font-bold text-ticket">ETH</span>
        </div>
        <div role="group" aria-label="Montants rapides" className="flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((q) => {
            const isOn = Number(q) === Number(amount);
            return (
              <button
                key={q}
                type="button"
                aria-pressed={isOn}
                onClick={() => setAmount(q)}
                className="db-chip flex-[1_1_60px]"
                style={{ background: isOn ? "var(--night)" : "transparent", color: isOn ? "var(--amber)" : "var(--night)" }}
              >
                {q.replace(".", ",")}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-night pt-[18px]">
        <span className="tag-b">Vous recevez · droits de vote</span>
        <AmountFlaps wei={wei} rate={rate} />
        <div className="mono flex justify-between gap-3 text-[13px]">
          <span>TAUX FIXE</span>
          <span>1 ETH = {rate} CFD</span>
        </div>
        <div className="mono flex justify-between gap-3 text-[13px]">
          <span>FRAIS À LA CONTRIBUTION</span>
          <span>0 %</span>
        </div>
      </div>
      <button type="submit" disabled={!wei || busy} className="btn btn-dark !min-h-[64px] !text-[16px]">
        {busy ? "Transaction en cours…" : wei ? `Contribuer ${eth(wei, 4)} ETH` : "Montant invalide"}
      </button>
      <p className="m-0 text-[14px] font-medium">
        {!account && "MetaMask vous demandera d'abord de connecter un compte. "}
        Vos CFD sont vos droits de vote sur chaque tranche : déléguez-les à la tour de contrôle pour voter. Si la campagne échoue ou est gelée, vous
        récupérez 100 % de votre mise.
      </p>
      <TxStrip status={status} />
    </form>
  );
}

function FinalizeBox({ campaignId, isReached }: { campaignId: number; isReached: boolean }) {
  const { status, send, busy } = useTx();
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[16px] font-medium">
        L&apos;embarquement est terminé. N&apos;importe qui peut clôturer : la campagne deviendra{" "}
        <strong>{isReached ? "financée" : "échouée, et les remboursements s'ouvriront"}</strong>.
      </p>
      <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.finalize(campaignId))} className="btn btn-dark">
        Clôturer l&apos;embarquement
      </button>
      <TxStrip status={status} />
    </div>
  );
}

function RefundBox({ campaign: c, contribution, rate }: { campaign: Campaign; contribution: bigint; rate: number }) {
  const { status, send, busy } = useTx();
  const amount = c.raised === 0n ? 0n : (contribution * (c.raised - c.released)) / c.raised;
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[16px] font-medium">
        Vol {c.status === 2 ? "annulé : objectif manqué" : "annulé par la DAO"}. Vous pouvez récupérer <strong>{eth(amount, 4)} ETH</strong>
        {c.released > 0n && " (au prorata des fonds restants)"}. Vos {cfd(contribution * BigInt(rate))} CFD seront brûlés.
      </p>
      <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.refund(c.id))} className="btn btn-dark">
        Me faire rembourser
      </button>
      <TxStrip status={status} />
    </div>
  );
}

interface TicketOfficeProps {
  campaign: Campaign;
  myContribution: bigint;
  now: number;
  rate: number;
}

/** Guichet : contribuer, clôturer ou se faire rembourser selon l'état de la campagne. */
export function TicketOffice({ campaign: c, myContribution, now, rate }: TicketOfficeProps) {
  const isActive = c.status === 0;
  const canFinalize = isActive && now >= c.deadline;
  const isCancelled = c.status === 2 || c.status === 3;
  const title = isCancelled ? (
    <>
      Vol
      <br />
      annulé
    </>
  ) : (
    <>
      Monter
      <br />à bord
    </>
  );
  return (
    <div className="on-amber flex flex-col gap-[22px] rounded-[18px] bg-amber px-7 py-[30px] text-night">
      <h2 className="display text-[64px]" style={{ lineHeight: 0.85 }}>
        {title}
      </h2>
      {isCancelled && <span className="tag-b -mt-3">Remboursement</span>}
      {isActive && !canFinalize && <ContributeForm campaignId={c.id} rate={rate} />}
      {canFinalize && <FinalizeBox campaignId={c.id} isReached={c.raised >= c.goal} />}
      {c.status === 1 && <p className="m-0 text-[16px] font-medium">Embarquement terminé : l&apos;objectif est atteint. Les tranches partent escale par escale, sur vote.</p>}
      {isCancelled && myContribution > 0n && <RefundBox campaign={c} contribution={myContribution} rate={rate} />}
      {isCancelled && myContribution === 0n && <p className="m-0 text-[16px] font-medium">Aucune mise à rembourser pour ce compte.</p>}
      {myContribution > 0n && (
        <p className="mono m-0 border-t-2 border-dashed border-night pt-4 text-[13px] font-bold">
          VOTRE MISE : {eth(myContribution, 4)} ETH · {cfd(myContribution * BigInt(rate))} CFD
        </p>
      )}
    </div>
  );
}

/** Informations techniques sous le guichet (porteur, bénéficiaire, CID IPFS). */
export function FlightInfo({ campaign: c }: { campaign: Campaign }) {
  const rows = [
    { label: "Porteur", value: shortAddress(c.creator), title: c.creator },
    { label: "Bénéficiaire", value: shortAddress(c.beneficiary), title: c.beneficiary },
    { label: "Métadonnées", value: `IPFS · ${c.metadataCID.slice(0, 10)}…`, title: c.metadataCID },
  ];
  return (
    <dl className="mono m-0 flex flex-col gap-[5px] text-[13px] tracking-[.04em]">
      {rows.map((r) => (
        <div key={r.label} className="db-tile flex justify-between gap-3 rounded-md px-[18px] py-3.5">
          <dt className="font-display text-[14px] text-gray">{r.label}</dt>
          <dd className="m-0 truncate" title={r.title}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
