import { ArrowIcon, PlaneIcon } from "@/components/board/Icons";
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
      title: "Enregistrement",
      real: "Création de la campagne",
      text: "Le club crée sa campagne : un objectif, une durée de 1 h à 90 jours et 2 à 5 jalons dont la somme fait exactement 100 %.",
    },
    {
      letter: "B",
      title: "Embarquement",
      real: "Contribution",
      text: `Vous contribuez en ETH et recevez des CFD au taux fixe de 1 ETH = ${r.rate} CFD. Ce sont vos droits de vote.`,
    },
    {
      letter: "C",
      title: "Tour de contrôle",
      real: "Vote de la DAO",
      text: "La DAO vote chaque jalon avec les CFD détenus au snapshot, le bloc qui précède la proposition.",
    },
    {
      letter: "D",
      title: "Décollage",
      real: "Déblocage de la tranche",
      text: `N'importe qui peut exécuter une proposition acceptée : la tranche part. Les ${r.feePercent} % de frais sont prélevés à ce moment-là.`,
    },
  ];
}

/** Section signalétique ambre « Quatre portes » : le cycle de vie d'une campagne. */
export function HowItWorks({ rules }: { rules: ProtocolRules }) {
  return (
    <SignPanel variant="band" id="fonctionnement" aria-labelledby="portes-title">
      <div aria-hidden="true" className="relative h-[34px] overflow-hidden border-b-2 border-dashed border-night">
        <PlaneIcon className="db-plane absolute top-0.5" />
      </div>
      <div className="wrap flex flex-col gap-[52px] pb-24 pt-20">
        <h2 id="portes-title" className="display display-xl">
          Quatre portes.
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
                {i < 3 ? <ArrowIcon size={44} /> : <PlaneIcon size={44} />}
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
          <span className="tag-b text-[15px] text-alert">Vol annulé ?</span>
          <p className="m-0 flex-[1_1_420px] text-[19px]">
            Objectif manqué, ou campagne gelée par la DAO : chacun récupère lui-même <strong className="text-amber">100 % de sa mise</strong>, et ses CFD
            sont brûlés.
          </p>
        </div>
      </div>
    </SignPanel>
  );
}
