"use client";

import { useEffect, useState } from "react";
import { CHAIN_ID } from "@/config/chain";
import { getContracts } from "./contracts";
import { type Campaign, loadCampaigns, loadProposals, type Proposal } from "./data";
import { describeError } from "./errors";
import type { CampaignMetadata } from "./metadata";
import { useWeb3 } from "./web3";

interface Loadable<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/** Charge une donnée on-chain et la recharge après chaque transaction (refreshKey). */
function useChainData<T>(loader: () => Promise<T>, deps: unknown[]): Loadable<T> {
  const { refreshKey } = useWeb3();
  const [state, setState] = useState<Loadable<T>>({ data: null, error: null, isLoading: true });
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true }));
    loader()
      .then((data) => !cancelled && setState({ data, error: null, isLoading: false }))
      .catch((e: unknown) => !cancelled && setState({ data: null, error: describeError(e), isLoading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loader dépend uniquement de deps
  }, [refreshKey, ...deps]);
  return state;
}

export function useCampaigns(): Loadable<Campaign[]> {
  const { readProvider } = useWeb3();
  return useChainData(() => loadCampaigns(getContracts(readProvider).fund), [readProvider]);
}

export function useProposals(): Loadable<Proposal[]> {
  const { readProvider } = useWeb3();
  return useChainData(() => loadProposals(getContracts(readProvider).governance), [readProvider]);
}

/** Heure de la blockchain (≠ heure du PC sur anvil après un saut dans le temps). */
export function useChainTime(): number {
  const { readProvider, refreshKey } = useWeb3();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    let cancelled = false;
    readProvider
      .getBlock("latest")
      .then((b) => !cancelled && b && setNow(Number(b.timestamp)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [readProvider, refreshKey]);
  return now;
}

const metadataCache = new Map<string, Promise<CampaignMetadata | null>>();

export function fetchMetadata(cid: string): Promise<CampaignMetadata | null> {
  if (!metadataCache.has(cid)) {
    const p = fetch(`/api/ipfs/${encodeURIComponent(cid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { metadata?: CampaignMetadata } | null) => body?.metadata ?? null)
      .catch(() => null);
    metadataCache.set(cid, p);
  }
  return metadataCache.get(cid)!;
}

export function useMetadata(cid: string | undefined): { metadata: CampaignMetadata | null; isLoading: boolean } {
  const [state, setState] = useState<{ metadata: CampaignMetadata | null; isLoading: boolean }>({
    metadata: null,
    isLoading: Boolean(cid),
  });
  useEffect(() => {
    if (!cid) return;
    let cancelled = false;
    fetchMetadata(cid).then((metadata) => !cancelled && setState({ metadata, isLoading: false }));
    return () => {
      cancelled = true;
    };
  }, [cid]);
  return state;
}

export interface RiskEntry {
  score: number;
  level: "Faible" | "Moyen" | "Élevé";
  rulesScore: number;
  forestScore: number;
  reasons: string[];
}

interface RiskFile {
  generatedAt: string;
  chainId: number;
  campusFund: string;
  campaigns: Record<string, RiskEntry>;
}

/** Scores produits par scripts/anomaly_detection.py (ignorés s'ils concernent un autre déploiement). */
export function useRiskScores(campusFund: string | undefined): { scores: Record<string, RiskEntry>; generatedAt: string | null; isLoaded: boolean } {
  const [file, setFile] = useState<RiskFile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    fetch(`/risk-scores-${CHAIN_ID}.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((f: RiskFile | null) => setFile(f))
      .catch(() => setFile(null))
      .finally(() => setIsLoaded(true));
  }, []);
  const valid =
    file && file.chainId === CHAIN_ID && campusFund && file.campusFund.toLowerCase() === campusFund.toLowerCase();
  return { scores: valid ? file.campaigns : {}, generatedAt: valid ? file.generatedAt : null, isLoaded };
}
