"use client";

import type { ReactNode } from "react";
import { txUrl } from "@/config/chain";
import { STATUS_LABELS, type StatusIndex } from "@/lib/data";
import type { RiskEntry } from "@/lib/hooks";
import type { TxStatus } from "@/lib/useTx";

const STATUS_STYLES: Record<StatusIndex, string> = {
  0: "bg-sky-50 text-sky-800 ring-sky-200",
  1: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  2: "bg-stone-100 text-stone-700 ring-stone-300",
  3: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StatusPill({ status }: { status: StatusIndex }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const RISK_STYLES: Record<RiskEntry["level"], { box: string; dot: string }> = {
  Faible: { box: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  Moyen: { box: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  Élevé: { box: "bg-rose-50 text-rose-800 ring-rose-300", dot: "bg-rose-600 animate-pulse" },
};

/** Badge du score de risque IA (scripts/anomaly_detection.py). */
export function RiskBadge({ risk }: { risk: RiskEntry | undefined }) {
  if (!risk) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500 ring-1 ring-stone-200" title="Lancez scripts/anomaly_detection.py pour calculer ce score">
        Risque IA : non calculé
      </span>
    );
  }
  const s = RISK_STYLES[risk.level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.box}`}
      title={risk.reasons.join(" · ") || "Aucun signal suspect"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      Risque {risk.level} · {Math.round(risk.score)}/100
    </span>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" }) {
  const color = tone === "ok" ? "var(--ok)" : "var(--accent)";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/80" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

/** Jalons sous forme de segments proportionnels : retiré / approuvé par la DAO / en attente. */
export function MilestoneTrack({ bps, approved, withdrawn }: { bps: number[]; approved: number; withdrawn: number }) {
  return (
    <div>
      <div className="flex h-2.5 gap-1" aria-label={`${withdrawn} tranche(s) retirée(s), ${approved} jalon(s) approuvé(s) sur ${bps.length}`}>
        {bps.map((b, i) => {
          const tone = i < withdrawn ? "bg-[var(--ok)]" : i < approved ? "bg-emerald-300" : "bg-stone-200";
          return <div key={i} className={`rounded-sm ${tone}`} style={{ flexGrow: b }} title={`Jalon ${i + 1} : ${b / 100} %`} />;
        })}
      </div>
      <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
        {withdrawn}/{bps.length} tranche(s) versée(s) · {approved} approuvée(s) par la DAO
      </p>
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-[var(--ink-soft)]" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--accent)]" />
      {label}
    </div>
  );
}

export function ErrorBox({ title = "Erreur", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
      <p className="font-semibold">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function TxFeedback({ status }: { status: TxStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "error") return <ErrorBox title="Transaction impossible">{status.message}</ErrorBox>;
  const link = "hash" in status ? txUrl(status.hash) : null;
  const text =
    status.kind === "wallet"
      ? "Confirmez la transaction dans MetaMask…"
      : status.kind === "mining"
        ? "Transaction envoyée, en attente de confirmation…"
        : "Transaction confirmée.";
  const tone = status.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-sky-200 bg-sky-50 text-sky-900";
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${tone}`} role="status">
      {text}
      {"hash" in status && (
        <span className="ml-2 font-mono text-xs opacity-70">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
              {status.hash.slice(0, 10)}…
            </a>
          ) : (
            `${status.hash.slice(0, 10)}…`
          )}
        </span>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-[var(--ink-soft)]">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="font-display text-2xl leading-tight">{value}</p>
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}
