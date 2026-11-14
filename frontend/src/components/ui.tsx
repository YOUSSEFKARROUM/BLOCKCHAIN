"use client";

import type { ReactNode } from "react";
import { txUrl } from "@/config/chain";
import { STATUS_LABELS, type StatusIndex } from "@/lib/data";
import type { RiskEntry } from "@/lib/hooks";
import type { TxStatus } from "@/lib/useTx";

const STATUS_TONES: Record<StatusIndex, string> = {
  0: "tone-info",
  1: "tone-ok",
  2: "tone-neutral",
  3: "tone-danger",
};

export function StatusPill({ status }: { status: StatusIndex }) {
  return <span className={`pill ${STATUS_TONES[status]}`}>{STATUS_LABELS[status]}</span>;
}

const RISK_TONES: Record<RiskEntry["level"], string> = {
  Faible: "tone-ok",
  Moyen: "tone-warn",
  Élevé: "tone-danger",
};

/** Badge du score de risque IA (scripts/anomaly_detection.py). */
export function RiskBadge({ risk }: { risk: RiskEntry | undefined }) {
  if (!risk) {
    return (
      <span className="pill tone-neutral" title="Lancez scripts/anomaly_detection.py pour calculer ce score">
        Risque non calculé
      </span>
    );
  }
  return (
    <span className={`pill ${RISK_TONES[risk.level]}`} title={risk.reasons.join(", ") || "Aucun signal suspect"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      Risque {risk.level.toLowerCase()} {Math.round(risk.score)}
    </span>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" }) {
  const color = tone === "ok" ? "var(--ok)" : "var(--text)";
  return (
    <div className="track h-1.5 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full origin-left rounded-full"
        style={{ width: "100%", transform: `scaleX(${Math.min(100, value) / 100})`, background: color, transition: "transform 700ms cubic-bezier(0.32,0.72,0,1)" }}
      />
    </div>
  );
}

/** Jalons sous forme de segments proportionnels : versé, approuvé par la DAO, en attente. */
export function MilestoneTrack({ bps, approved, withdrawn, showCaption = true }: { bps: number[]; approved: number; withdrawn: number; showCaption?: boolean }) {
  return (
    <div>
      <div className="flex h-1.5 gap-1" aria-label={`${withdrawn} tranche(s) versée(s), ${approved} jalon(s) approuvé(s) sur ${bps.length}`}>
        {bps.map((b, i) => {
          const style = i < withdrawn ? { background: "var(--ok)" } : i < approved ? { background: "rgba(48,209,88,0.4)" } : undefined;
          return <div key={i} className={`rounded-full ${style ? "" : "track"}`} style={{ flexGrow: b, ...style }} title={`Jalon ${i + 1} : ${b / 100} %`} />;
        })}
      </div>
      {showCaption && (
        <p className="mt-2 text-xs text-[var(--text-2)]">
          {withdrawn} tranche{withdrawn > 1 ? "s" : ""} sur {bps.length} versée{withdrawn > 1 ? "s" : ""}, {approved} approuvée{approved > 1 ? "s" : ""} par la DAO
        </p>
      )}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-[var(--text-2)]" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      {label}
    </div>
  );
}

export function ErrorBox({ title = "Erreur", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="tone-danger rounded-2xl px-4 py-3 text-sm" role="alert">
      <p className="font-semibold">{title}</p>
      <div className="mt-0.5 text-[var(--text)]">{children}</div>
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
  return (
    <div className={`rounded-2xl px-4 py-2.5 text-sm ${status.kind === "success" ? "tone-ok" : "tone-info"}`} role="status">
      {text}
      {"hash" in status && (
        <span className="ml-2 font-mono text-xs opacity-80">
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
    <div className="rounded-[20px] border border-dashed border-[var(--line)] px-6 py-12 text-center">
      <p className="font-display text-lg">{title}</p>
      {children && <div className="mt-2 text-sm text-[var(--text-2)]">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <p className="font-display text-[clamp(2.4rem,5vw,3.75rem)] !font-extrabold !leading-none !tracking-[-0.04em]">{value}</p>
      <p className="mt-3 text-sm font-medium">{label}</p>
      {hint && <p className="text-[13px] text-[var(--text-2)]">{hint}</p>}
    </div>
  );
}
