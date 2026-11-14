"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Scène d'ouverture pilotée par le défilement : elle montre, en 4 temps, ce que fait CampusFund.
 * 1 les dons tombent dans le coffre, 2 chaque donateur reçoit ses voix, 3 le vote, 4 une tranche part.
 * Au chargement, les pièces apparaissent dans les mains des donateurs. Ensuite la position suit le
 * défilement (lissé par un ressort sans rebond) : on peut s'arrêter, revenir en arrière ou accélérer.
 * Avec « réduire les animations », la scène saute directement à l'état final de chaque étape.
 */

const OWNERS = [
  { name: "Toi", x: 110 },
  { name: "Sara", x: 260 },
  { name: "Yanis", x: 410 },
];
const CHIP_Y = 52;
const HAND_Y = 150; // les pièces attendent sous chaque donateur
// 10 pièces de 0,1 ETH : 4 dans la tranche 1, 3 dans la 2, 3 dans la 3
const SLOTS: [number, number][] = [
  [116, 322], [164, 322], [116, 370], [164, 370],
  [256, 322], [304, 322], [280, 370],
  [376, 322], [424, 322], [400, 370],
];
const COIN_OWNER = [0, 0, 1, 2, 0, 1, 2, 0, 1, 2]; // Toi 4 pièces, Sara 3, Yanis 3
const START: [number, number][] = COIN_OWNER.map((owner, i) => {
  const mine = COIN_OWNER.map((o, k) => (o === owner ? k : -1)).filter((k) => k >= 0);
  return [OWNERS[owner].x + (mine.indexOf(i) - (mine.length - 1) / 2) * 27, HAND_Y];
});
const CLUB = { x: 94, y: 588 };
// Une teinte par étape, reprise dans le reste de la page (voir globals.css)
const COLORS = [
  [35, 64, 255], // dons : bleu cobalt
  [35, 64, 255],
  [104, 58, 232], // voix : violet
  [226, 61, 80], // vote : corail
  [12, 140, 84], // déblocage : vert
];

