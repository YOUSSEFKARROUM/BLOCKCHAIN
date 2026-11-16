"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorPanel, LoadingFlaps } from "@/components/board/Feedback";
import { ArrowIcon } from "@/components/board/Icons";
import { BoardingPass } from "@/components/campaign/BoardingPass";
import { Runway } from "@/components/campaign/Runway";
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

const LONG_DESCRIPTION = 140;

/** Description de la campagne : deux lignes, le reste à la demande. */
function Description({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isLong = text.length > LONG_DESCRIPTION;
  return (
    <div className="mt-1.5 flex max-w-[700px] flex-col items-start">
      <p className={`m-0 whitespace-pre-line text-[19px] text-soft ${isLong && !isOpen ? "line-clamp-2" : ""}`}>{text}</p>
      {isLong && (
        <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((v) => !v)} className="tag min-h-[44px] cursor-pointer border-0 bg-transparent p-0 text-amber underline underline-offset-4">
          {isOpen ? "Réduire" : "Lire la suite"}
        </button>
      )}
    </div>
  );
}

/** Fiche d'une campagne : carte d'embarquement, piste des jalons, scanner et guichet (maquette Campaign). */
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
        <Description text={metadata?.description ?? "Métadonnées IPFS indisponibles."} />
      </div>

      {/* Sur téléphone, le guichet suit la carte d'embarquement ; sur grand écran, il reste à droite. */}
      <div className="grid items-start gap-x-9 gap-y-12 min-[1100px]:grid-cols-[minmax(0,1fr)_380px]">
        <BoardingPass campaign={c} proposals={proposals ?? []} metadata={metadata} now={now} feePercent={rules.feePercent} />
        <aside className="flex min-w-0 flex-col gap-6 min-[1100px]:col-start-2 min-[1100px]:row-span-3 min-[1100px]:row-start-1">
          <TicketOffice campaign={c} myContribution={myContribution} now={now} rate={rules.rate} />
          <FlightInfo campaign={c} />
        </aside>
        <Runway campaign={c} proposals={proposals ?? []} metadata={metadata} feePercent={rules.feePercent} now={now} />
        <ScannerPanel risk={risk} thresholdCfd={rules.proposalThresholdCfd} />
      </div>
    </main>
  );
}
