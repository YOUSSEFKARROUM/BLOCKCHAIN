"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorBox, ProgressBar, Spinner, TxFeedback } from "@/components/ui";
import { getContracts } from "@/lib/contracts";
import { PROPOSAL_STATE_LABELS, type Proposal } from "@/lib/data";
import { cfd, dateTime, percent, relative, shortAddress } from "@/lib/format";
import { useCampaigns, useChainTime, useMetadata, useProposals } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

const STATE_TONES = ["tone-info", "tone-neutral", "tone-ok", "tone-solid"];

export default function GovernancePage() {
  const { data: proposals, error, isLoading } = useProposals();
  const { data: campaigns } = useCampaigns();

  return (
    <div className="space-y-10 pt-6">
      <header className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <h1 className="display-l two-tone">
            Tableau de vote.
            <span>Un vote pondéré par les CFD.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--ink-soft)]">
            Le poids de votre vote est votre nombre de CFD <strong>délégués au bloc précédant la création</strong> de la
            proposition (snapshot) : acheter ou emprunter des CFD ensuite ne sert à rien. Une proposition est adoptée si
            au moins <strong>10 % des CFD</strong> ont voté (quorum) et s&apos;il y a <strong>plus de « pour » que de « contre »</strong>.
          </p>
        </div>
        <VotingPower />
      </header>

      <FreezeForm campaignIds={(campaigns ?? []).filter((c) => c.status <= 1).map((c) => c.id)} />

      {isLoading && !proposals && <Spinner label="Lecture des propositions…" />}
      {error && <ErrorBox>{error}</ErrorBox>}
      {proposals?.length === 0 && <EmptyState title="Aucune proposition pour l'instant" />}
      <div className="space-y-4">
        {proposals?.map((p) => (
          <ProposalCard key={p.id} proposal={p} cid={campaigns?.[p.campaignId]?.metadataCID} />
        ))}
      </div>
    </div>
  );
}

/** Solde CFD, pouvoir de vote actuel et bouton de délégation. */
function VotingPower() {
  const { readProvider, account, refreshKey } = useWeb3();
  const [info, setInfo] = useState<{ balance: bigint; votes: bigint; delegatee: string } | null>(null);
  const { status, send, busy } = useTx();

  useEffect(() => {
    if (!account) return;
    const { token } = getContracts(readProvider);
    Promise.all([token.balanceOf(account), token.getVotes(account), token.delegates(account)])
      .then(([balance, votes, delegatee]) => setInfo({ balance, votes, delegatee }))
      .catch(() => setInfo(null));
  }, [readProvider, account, refreshKey]);

  if (!account) {
    return <div className="card p-5 text-sm text-[var(--ink-soft)]">Connectez MetaMask pour voir votre pouvoir de vote.</div>;
  }
  const selfDelegated = info?.delegatee.toLowerCase() === account.toLowerCase();
  return (
    <div className="card space-y-3 p-5 text-sm">
      <div className="flex justify-between">
        <span className="text-[var(--ink-soft)]">Solde</span>
        <strong>{info ? cfd(info.balance) : "…"} CFD</strong>
      </div>
      <div className="flex justify-between">
        <span className="text-[var(--ink-soft)]">Pouvoir de vote actuel</span>
        <strong>{info ? cfd(info.votes) : "…"} CFD</strong>
      </div>
      {info && !selfDelegated && info.balance > 0n && (
        <>
          <p className="tone-warn rounded-xl p-3 text-xs">
            Vos CFD ne sont pas délégués : ils ne comptent pour aucun vote. La délégation s&apos;applique aux
            propositions créées <em>après</em> elle.
          </p>
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void send((s) => getContracts(s).token.delegate(account))}>
            Activer mon pouvoir de vote (me déléguer)
          </button>
        </>
      )}
      <TxFeedback status={status} />
    </div>
  );
}