const STEPS = [
  {
    title: "Tu donnes.",
    text: "Chaque don en ETH tombe dans un coffre : un contrat que personne ne peut ouvrir seul. L'objectif du club y est découpé en tranches.",
  },
  {
    title: "Tu reçois des voix.",
    text: "Pour 0,1 ETH donné, tu reçois 100 CFD. Ce sont tes voix : plus tu as contribué, plus ton avis pèse.",
  },
  {
    title: "Vous votez.",
    text: "Quand le club a avancé, il demande une tranche. Ceux qui ont donné votent. Il faut assez de participants, et plus de pour que de contre.",
  },
  {
    title: "Une tranche part.",
    text: "Le vote est passé : le contrat envoie la première tranche au club. Le reste demeure bloqué jusqu'au prochain vote. Si le projet déraille, la communauté peut tout geler et chacun récupère sa part.",
  },
];

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const backOut = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;
function bounceOut(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

export function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0); // 0 = accroche, 1 à 4 = étapes

  useEffect(() => {
    const section = sectionRef.current;
    const backdrop = backdropRef.current;
    const svg = svgRef.current;
    if (!section || !backdrop || !svg) return;
    const q = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!;
    const coins = q<SVGGElement>("[data-coin]");
    const tokens = q<SVGCircleElement>("[data-token]");
    const voices = q<SVGTextElement>("[data-voices]");
    const rings = q<SVGCircleElement>("[data-ring]");
    const votePanel = one<SVGGElement>("[data-vote]");
    const forBar = one<SVGRectElement>("[data-for]");
    const againstBar = one<SVGRectElement>("[data-against]");
    const forLabel = one<SVGTextElement>("[data-for-label]");
    const againstLabel = one<SVGTextElement>("[data-against-label]");
    const verdict = one<SVGGElement>("[data-verdict]");
    const gate = one<SVGPathElement>("[data-gate]");
    const floor = one<SVGLineElement>("[data-floor]");
    const lock = one<SVGTextElement>("[data-lock]");
    const lockIcon = one<SVGGElement>("[data-lock-icon]");
    const club = one<SVGGElement>("[data-club]");
    const clubLabel = one<SVGTextElement>("[data-club-label]");
    const rest = one<SVGTextElement>("[data-rest]");
    const vaultTotal = one<SVGTextElement>("[data-total]");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const born = performance.now();
    const INTRO_MS = 200 + 9 * 80 + 420;
    let current = -0.35;
    let target = -0.35;
    let velocity = 0;
    let frame = 0;
    let last = 0;
    let shownStep = -1;

    const render = (p: number, now: number) => {
      // Couleur de fond : une teinte par étape
      const x = clamp01((p + 1) / 5) * 5;
      const k = Math.min(4, Math.floor(x));
      const from = COLORS[Math.max(0, k - 1)];
      const to = COLORS[k];
      const t = easeOut(clamp01((x - k) / 0.3));
      backdrop.style.backgroundColor = `rgb(${from.map((c, i) => Math.round(lerp(c, to[i], t))).join(",")})`;

      // Entrée : les pièces apparaissent une à une sous les donateurs
      // 1. puis elles tombent vers leur tranche (rebond à l'arrivée)
      let received = 0;
      let landed = 0;
      coins.forEach((coin, i) => {
        const pop = reduce ? 1 : clamp01((now - born - 200 - i * 80) / 420);
        const fall = clamp01((p - i * 0.055) / 0.42);
        let cx = lerp(START[i][0], SLOTS[i][0], easeOut(fall));
        let cy = lerp(START[i][1], SLOTS[i][1], bounceOut(fall));
        if (fall >= 1) landed++;
        // 4. Les pièces de la tranche 1 sortent vers le club
        if (i < 4) {
          const out = clamp01((p - 3.2 - i * 0.07) / 0.38);
          cx = lerp(cx, CLUB.x + i * 11, easeOut(out));
          cy = lerp(cy, CLUB.y, out * out);
          if (out >= 1) received++;
        }
        coin.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${Math.max(0, backOut(pop)).toFixed(3)})`);
      });
      const total = `${((landed - received) / 10).toLocaleString("fr-FR")} ETH au coffre`;
      if (vaultTotal.textContent !== total) vaultTotal.textContent = total;

      // 2. Chaque pièce renvoie des voix (CFD) à son donateur
      const arrived = [0, 0, 0];
      tokens.forEach((token, i) => {
        const owner = OWNERS[COIN_OWNER[i]];
        const fly = clamp01((p - 1.08 - i * 0.06) / 0.38);
        if (fly >= 1) arrived[COIN_OWNER[i]]++;
        token.setAttribute("cx", lerp(SLOTS[i][0], owner.x, easeOut(fly)).toFixed(1));
        token.setAttribute("cy", lerp(SLOTS[i][1], CHIP_Y, easeOut(fly)).toFixed(1));
        token.setAttribute("opacity", fly > 0 && fly < 1 ? "1" : "0");
      });
      voices.forEach((v, i) => {
        const label = `${arrived[i] * 100} voix`;
        if (v.textContent !== label) v.textContent = label;
        v.setAttribute("opacity", p > 1 ? "1" : "0.55");
      });

      // 3. Le vote : Toi puis Sara votent pour, Yanis vote contre
      const v = p - 2;
      votePanel.setAttribute("opacity", clamp01((p - 1.9) / 0.15).toFixed(2));
      const forShare = 0.4 * easeOut(clamp01((v - 0.08) / 0.25)) + 0.3 * easeOut(clamp01((v - 0.36) / 0.25));
      const againstShare = 0.3 * easeOut(clamp01((v - 0.62) / 0.22));
      forBar.setAttribute("width", (400 * forShare).toFixed(1));
      againstBar.setAttribute("width", (400 * againstShare).toFixed(1));
      againstBar.setAttribute("x", (460 - 400 * againstShare).toFixed(1));
      forLabel.textContent = `Pour ${Math.round(forShare * 1000)}`;
      againstLabel.textContent = `Contre ${Math.round(againstShare * 1000)}`;
      [0.08, 0.36, 0.62].forEach((start, i) => rings[i].setAttribute("opacity", clamp01((v - start) / 0.1).toFixed(2)));
      verdict.setAttribute("opacity", clamp01((v - 0.86) / 0.1).toFixed(2));

      // 4. La tranche 1 s'ouvre, le club reçoit, le reste reste bloqué
      const r = p - 3;
      gate.setAttribute("opacity", (0.3 * clamp01(r / 0.2)).toFixed(2));
      floor.setAttribute("opacity", (1 - clamp01((r - 0.1) / 0.15)).toFixed(2));
      const lockLabel = r > 0.2 ? "Débloquée" : "Bloquée";
      if (lock.textContent !== lockLabel) lock.textContent = lockLabel;
      lockIcon.setAttribute("opacity", r > 0.2 ? "0" : "1");
      club.setAttribute("opacity", clamp01((p - 2.95) / 0.15).toFixed(2));
      const clubText = received > 0 ? `a reçu ${(received / 10).toLocaleString("fr-FR")} ETH` : "attend sa tranche";
      if (clubLabel.textContent !== clubText) clubLabel.textContent = clubText;
      rest.setAttribute("opacity", clamp01((r - 0.8) / 0.15).toFixed(2));

      const nextStep = p < -0.05 ? 0 : Math.min(4, Math.floor(p) + 1);
      if (nextStep !== shownStep) {
        shownStep = nextStep;
        setStep(nextStep);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      // Ressort amorti critique : suit le défilement sans à-coup ni rebond
      velocity += (-630 * (current - target) - 50 * velocity) * dt;
      current += velocity * dt;
      render(current, now);
      const settled = Math.abs(current - target) + Math.abs(velocity) < 0.0015 && now - born > INTRO_MS;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const progress = span > 0 ? clamp01(-rect.top / span) : 0;
      target = -0.35 + progress * 4.45;
      if (reduce) {
        current = target < 0 ? -0.35 : Math.min(4.1, Math.floor(target) + 0.999);
        render(current, performance.now());
        return;
      }
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    render(current, born);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[520vh]" aria-label="Comment fonctionne CampusFund">
      <div className="sticky top-0 grid h-screen grid-rows-[auto_minmax(0,1fr)] items-start gap-4 pb-4 pt-44 md:grid-cols-[1.2fr_1fr] md:grid-rows-1 md:items-center md:gap-10 md:pb-6 md:pt-20">
        {/* Fond coloré sur toute la largeur de la fenêtre */}
        <div ref={backdropRef} aria-hidden className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 rounded-b-[44px]" style={{ backgroundColor: "rgb(35,64,255)" }} />

        {/* Texte : un panneau par étape, superposés */}
        <div className="relative order-2 h-full md:order-1 md:h-auto md:min-h-[29rem]">
          <Panel active={step === 0}>
            <h1 className="display-xl">
              Ton argent reste au coffre.
              <span className="block text-white/55">Jusqu&apos;au vote.</span>
            </h1>
            <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-white/85 md:mt-6 md:text-lg">
              CampusFund finance les projets des clubs étudiants. Personne ne touche aux fonds sans l&apos;accord de ceux qui
              ont donné.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-8">
              <a href="#campagnes" className="btn-primary" tabIndex={step === 0 ? 0 : -1}>
                Explorer les campagnes
              </a>
              <Link href="/creator" className="btn-on-color" tabIndex={step === 0 ? 0 : -1}>
                Lancer une campagne
              </Link>
            </div>
            <p className="mt-7 hidden items-center gap-2 text-sm text-white/80 md:flex">
              <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden className="scroll-cue">
                <path d="M7 1v14M2 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Fais défiler pour voir comment ça marche
            </p>
          </Panel>
          {STEPS.map((s, i) => (
            <Panel key={s.title} active={step === i + 1}>
              <p className="text-sm font-semibold text-white/80">Étape {i + 1} sur 4</p>
              <h2 className="display-xl mt-3">{s.title}</h2>
              <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-white/85 md:mt-6 md:text-lg">{s.text}</p>
            </Panel>
          ))}
          <div className="absolute bottom-0 left-0 flex gap-1.5 transition-opacity duration-300" style={{ opacity: step === 0 ? 0 : 1 }} aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.title} className="h-1.5 rounded-full bg-white transition-all duration-300" style={{ width: step === i + 1 ? 36 : 12, opacity: step >= i + 1 ? 1 : 0.3 }} />
            ))}
          </div>
        </div>

        {/* Scène */}
        <svg ref={svgRef} viewBox="0 0 520 640" role="img" aria-label="Animation : les dons entrent dans un coffre, les donateurs reçoivent des voix, votent, puis une tranche est versée au club." className="order-1 mx-auto h-full max-h-[34vh] w-full md:order-2 md:max-h-[min(84vh,720px)]">
          {/* Donateurs */}
          {OWNERS.map((o, i) => (
            <g key={o.name}>
              <circle data-ring cx={o.x} cy={CHIP_Y} r="34" fill="none" stroke={i === 2 ? "#2a0a12" : "#fff"} strokeWidth="4" opacity="0" />
              <circle cx={o.x} cy={CHIP_Y} r="27" fill="#fff" />
              <text x={o.x} y={CHIP_Y + 5.5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111">
                {o.name}
              </text>
              <text data-voices x={o.x} y={CHIP_Y + 56} textAnchor="middle" fontSize="15" fontWeight="600" fill="#fff" opacity="0.55">
                0 voix
              </text>
            </g>
          ))}

          {/* Vote */}
          <g data-vote opacity="0">
            <text data-for-label x="60" y="172" fontSize="15" fontWeight="700" fill="#fff">
              Pour 0
            </text>
            <text data-against-label x="460" y="172" textAnchor="end" fontSize="15" fontWeight="700" fill="#fff">
              Contre 0
            </text>
            <rect x="60" y="182" width="400" height="16" rx="8" fill="rgba(255,255,255,0.25)" />
            <rect data-for x="60" y="182" width="0" height="16" rx="8" fill="#fff" />
            <rect data-against x="460" y="182" width="0" height="16" rx="8" fill="#2a0a12" />
            <g data-verdict opacity="0">
              <rect x="166" y="208" width="188" height="32" rx="16" fill="#fff" />
              <text x="260" y="229.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#111">
                Tranche 1 accordée
              </text>
            </g>
          </g>

          {/* Coffre : 3 tranches (40 %, 30 %, 30 %) */}
          <rect x="60" y="270" width="400" height="150" rx="24" fill="rgba(255,255,255,0.12)" />
          <path data-gate d="M84 270H220V420H84a24 24 0 0 1-24-24V294a24 24 0 0 1 24-24Z" fill="#fff" opacity="0" />
          <path d="M84 270H436a24 24 0 0 1 24 24V396a24 24 0 0 1-24 24H220M60 396V294a24 24 0 0 1 24-24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <line data-floor x1="84" y1="420" x2="220" y2="420" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 396a24 24 0 0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <line x1="220" y1="272" x2="220" y2="418" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeDasharray="5 7" />
          <line x1="340" y1="272" x2="340" y2="418" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeDasharray="5 7" />
          {[
            ["Tranche 1", 140],
            ["Tranche 2", 280],
            ["Tranche 3", 400],
          ].map(([label, cx]) => (
            <text key={label} x={cx} y="258" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">
              {label}
            </text>
          ))}
          {[140, 280, 400].map((cx, i) => (
            <g key={cx}>
              <g {...(i === 0 ? { "data-lock-icon": "" } : {})} transform={`translate(${cx - 42} 434)`} fill="none" stroke="#fff" strokeWidth="2">
                <rect x="0" y="5" width="12" height="9" rx="2" fill="#fff" />
                <path d="M2.5 5V3.2a3.5 3.5 0 0 1 7 0V5" />
              </g>
              <text {...(i === 0 ? { "data-lock": "" } : {})} x={cx + 6} y="446" textAnchor="middle" fontSize="14" fontWeight="600" fill="#fff">
                Bloquée
              </text>
            </g>
          ))}
          <text data-total x="260" y="508" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            0 ETH au coffre
          </text>

          {/* Club */}
          <g data-club opacity="0">
            <rect x="60" y="556" width="300" height="64" rx="32" fill="#fff" />
            <text x="168" y="583" fontSize="16" fontWeight="700" fill="#111">
              Club Robotique
            </text>
            <text data-club-label x="168" y="604" fontSize="14" fill="#333">
              attend sa tranche
            </text>
          </g>
          <text data-rest x="460" y="594" textAnchor="end" fontSize="14" fontWeight="600" fill="#fff" opacity="0">
            Le reste attend
          </text>

          {/* Voix (CFD) puis pièces, dessinées en dernier pour passer au-dessus */}
          {SLOTS.map((_, i) => (
            <circle key={i} data-token r="7.5" fill="#fff" opacity="0" />
          ))}
          {SLOTS.map((_, i) => (
            <g key={i} data-coin transform="scale(0)">
              <circle cy="2.5" r="20" fill="#c98f00" />
              <circle r="20" fill="#ffd43b" />
              <circle r="15.5" fill="none" stroke="#e0ac00" strokeWidth="1.5" />
              {/* Losange d'Ethereum */}
              <path d="M0-11 6.5.4 0 4.2-6.5.4Z" fill="#6b4e00" />
              <path d="M-6.5 2.6 0 6.4 6.5 2.6 0 11.5Z" fill="#6b4e00" opacity="0.75" />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!active}
      className="absolute inset-x-0 top-0"
      style={{
        opacity: active ? 1 : 0,
        transform: `translateY(${active ? 0 : 14}px)`,
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 320ms ease, transform 420ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {children}
    </div>
  );
}
