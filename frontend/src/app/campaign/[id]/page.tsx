"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorPanel, LoadingFlaps } from "@/components/board/Feedback";
import { ArrowIcon } from "@/components/board/Icons";
import { BoardingPass } from "@/components/campaign/BoardingPass";
import { Escales } from "@/components/campaign/Escales";
import { ScannerPanel } from "@/components/campaign/ScannerPanel";
import { FlightInfo, TicketOffice } from "@/components/campaign/TicketOffice";
import { deployment, getContracts } from "@/lib/contracts";
import { fallbackName } from "@/lib/campaignView";
import { type Campaign, loadCampaign } from "@/lib/data";
import { describeError } from "@/lib/errors";
import { useChainTime, useMetadata, useProposals, useRiskScores } from "@/lib/hooks";
import { useProtocol } from "@/lib/useProtocol";
import { useWeb3 } from "@/lib/web3";

function BackLink() {
  return (
    <Link href="/#departs" className="tag inline-flex min-h-[44px] items-center gap-2.5 self-start no-underline hover:text-amber">
      <ArrowIcon size={16} back />
      Tous les départs
    </Link>
  );
}

/** Fiche d'une campagne : carte d'embarquement, escales, scanner et guichet (maquette Campaign). */
export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { readProvider, account, refreshKey } = useWeb3();
  const now = useChainTime();
  const rules = useProtocol();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [myContribution, setMyContribution] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const { data: proposals } = useProposals();
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

  if (error || !campaign) {
    return (
      <main className="wrap flex flex-col gap-6 pb-28 pt-5">
        <BackLink />
        {error ? <ErrorPanel title="Vol introuvable">{error}</ErrorPanel> : <LoadingFlaps label="Lecture de la campagne sur la chaîne" />}
      </main>
    );
  }

  const c = campaign;
  const name = metadata?.name ?? fallbackName(c.id);
  // Comme la maquette : le dernier mot du nom passe en ambre.
  const cut = name.lastIndexOf(" ");
  const [head, tail] = cut > 0 ? [name.slice(0, cut), name.slice(cut + 1)] : ["", name];
  return (
    <main className="wrap flex flex-col gap-11 pb-28 pt-5">
      <div className="flex flex-col gap-3.5">
        <BackLink />
        <h1 className="display" style={{ fontSize: "clamp(48px, 9.6vw, 156px)", lineHeight: 0.82, fontStretch: "66%" }}>
          {head} <span className="text-amber">{tail}</span>
        </h1>
        <p className="m-0 mt-1.5 max-w-[700px] whitespace-pre-line text-[19px] text-soft">{metadata?.description ?? "Métadonnées IPFS indisponibles."}</p>
      </div>

      <div className="flex flex-wrap items-start gap-9">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-14">
          <BoardingPass campaign={c} proposals={proposals ?? []} metadata={metadata} risk={risk} now={now} feePercent={rules.feePercent} />
          <Escales campaign={c} proposals={proposals ?? []} metadata={metadata} feePercent={rules.feePercent} />
          <ScannerPanel risk={risk} thresholdCfd={rules.proposalThresholdCfd} />
        </div>
        <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-6">
          <TicketOffice campaign={c} myContribution={myContribution} now={now} rate={rules.rate} />
          <FlightInfo campaign={c} />
        </aside>
      </div>
    </main>
  );
}
