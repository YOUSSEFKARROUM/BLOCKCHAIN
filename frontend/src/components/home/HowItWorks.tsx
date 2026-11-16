import { ArrowIcon, CheckIcon } from "@/components/board/Icons";
import { SignPanel } from "@/components/board/SignPanel";
import type { ProtocolRules } from "@/lib/useProtocol";

interface Gate {
  letter: string;
  title: string;
  real: string;
  text: string;
}

function gates(r: ProtocolRules): Gate[] {
  return [
    {
      letter: "A",
      title: "Création",
      real: "Le porteur",
      text: "Un objectif, une durée, 2 à 5 jalons.",
    },
    {
      letter: "B",
      title: "Contribution",
      real: "Les étudiants",
      text: `1 ETH = ${r.rate} CFD : vos droits de vote.`,
    },
    {
      letter: "C",
      title: "Vote",
      real: "Les contributeurs",
      text: "La DAO vote chaque jalon, au snapshot.",
    },
    {
      letter: "D",
      title: "Déblocage",
      real: "Le club",
      text: `Vote adopté : la tranche est versée (${r.feePercent} % de frais).`,
    },
  ];
}

/** Section ambre « Quatre étapes » : le cycle de vie d'une campagne. */
export function HowItWorks({ rules }: { rules: ProtocolRules }) {
  return (
    <SignPanel variant="band" id="fonctionnement" aria-labelledby="portes-title">
      <div className="wrap flex flex-col gap-[52px] pb-24 pt-20">
        <h2 id="portes-title" className="display display-xl">
          Quatre étapes.
          <br />
          Aucun chèque en blanc.
        </h2>
        <ol className="m-0 grid list-none border-t-[3px] border-night p-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
          {gates(rules).map((g, i) => (
            <li key={g.letter} className="flex flex-col gap-3.5 border-b-[3px] border-night pb-2 pr-6 pt-7">
              <div className="flex items-center gap-3.5">
                <span aria-hidden="true" className="flex h-[72px] w-[72px] items-center justify-center rounded-[10px] bg-night font-display text-[46px] font-black text-amber">
                  {g.letter}
                </span>
                {i < 3 ? <ArrowIcon size={44} /> : <CheckIcon size={44} />}
              </div>
              <h3 className="display m-0 text-[30px] leading-none" style={{ fontWeight: 800, fontStretch: "80%" }}>
                {g.title}
              </h3>
              <span className="tag-b">{g.real}</span>
              <p className="mb-5 mt-0 text-[16px] font-medium">{g.text}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-[18px] rounded-[10px] bg-night px-[30px] py-[26px] text-ticket">
          <span className="tag-b text-[15px] text-alert">Campagne annulée ?</span>
          <p className="m-0 flex-[1_1_420px] text-[19px]">
            Objectif manqué : <strong className="text-amber">100 % de la mise</strong> rendue. Gel : tout ce qui n&apos;a pas encore été versé.
          </p>
        </div>
      </div>
    </SignPanel>
  );
}
