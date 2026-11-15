"use client";

import { formatEther } from "ethers";
import { useEffect, useState } from "react";
import { FlapText } from "@/components/board/Flap";
import { TxStrip } from "@/components/board/Feedback";
import { getContracts } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

interface PowerInfo {
  balance: bigint;
  votes: bigint;
  delegatee: string;
}

function wholeTokens(amount: bigint): string {
  return String(Math.floor(Number(formatEther(amount))));
}

/** Pouvoir de vote du compte connecté, en palettes, avec la délégation (obligatoire pour voter). */
export function VotingPower({ rate }: { rate: number }) {
  const { readProvider, account, refreshKey, connect, hasWallet } = useWeb3();
  const [info, setInfo] = useState<PowerInfo | null>(null);
  const { status, send, busy } = useTx();

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    const { token } = getContracts(readProvider);
    Promise.all([token.balanceOf(account), token.getVotes(account), token.delegates(account)])
      .then(([balance, votes, delegatee]) => !cancelled && setInfo({ balance, votes, delegatee }))
      .catch(() => !cancelled && setInfo(null));
    return () => {
      cancelled = true;
    };
  }, [readProvider, account, refreshKey]);

  if (!account) {
    return (
      <div className="flex flex-col items-start gap-3">
        <span className="tag">Votre pouvoir de vote</span>
        <FlapText text="----" label="Pouvoir de vote inconnu : portefeuille non connecté" size="lg" color="var(--gray)" />
        {hasWallet && (
          <button type="button" onClick={connect} className="btn btn-ghost btn-sm">
            Connecter MetaMask pour voter
          </button>
        )}
      </div>
    );
  }

  const isDelegated = info?.delegatee.toLowerCase() === account.toLowerCase();
  const votes = info ? wholeTokens(info.votes) : "";
  const contributed = info ? (Number(formatEther(info.balance)) / rate).toLocaleString("fr-FR", { maximumFractionDigits: 3 }) : "…";
  return (
    <div className="flex flex-col gap-2.5">
      <span className="tag">Votre pouvoir de vote · {contributed} ETH contribués</span>
      <div className="flex flex-wrap items-center gap-[5px]">
        <FlapText text={votes} label={`${votes} CFD`} size="lg" isLoading={!info} loadingLength={4} gap={5} />
        <span aria-hidden="true" className="mono ml-2.5 text-[22px] font-bold">
          CFD
        </span>
      </div>
      <p className="m-0 max-w-[560px] text-[14px] text-gray">
        Déblocage d&apos;une tranche : vous votez avec votre contribution à la campagne, sans rien faire de plus. Gel d&apos;une campagne : il faut
        avoir délégué vos CFD.
      </p>
      {info && !isDelegated && info.balance > 0n && (
        <div className="flex max-w-[560px] flex-col gap-3 rounded-md border-[1.5px] border-amber bg-[#121008] p-4">
          <p className="m-0 text-[15px] text-soft">
            Vos {wholeTokens(info.balance)} CFD ne sont pas délégués : ils ne comptent pas pour les votes de gel. La délégation s&apos;applique aux
            propositions créées <em>après</em> elle.
          </p>
          <button type="button" disabled={busy} onClick={() => void send((s) => getContracts(s).token.delegate(account))} className="btn btn-amber btn-sm self-start">
            Activer mon pouvoir de vote
          </button>
        </div>
      )}
      {info && info.balance === 0n && <p className="m-0 text-[15px] text-gray">Aucun CFD sur ce compte : contribuez à une campagne pour obtenir des droits de vote.</p>}
      <TxStrip status={status} />
    </div>
  );
}
