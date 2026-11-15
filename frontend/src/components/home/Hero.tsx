"use client";

import Link from "next/link";
import { Clock } from "@/components/board/Clock";
import { Flap } from "@/components/board/Flap";
import { ArrowIcon } from "@/components/board/Icons";
import { CHAIN } from "@/config/chain";

/** Le titre se retourne une seule fois à l'arrivée : une boucle détournerait l'attention de la lecture. */
const HEADLINE = [
  { text: "LES FONDS", color: "var(--ticket)" },
  { text: "DÉCOLLENT", color: "var(--ticket)" },
  { text: "SUR VOTE.", color: "var(--amber)" },
];

function HeroRow({ text, color, delayOf }: { text: string; color: string; delayOf: (i: number) => number }) {
  return (
    <span aria-hidden="true" className="flex" style={{ gap: "clamp(3px, .45vw, 6px)" }}>
      {Array.from(text).map((ch, i) => (
        <Flap key={`${i}-${ch}`} ch={ch} size="xl" color={color} delay={delayOf(i)} />
      ))}
    </span>
  );
}

function FlapHeadline() {
  return (
    <h1 aria-label="Les fonds décollent sur vote." className="m-0 flex flex-col gap-2" style={{ perspective: 900 }}>
      {HEADLINE.map((row, ri) => (
        <HeroRow key={row.text} text={row.text} color={row.color} delayOf={(ci) => 0.15 + ri * 0.28 + ci * 0.07} />
      ))}
    </h1>
  );
}

export function Hero() {
  return (
    <section className="wrap flex flex-wrap items-center gap-x-14 gap-y-11 pb-10 pt-9">
      <FlapHeadline />
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[26px]">
        <div className="flex flex-wrap items-center gap-4">
          <Clock />
          <span className="tag">
            Heure locale
            <br />
            Terminal {CHAIN.name}
          </span>
        </div>
        <p className="m-0 max-w-[540px] text-[21px] leading-[1.45] text-soft" style={{ textWrap: "pretty" }}>
          Les ETH restent à quai. Chaque tranche part vers le club après le vote des contributeurs.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#departs" className="btn btn-amber !text-[15px]">
            Voir les campagnes
            <ArrowIcon />
          </a>
          <Link href="/creator" className="btn btn-ghost !text-[15px]">
            Créer une campagne
          </Link>
        </div>
      </div>
    </section>
  );
}
