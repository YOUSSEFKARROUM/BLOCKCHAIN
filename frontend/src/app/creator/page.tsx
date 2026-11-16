"use client";

import { FlightPlanForm } from "@/components/creator/FlightPlanForm";
import { MyFlights } from "@/components/creator/MyFlights";
import { useCampaigns, useChainTime, useProposals } from "@/lib/hooks";
import { useProtocol } from "@/lib/useProtocol";

/** Espace porteur : créer une campagne et suivre les siennes. */
export default function CreatorPage() {
  const { data: campaigns } = useCampaigns();
  const { data: proposals } = useProposals();
  const now = useChainTime();
  const rules = useProtocol();
  return (
    <main className="wrap flex flex-col gap-12 pb-28 pt-5">
      <div className="flex flex-col gap-[18px]">
        <span className="tag text-amber" style={{ fontSize: 13 }}>
          Espace porteur · nouvelle campagne
        </span>
        <h1 className="display display-hero">
          Créez votre
          <br />
          <span className="text-amber">campagne.</span>
        </h1>
        <p className="m-0 mt-1.5 max-w-[620px] text-[20px] text-soft">
          Fixez l&apos;objectif, la durée et les jalons. La tranche de chaque jalon n&apos;est versée qu&apos;après un vote.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-9">
        <FlightPlanForm />
        <MyFlights campaigns={campaigns} proposals={proposals ?? []} now={now} feePercent={rules.feePercent} />
      </div>
    </main>
  );
}
