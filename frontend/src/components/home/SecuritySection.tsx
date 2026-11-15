/** Chiffres de la campagne de tests et d'audit (docs/tests, docs/coverage, docs/audit). */
const STATS = [
  { value: "145", strong: "tests Foundry", rest: "unitaires, attaques, fuzz, invariants", isAccent: true },
  { value: "100%", strong: "des lignes couvertes", rest: "sur les 4 contrats" },
  { value: "8", strong: "tests de fuzz", rest: "1000 exécutions chacun" },
  { value: "5", strong: "invariants", rest: "256 séquences chacun, avec un Handler" },
];

const THREATS = [
  {
    kind: "Menace type The DAO",
    title: "Réentrance",
    text: "Le coffre vulnérable est vidé. CampusFund résiste.",
    lost: "VulnerableVault : vidé",
    held: "SecureVault : intact",
  },
  {
    kind: "Menace type Beanstalk",
    title: "Flash loan de gouvernance",
    text: "Les CFD empruntés ne pèsent rien : le vote lit le bloc précédent.",
    lost: "NaiveGovernance : prise",
    held: "block.number − 1 : tient",
  },
];

const NOTES = [
  { title: "Multisig 2 sur 3", text: "Deux signatures au-delà de 1 ETH par jour." },
  { title: "Aucun admin", text: "Personne ne débloque de fonds sans vote." },
  { title: "Audit Slither", text: "Tous les findings traités." },
];

const AUTO_GRID = (min: number) => ({ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` });

export function SecuritySection() {
  return (
    <section id="securite" aria-labelledby="securite-title" className="wrap flex flex-col gap-14 pb-[72px] pt-28">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 id="securite-title" className="display display-xl">
          Contrôle
          <br />
          <span className="text-amber">de sécurité.</span>
        </h2>
        <span className="tag" style={{ letterSpacing: ".1em" }}>
          Solidity 0.8.24 · Foundry · OpenZeppelin v5.4
        </span>
      </div>

      <div className="grid gap-3.5" style={AUTO_GRID(250)}>
        {STATS.map((s) => (
          <div key={s.strong} className="db-tile flex flex-col gap-[22px] rounded-[10px] px-[26px] py-[30px]">
            <span className={`mono font-bold leading-none ${s.isAccent ? "text-amber" : ""}`} style={{ fontSize: "clamp(56px, 6vw, 84px)" }}>
              {s.value}
            </span>
            <span className="text-[16px] text-soft">
              <strong className="text-ticket">{s.strong}</strong>
              <br />
              {s.rest}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5" style={AUTO_GRID(420)}>
        {THREATS.map((t) => (
          <article key={t.title} className="panel flex flex-col gap-4 p-8">
            <div className="tag-b flex flex-wrap justify-between gap-2.5">
              <span className="text-gray">{t.kind}</span>
              <span className="text-ok">Interceptée</span>
            </div>
            <h3 className="display m-0" style={{ fontSize: "clamp(32px, 4vw, 44px)", fontStretch: "72%", lineHeight: 0.95 }}>
              {t.title}
            </h3>
            <p className="m-0 text-[16px] text-soft">{t.text}</p>
            <div className="mono mt-auto flex flex-wrap gap-2 text-[12px] font-bold uppercase tracking-[.06em]">
              <span className="rounded px-3 py-2" style={{ background: "#3A1408", color: "#FF9B7A" }}>
                {t.lost}
              </span>
              <span className="rounded px-3 py-2" style={{ background: "#0F2E17", color: "#6BE584" }}>
                {t.held}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-8" style={AUTO_GRID(280)}>
        {NOTES.map((n) => (
          <div key={n.title} className="border-t-2 border-amber pt-[18px]">
            <h3 className="display m-0 mb-2 text-[22px]" style={{ fontWeight: 800, fontStretch: "85%", lineHeight: 1.1 }}>
              {n.title}
            </h3>
            <p className="m-0 text-[15px] text-[#C9C7C0]">{n.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
