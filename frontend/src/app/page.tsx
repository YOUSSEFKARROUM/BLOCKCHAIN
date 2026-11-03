"use client";

import { useEffect, useMemo, useState } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState, ErrorBox, Spinner, Stat } from "@/components/ui";
import { deployment, getContracts } from "@/lib/contracts";
import { STATUS_LABELS, type StatusIndex } from "@/lib/data";
import { eth } from "@/lib/format";
import { useCampaigns, useChainTime, useRiskScores } from "@/lib/hooks";
import { useWeb3 } from "@/lib/web3";

type Filter = "all" | StatusIndex;

export default function CampaignsPage() {
  const { readProvider, refreshKey } = useWeb3();
  const { data: campaigns, error, isLoading } = useCampaigns();
  const { scores, generatedAt } = useRiskScores(deployment?.CampusFund);
  const now = useChainTime();
  const [filter, setFilter] = useState<Filter>("all");
  const [treasury, setTreasury] = useState<bigint | null>(null);

  useEffect(() => {
    if (!deployment) return;
    readProvider.getBalance(getContracts(readProvider).treasury.target as string).then(setTreasury).catch(() => setTreasury(null));
  }, [readProvider, refreshKey]);

  const visible = useMemo(
    () => (campaigns ?? []).filter((c) => filter === "all" || c.status === filter),
    [campaigns, filter],
  );
  const totalRaised = (campaigns ?? []).reduce((sum, c) => sum + c.raised, 0n);
  const active = (campaigns ?? []).filter((c) => c.status === 0).length;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="eyebrow">Financement participatif décentralisé</p>
          <h1 className="font-display mt-2 text-4xl leading-[1.05] md:text-5xl">
            Les projets du campus,
            <br />
            financés et <em className="text-[var(--accent)]">surveillés</em> par leur communauté.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--ink-soft)]">
            Chaque contribution en ETH vous donne des jetons CFD (1 ETH = 1000 CFD). Les fonds sont versés jalon par
            jalon, uniquement après un vote de la DAO : aucun administrateur ne peut débloquer l&apos;argent seul.
          </p>
        </div>
        <div className="card grid grid-cols-3 gap-4 p-5">
          <Stat label="Collecté" value={`${eth(totalRaised, 2)}`} hint="ETH, toutes campagnes" />
          <Stat label="En cours" value={active} hint={`sur ${campaigns?.length ?? 0} campagnes`} />
          <Stat label="Trésorerie" value={treasury === null ? "—" : eth(treasury, 3)} hint="ETH (frais 2 %, multisig)" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="font-display mr-4 text-2xl">Campagnes</h2>
          {(["all", 0, 1, 2, 3] as Filter[]).map((f) => (
            <button
              key={String(f)}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${filter === f ? "bg-[var(--ink)] text-white ring-[var(--ink)]" : "bg-white/70 ring-[var(--rule)] hover:bg-white"}`}
            >
              {f === "all" ? "Toutes" : STATUS_LABELS[f]}
            </button>
          ))}
          <span className="ml-auto text-xs text-[var(--ink-soft)]">
            {generatedAt ? `Scores IA calculés le ${new Date(generatedAt).toLocaleString("fr-FR")}` : "Scores IA non calculés"}
          </span>
        </div>

        {isLoading && !campaigns && <Spinner label="Lecture des campagnes sur la blockchain…" />}
        {error && <ErrorBox title="Lecture impossible">{error}</ErrorBox>}
        {campaigns && visible.length === 0 && (
          <EmptyState title="Aucune campagne ici">Créez la première depuis l&apos;espace porteur.</EmptyState>
        )}
        <div className="grid gap-5 md:grid-cols-3">
          {visible.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} risk={scores[String(c.id)]} now={now} featured={i === 0 && filter === "all"} />
          ))}
        </div>
      </section>
    </div>
  );
}
