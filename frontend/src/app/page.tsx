"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CampaignRow } from "@/components/CampaignRow";
import { CountUp } from "@/components/CountUp";
import { Faq } from "@/components/Faq";
import { Story } from "@/components/Story";
import { EmptyState, ErrorBox, ProgressBar, Spinner, Stat } from "@/components/ui";
import { CHAIN } from "@/config/chain";
import { deployment, getContracts } from "@/lib/contracts";
import { PROPOSAL_STATE_LABELS, type Proposal, STATUS_LABELS, type StatusIndex } from "@/lib/data";
import { formatEther } from "ethers";
import { cfd, percent, relative } from "@/lib/format";
import { useCampaigns, useChainTime, useProposals, useRiskScores } from "@/lib/hooks";
import { useWeb3 } from "@/lib/web3";

type Filter = "all" | StatusIndex;

function explorerUrl(address: string | undefined): string | null {
  return CHAIN.explorer && address ? `${CHAIN.explorer}/address/${address}#code` : null;
}

export default function HomePage() {
  const { readProvider, refreshKey } = useWeb3();
  const { data: campaigns, error, isLoading } = useCampaigns();
  const { data: proposals } = useProposals();
  const { scores, generatedAt } = useRiskScores(deployment?.CampusFund);
  const now = useChainTime();
  const [filter, setFilter] = useState<Filter>("all");
  const [treasury, setTreasury] = useState<bigint | null>(null);

  useEffect(() => {
    if (!deployment) return;
    readProvider.getBalance(deployment.Treasury).then(setTreasury).catch(() => setTreasury(null));
  }, [readProvider, refreshKey]);

  const visible = useMemo(() => (campaigns ?? []).filter((c) => filter === "all" || c.status === filter), [campaigns, filter]);
  const totalRaised = (campaigns ?? []).reduce((sum, c) => sum + c.raised, 0n);
  const active = (campaigns ?? []).filter((c) => c.status === 0).length;

  return (
    <div>
      <Story />

      {/* ---------- Chiffres lus sur la blockchain ---------- */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-[var(--line)] py-12 md:grid-cols-4" aria-label="Chiffres de la plateforme">
        <Stat label="Campagnes en cours" value={campaigns ? <CountUp value={active} /> : "–"} hint={`sur ${campaigns?.length ?? 0} créées`} />
        <Stat label="ETH collectés" value={campaigns ? <CountUp value={Number(formatEther(totalRaised))} digits={2} /> : "–"} hint="toutes campagnes" />
        <Stat label="Propositions" value={proposals ? <CountUp value={proposals.length} /> : "–"} hint="soumises au vote" />
        <Stat label="ETH en trésorerie" value={treasury === null ? "–" : <CountUp value={Number(formatEther(treasury))} digits={3} />} hint="2 % des tranches versées" />
      </section>

      {/* ---------- Campagnes ---------- */}
      <section id="campagnes" className="section">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 className="display-l two-tone">
            Campagnes.
            <span style={{ color: "var(--give)" }}>Chaque tranche se mérite.</span>
          </h2>
          <p className="mt-4 max-w-[34ch] text-[15px] text-[var(--text-2)]">
            Les fonds sont découpés en jalons. Le porteur demande une tranche, la DAO vote, le contrat exécute.
          </p>
          <p className="mt-4 text-[13px] text-[var(--text-3)]">
            {generatedAt ? `Scores de risque calculés le ${new Date(generatedAt).toLocaleDateString("fr-FR")}` : "Scores de risque non calculés"}
          </p>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap gap-2 px-4" role="group" aria-label="Filtrer par statut">
            {(["all", 0, 1, 2, 3] as Filter[]).map((f) => (
              <button
                key={String(f)}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`pill !px-3.5 !py-2 transition-colors active:opacity-70 ${filter === f ? "tone-solid" : "tone-neutral hover:text-[var(--text)]"}`}
              >
                {f === "all" ? "Toutes" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
          {isLoading && !campaigns && <Spinner label="Lecture des campagnes sur la blockchain…" />}
          {error && <ErrorBox title="Lecture impossible">{error}</ErrorBox>}
          {campaigns && visible.length === 0 && (
            <EmptyState title={campaigns.length === 0 ? "Aucune campagne pour l'instant" : "Aucune campagne avec ce statut"}>
              {campaigns.length === 0 && (
                <Link href="/creator" className="btn-primary mt-3">
                  Créer la première campagne
                </Link>
              )}
            </EmptyState>
          )}
          <div className="divide-y divide-[var(--line)]">
            {visible.map((c) => (
              <CampaignRow key={c.id} campaign={c} risk={scores[String(c.id)]} now={now} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Gouvernance ---------- */}
      <section className="section">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 className="display-l two-tone">
            Gouvernance.
            <span style={{ color: "var(--vote)" }}>Une voix par CFD, figée.</span>
          </h2>
          <p className="mt-4 max-w-[34ch] text-[15px] text-[var(--text-2)]">
            Le poids de vote est photographié à la création de la proposition. Un prêt éclair de jetons ne change rien au
            résultat.
          </p>
          <Link href="/governance" className="btn-ghost mt-6">
            Ouvrir le tableau de vote
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {proposals?.slice(0, 2).map((p) => <ProposalPreview key={p.id} proposal={p} now={now} />)}
          {proposals?.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="Aucune proposition pour l'instant">
                Une proposition apparaît quand un porteur demande le déblocage d&apos;un jalon, ou quand un membre signale une
                campagne.
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Sécurité ---------- */}
      <section className="section">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 className="display-l two-tone">
            Sécurité.
            <span style={{ color: "var(--release)" }}>Prouvée par les tests.</span>
          </h2>
          <p className="mt-4 max-w-[34ch] text-[15px] text-[var(--text-2)]">
            Chaque protection a son test, et chaque attaque a sa démonstration : elle réussit sur une version faible, elle
            échoue sur la nôtre.
          </p>
        </div>
        <div className="grid gap-8">
          <pre className="card overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-[var(--text-2)]" aria-label="Extrait de CampusFund.withdrawTranche">
            <code>
              <span className="text-[var(--text-3)]">{"// Vérifier, mettre à jour, puis seulement envoyer\n"}</span>
              {"function "}
              <span className="text-[var(--text)]">withdrawTranche</span>
              {"(uint256 id)\n    external nonReentrant whenNotPaused\n{\n"}
              {"    if (msg.sender != c.beneficiary) revert NotBeneficiary();\n"}
              {"    if (c.withdrawnMilestones >= c.approvedMilestones)\n        revert NoApprovedTranche();\n\n"}
              <span className="text-[var(--text)]">{"    c.withdrawnMilestones = index + 1;\n    totalOwed -= amount;\n\n"}</span>
              {"    treasury.sendValue(fee);\n    c.beneficiary.sendValue(amount - fee);\n}"}
            </code>
          </pre>
          <dl className="grid gap-x-10 text-sm sm:grid-cols-2">
            {SAFEGUARDS.map((s) => {
              const url = explorerUrl(s.contract ? deployment?.[s.contract] : undefined);
              return (
                <div key={s.name} className="border-t border-[var(--line)] py-4">
                  <dt className="font-medium">{s.name}</dt>
                  <dd className="mt-0.5 text-[var(--text-2)]">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                        {s.detail}
                      </a>
                    ) : (
                      s.detail
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* ---------- Questions ---------- */}
      <section className="section">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 className="display-l two-tone">
            Questions.
            <span style={{ color: "var(--voice)" }}>Réponses courtes.</span>
          </h2>
        </div>
        <Faq />
      </section>

      {/* ---------- Dernier appel ---------- */}
      <section className="mt-8 rounded-[36px] px-7 py-14 md:px-16 md:py-20" style={{ background: "var(--give-solid)" }}>
        <h2 className="display-xl">Un projet à financer&nbsp;?</h2>
        <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-white/85">
          Décris-le, découpe-le en jalons, et laisse ta communauté débloquer les fonds au fil de tes avancées.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/creator" className="btn-primary">
            Lancer une campagne
          </Link>
          <a href="#campagnes" className="btn-on-color">
            Voir les campagnes
          </a>
        </div>
      </section>
    </div>
  );
}

const SAFEGUARDS: { name: string; detail: string; contract?: "CampusFund" | "Governance" | "Treasury" | "CFDToken" }[] = [
  { name: "Anti-réentrance", detail: "État mis à jour avant tout envoi", contract: "CampusFund" },
  { name: "Vote sur solde figé", detail: "Lu au bloc précédant la proposition", contract: "Governance" },
  { name: "Trésorerie", detail: "Multisig 2 sur 3, plafond de 1 ETH par jour", contract: "Treasury" },
  { name: "Pause d'urgence", detail: "Suspend contributions et retraits" },
  { name: "Tests", detail: "145 tests Foundry, fuzzing et invariants" },
  { name: "Audit Slither", detail: "18 alertes : 5 corrigées, 13 justifiées" },
];

/** Aperçu en lecture seule d'une proposition ; le vote se fait sur la page Gouvernance. */
function ProposalPreview({ proposal: p, now }: { proposal: Proposal; now: number }) {
  const cast = p.forVotes + p.againstVotes;
  const forShare = percent(p.forVotes, cast);
  const tone = p.state === 0 ? "tone-info" : p.state === 1 ? "tone-neutral" : p.state === 2 ? "tone-ok" : "tone-solid";
  return (
    <Link href="/governance" className="card row-link block p-5">
      <span className={`pill ${tone}`}>{PROPOSAL_STATE_LABELS[p.state]}</span>
      <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.015em]">
        {p.ptype === 0 ? `Débloquer le jalon ${p.milestoneIndex + 1} de la campagne n°${p.campaignId}` : `Geler la campagne n°${p.campaignId}`}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-2)]">{p.description}</p>
      <div className="mt-5 flex justify-between text-[13px]">
        <span className="text-[var(--ok)]">Pour {cfd(p.forVotes)}</span>
        <span className="text-[var(--danger)]">Contre {cfd(p.againstVotes)}</span>
      </div>
      <div className="track mt-2 flex h-1.5 overflow-hidden rounded-full">
        <div style={{ width: `${cast === 0n ? 0 : forShare}%`, background: "var(--ok)" }} />
        <div style={{ width: `${cast === 0n ? 0 : 100 - forShare}%`, background: "var(--danger)" }} />
      </div>
      <div className="mt-4 mb-2 flex justify-between text-[13px] text-[var(--text-2)]">
        <span>Quorum</span>
        <span>
          {cfd(p.participation)} sur {cfd(p.quorum)} CFD
        </span>
      </div>
      <ProgressBar value={percent(p.participation, p.quorum === 0n ? 1n : p.quorum)} />
      <p className="mt-4 text-[13px] text-[var(--text-3)]">Fin du vote {relative(p.voteEnd, now)}</p>
    </Link>
  );
}
