"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tuile « Comment ça marche » : une animation de 4 étapes qui se joue toute seule, en boucle.
 * L'argent va de gauche à droite : donateurs, coffre, club. On peut mettre en pause ou aller
 * directement à une étape. Avec « réduire les animations », rien ne joue tout seul : chaque étape
 * s'affiche directement dans son état final.
 */

const STEPS = [
  { tab: "Donner", caption: "Chacun donne. L'argent va dans un coffre, découpé en tranches." },
  { tab: "Voix", caption: "Chaque don donne des voix : 100 voix pour 0,1 ETH." },
  { tab: "Vote", caption: "Le club demande une tranche. Ceux qui ont donné votent." },
  { tab: "Déblocage", caption: "Vote gagné : la tranche 1 part au club. Le reste demeure bloqué." },
];
const STEP_MS = 3600; // durée d'une étape
const MOVE_MS = 2300; // dont le mouvement ; le reste est une pause pour lire
const FADE_MS = 350;

const OWNERS = [
  { name: "Toi", y: 86 },
  { name: "Sara", y: 186 },
  { name: "Yanis", y: 286 },
];
const OWNER_X = 64;
// 10 pièces de 0,1 ETH : 4 dans la tranche 1, 3 dans la 2, 3 dans la 3
const SLOTS: [number, number][] = [
  [318, 114], [360, 114], [402, 114], [444, 114],
  [339, 204], [381, 204], [423, 204],
  [339, 285], [381, 285], [423, 285],
];
const COIN_OWNER = [0, 0, 1, 2, 0, 1, 2, 0, 1, 2]; // Toi 4 pièces, Sara 3, Yanis 3
const START: [number, number][] = COIN_OWNER.map((owner, i) => {
  const mine = COIN_OWNER.map((o, k) => (o === owner ? k : -1)).filter((k) => k >= 0);
  return [112 + mine.indexOf(i) * 21, OWNERS[owner].y];
});
const CLUB = { x: 580, y: 104 };

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

