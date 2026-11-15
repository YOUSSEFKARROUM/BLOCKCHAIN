"use client";

import type { ReactNode } from "react";
import { txUrl } from "@/config/chain";
import type { TxStatus } from "@/lib/useTx";
import { FlapText } from "./Flap";
import { StatusLamp } from "./StatusLamp";

const TX_TEXT: Record<Exclude<TxStatus["kind"], "idle" | "error">, string> = {
  wallet: "Signature en attente dans MetaMask…",
  mining: "Transaction envoyée, en attente du bloc…",
  success: "Transaction confirmée.",
};

/** Suivi d'une transaction : signature, minage, confirmation ou refus. */
export function TxStrip({ status }: { status: TxStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "error") return <ErrorPanel title="Transaction refusée">{status.message}</ErrorPanel>;
  const isDone = status.kind === "success";
  const color = isDone ? "var(--ok)" : "var(--amber)";
  const link = "hash" in status ? txUrl(status.hash) : null;
  return (
    <div role="status" className="mono flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-night px-4 py-3 text-[13px] text-ticket" style={{ border: `1.5px solid ${color}` }}>
      <StatusLamp color={color} isBlinking={!isDone} />
      <span style={{ color }}>{TX_TEXT[status.kind]}</span>
      {"hash" in status &&
        (link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-gray underline hover:text-amber">
            {status.hash.slice(0, 10)}…
          </a>
        ) : (
          <span className="text-gray">{status.hash.slice(0, 10)}…</span>
        ))}
    </div>
  );
}

export function ErrorPanel({ title = "Erreur", children }: { title?: string; children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md bg-night px-4 py-3 text-[15px] text-ticket" style={{ border: "1.5px solid var(--alert)" }}>
      <p className="tag-b mb-1 flex items-center gap-2.5" style={{ color: "#FF9B7A" }}>
        <StatusLamp color="var(--alert)" size={10} />
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

/** Chargement : palettes vides qui se retournent. */
export function LoadingFlaps({ label = "Chargement", length = 9 }: { label?: string; length?: number }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 py-8">
      <FlapText text="" isLoading loadingLength={length} size="md" gap={4} />
      <span className="tag">{label}…</span>
    </div>
  );
}

export function EmptyPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel flex flex-col gap-2 px-6 py-10" style={{ borderStyle: "dashed" }}>
      <p className="tag-b text-amber">{title}</p>
      {children && <div className="text-[15px] text-soft">{children}</div>}
    </div>
  );
}
