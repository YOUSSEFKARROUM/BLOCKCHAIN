"use client";

import { useId, useState } from "react";

const ITEMS = [
  {
    q: "Que se passe-t-il si l'objectif n'est pas atteint ?",
    a: "À l'échéance, la campagne passe en « Échouée ». Chaque contributeur récupère alors 100 % de sa mise avec le bouton « Me faire rembourser ». Les 2 % de frais ne sont prélevés que sur les tranches versées, jamais sur une campagne échouée.",
  },
  {
    q: "Qui décide du déblocage des fonds ?",
    a: "Les détenteurs de CFD, par un vote. Le porteur demande le déblocage d'un jalon, la communauté vote pendant la durée prévue, puis n'importe qui peut exécuter la décision. Il faut que 10 % des CFD aient voté et qu'il y ait plus de « pour » que de « contre ». Aucun administrateur ne peut débloquer l'argent seul.",
  },
  {
    q: "Pourquoi mon vote ne compte-t-il pas ?",
    a: "Le poids d'un vote est le nombre de CFD que vous aviez délégués au bloc précédant la création de la proposition. Des CFD achetés, empruntés ou délégués après coup ne comptent pas pour ce vote : c'est ce qui empêche une prise de contrôle éclair. Activez votre pouvoir de vote dès votre première contribution.",
  },
  {
    q: "Comment fonctionne le score de risque ?",
    a: "Un script hors chaîne lit l'historique des contributions et cherche des signaux de fraude : montants identiques, adresses financées par une même source, adresses neuves, pic soudain. Il combine des règles et un modèle Isolation Forest pour donner un score de 0 à 100. Ce score est indicatif : seule la DAO peut geler une campagne.",
  },
  {
    q: "Puis-je me faire rembourser d'une campagne gelée ?",
    a: "Oui. Si la DAO gèle une campagne, vous récupérez votre part de ce qui reste dans le contrat. Si des tranches avaient déjà été versées, le remboursement se fait au prorata. Vos CFD de cette contribution sont brûlés au passage.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <div>
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-[var(--line)] first:border-t">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${base}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium tracking-[-0.01em] transition-opacity active:opacity-60"
              >
                {item.q}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden
                  className="shrink-0 text-[var(--text-2)]"
                  style={{ transform: `rotate(${isOpen ? 45 : 0}deg)`, transition: "transform var(--settle)" }}
                >
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </h3>
            {/* grid 0fr -> 1fr : la hauteur s'anime depuis sa valeur courante, donc reste interruptible */}
            <div
              id={`${base}-${i}`}
              role="region"
              className="grid"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0, transition: "grid-template-rows var(--settle), opacity var(--settle)" }}
            >
              <div className="overflow-hidden" aria-hidden={!isOpen}>
                <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-[var(--text-2)]">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