function FreezeForm({ campaignIds }: { campaignIds: number[] }) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const { status, send, busy } = useTx();
  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Signaler une campagne suspecte (proposer un gel)
      </button>
    );
  }
  return (
    <form
      className="card grid gap-3 p-5 md:grid-cols-[180px_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (campaignId === "" || reason.trim().length < 5) return;
        void send((s) => getContracts(s).governance.proposeFreeze(campaignId, reason.trim()));
      }}
    >
      <div>
        <label className="label" htmlFor="fc">
          Campagne
        </label>
        <select id="fc" className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value === "" ? "" : Number(e.target.value))}>
          <option value="">Choisir…</option>
          {campaignIds.map((id) => (
            <option key={id} value={id}>
              n°{id}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="fr">
          Motif (visible par tous)
        </label>
        <input id="fr" className="input" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : adresses toutes financées par le même compte" />
      </div>
      <button type="submit" className="btn-primary" disabled={busy || campaignId === "" || reason.trim().length < 5}>
        Proposer le gel
      </button>
      <p className="text-xs text-[var(--ink-soft)] md:col-span-3">Il faut au moins 100 CFD délégués avant ce bloc (anti-spam).</p>
      <div className="md:col-span-3">
        <TxFeedback status={status} />
      </div>
    </form>
  );
}

function ProposalCard({ proposal: p, cid }: { proposal: Proposal; cid: string | undefined }) {
  const { readProvider, account, refreshKey } = useWeb3();
  const now = useChainTime();
  const { metadata } = useMetadata(cid);
  const { status, send, busy } = useTx();
  const [mine, setMine] = useState<{ voted: boolean; weight: bigint } | null>(null);

  useEffect(() => {
    if (!account) return;
    const { governance, token } = getContracts(readProvider);
    Promise.all([governance.hasVoted(p.id, account), token.getPastVotes(account, p.snapshotBlock)])
      .then(([voted, weight]) => setMine({ voted, weight }))
      .catch(() => setMine(null));
  }, [readProvider, account, p.id, p.snapshotBlock, refreshKey]);

  const cast = p.forVotes + p.againstVotes;
  const forShare = percent(p.forVotes, cast);
  const quorumProgress = percent(p.participation, p.quorum === 0n ? 1n : p.quorum);
  const title = p.ptype === 0 ? `Débloquer le jalon ${p.milestoneIndex + 1}` : "Geler la campagne";

  return (
    <article className="card">
      <div className="grid gap-6 p-5 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[var(--ink-soft)]">#{p.id}</span>
            <span className={`pill ${STATE_TONES[p.state]}`}>{PROPOSAL_STATE_LABELS[p.state]}</span>
            {p.quadratic && <span className="pill tone-neutral">Vote quadratique</span>}
          </div>
          <h3 className="font-display mt-3 text-xl">
            {title} : {metadata?.name ?? `campagne n°${p.campaignId}`}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-2)]">{p.description}</p>
          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            Proposée par {shortAddress(p.proposer)}, solde figé au bloc {p.snapshotBlock}, fin du vote {dateTime(p.voteEnd)} (
            {relative(p.voteEnd, now)})
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold text-[var(--ok)]">Pour {cfd(p.forVotes)}</span>
              <span className="font-semibold text-[var(--danger)]">Contre {cfd(p.againstVotes)}</span>
            </div>
            <div className="track flex h-1.5 overflow-hidden rounded-full">
              <div className="bg-[var(--ok)]" style={{ width: `${cast === 0n ? 0 : forShare}%` }} />
              <div className="bg-[var(--danger)]" style={{ width: `${cast === 0n ? 0 : 100 - forShare}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-[var(--ink-soft)]">
              <span>Quorum (10 % des CFD au snapshot)</span>
              <span>
                {cfd(p.participation)} / {cfd(p.quorum)} CFD
              </span>
            </div>
            <ProgressBar value={quorumProgress} tone={quorumProgress >= 100 ? "ok" : "accent"} />
          </div>

          {p.state === 0 && account && mine && !mine.voted && mine.weight > 0n && (
            <div className="flex gap-2">
              <button type="button" className="btn-ok flex-1" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.castVote(p.id, true))}>
                Voter pour
              </button>
              <button type="button" className="btn-danger flex-1" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.castVote(p.id, false))}>
                Voter contre
              </button>
            </div>
          )}
          {p.state === 0 && mine?.voted && <p className="text-xs font-semibold text-[var(--ok)]">Vous avez voté sur cette proposition.</p>}
          {p.state === 0 && mine && !mine.voted && mine.weight === 0n && (
            <p className="text-xs text-[var(--ink-soft)]">
              Vous n&apos;aviez aucun CFD délégué au bloc {p.snapshotBlock} : pas de pouvoir de vote sur cette proposition.
            </p>
          )}
          {p.state === 2 && (
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void send((s) => getContracts(s).governance.execute(p.id))}>
              Exécuter la décision
            </button>
          )}
          <TxFeedback status={status} />
        </div>
      </div>
    </article>
  );
}