export function HowItWorks() {
  const svgRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const clock = useRef({ elapsed: 0, playing: true });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
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
    const gate = one<SVGPathElement>("[data-gate]");
    const wall = one<SVGLineElement>("[data-wall]");
    const lock = one<SVGTextElement>("[data-lock]");
    const club = one<SVGGElement>("[data-club]");
    const clubLabel = one<SVGTextElement>("[data-club-label]");
    const vaultTotal = one<SVGTextElement>("[data-total]");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      clock.current.playing = false;
      setPlaying(false);
    }
    let frame = 0;
    let last = performance.now();
    let shown = -1;

    const render = (p: number) => {
      // 1. Les pièces vont du donateur vers leur tranche
      let received = 0;
      let landed = 0;
      coins.forEach((coin, i) => {
        const fall = clamp01((p - i * 0.05) / 0.45);
        let cx = lerp(START[i][0], SLOTS[i][0], bounceOut(fall));
        let cy = lerp(START[i][1], SLOTS[i][1], easeOut(fall));
        if (fall >= 1) landed++;
        // 4. Celles de la tranche 1 sortent vers le club
        if (i < 4) {
          const out = clamp01((p - 3.15 - i * 0.07) / 0.4);
          cx = lerp(cx, CLUB.x - 24 + i * 16, easeOut(out));
          cy = lerp(cy, CLUB.y + 76, easeOut(out));
          if (out >= 1) received++;
        }
        coin.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
      });
      const total = `${((landed - received) / 10).toLocaleString("fr-FR")} ETH au coffre`;
      if (vaultTotal.textContent !== total) vaultTotal.textContent = total;

      // 2. Chaque pièce renvoie des voix à son donateur
      const arrived = [0, 0, 0];
      tokens.forEach((token, i) => {
        const fly = clamp01((p - 1.05 - i * 0.055) / 0.4);
        if (fly >= 1) arrived[COIN_OWNER[i]]++;
        token.setAttribute("cx", lerp(SLOTS[i][0], OWNER_X, easeOut(fly)).toFixed(1));
        token.setAttribute("cy", lerp(SLOTS[i][1], OWNERS[COIN_OWNER[i]].y, easeOut(fly)).toFixed(1));
        token.setAttribute("opacity", fly > 0 && fly < 1 ? "1" : "0");
      });
      voices.forEach((v, i) => {
        const label = `${arrived[i] * 100} voix`;
        if (v.textContent !== label) v.textContent = label;
        v.setAttribute("opacity", arrived[i] > 0 ? "1" : "0.45");
      });

      // 3. Le vote : Toi puis Sara votent pour, Yanis vote contre
      const v = p - 2;
      votePanel.setAttribute("opacity", clamp01((p - 2) / 0.1).toFixed(2));
      const forShare = 0.4 * easeOut(clamp01((v - 0.08) / 0.25)) + 0.3 * easeOut(clamp01((v - 0.36) / 0.25));
      const againstShare = 0.3 * easeOut(clamp01((v - 0.62) / 0.22));
      forBar.setAttribute("width", (230 * forShare).toFixed(1));
      againstBar.setAttribute("width", (230 * againstShare).toFixed(1));
      againstBar.setAttribute("x", (480 - 230 * againstShare).toFixed(1));
      forLabel.textContent = `Pour ${Math.round(forShare * 1000)}`;
      againstLabel.textContent = `Contre ${Math.round(againstShare * 1000)}`;
      [0.08, 0.36, 0.62].forEach((start, i) => rings[i].setAttribute("opacity", clamp01((v - start) / 0.1).toFixed(2)));

      // 4. La tranche 1 s'ouvre vers le club
      const r = p - 3;
      gate.setAttribute("opacity", (0.16 * clamp01(r / 0.15)).toFixed(2));
      wall.setAttribute("opacity", (1 - clamp01((r - 0.05) / 0.12)).toFixed(2));
      const lockLabel = r > 0.12 ? "Débloquée" : "Bloquée";
      if (lock.textContent !== lockLabel) lock.textContent = lockLabel;
      club.setAttribute("opacity", (0.35 + 0.65 * clamp01((p - 2.9) / 0.15)).toFixed(2));
      const clubText = received > 0 ? `a reçu ${(received / 10).toLocaleString("fr-FR")} ETH` : "attend";
      if (clubLabel.textContent !== clubText) clubLabel.textContent = clubText;
    };

    const tick = (now: number) => {
      const c = clock.current;
      const dt = Math.min(100, now - last);
      last = now;
      const cycle = STEP_MS * STEPS.length;
      if (c.playing) c.elapsed = (c.elapsed + dt) % cycle;
      const index = Math.min(STEPS.length - 1, Math.floor(c.elapsed / STEP_MS));
      const inStep = c.elapsed - index * STEP_MS;
      // En pause ou en mouvement réduit, on montre l'état final de l'étape
      const p = index + (c.playing ? clamp01(inStep / MOVE_MS) : 0.999);
      render(p);
      // Fondu au moment où la boucle recommence, pour que les pièces ne se téléportent pas
      const edge = c.playing ? Math.min(c.elapsed, cycle - c.elapsed) : FADE_MS;
      svg.style.opacity = clamp01(edge / FADE_MS).toFixed(2);
      if (barRef.current) barRef.current.style.transform = `scaleX(${c.playing ? inStep / STEP_MS : 1})`;
      if (index !== shown) {
        shown = index;
        setStep(index);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const goTo = (index: number) => {
    clock.current.elapsed = index * STEP_MS + (clock.current.playing ? 0 : MOVE_MS);
    setStep(index);
  };
  const toggle = () => {
    clock.current.playing = !clock.current.playing;
    if (clock.current.playing) clock.current.elapsed = step * STEP_MS;
    setPlaying(clock.current.playing);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Comment ça marche</h2>
        <button type="button" onClick={toggle} className="pill tone-neutral !px-3 !py-1.5 transition-colors hover:text-[var(--text)] active:opacity-70" aria-label={playing ? "Mettre l'animation en pause" : "Lancer l'animation"}>
          {playing ? "Pause" : "Lecture"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5" role="tablist" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            role="tab"
            aria-selected={step === i}
            onClick={() => goTo(i)}
            className={`relative overflow-hidden rounded-xl px-2 py-2 text-center text-[12px] font-semibold sm:text-left sm:text-[13px] transition-colors active:opacity-70 ${step === i ? "bg-white text-black" : "bg-white/[0.07] text-[var(--text-2)] hover:text-[var(--text)]"}`}
          >
            <span className="mr-1 hidden opacity-50 sm:inline">{i + 1}</span>
            {s.tab}
            {step === i && <span ref={barRef} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-black/35" />}
          </button>
        ))}
      </div>

      <svg ref={svgRef} viewBox="22 0 600 372" role="img" aria-label="Animation : les dons vont dans un coffre, les donateurs reçoivent des voix, votent, puis une tranche est versée au club." className="my-auto w-full pt-4">
        {/* Donateurs */}
        {OWNERS.map((o, i) => (
          <g key={o.name}>
            <circle data-ring cx={OWNER_X} cy={o.y} r="32" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray={i === 2 ? "4 6" : undefined} opacity="0" />
            <circle cx={OWNER_X} cy={o.y} r="25" fill="#fff" />
            <text x={OWNER_X} y={o.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#000">
              {o.name}
            </text>
            <text data-voices x={OWNER_X} y={o.y + 48} textAnchor="middle" fontSize="15" fontWeight="600" fill="#fff" opacity="0.45">
              0 voix
            </text>
          </g>
        ))}

        {/* Vote */}
        <g data-vote opacity="0">
          <text data-for-label x="250" y="16" fontSize="13" fontWeight="700" fill="#fff">
            Pour 0
          </text>
          <text data-against-label x="480" y="16" textAnchor="end" fontSize="13" fontWeight="700" fill="#8e8e93">
            Contre 0
          </text>
          <rect x="250" y="24" width="230" height="10" rx="5" fill="rgba(255,255,255,0.14)" />
          <rect data-for x="250" y="24" width="0" height="10" rx="5" fill="#fff" />
          <rect data-against x="480" y="24" width="0" height="10" rx="5" fill="#6e6e73" />
        </g>

        {/* Coffre : 3 tranches (40 %, 30 %, 30 %) */}
        <rect x="250" y="50" width="230" height="270" rx="22" fill="rgba(255,255,255,0.05)" />
        <path data-gate d="M272 50H458a22 22 0 0 1 22 22V158H250V72a22 22 0 0 1 22-22Z" fill="#fff" opacity="0" />
        <path d="M480 158V298a22 22 0 0 1-22 22H272a22 22 0 0 1-22-22V72a22 22 0 0 1 22-22H458a22 22 0 0 1 22 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <line data-wall x1="480" y1="72" x2="480" y2="158" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <line x1="252" y1="158" x2="478" y2="158" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeDasharray="4 6" />
        <line x1="252" y1="239" x2="478" y2="239" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeDasharray="4 6" />
        {[
          ["Tranche 1", 70],
          ["Tranche 2", 176],
          ["Tranche 3", 257],
        ].map(([label, y], i) => (
          <g key={label}>
            <text x="264" y={y} fontSize="14" fontWeight="700" fill="#fff">
              {label}
            </text>
            <text {...(i === 0 ? { "data-lock": "" } : {})} x="264" y={Number(y) + 17} fontSize="13" fill="#a1a1a6">
              Bloquée
            </text>
          </g>
        ))}
        <text data-total x="365" y="352" textAnchor="middle" fontSize="21" fontWeight="800" fill="#fff" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
          0 ETH au coffre
        </text>

        {/* Club */}
        <g data-club opacity="0.35">
          <rect x={CLUB.x - 36} y={CLUB.y - 28} width="72" height="56" rx="16" fill="none" stroke="#fff" strokeWidth="3" />
          <text x={CLUB.x} y={CLUB.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
            Club
          </text>
          <text data-club-label x={CLUB.x} y={CLUB.y + 48} textAnchor="middle" fontSize="14" fill="#fff">
            attend
          </text>
        </g>

        {/* Voix puis pièces, dessinées en dernier pour passer au-dessus */}
        {SLOTS.map((_, i) => (
          <circle key={i} data-token r="5" fill="#fff" opacity="0" />
        ))}
        {SLOTS.map((_, i) => (
          <g key={i} data-coin>
            <circle r="16" fill="#f5f5f7" stroke="#000" strokeWidth="2" />
            {/* Losange d'Ethereum */}
            <path d="M0-9.5 5.6.3 0 3.6-5.6.3Z" fill="#000" />
            <path d="M-5.6 2.2 0 5.5 5.6 2.2 0 9.8Z" fill="#000" opacity="0.6" />
          </g>
        ))}
      </svg>

      <p className="mt-3 min-h-[2.75rem] text-[15px] leading-snug text-[var(--text-2)]">
        {STEPS[step].caption}
      </p>
    </div>
  );
}
