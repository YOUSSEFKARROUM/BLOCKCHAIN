import { RiskScale } from "@/components/board/RiskScale";

const SIGNALS = ["Montants répétés", "Adresses liées", "Adresses neuves", "Pic de contributions", "Concentration"];

/** Section « Scanner » : le score de risque IA et ses performances mesurées. */
export function ScannerSection() {
  return (
    <section
      id="ia"
      aria-labelledby="ia-title"
      className="wrap grid items-center gap-14 py-[72px]"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(480px, 100%), 1fr))" }}
    >
      <div className="flex flex-col gap-[22px]">
        <h2 id="ia-title" className="display display-l">
          Le scanner signale.
          <br />
          <span className="text-amber">La DAO décide.</span>
        </h2>
        <p className="m-0 max-w-[540px] text-soft">
          Scanner = score de risque IA. Un script lit les contributions sur la chaîne et calcule 6 indicateurs par campagne. Le score final
          mêle 60 % de règles et 40 % d&apos;Isolation Forest. Il n&apos;a aucun pouvoir : geler une campagne reste un vote.
        </p>
        <ul className="mono m-0 flex list-none flex-wrap gap-1.5 p-0 text-[12px] uppercase tracking-[.08em]">
          {SIGNALS.map((s) => (
            <li key={s} className="rounded bg-tile-2 px-3 py-2">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="panel flex flex-col gap-[26px]" style={{ padding: "clamp(22px, 3vw, 36px)" }}>
        <RiskScale variant="large" />
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))" }}>
          <div className="db-tile rounded-lg p-[22px]">
            <div className="mono text-[56px] font-bold leading-none text-amber">1,0</div>
            <div className="mt-4 text-[14px] text-soft">de précision</div>
          </div>
          <div className="db-tile rounded-lg p-[22px]">
            <div className="mono text-[56px] font-bold leading-none text-amber">0,87</div>
            <div className="mt-4 text-[14px] text-soft">de rappel</div>
          </div>
        </div>
        <p className="tag m-0" style={{ letterSpacing: ".06em" }}>
          Mesuré sur le jeu de démonstration : 300 campagnes normales et 30 fraudes.
        </p>
      </div>
    </section>
  );
}
