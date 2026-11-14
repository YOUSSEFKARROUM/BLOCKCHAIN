"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Scène d'ouverture pilotée par le défilement : elle montre, en 4 temps, ce que fait CampusFund.
 * 1 les dons tombent dans le coffre, 2 chaque donateur reçoit ses voix, 3 le vote, 4 une tranche part.
 * La position suit le défilement (avec un ressort sans rebond pour lisser), donc on peut s'arrêter,
 * revenir en arrière ou accélérer à tout moment. Avec « réduire les animations », la scène saute
 * directement à l'état final de chaque étape.
 */

const OWNERS = [
  { name: "Toi", x: 110 },
  { name: "Sara", x: 260 },
  { name: "Yanis", x: 410 },
];
const CHIP_Y = 52;
// 10 pièces de 0,1 ETH : 4 dans la tranche 1, 3 dans la 2, 3 dans la 3
const SLOTS: [number, number][] = [
  [116, 322], [164, 322], [116, 370], [164, 370],
  [256, 322], [304, 322], [280, 370],
  [376, 322], [424, 322], [400, 370],
];
const COIN_OWNER = [0, 0, 1, 2, 0, 1, 2, 0, 1, 2]; // Toi 4 pièces, Sara 3, Yanis 3
const CLUB = { x: 92, y: 588 };
const COLORS = [
  [35, 64, 255], // dons : bleu cobalt
  [35, 64, 255],
  [98, 54, 224], // voix : violet
  [226, 61, 80], // vote : corail
  [14, 148, 88], // déblocage : vert
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0); // 0 = accroche, 1 à 4 = étapes

  useEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;
    const q = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!;
    const stage = one<SVGRectElement>("[data-stage]");
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
    const club = one<SVGGElement>("[data-club]");
    const clubLabel = one<SVGTextElement>("[data-club-label]");
    const rest = one<SVGTextElement>("[data-rest]");
    const vaultTotal = one<SVGTextElement>("[data-total]");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = -0.35;
    let target = -0.35;
    let velocity = 0;
    let frame = 0;
    let last = 0;
    let shownStep = -1;

    const render = (p: number) => {
      // Couleur de la scène : une teinte par étape
      const x = clamp01((p + 1) / 5) * 5;
      const k = Math.min(4, Math.floor(x));
      const from = COLORS[Math.max(0, k - 1)];
      const to = COLORS[k];
      const t = easeOut(clamp01((x - k) / 0.3));
      stage.setAttribute("fill", `rgb(${from.map((c, i) => Math.round(lerp(c, to[i], t))).join(",")})`);

      // 1. Les pièces tombent du donateur vers leur tranche (rebond à l'arrivée)
      let received = 0;
      let landed = 0;
      coins.forEach((coin, i) => {
        const owner = OWNERS[COIN_OWNER[i]];
        const fall = clamp01((p - i * 0.055) / 0.42);
        let cx = lerp(owner.x, SLOTS[i][0], easeOut(fall));
        let cy = lerp(CHIP_Y, SLOTS[i][1], bounceOut(fall));
        if (fall >= 1) landed++;
        // 4. Les pièces de la tranche 1 sortent vers le club
        if (i < 4) {
          const out = clamp01((p - 3.2 - i * 0.07) / 0.38);
          cx = lerp(cx, CLUB.x + i * 11, easeOut(out));
          cy = lerp(cy, CLUB.y, out * out);
          if (out >= 1) received++;
        }
        coin.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${Math.min(1, fall * 6).toFixed(3)})`);
      });

      const total = `Au coffre : ${((landed - received) / 10).toLocaleString("fr-FR")} ETH`;
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
        v.setAttribute("opacity", p > 1 ? "1" : "0.45");
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
      gate.setAttribute("opacity", (0.22 * clamp01(r / 0.2)).toFixed(2));
      floor.setAttribute("opacity", (1 - clamp01((r - 0.1) / 0.15)).toFixed(2));
      const lockLabel = r > 0.2 ? "Débloquée" : "Bloquée";
      if (lock.textContent !== lockLabel) lock.textContent = lockLabel;
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
      render(current);
      frame = Math.abs(current - target) + Math.abs(velocity) < 0.0015 ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const progress = span > 0 ? clamp01(-rect.top / span) : 0;
      target = -0.35 + progress * 4.45;
      if (reduce) {
        current = target < 0 ? -0.35 : Math.min(4.1, Math.floor(target) + 0.999);
        render(current);
        return;
      }
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    render(current);
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
      <div className="sticky top-0 grid h-screen grid-rows-[auto_minmax(0,1fr)] items-start gap-4 pb-4 pt-44 md:grid-cols-[1fr_1.05fr] md:grid-rows-1 md:items-center md:gap-12 md:pb-6 md:pt-20">
        {/* Texte : un panneau par étape, superposés */}
        <div className="relative order-2 h-full md:order-1 md:h-auto md:min-h-[29rem]">
          <Panel active={step === 0}>
            <h1 className="display-xl">
              Ton argent reste au coffre.
              <span className="block text-[var(--text-3)]">Jusqu&apos;au vote.</span>
            </h1>
            <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-[var(--text-2)] md:mt-5 md:text-[17px]">
              CampusFund finance les projets des clubs étudiants. Personne ne touche aux fonds sans l&apos;accord de ceux qui
              ont donné.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-7">
              <a href="#campagnes" className="btn-primary" tabIndex={step === 0 ? 0 : -1}>
                Explorer les campagnes
              </a>
              <Link href="/creator" className="btn-ghost" tabIndex={step === 0 ? 0 : -1}>
                Lancer une campagne
              </Link>
            </div>
            <p className="mt-8 hidden items-center gap-2 text-sm text-[var(--text-2)] md:flex">
              <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden className="scroll-cue">
                <path d="M7 1v14M2 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Fais défiler pour voir comment ça marche
            </p>
          </Panel>
          {STEPS.map((s, i) => (
            <Panel key={s.title} active={step === i + 1}>
              <p className="text-sm font-medium text-[var(--text-2)]">Étape {i + 1} sur 4</p>
              <h2 className="display-xl mt-3">{s.title}</h2>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-[var(--text-2)] md:mt-5 md:text-[17px]">{s.text}</p>
            </Panel>
          ))}
          <div className="absolute bottom-0 left-0 flex gap-1.5 transition-opacity duration-300" style={{ opacity: step === 0 ? 0 : 1 }} aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.title} className="h-1 rounded-full bg-white transition-all duration-300" style={{ width: step === i + 1 ? 28 : 10, opacity: step >= i + 1 ? 1 : 0.25 }} />
            ))}
          </div>
        </div>

        {/* Scène */}
        <svg ref={svgRef} viewBox="0 0 520 640" role="img" aria-label="Animation : les dons entrent dans un coffre, les donateurs reçoivent des voix, votent, puis une tranche est versée au club." className="order-1 mx-auto h-full max-h-[34vh] w-full md:order-2 md:max-h-[min(80vh,680px)]">
          <rect data-stage width="520" height="640" rx="36" fill="rgb(35,64,255)" />

          {/* Donateurs */}
          {OWNERS.map((o, i) => (
            <g key={o.name}>
              <circle data-ring cx={o.x} cy={CHIP_Y} r="33" fill="none" stroke={i === 2 ? "#ffd0d0" : "#d4ffe0"} strokeWidth="3" opacity="0" />
              <circle cx={o.x} cy={CHIP_Y} r="26" fill="rgba(255,255,255,0.2)" />
              <text x={o.x} y={CHIP_Y + 5} textAnchor="middle" fontSize="15" fontWeight="600" fill="#fff">
                {o.name}
              </text>
              <text data-voices x={o.x} y={CHIP_Y + 54} textAnchor="middle" fontSize="14" fill="#fff" opacity="0.45">
                0 voix
              </text>
            </g>
          ))}

          {/* Vote */}
          <g data-vote opacity="0">
            <text data-for-label x="60" y="170" fontSize="14" fontWeight="600" fill="#fff">
              Pour 0
            </text>
            <text data-against-label x="460" y="170" textAnchor="end" fontSize="14" fontWeight="600" fill="#fff">
              Contre 0
            </text>
            <rect x="60" y="180" width="400" height="14" rx="7" fill="rgba(255,255,255,0.22)" />
            <rect data-for x="60" y="180" width="0" height="14" rx="7" fill="#fff" />
            <rect data-against x="460" y="180" width="0" height="14" rx="7" fill="rgba(20,10,20,0.55)" />
            <g data-verdict opacity="0">
              <rect x="176" y="204" width="168" height="30" rx="15" fill="#fff" />
              <text x="260" y="224" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111">
                Tranche 1 accordée
              </text>
            </g>
          </g>

          {/* Coffre : 3 tranches (40 %, 30 %, 30 %) */}
          <path data-gate d="M84 270H220V420H84a24 24 0 0 1-24-24V294a24 24 0 0 1 24-24Z" fill="#fff" opacity="0" />
          <path d="M84 270H436a24 24 0 0 1 24 24V396a24 24 0 0 1-24 24H220M60 396V294a24 24 0 0 1 24-24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line data-floor x1="84" y1="420" x2="220" y2="420" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 396a24 24 0 0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="220" y1="270" x2="220" y2="420" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5 6" />
          <line x1="340" y1="270" x2="340" y2="420" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5 6" />
          {[
            ["Tranche 1", 140],
            ["Tranche 2", 280],
            ["Tranche 3", 400],
          ].map(([label, cx]) => (
            <text key={label} x={cx} y="258" textAnchor="middle" fontSize="14" fontWeight="600" fill="#fff">
              {label}
            </text>
          ))}
          <text data-lock x="140" y="446" textAnchor="middle" fontSize="13" fill="#fff">
            Bloquée
          </text>
          <text x="280" y="446" textAnchor="middle" fontSize="13" fill="#fff" opacity="0.8">
            Bloquée
          </text>
          <text x="400" y="446" textAnchor="middle" fontSize="13" fill="#fff" opacity="0.8">
            Bloquée
          </text>

          {/* Club */}
          <g data-club opacity="0">
            <rect x="60" y="558" width="290" height="60" rx="30" fill="rgba(255,255,255,0.2)" />
            <text x="164" y="583" fontSize="15" fontWeight="600" fill="#fff">
              Club Robotique
            </text>
            <text data-club-label x="164" y="603" fontSize="13" fill="#fff">
              attend sa tranche
            </text>
          </g>
          <text data-rest x="460" y="593" textAnchor="end" fontSize="13" fill="#fff" opacity="0">
            Le reste attend
          </text>
          <text data-total x="260" y="500" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">
            Au coffre : 0 ETH
          </text>

          {/* Voix (CFD) puis pièces, dessinées en dernier pour passer au-dessus */}
          {SLOTS.map((_, i) => (
            <circle key={i} data-token r="7" fill="#fff" opacity="0" />
          ))}
          {SLOTS.map((_, i) => (
            <g key={i} data-coin transform="scale(0)">
              <circle r="19" fill="#ffd43b" />
              <circle r="12.5" fill="none" stroke="#b98900" strokeWidth="2" />
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
