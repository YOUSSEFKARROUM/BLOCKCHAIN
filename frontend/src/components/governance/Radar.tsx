import { COLORS, flightCode } from "@/lib/campaignView";
import type { Proposal } from "@/lib/data";

const GOLDEN_ANGLE = 137.5;

/** Position stable d'un écho (dérivée de l'id) : le même point ne saute pas d'un rendu à l'autre. */
function blipPosition(id: number): { left: number; top: number } {
  const angle = ((id * GOLDEN_ANGLE + 40) % 360) * (Math.PI / 180);
  const radius = 18 + ((id * 23) % 20); // entre 18 % et 37 % du rayon
  return { left: 50 + radius * Math.cos(angle), top: 50 + radius * Math.sin(angle) };
}

function blipColor(p: Proposal): string {
  if (p.state === 2) return COLORS.ok;
  return p.ptype === 1 ? COLORS.alert : COLORS.amber;
}

const RADAR_BG = {
  backgroundColor: "#06140B",
  backgroundImage:
    "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent calc(16.6% - 1.5px), rgba(76,217,100,.35) calc(16.6% - 1.5px), rgba(76,217,100,.35) 16.6%), linear-gradient(rgba(76,217,100,.3), rgba(76,217,100,.3)), linear-gradient(rgba(76,217,100,.3), rgba(76,217,100,.3))",
  backgroundSize: "100% 100%, 1.5px 100%, 100% 1.5px",
  backgroundPosition: "center, center, center",
  backgroundRepeat: "no-repeat",
  border: "3px solid #1F5A2E",
  boxShadow: "0 0 80px rgba(76,217,100,.18)",
};

/** Radar animé : un écho par proposition ouverte ou adoptée en attente d'exécution. */
export function Radar({ proposals }: { proposals: Proposal[] }) {
  const blips = proposals.filter((p) => p.state === 0 || p.state === 2);
  const label =
    blips.length === 0 ? "Radar : aucune proposition en approche" : `Radar : ${blips.length} proposition${blips.length > 1 ? "s" : ""} en approche`;
  return (
    <div className="flex flex-[1_1_360px] justify-center">
      <div role="img" aria-label={label} className="relative aspect-square overflow-hidden rounded-full" style={{ width: "min(420px, 82vw)", ...RADAR_BG }}>
        <div
          aria-hidden="true"
          className="db-sweep absolute inset-0 rounded-full"
          style={{ background: "conic-gradient(from 0deg, rgba(76,217,100,0) 0deg, rgba(76,217,100,0) 290deg, rgba(76,217,100,.55) 359deg, rgba(76,217,100,0) 360deg)" }}
        />
        {blips.map((p, i) => {
          const pos = blipPosition(p.id);
          const color = blipColor(p);
          return (
            <span key={p.id} aria-hidden="true">
              <span
                className="db-ping absolute h-4 w-4 rounded-full"
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, background: color, boxShadow: `0 0 18px ${color}`, animationDelay: `${(i * 1.3) % 4}s` }}
              />
              <span className="mono absolute text-[12px] font-bold" style={{ left: `${pos.left}%`, top: `${pos.top}%`, margin: "-22px 0 0 22px", color }}>
                {flightCode(p.campaignId)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
