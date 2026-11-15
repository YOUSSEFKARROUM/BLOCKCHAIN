/** Pictogrammes de la signalétique (flèche, avion, croix), tous décoratifs. */
export function ArrowIcon({ size = 18, back = false }: { size?: number; back?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
      <path d={back ? "M20 12H5M11 18l-6-6 6-6" : "M4 12h15M13 6l6 6-6 6"} />
    </svg>
  );
}

export function PlaneIcon({ size = 30, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} style={style}>
      <path d="M2 13l20-9-7 18-3.5-7.5z" />
    </svg>
  );
}

export function CrossIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
