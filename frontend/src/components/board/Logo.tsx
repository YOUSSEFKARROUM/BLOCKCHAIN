/** Dégradés à charnière des deux palettes du logo (maquette Logo). */
export const LOGO_C_BG = "linear-gradient(#FFC42E 0, #FFC42E 48%, #09090A 48%, #09090A 52%, #F0A800 52%)";
export const LOGO_F_BG = "linear-gradient(#2A2A2E 0, #2A2A2E 48%, #09090A 48%, #09090A 52%, #1D1D20 52%)";

interface LogoProps {
  /** Hauteur d'une palette, en px. */
  size?: number;
  withWordmark?: boolean;
}

/** Logo CampusFund : deux palettes, C (ambre) et F (sombre), puis le mot CAMPUSFUND. */
export function Logo({ size = 50, withWordmark = true }: LogoProps) {
  const tile = {
    width: Math.round(size * 0.76),
    height: size,
    borderRadius: Math.max(3, Math.round(size / 10)),
    fontSize: Math.round(size * 0.68),
  };
  return (
    <span className="flex items-center gap-3.5">
      <span aria-hidden="true" className="mono flex gap-1 font-bold">
        <span className="flex items-center justify-center text-night" style={{ ...tile, background: LOGO_C_BG }}>
          C
        </span>
        <span className="flex items-center justify-center text-amber" style={{ ...tile, background: LOGO_F_BG }}>
          F
        </span>
      </span>
      {withWordmark && (
        <span aria-hidden="true" className="mono hidden text-[18px] font-bold tracking-[.22em] sm:inline">
          CAMPUSFUND
        </span>
      )}
    </span>
  );
}
