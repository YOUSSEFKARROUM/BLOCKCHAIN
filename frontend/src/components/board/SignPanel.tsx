import type { ReactNode } from "react";

interface SignPanelProps {
  children: ReactNode;
  /** `band` : pleine largeur (section) ; `card` : bloc arrondi. */
  variant?: "band" | "card";
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
}

/** Bloc de signalétique ambre : texte nuit sur fond ambre, comme les panneaux d'aéroport. */
export function SignPanel({ children, variant = "card", className = "", ...rest }: SignPanelProps) {
  const shape = variant === "card" ? "rounded-[10px]" : "";
  return (
    <section className={`on-amber bg-amber text-night ${shape} ${className}`} {...rest}>
      {children}
    </section>
  );
}
