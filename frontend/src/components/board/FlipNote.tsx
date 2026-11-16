"use client";

import { useId, useState } from "react";
import { CrossIcon } from "./Icons";

interface FlipNoteProps {
  /** Étiquette du bloc, aussi lue par le bouton « ? ». */
  label: string;
  /** Verso : l'explication complète, affichée à la demande. */
  back: React.ReactNode;
  /** Recto : le visuel (jauge, schéma, chiffre). */
  children: React.ReactNode;
  /** `flip` retourne le contenu comme une palette ; `fade` le fond, pour les grands blocs. */
  variant?: "flip" | "fade";
  className?: string;
}

/**
 * Bloc à deux faces : le visuel au recto, la phrase d'explication au verso.
 * Le bouton « ? » retourne le bloc. La face cachée est retirée de l'arbre d'accessibilité.
 */
export function FlipNote({ label, back, children, variant = "flip", className = "db-panel" }: FlipNoteProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const backId = useId();
  return (
    <div className={`flip relative rounded-[10px] ${variant === "fade" ? "flip-fade" : ""} ${className}`} data-flipped={isFlipped}>
      <button
        type="button"
        className="flip-toggle"
        aria-expanded={isFlipped}
        aria-controls={backId}
        aria-label={isFlipped ? `Masquer l'explication : ${label}` : `Afficher l'explication : ${label}`}
        onClick={() => setIsFlipped((v) => !v)}
      >
        <span>{isFlipped ? <CrossIcon size={12} /> : "?"}</span>
      </button>
      <div className="flip-inner">
        <div className="flip-face flip-front flex flex-col gap-3 p-5 pr-14" aria-hidden={isFlipped}>
          <span className="tag">{label}</span>
          {children}
        </div>
        <div id={backId} className="flip-face flip-back flex flex-col gap-3 p-5 pr-14" aria-hidden={!isFlipped}>
          <span className="tag text-amber">{label}</span>
          <div className="text-[15px] leading-[1.5] text-soft">{back}</div>
        </div>
      </div>
    </div>
  );
}
