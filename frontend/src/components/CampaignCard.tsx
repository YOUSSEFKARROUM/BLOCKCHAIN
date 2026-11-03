"use client";

import Link from "next/link";
import type { Campaign } from "@/lib/data";
import { eth, percent, relative } from "@/lib/format";
import { type RiskEntry, useMetadata } from "@/lib/hooks";
import { MilestoneTrack, ProgressBar, RiskBadge, StatusPill } from "./ui";

const CATEGORY_TONES: Record<string, string> = {
  Compétition: "from-[#c2542d] to-[#e08a4c]",
  Matériel: "from-[#16213e] to-[#3b4f86]",
  Événement: "from-[#2f7d5b] to-[#6fb08c]",
  Culture: "from-[#7a3b69] to-[#b57aa6]",
};

interface Props {
  campaign: Campaign;
  risk: RiskEntry | undefined;
  now: number;
  featured?: boolean;
}

export function CampaignCard({ campaign: c, risk, now, featured = false }: Props) {
  const { metadata, isLoading } = useMetadata(c.metadataCID);
  const progress = percent(c.raised, c.goal);
  const tone = CATEGORY_TONES[metadata?.category ?? ""] ?? "from-stone-500 to-stone-400";
  const title = metadata?.name ?? (isLoading ? "Chargement des métadonnées IPFS…" : `Campagne n°${c.id}`);
  const deadlineText = c.status === 0 ? (c.deadline > now ? `Fin ${relative(c.deadline, now)}` : "Échéance passée, à clôturer") : null;

  return (
    <Link
      href={`/campaign/${c.id}`}
      className={`card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${featured ? "md:col-span-2" : ""}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${tone}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">{metadata?.category ?? "Projet"}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            <StatusPill status={c.status} />
            <RiskBadge risk={risk} />
          </span>
        </div>
        <div>
          <h3 className={`font-display leading-snug ${featured ? "text-2xl" : "text-xl"}`}>{title}</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{metadata?.club ?? "—"}</p>
          {featured && metadata && <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">{metadata.description}</p>}
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between text-sm">
            <span>
              <strong className="font-display text-lg">{eth(c.raised)} ETH</strong>
              <span className="text-[var(--ink-soft)]"> / {eth(c.goal)} ETH</span>
            </span>
            <span className="font-semibold">{Math.round(progress)} %</span>
          </div>
          <ProgressBar value={progress} tone={progress >= 100 ? "ok" : "accent"} />
          <MilestoneTrack bps={c.milestonesBps} approved={c.approvedMilestones} withdrawn={c.withdrawnMilestones} />
          {deadlineText && <p className="text-xs font-medium text-[var(--ink-soft)]">{deadlineText}</p>}
        </div>
      </div>
    </Link>
  );
}
