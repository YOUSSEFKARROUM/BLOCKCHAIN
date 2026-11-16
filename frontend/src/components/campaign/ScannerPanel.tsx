import { FlipNote } from "@/components/board/FlipNote";
import { RISK_COLORS, RiskScale } from "@/components/board/RiskScale";
import type { RiskEntry } from "@/lib/hooks";

/** Part d'un détecteur dans le score : une barre de 0 à 100. */
function DetectorBar({ label, score }: { label: string; score: number }) {
  const value = Math.round(score);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[14px]">
        <span className="text-soft">{label}</span>
        <span className="mono font-bold">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#2A2A2E]" aria-hidden="true">
        <div className="db-bar h-full bg-ticket" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

/** Score de risque IA de la campagne (scripts/anomaly_detection.py). Le mode de calcul est au verso. */
export function ScannerPanel({ risk, thresholdCfd }: { risk: RiskEntry | undefined; thresholdCfd: number }) {
  const color = risk ? RISK_COLORS[risk.level] : "var(--gray)";
  const back = risk
    ? `Score = 60 % de règles lisibles + 40 % d'Isolation Forest, calculé hors chaîne par scripts/anomaly_detection.py. C'est un signal, pas une preuve : geler une campagne reste une décision de la DAO, proposée par tout détenteur d'au moins ${thresholdCfd} CFD.`
    : "Lancez scripts/anomaly_detection.py pour calculer le score de cette campagne.";
  return (
    <section aria-label="Scanner IA : score de risque">
      <FlipNote label="Scanner IA · Score de risque" back={back} variant="fade" className="panel">
        {risk ? (
          <div className="grid items-center gap-x-8 gap-y-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="db-tile mono rounded-lg px-[18px] py-1.5 font-bold leading-[1.05]" style={{ color, fontSize: "clamp(64px, 18vw, 96px)" }}>
                {Math.round(risk.score)}
              </span>
              <span className="display text-[36px]" style={{ fontStretch: "72%", lineHeight: 1, overflowWrap: "normal" }}>
                {risk.level}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <RiskScale score={risk.score} />
              <DetectorBar label="Règles" score={risk.rulesScore} />
              <DetectorBar label="Isolation Forest" score={risk.forestScore} />
            </div>
            {risk.reasons.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0" style={{ gridColumn: "1 / -1" }}>
                {risk.reasons.map((reason) => (
                  <li key={reason} className="rounded-[4px] border px-2.5 py-1.5 text-[13px] font-medium" style={{ borderColor: color, color: "var(--ticket)" }}>
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mono m-0 text-[18px] font-bold text-gray">SCORE NON CALCULÉ</p>
        )}
      </FlipNote>
    </section>
  );
}
