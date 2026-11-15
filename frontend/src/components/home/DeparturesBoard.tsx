"use client";

import { useMemo, useState } from "react";
import { BOARD_GRID, BoardRow, BoardRowPlaceholder } from "@/components/board/BoardRow";
import { EmptyPanel, ErrorPanel } from "@/components/board/Feedback";
import { BOARD_FILTERS, type BoardFilter, boardStatus, flightCode } from "@/lib/campaignView";
import type { Campaign, Proposal } from "@/lib/data";
import { eth } from "@/lib/format";
import { useCampaigns, useChainTime, useMetadata, useProposals } from "@/lib/hooks";

const ROW_STAGGER = 0.12;

function CampaignBoardRow({ campaign: c, proposals, now, delay }: { campaign: Campaign; proposals: Proposal[]; now: number; delay: number }) {
  const { metadata } = useMetadata(c.metadataCID);
  const status = boardStatus(c, proposals, now);
  const isFunded = c.status === 1;
  return (
    <BoardRow
      delay={delay}
      row={{
        href: `/campaign/${c.id}`,
        flight: flightCode(c.id),
        name: metadata?.name ?? `Campagne n°${c.id}`,
        club: metadata?.club ?? "—",
        tranche: isFunded ? `${c.withdrawnMilestones} sur ${c.milestoneCount}` : "—",
        amount: isFunded ? `${eth(c.raised, 2)} ETH` : `${eth(c.raised, 2)} / ${eth(c.goal, 2)} ETH`,
        status: status.label,
        color: status.color,
        isBlinking: status.isBlinking,
      }}
    />
  );
}

function FilterTabs({ value, onChange }: { value: BoardFilter; onChange: (f: BoardFilter) => void }) {
  return (
    <div role="group" aria-label="Filtrer les campagnes" className="flex flex-wrap gap-1.5">
      {BOARD_FILTERS.map((f) => {
        const isOn = f.value === value;
        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onChange(f.value)}
            className={`btn btn-sm !min-h-[46px] !px-[18px] ${isOn ? "btn-amber" : "bg-tile-2 text-ticket"}`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

/** Tableau des départs : une ligne par campagne lue sur la chaîne. */
export function DeparturesBoard() {
  const { data: campaigns, error, isLoading } = useCampaigns();
  const { data: proposals } = useProposals();
  const now = useChainTime();
  const [filter, setFilter] = useState<BoardFilter>("all");

  const rows = useMemo(() => {
    const list = proposals ?? [];
    return (campaigns ?? []).filter((c) => filter === "all" || boardStatus(c, list, now).filter === filter);
  }, [campaigns, proposals, filter, now]);

  const isFirstLoad = isLoading && !campaigns;

  return (
    <section id="departs" aria-labelledby="departs-title" className="wrap flex flex-col gap-[22px] pb-24 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <h2 id="departs-title" className="display display-m">
          Départs <span className="text-amber">des tranches</span>
        </h2>
        <FilterTabs value={filter} onChange={setFilter} />
      </div>
      {error && <ErrorPanel title="Tableau indisponible">{error}</ErrorPanel>}
      <div className="overflow-x-auto pb-1.5" tabIndex={0} aria-label="Tableau des départs, défilement horizontal">
        <div className="flex min-w-[1040px] flex-col gap-[5px]" style={{ perspective: 1400 }}>
          <div className="mono grid gap-x-5 px-5 pb-1.5 text-[12px] tracking-[.18em] text-amber" style={{ gridTemplateColumns: BOARD_GRID }}>
            <span>VOL</span>
            <span>CAMPAGNE</span>
            <span>CLUB</span>
            <span>JALON</span>
            <span>MONTANT</span>
            <span>STATUT</span>
          </div>
          {isFirstLoad && [0, 1, 2].map((i) => <BoardRowPlaceholder key={i} delay={i * 0.18} />)}
          {rows.map((c, i) => (
            <CampaignBoardRow key={c.id} campaign={c} proposals={proposals ?? []} now={now} delay={0.1 + i * ROW_STAGGER} />
          ))}
        </div>
      </div>
      {!isFirstLoad && !error && rows.length === 0 && (
        <EmptyPanel title={campaigns?.length ? "Aucun vol dans cette catégorie" : "Aucun départ prévu"}>
          {campaigns?.length ? "Changez de filtre pour voir les autres campagnes." : "Aucune campagne n'a encore été créée sur ce réseau."}
        </EmptyPanel>
      )}
      <p className="tag m-0" style={{ letterSpacing: ".1em" }}>
        Vol = campagne · Escale = jalon
      </p>
    </section>
  );
}
