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
    <div className="flex items-center gap-1 rounded-full border border-dashed border-[var(--line)] px-2 py-1 text-xs" title="Démo anvil : avancer le temps de la blockchain">
      <span className="px-1 text-[var(--text-2)]">Temps anvil</span>
      {[
        ["+1 h", 3_700],
        ["+1 j", 86_400],
      ].map(([label, seconds]) => (
        <button
          key={label}
          type="button"
          disabled={busy}
          onClick={() => advance(seconds as number)}
          className="rounded-full px-2 py-1 font-semibold transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
