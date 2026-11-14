/**
 * Logo CampusFund : un coffre découpé en trois tranches, dont la première est débloquée.
 * C'est le principe du produit en un signe : les fonds sortent tranche par tranche.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#f5f5f7" />
      {/* Tranche débloquée : pleine. Tranches bloquées : estompées. */}
      <rect x="7" y="7.5" width="18" height="4.6" rx="2.3" fill="#000" />
      <rect x="7" y="13.7" width="18" height="4.6" rx="2.3" fill="#000" opacity="0.32" />
      <rect x="7" y="19.9" width="18" height="4.6" rx="2.3" fill="#000" opacity="0.32" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[19px] !font-extrabold !tracking-[-0.035em]">
        Campus<span className="text-[var(--text-2)]">Fund</span>
      </span>
    </span>
  );
}
