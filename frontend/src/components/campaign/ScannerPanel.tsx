import { RISK_COLORS, RiskScale } from "@/components/board/RiskScale";
import type { RiskEntry } from "@/lib/hooks";

/** Score de risque IA de la campagne (scripts/anomaly_detection.py), placé sur l'échelle 0-35-50-100. */
export function ScannerPanel({ risk, thresholdCfd }: { risk: RiskEntry | undefined; thresholdCfd: number }) {
  const color = risk ? RISK_COLORS[risk.level] : "var(--gray)";
  return (
    <section
      aria-labelledby="scanner-title"
      className="panel grid items-center gap-8"
      style={{ padding: "clamp(22px, 3vw, 36px)", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}
    >
      <div className="flex flex-col gap-2.5">
        <h2 id="scanner-title" className="tag m-0">
          Scanner IA · Score de risque
        </h2>
        {risk ? (
          <div className="flex items-center gap-4">
            <span className="db-tile mono rounded-lg px-[18px] py-1.5 text-[96px] font-bold leading-[1.05]" style={{ color }}>
              {Math.round(risk.score)}
            </span>
            <span className="display text-[36px]" style={{ fontStretch: "72%", lineHeight: 1 }}>
              {risk.level}
            </span>
          </div>
        ) : (
          <p className="mono m-0 text-[18px] font-bold text-gray">SCORE NON CALCULÉ</p>
        )}
        <span className="text-[14px] text-[#C9C7C0]">
          {risk
            ? `${Math.round(risk.rulesScore)} aux règles (60 %), ${Math.round(risk.forestScore)} à l'Isolation Forest (40 %), calculé hors chaîne.`
            : "Lancez scripts/anomaly_detection.py pour calculer le score de cette campagne."}
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        <RiskScale score={risk?.score} />
        {risk && risk.reasons.length > 0 && (
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[15px] text-ticket">
            {risk.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <p className="m-0 text-[15px] text-soft">
          Le score est un signal. Geler une campagne reste une décision de la DAO, proposée par tout détenteur d&apos;au moins {thresholdCfd} CFD.
        </p>
      </div>
    </section>
  );
}
