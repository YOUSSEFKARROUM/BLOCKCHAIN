"use client";

import { parseEther } from "ethers";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBox, MilestoneTrack, ProgressBar, RiskBadge, Spinner, StatusPill, TxFeedback } from "@/components/ui";
import { deployment, getContracts } from "@/lib/contracts";
import { type Campaign, loadCampaign, trancheAmounts } from "@/lib/data";
import { describeError } from "@/lib/errors";
import { cfd, dateTime, eth, percent, relative, shortAddress } from "@/lib/format";
import { useChainTime, useMetadata, useRiskScores } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { readProvider, account, refreshKey } = useWeb3();
  const now = useChainTime();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [myContribution, setMyContribution] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const { metadata } = useMetadata(campaign?.metadataCID);
  const { scores } = useRiskScores(deployment?.CampusFund);
  const risk = scores[String(id)];

  useEffect(() => {
    if (!Number.isInteger(id) || id < 0) {
      setError("Identifiant de campagne invalide.");
      return;
    }
    const { fund } = getContracts(readProvider);
    loadCampaign(fund, id)
      .then((c) => {
        setCampaign(c);
        setError(null);
      })
      .catch((e: unknown) => setError(describeError(e)));
    if (account) fund.contributionOf(id, account).then((v: bigint) => setMyContribution(v)).catch(() => undefined);
  }, [readProvider, id, account, refreshKey]);

  if (error) return <ErrorBox title="Campagne indisponible">{error}</ErrorBox>;
  if (!campaign) return <Spinner />;

  const c = campaign;
  const tranches = trancheAmounts(c);
  const progress = percent(c.raised, c.goal);
  const isActive = c.status === 0;
  const canFinalize = isActive && now >= c.deadline;
  const canRefund = (c.status === 2 || c.status === 3) && myContribution > 0n;

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-[var(--ink-soft)] hover:underline">
        ← Toutes les campagnes
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <article className="space-y-6">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{metadata?.category ?? "Projet"}</span>
              <StatusPill status={c.status} />
              <RiskBadge risk={risk} />
            </div>
            <h1 className="font-display mt-3 text-4xl leading-tight">{metadata?.name ?? `Campagne n°${c.id}`}</h1>
            <p className="mt-1 text-[var(--ink-soft)]">{metadata?.club}</p>
          </header>

          <p className="whitespace-pre-line leading-relaxed">{metadata?.description ?? "Métadonnées IPFS indisponibles."}</p>

          {risk && risk.reasons.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm">
              <p className="font-semibold text-rose-900">Signaux détectés par l&apos;analyse IA (hors chaîne)</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-rose-900/90">
                {risk.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-rose-900/70">
                Score {Math.round(risk.score)}/100 = 60 % règles ({Math.round(risk.rulesScore)}) + 40 % Isolation Forest (
                {Math.round(risk.forestScore)}). Indicatif : seule la DAO peut geler une campagne.
              </p>
            </div>
          )}

          <section>
            <h2 className="font-display text-2xl">Jalons</h2>
            <p className="mb-3 text-sm text-[var(--ink-soft)]">
              Chaque tranche n&apos;est versée au bénéficiaire qu&apos;après un vote favorable de la DAO.
            </p>
            <ol className="space-y-2">
              {c.milestonesBps.map((bps, i) => {
                const state = i < c.withdrawnMilestones ? "Versée" : i < c.approvedMilestones ? "Approuvée, à retirer" : "En attente du vote";
                const tone = i < c.withdrawnMilestones ? "bg-emerald-600 text-white" : i < c.approvedMilestones ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-600";
                return (
                  <li key={i} className="card flex items-start gap-4 p-4">
                    <span className="font-display text-2xl text-[var(--accent)]">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{metadata?.milestones[i]?.title ?? `Jalon ${i + 1}`}</p>
                      <p className="text-sm text-[var(--ink-soft)]">{metadata?.milestones[i]?.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{bps / 100} %</p>
                      <p className="text-xs text-[var(--ink-soft)]">{c.status === 1 ? `${eth(tranches[i])} ETH` : "—"}</p>
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{state}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <p className="font-display text-3xl">{eth(c.raised)} ETH</p>
              <p className="text-sm text-[var(--ink-soft)]">collectés sur un objectif de {eth(c.goal)} ETH</p>
            </div>
            <ProgressBar value={progress} tone={progress >= 100 ? "ok" : "accent"} />
            <MilestoneTrack bps={c.milestonesBps} approved={c.approvedMilestones} withdrawn={c.withdrawnMilestones} />
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--ink-soft)]">Échéance</dt>
              <dd className="text-right">
                {dateTime(c.deadline)}
                <br />
                <span className="text-xs text-[var(--ink-soft)]">{relative(c.deadline, now)}</span>
              </dd>
              <dt className="text-[var(--ink-soft)]">Bénéficiaire</dt>
              <dd className="text-right font-mono text-xs">{shortAddress(c.beneficiary)}</dd>
              <dt className="text-[var(--ink-soft)]">Déjà versé</dt>
              <dd className="text-right">{eth(c.released)} ETH</dd>
              <dt className="text-[var(--ink-soft)]">CID IPFS</dt>
              <dd className="truncate text-right font-mono text-[10px]" title={c.metadataCID}>
                {c.metadataCID}
              </dd>
            </dl>
          </div>

          {isActive && !canFinalize && <ContributeForm campaignId={c.id} />}
          {canFinalize && <FinalizeBox campaignId={c.id} reached={c.raised >= c.goal} />}
          {myContribution > 0n && (
            <div className="card space-y-3 p-5 text-sm">
              <p>
                Votre contribution : <strong>{eth(myContribution)} ETH</strong> ({cfd(myContribution * 1000n)} CFD reçus)
              </p>
              {canRefund && <RefundBox campaign={c} contribution={myContribution} />}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ContributeForm({ campaignId }: { campaignId: number }) {
  const [amount, setAmount] = useState("0.1");
  const { status, send, busy } = useTx();
  let wei: bigint | null = null;
  try {
    wei = parseEther(amount || "0");
  } catch {
    wei = null;
  }
  const valid = wei !== null && wei > 0n;

  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && wei !== null) {
          const value = wei;
          void send((signer) => getContracts(signer).fund.contribute(campaignId, { value }));
        }
      }}
    >
      <label className="label" htmlFor="amount">
        Contribuer (ETH)
      </label>
      <input id="amount" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))} />
      <p className="text-xs text-[var(--ink-soft)]">
        {valid && wei !== null ? `Vous recevrez ${cfd(wei * 1000n)} CFD de gouvernance.` : "Montant invalide."} Pensez à
        déléguer vos CFD (page Gouvernance) pour pouvoir voter.
      </p>
      <button type="submit" className="btn-primary w-full" disabled={!valid || busy}>
        {busy ? "Transaction en cours…" : "Contribuer"}
      </button>
      <TxFeedback status={status} />
    </form>
  );
}

function FinalizeBox({ campaignId, reached }: { campaignId: number; reached: boolean }) {
  const { status, send, busy } = useTx();
  return (
    <div className="card space-y-3 p-5 text-sm">
      <p>
        L&apos;échéance est passée. N&apos;importe qui peut clôturer la campagne : elle deviendra{" "}
        <strong>{reached ? "Réussie" : "Échouée (remboursements ouverts)"}</strong>.
      </p>
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.finalize(campaignId))}>
        Clôturer la campagne
      </button>
      <TxFeedback status={status} />
    </div>
  );
}

function RefundBox({ campaign, contribution }: { campaign: Campaign; contribution: bigint }) {
  const { status, send, busy } = useTx();
  const amount = (contribution * (campaign.raised - campaign.released)) / campaign.raised;
  return (
    <div className="space-y-2">
      <p>
        Campagne {campaign.status === 2 ? "échouée" : "annulée"} : vous pouvez récupérer <strong>{eth(amount)} ETH</strong>
        {campaign.released > 0n && " (au prorata des fonds restants)"}. Vos {cfd(contribution * 1000n)} CFD seront brûlés.
      </p>
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.refund(campaign.id))}>
        Me faire rembourser
      </button>
      <TxFeedback status={status} />
    </div>
  );
}
