"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcn/accordion";

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
  return (
    <Accordion type="single" collapsible defaultValue="q0" className="border-t border-border">
      {ITEMS.map((item, i) => (
        <AccordionItem key={item.q} value={`q${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
