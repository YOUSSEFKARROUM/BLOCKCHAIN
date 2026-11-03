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
    <div className="flex items-center gap-1 rounded-lg border border-dashed border-[var(--rule)] bg-white/60 px-2 py-1 text-[11px]" title="Démo anvil : avancer le temps de la blockchain">
      <span className="font-semibold text-[var(--ink-soft)]">⏱ anvil</span>
      <button type="button" disabled={busy} onClick={() => advance(3_700)} className="rounded px-1.5 py-0.5 font-semibold hover:bg-stone-100">
        +1 h
      </button>
      <button type="button" disabled={busy} onClick={() => advance(86_400)} className="rounded px-1.5 py-0.5 font-semibold hover:bg-stone-100">
        +1 j
      </button>
    </div>
  );
}
