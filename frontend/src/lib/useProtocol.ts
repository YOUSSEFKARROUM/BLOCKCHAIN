"use client";

import { useEffect, useState } from "react";
import { deployment, getContracts } from "./contracts";
import { useWeb3 } from "./web3";

/** Règles du protocole, lues sur les contrats (valeurs du code en attendant ou si la lecture échoue). */
export interface ProtocolRules {
  rate: number; // CFD par ETH
  feePercent: number; // frais sur chaque tranche
  quorumPercent: number;
  proposalThresholdCfd: number;
  votingPeriodSeconds: number;
}

export const DEFAULT_RULES: ProtocolRules = {
  rate: 1000,
  feePercent: 2,
  quorumPercent: 10,
  proposalThresholdCfd: 100,
  votingPeriodSeconds: deployment?.votingPeriod ?? 3600,
};

const WEI_PER_TOKEN = 10n ** 18n;

export function useProtocol(): ProtocolRules {
  const { readProvider } = useWeb3();
  const [rules, setRules] = useState<ProtocolRules>(DEFAULT_RULES);

  useEffect(() => {
    if (!deployment) return;
    let cancelled = false;
    const { token, fund, governance } = getContracts(readProvider);
    Promise.all([token.RATE(), fund.FEE_BPS(), governance.QUORUM_BPS(), governance.proposalThreshold(), governance.votingPeriod()])
      .then(([rate, fee, quorum, threshold, period]: bigint[]) => {
        if (cancelled) return;
        setRules({
          rate: Number(rate),
          feePercent: Number(fee) / 100,
          quorumPercent: Number(quorum) / 100,
          proposalThresholdCfd: Number(threshold / WEI_PER_TOKEN),
          votingPeriodSeconds: Number(period),
        });
      })
      .catch(() => undefined); // on garde les valeurs du code
    return () => {
      cancelled = true;
    };
  }, [readProvider]);

  return rules;
}

/** « 1 h », « 3 j », « 45 min ». */
export function formatPeriod(seconds: number): string {
  if (seconds >= 86_400 && seconds % 86_400 === 0) return `${seconds / 86_400} j`;
  if (seconds >= 3_600) return `${Math.round(seconds / 360) / 10} h`.replace(".", ",");
  return `${Math.round(seconds / 60)} min`;
}
