"use client";

import { buttonVariants } from "@/components/shadcn/button";
import { formatEther } from "ethers";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CampaignRow } from "@/components/CampaignRow";
import { CountUp } from "@/components/CountUp";
import { DotField } from "@/components/DotField";
import { Faq } from "@/components/Faq";
import { HowItWorks } from "@/components/HowItWorks";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { EmptyState, ErrorBox, MilestoneTrack, ProgressBar, RiskBadge, Spinner, StatusPill } from "@/components/ui";
import { CHAIN } from "@/config/chain";
import { deployment } from "@/lib/contracts";
import { type Campaign, PROPOSAL_STATE_LABELS, type Proposal, STATUS_LABELS, type StatusIndex } from "@/lib/data";
import { cfd, eth, percent, relative } from "@/lib/format";
import { type RiskEntry, useCampaigns, useChainTime, useMetadata, useProposals, useRiskScores } from "@/lib/hooks";
import { useWeb3 } from "@/lib/web3";

type Filter = "all" | StatusIndex;

function explorerUrl(address: string | undefined): string | null {
  return CHAIN.explorer && address ? `${CHAIN.explorer}/address/${address}#code` : null;
}

export default function HomePage() {
  const { readProvider, refreshKey } = useWeb3();
  const { data: campaigns, error, isLoading } = useCampaigns();
  const { data: proposals } = useProposals();
  const { scores, isLoaded: scoresLoaded } = useRiskScores(deployment?.CampusFund);
  const now = useChainTime();
  const [filter, setFilter] = useState<Filter>("all");
  const [treasury, setTreasury] = useState<bigint | null>(null);

  useEffect(() => {
    if (!deployment) return;
    readProvider.getBalance(deployment.Treasury).then(setTreasury).catch(() => setTreasury(null));
  }, [readProvider, refreshKey]);

  const visible = useMemo(() => (campaigns ?? []).filter((c) => filter === "all" || c.status === filter), [campaigns, filter]);
  const totalRaised = (campaigns ?? []).reduce((sum, c) => sum + c.raised, 0n);
  const active = (campaigns ?? []).filter((c) => c.status === 0);
  // À la une : la campagne en cours la plus avancée, sinon la plus récente
  const featured = useMemo(() => {
    // On ne met pas en avant une campagne signalée à risque élevé : on attend donc les scores
    if (!scoresLoaded) return null;
    const safe = (c: Campaign) => scores[String(c.id)]?.level !== "Élevé";
    const open = active.filter(safe).sort((a, b) => percent(b.raised, b.goal) - percent(a.raised, a.goal));
    return open[0] ?? [...(campaigns ?? [])].reverse().find(safe) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dérivé de campaigns et scores
  }, [campaigns, scores, scoresLoaded]);
  const liveVote = proposals?.find((p) => p.state === 0) ?? proposals?.[0] ?? null;

  return (
    <div className="pt-5">
      {/* ---------- Mosaïque ---------- */}
      <div className="grid gap-3 lg:grid-cols-12">
        <section className="tile flex min-h-[25rem] flex-col justify-end lg:col-span-6 lg:min-h-[29rem]">
          <DotField />
          <div className="relative">
            <h1 className="display-xl">
              Ton argent reste au coffre.
              <span className="block text-[var(--text-3)]">Jusqu&apos;au vote.</span>
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[var(--text-2)]">
              CampusFund finance les projets des clubs étudiants. Personne ne touche aux fonds sans l&apos;accord de ceux qui
              ont donné.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#campagnes" className={buttonVariants()}>
                Explorer les campagnes
              </a>
              <Link href="/creator" className={buttonVariants({ variant: "outline" })}>
                Lancer une campagne
              </Link>
            </div>
          </div>
        </section>

        <section className="tile lg:col-span-6">
          <HowItWorks />
        </section>

        <section className="tile lg:col-span-4">
          <p className="tile-label">À la une</p>
          {featured ? <Featured campaign={featured} risk={scores[String(featured.id)]} now={now} /> : <TileEmpty loading={!campaigns || !scoresLoaded}>Aucune campagne pour l&apos;instant.</TileEmpty>}
        </section>

        <section className="tile lg:col-span-4">
          <p className="tile-label">{liveVote?.state === 0 ? "Vote en cours" : "Dernier vote"}</p>
          {liveVote ? <VoteTile proposal={liveVote} now={now} /> : <TileEmpty loading={!proposals}>Aucune proposition pour l&apos;instant.</TileEmpty>}
        </section>

        <section className="tile lg:col-span-4" aria-label="Chiffres lus sur la blockchain">
          <p className="tile-label">En direct sur {CHAIN.name}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
            <Figure label="campagnes en cours" value={campaigns ? <CountUp value={active.length} /> : "–"} />
            <Figure label="ETH collectés" value={campaigns ? <CountUp value={Number(formatEther(totalRaised))} digits={2} /> : "–"} />
            <Figure label="propositions votées" value={proposals ? <CountUp value={proposals.length} /> : "–"} />
            <Figure label="ETH en trésorerie" value={treasury === null ? "–" : <CountUp value={Number(formatEther(treasury))} digits={3} />} />
          </dl>
        </section>

        <section className="tile lg:col-span-12" aria-label="Sécurité">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAFEGUARDS.map((s) => {
              const url = explorerUrl(s.contract ? deployment?.[s.contract] : undefined);
              return (
                <div key={s.name}>
                  <dt className="font-display text-lg">{s.name}</dt>
                  <dd className="mt-1 text-sm text-[var(--text-2)]">
                    {s.detail}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1.5 underline decoration-white/30 underline-offset-4 hover:decoration-white">
                        Voir le contrat
                      </a>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      </div>

      {/* ---------- Toutes les campagnes ---------- */}
      <section id="campagnes" className="pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-l">Toutes les campagnes</h2>
          <Tabs value={String(filter)} onValueChange={(v) => setFilter(v === "all" ? "all" : (Number(v) as StatusIndex))}>
            <TabsList aria-label="Filtrer par statut">
              {(["all", 0, 1, 2, 3] as Filter[]).map((f) => (
                <TabsTrigger key={String(f)} value={String(f)}>
                  {f === "all" ? "Toutes" : STATUS_LABELS[f]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-6">
          {isLoading && !campaigns && <Spinner label="Lecture des campagnes sur la blockchain…" />}
          {error && <ErrorBox title="Lecture impossible">{error}</ErrorBox>}
          {campaigns && visible.length === 0 && (
            <EmptyState title={campaigns.length === 0 ? "Aucune campagne pour l'instant" : "Aucune campagne avec ce statut"}>
              {campaigns.length === 0 && (
                <Link href="/creator" className={buttonVariants({ className: "mt-3" })}>
                  Créer la première campagne
                </Link>
              )}
            </EmptyState>
          )}
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {visible.map((c) => (
              <CampaignRow key={c.id} campaign={c} risk={scores[String(c.id)]} now={now} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Questions ---------- */}
      <section className="mx-auto max-w-3xl pt-20">
        <h2 className="display-l mb-6">Questions fréquentes</h2>
        <Faq />
      </section>
    </div>
  );
}

const SAFEGUARDS: { name: string; detail: string; contract?: "CampusFund" | "Governance" | "Treasury" }[] = [
  { name: "145 tests", detail: "Tests Foundry, fuzzing et invariants, tous réussis." },
  { name: "Vote sur solde figé", detail: "Un prêt éclair de jetons ne change pas le résultat.", contract: "Governance" },
  { name: "Trésorerie à 3 clés", detail: "2 signatures sur 3 au-delà de 1 ETH par jour.", contract: "Treasury" },
  { name: "Audit Slither", detail: "18 alertes : 5 corrigées, 13 justifiées.", contract: "CampusFund" },
];

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dd className="font-display text-[clamp(2rem,3.4vw,2.9rem)] !font-extrabold !leading-none !tracking-[-0.04em]">{value}</dd>
      <dt className="mt-1.5 text-[13px] text-[var(--text-2)]">{label}</dt>
    </div>
  );
}

function TileEmpty({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return <p className="mt-6 text-sm text-[var(--text-2)]">{loading ? "Lecture sur la blockchain…" : children}</p>;
}

function Featured({ campaign: c, risk, now }: { campaign: Campaign; risk: RiskEntry | undefined; now: number }) {
  const { metadata } = useMetadata(c.metadataCID);
  const progress = percent(c.raised, c.goal);
  return (
    <Link href={`/campaign/${c.id}`} className="group mt-3 block">
      <h3 className="font-display text-2xl leading-tight group-hover:underline group-hover:decoration-white/40 group-hover:underline-offset-4">
        {metadata?.name ?? `Campagne n°${c.id}`}
      </h3>
      <p className="mt-1 text-sm text-[var(--text-2)]">{metadata?.club ?? "Porteur inconnu"}</p>
      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-5xl !font-extrabold !tracking-[-0.04em]">{Math.round(progress)} %</span>
        <span className="text-sm text-[var(--text-2)]">
          {eth(c.raised)} sur {eth(c.goal)} ETH
        </span>
      </p>
      <div className="mt-3">
        <ProgressBar value={progress} tone={progress >= 100 ? "ok" : "accent"} />
      </div>
      <div className="mt-4">
        <MilestoneTrack bps={c.milestonesBps} approved={c.approvedMilestones} withdrawn={c.withdrawnMilestones} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <StatusPill status={c.status} />
        <RiskBadge risk={risk} />
        {c.status === 0 && c.deadline > now && <span className="text-[13px] text-[var(--text-2)]">Fin {relative(c.deadline, now)}</span>}
      </div>
    </Link>
  );
}

function VoteTile({ proposal: p, now }: { proposal: Proposal; now: number }) {
  const cast = p.forVotes + p.againstVotes;
  const forShare = percent(p.forVotes, cast);
  const tone = p.state === 0 ? "tone-info" : p.state === 1 ? "tone-neutral" : p.state === 2 ? "tone-ok" : "tone-solid";
  return (
    <Link href="/governance" className="group mt-3 block">
      <h3 className="font-display text-2xl leading-tight group-hover:underline group-hover:decoration-white/40 group-hover:underline-offset-4">
        {p.ptype === 0 ? `Débloquer le jalon ${p.milestoneIndex + 1} de la campagne n°${p.campaignId}` : `Geler la campagne n°${p.campaignId}`}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-2)]">{p.description}</p>
      <div className="mt-5 flex justify-between text-sm font-semibold">
        <span>Pour {cfd(p.forVotes)}</span>
        <span className="text-[var(--text-2)]">Contre {cfd(p.againstVotes)}</span>
      </div>
      <div className="track mt-2 flex h-2 overflow-hidden rounded-full">
        <div className="bg-white" style={{ width: `${cast === 0n ? 0 : forShare}%` }} />
        <div className="ml-auto bg-[var(--text-3)]" style={{ width: `${cast === 0n ? 0 : 100 - forShare}%` }} />
      </div>
      <p className="mt-4 text-[13px] text-[var(--text-2)]">
        Quorum : {cfd(p.participation)} sur {cfd(p.quorum)} CFD
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`pill ${tone}`}>{PROPOSAL_STATE_LABELS[p.state]}</span>
        {p.state === 0 && <span className="text-[13px] text-[var(--text-2)]">Fin {relative(p.voteEnd, now)}</span>}
      </div>
    </Link>
  );
}
