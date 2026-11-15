import type { CSSProperties } from "react";

/** Tailles de palette reprises des maquettes (valeurs exactes des `clamp()`). */
const SIZES = {
  xl: { width: "clamp(31px, 5vw, 76px)", height: "clamp(42px, 6.6vw, 100px)", fontSize: "clamp(28px, 4.6vw, 70px)", borderRadius: 7 },
  lg: { width: "clamp(40px, 6vw, 76px)", height: "clamp(54px, 8vw, 100px)", fontSize: "clamp(34px, 5.4vw, 70px)", borderRadius: 7 },
  md: { width: 34, height: 46, fontSize: 28, borderRadius: 4 },
  sm: { width: 40, height: 56, fontSize: 34, borderRadius: 5 },
} satisfies Record<string, CSSProperties>;

export type FlapSize = keyof typeof SIZES;

interface FlapProps {
  ch: string;
  size?: FlapSize;
  color?: string;
  /** Délai du retournement, en secondes. */
  delay?: number;
  isLoading?: boolean;
  /** Pas d'animation (ex. horloge qui change chaque seconde). */
  isStill?: boolean;
}

/** Une palette du tableau : tuile à charnière centrale qui se retourne quand elle apparaît. */
export function Flap({ ch, size = "md", color = "var(--amber)", delay = 0, isLoading = false, isStill = false }: FlapProps) {
  const motion = isLoading ? "db-flap-loading" : isStill ? "db-flap-still" : "";
  return (
    <span
      aria-hidden="true"
      className={`db-flap db-tile ${motion}`}
      style={{ ...SIZES[size], color, animationDelay: `${delay}s` }}
    >
      {isLoading ? "" : ch === " " ? " " : ch}
    </span>
  );
}

interface FlapTextProps {
  text: string;
  /** Texte lu par les lecteurs d'écran ; par défaut, `text`. */
  label?: string;
  size?: FlapSize;
  color?: string;
  /** Délai de la première palette, puis écart entre deux palettes (secondes). */
  baseDelay?: number;
  step?: number;
  /** Nombre de palettes vides affichées pendant le chargement. */
  loadingLength?: number;
  isLoading?: boolean;
  className?: string;
  gap?: string | number;
}

/**
 * Un mot en palettes. Chaque lettre est remontée quand elle change (clé = position + caractère),
 * ce qui rejoue son retournement ; les lettres inchangées ne bougent pas.
 */
export function FlapText({
  text,
  label,
  size = "md",
  color,
  baseDelay = 0,
  step = 0.06,
  loadingLength = 4,
  isLoading = false,
  className = "",
  gap = "clamp(3px, .45vw, 6px)",
}: FlapTextProps) {
  const chars = isLoading ? Array.from({ length: loadingLength }, () => "") : Array.from(text);
  return (
    <span role="img" aria-label={isLoading ? "Chargement" : (label ?? text)} className={`flex flex-wrap ${className}`} style={{ gap }}>
      {chars.map((ch, i) => (
        <Flap
          key={`${i}-${ch}`}
          ch={ch}
          size={size}
          color={color}
          delay={isLoading ? i * 0.12 : baseDelay + i * step}
          isLoading={isLoading}
        />
      ))}
    </span>
  );
}
