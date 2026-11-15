interface StatusLampProps {
  color: string;
  isBlinking?: boolean;
  /** Voyant éteint : simple cercle (escale verrouillée). */
  isHollow?: boolean;
  size?: number;
}

/** Voyant coloré du tableau. Décoratif : le statut est toujours écrit à côté. */
export function StatusLamp({ color, isBlinking = false, isHollow = false, size = 12 }: StatusLampProps) {
  const style = isHollow
    ? { width: size, height: size, border: `2px solid ${color}` }
    : { width: size, height: size, background: color, boxShadow: `0 0 12px ${color}` };
  return <span aria-hidden="true" className={`inline-block flex-none rounded-full ${isBlinking ? "db-blink" : ""}`} style={style} />;
}
