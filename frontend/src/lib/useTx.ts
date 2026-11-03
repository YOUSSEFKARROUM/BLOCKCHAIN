"use client";

import type { ContractTransactionResponse, JsonRpcSigner } from "ethers";
import { useCallback, useState } from "react";
import { CHAIN_ID } from "@/config/chain";
import { describeError } from "./errors";
import { useWeb3 } from "./web3";

export type TxStatus =
  | { kind: "idle" }
  | { kind: "wallet" } // en attente de signature dans MetaMask
  | { kind: "mining"; hash: string }
  | { kind: "success"; hash: string }
  | { kind: "error"; message: string };

/**
 * Envoie une transaction et suit son cycle de vie (signature -> minage -> confirmation),
 * avec vérifications préalables : MetaMask présent, compte connecté, bon réseau.
 */
export function useTx() {
  const { hasWallet, account, walletChainId, getSigner, connect, refresh } = useWeb3();
  const [status, setStatus] = useState<TxStatus>({ kind: "idle" });

  const send = useCallback(
    async (action: (signer: JsonRpcSigner) => Promise<ContractTransactionResponse>): Promise<boolean> => {
      if (!hasWallet) {
        setStatus({ kind: "error", message: "MetaMask est nécessaire pour envoyer une transaction." });
        return false;
      }
      if (!account) {
        await connect();
        return false;
      }
      if (walletChainId !== CHAIN_ID) {
        setStatus({ kind: "error", message: "Mauvais réseau : changez de réseau dans le bandeau en haut." });
        return false;
      }
      try {
        setStatus({ kind: "wallet" });
        const tx = await action(await getSigner());
        setStatus({ kind: "mining", hash: tx.hash });
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) throw new Error("La transaction a échoué.");
        setStatus({ kind: "success", hash: tx.hash });
        refresh();
        return true;
      } catch (error) {
        setStatus({ kind: "error", message: describeError(error) });
        return false;
      }
    },
    [hasWallet, account, walletChainId, getSigner, connect, refresh],
  );

  const reset = useCallback(() => setStatus({ kind: "idle" }), []);
  return { status, send, reset, busy: status.kind === "wallet" || status.kind === "mining" };
}
