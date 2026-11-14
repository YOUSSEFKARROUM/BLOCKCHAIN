"use client";

import Link from "next/link";
import type { Campaign } from "@/lib/data";
import { eth, percent, relative } from "@/lib/format";
import { type RiskEntry, useMetadata } from "@/lib/hooks";
import { MilestoneTrack, ProgressBar, RiskBadge, StatusPill } from "./ui";

interface Props {
  campaign: Campaign;
  risk: RiskEntry | undefined;
  now: number;
}

/** Une campagne = une ligne cliquable : nom, collecte, jalons, risque, statut. */
export function CampaignRow({ campaign: c, risk, now }: Props) {
  const { metadata, isLoading } = useMetadata(c.metadataCID);
  const progress = percent(c.raised, c.goal);
  const title = metadata?.name ?? (isLoading ? "Lecture des métadonnées IPFS…" : `Campagne n°${c.id}`);
  const deadline = c.status === 0 ? (c.deadline > now ? `Fin ${relative(c.deadline, now)}` : "Échéance passée, à clôturer") : null;

  return (
    <Link
      href={`/campaign/${c.id}`}
      className="row-link grid items-center gap-x-6 gap-y-3 rounded-2xl px-4 py-5 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_5.5rem_auto]"
    >
      <div className="min-w-0">
        <p className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.015em]">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-2)]">
          {metadata?.club ?? "Porteur inconnu"}
          {deadline && `, ${deadline.toLowerCase()}`}
        </p>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span>
            <span className="font-semibold">{eth(c.raised)}</span>
            <span className="text-[var(--text-2)]"> sur {eth(c.goal)} ETH</span>
          </span>
          <span className="text-[var(--text-2)]">{Math.round(progress)} %</span>
        </div>
        <ProgressBar value={progress} tone={progress >= 100 ? "ok" : "accent"} />
      </div>
      <div>
        <p className="mb-2 text-sm text-[var(--text-2)]">
          Jalons {c.withdrawnMilestones}/{c.milestoneCount}
        </p>
        <MilestoneTrack bps={c.milestonesBps} approved={c.approvedMilestones} withdrawn={c.withdrawnMilestones} showCaption={false} />
      </div>
      <div className="flex flex-wrap gap-1.5 md:flex-col md:items-end">
        <RiskBadge risk={risk} />
        <StatusPill status={c.status} />
      </div>
    </Link>
  );
}
