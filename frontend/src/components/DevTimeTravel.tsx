"use client";

import { useState } from "react";
import { RPC_URL } from "@/config/chain";
import { useWeb3 } from "@/lib/web3";

/**
 * Outil de démonstration, visible UNIQUEMENT sur anvil : avance l'horloge de la blockchain
 * (evm_increaseTime + evm_mine) pour atteindre une échéance ou la fin d'un vote sans attendre.
 * Impossible sur un vrai réseau : personne ne contrôle le temps d'Ethereum.
 */
export function DevTimeTravel() {
  const { refresh } = useWeb3();
  const [busy, setBusy] = useState(false);

  async function advance(seconds: number) {
    setBusy(true);
    try {
      for (const [method, params] of [
        ["evm_increaseTime", [seconds]],
        ["evm_mine", []],
      ] as const) {
        await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
      }
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="group"
      aria-label="Démo anvil : avancer le temps de la blockchain"
      className="mono flex items-center gap-1 rounded-md border-[1.5px] border-dashed border-line px-2 py-1 text-[12px] font-bold tracking-[.08em]"
    >
      <span className="px-1 font-normal text-gray">TEMPS ANVIL</span>
      {[
        ["+1 h", 3_700],
        ["+1 j", 86_400],
      ].map(([label, seconds]) => (
        <button
          key={label}
          type="button"
          disabled={busy}
          onClick={() => advance(seconds as number)}
          className="db-step !h-9 !w-auto !px-2.5 !text-[12px] uppercase"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
