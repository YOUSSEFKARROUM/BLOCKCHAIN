/** Seuils du score de risque (scripts/anomaly_detection.py) : Faible < 35 ≤ Moyen < 50 ≤ Élevé. */
export const RISK_THRESHOLDS = { medium: 35, high: 50 } as const;

export const RISK_COLORS = { Faible: "#4CD964", Moyen: "#FFB800", Élevé: "#FF6A3D" } as const;

interface RiskScaleProps {
  /** Score 0–100 à pointer sur l'échelle (curseur triangulaire). */
  score?: number;
  variant?: "large" | "compact";
}

/** Échelle 0 · 35 · 50 · 100 du scanner, avec curseur optionnel. */
export function RiskScale({ score, variant = "compact" }: RiskScaleProps) {
  const isLarge = variant === "large";
  const height = isLarge ? 64 : 24;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative" style={{ paddingTop: score === undefined ? 0 : 20 }}>
        {score !== undefined && (
          <div
            aria-hidden="true"
            className="absolute top-0 h-0 w-0"
            style={{
              left: `${Math.min(100, Math.max(0, score))}%`,
              transform: "translateX(-50%)",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "12px solid var(--ticket)",
            }}
          />
        )}
        <div className="mono flex gap-1 text-[14px] font-bold tracking-[.08em] text-night" style={{ height }} aria-hidden={!isLarge}>
          <div className="flex items-center pl-3.5" style={{ flex: "35 1 0", background: RISK_COLORS.Faible, borderRadius: "6px 2px 2px 6px" }}>
            {isLarge && "FAIBLE"}
          </div>
          <div className="flex items-center justify-center" style={{ flex: "15 1 0", background: RISK_COLORS.Moyen, borderRadius: 2 }}>
            {isLarge && "MOYEN"}
          </div>
          <div className="flex items-center justify-end pr-3.5" style={{ flex: "50 1 0", background: RISK_COLORS.Élevé, borderRadius: "2px 6px 6px 2px" }}>
            {isLarge && "ÉLEVÉ"}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mono relative h-5 text-[12px] text-gray">
        <span className="absolute left-0">0</span>
        <span className="absolute left-[35%] -translate-x-1/2">35</span>
        <span className="absolute left-1/2 -translate-x-1/2">50</span>
        <span className="absolute right-0">100</span>
      </div>
    </div>
  );
}
