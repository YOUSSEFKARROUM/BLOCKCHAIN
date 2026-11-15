"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock } from "@/components/board/Clock";
import { Flap } from "@/components/board/Flap";
import { ArrowIcon } from "@/components/board/Icons";
import { CHAIN } from "@/config/chain";
import { useReducedMotion } from "@/lib/useReducedMotion";

const FIXED_ROWS = ["LES FONDS", "DÉCOLLENT"];
const THIRD_ROW = ["SUR VOTE.", "PAR JALON"];
const ALTERNATE_MS = 4000;

function HeroRow({ text, color, delayOf }: { text: string; color: string; delayOf: (i: number) => number }) {
  return (
    <span aria-hidden="true" className="flex" style={{ gap: "clamp(3px, .45vw, 6px)" }}>
      {Array.from(text).map((ch, i) => (
        <Flap key={`${i}-${ch}`} ch={ch} size="xl" color={color} delay={delayOf(i)} />
      ))}
    </span>
  );
}

/** Titre en palettes : la troisième ligne alterne toutes les 4 s (sauf mouvement réduit). */
function FlapHeadline() {
  const isReduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isReduced) return;
    const id = setInterval(() => setTick((t) => t + 1), ALTERNATE_MS);
    return () => clearInterval(id);
  }, [isReduced]);

  const third = THIRD_ROW[tick % THIRD_ROW.length];
  return (
    <h1 aria-label="Les fonds décollent sur vote, par jalon." className="m-0 flex flex-col gap-2" style={{ perspective: 900 }}>
      {FIXED_ROWS.map((row, ri) => (
        <HeroRow key={row} text={row} color="var(--ticket)" delayOf={(ci) => 0.15 + ri * 0.28 + ci * 0.07} />
      ))}
      <HeroRow text={third} color="var(--amber)" delayOf={(ci) => (tick === 0 ? 0.71 + ci * 0.07 : ci * 0.06)} />
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
            Voir les départs
            <ArrowIcon />
          </a>
          <Link href="/creator" className="btn btn-ghost !text-[15px]">
            Déposer un plan de vol
          </Link>
        </div>
      </div>
    </section>
  );
}
