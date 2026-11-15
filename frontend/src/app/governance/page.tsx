"use client";

import { EmptyPanel, ErrorPanel, LoadingFlaps } from "@/components/board/Feedback";
import { SignPanel } from "@/components/board/SignPanel";
import { FreezeForm } from "@/components/governance/FreezeForm";
import { ProposalCard } from "@/components/governance/ProposalCard";
import { Radar } from "@/components/governance/Radar";
import { VotingPower } from "@/components/governance/VotingPower";
import { useCampaigns, useChainTime, useProposals } from "@/lib/hooks";
import { formatPeriod, useProtocol } from "@/lib/useProtocol";

/** Tour de contrôle = gouvernance de la DAO (maquette Governance). */
export default function GovernancePage() {
  const { data: proposals, error, isLoading } = useProposals();
  const { data: campaigns } = useCampaigns();
  const now = useChainTime();
  const rules = useProtocol();
  const list = proposals ?? [];

  const signs = [
    { big: `${rules.quorumPercent} %`, text: "de quorum, sur l'offre au snapshot" },
    { big: "POUR > CONTRE", text: "majorité stricte, l'égalité vaut rejet" },
    { big: formatPeriod(rules.votingPeriodSeconds).toUpperCase(), text: "de vote sur ce déploiement, de 1 h à 14 j possibles" },
    { big: `${rules.proposalThresholdCfd} CFD`, text: "minimum pour proposer un gel" },
  ];

  return (
    <main>
      <section className="wrap flex flex-wrap items-center gap-12 pb-[72px] pt-7">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[26px]">
          <span className="tag text-amber" style={{ fontSize: 13 }}>
            Gouvernance · DAO à snapshot
          </span>
          <h1 className="display display-hero">
            Tour de
            <br />
            <span className="text-amber">contrôle.</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[20px] text-soft" style={{ textWrap: "pretty" }}>
            Aucune tranche ne décolle sans votre autorisation. Vous votez avec les CFD que vous déteniez au bloc qui précède la proposition : des
            jetons achetés ou empruntés après coup ne comptent pas.
          </p>
          <VotingPower rate={rules.rate} />
        </div>
        <Radar proposals={list} />
      </section>

      <SignPanel variant="band" aria-labelledby="rules-title">
        <h2 id="rules-title" className="sr-only">
          Règles du vote
        </h2>
        <div className="wrap grid gap-x-8 gap-y-[22px] py-[30px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
          {signs.map((s) => (
            <div key={s.text}>
              <div className="display text-[52px]" style={{ lineHeight: 0.9, fontStretch: "70%" }}>
                {s.big}
              </div>
              <div className="text-[15px] font-semibold">{s.text}</div>
            </div>
          ))}
        </div>
      </SignPanel>

      <div className="wrap flex flex-col gap-16 pb-28 pt-[88px]">
        <section aria-labelledby="approche-title" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="approche-title" className="display display-l">
              Demandes <span className="text-amber">en approche</span>
            </h2>
            <span className="tag" style={{ letterSpacing: ".1em" }}>
              Propositions de la DAO, les plus récentes d&apos;abord
            </span>
          </div>
          <FreezeForm campaigns={(campaigns ?? []).filter((c) => c.status <= 1)} thresholdCfd={rules.proposalThresholdCfd} />
          {isLoading && !proposals && <LoadingFlaps label="Lecture des propositions" />}
          {error && <ErrorPanel title="Propositions indisponibles">{error}</ErrorPanel>}
          {proposals?.length === 0 && (
            <EmptyPanel title="Ciel dégagé">Aucune proposition pour l&apos;instant. Un porteur ouvre un vote depuis son plan de vol.</EmptyPanel>
          )}
          {list.map((p) => (
            <ProposalCard key={p.id} proposal={p} campaign={campaigns?.[p.campaignId]} now={now} quorumPercent={rules.quorumPercent} feePercent={rules.feePercent} />
          ))}
        </section>

        <SignPanel className="flex flex-col gap-3.5" aria-labelledby="snapshot-title">
          <div className="flex flex-col gap-3.5" style={{ padding: "clamp(28px, 4vw, 52px)" }}>
            <h2 id="snapshot-title" className="display" style={{ fontSize: "clamp(40px, 5.4vw, 80px)" }}>
              Pourquoi un snapshot ?
            </h2>
            <p className="m-0 max-w-[760px] text-[19px] font-medium">
              Un attaquant qui emprunte des CFD par flash loan les obtient dans le bloc courant. Le vote lit le bloc précédent : son poids est nul.
            </p>
          </div>
        </SignPanel>
      </div>
    </main>
  );
}
