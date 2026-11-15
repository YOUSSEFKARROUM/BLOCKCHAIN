"use client";

import { CrossIcon } from "@/components/board/Icons";
import { StatusLamp } from "@/components/board/StatusLamp";
import { COLORS } from "@/lib/campaignView";

export interface EscaleDraft {
  title: string;
  proof: string;
  pct: number;
}

export const MIN_ESCALES = 2;
export const MAX_ESCALES = 5;
const STEP = 5;
const MIN_PCT = 5;
const MAX_PCT = 95;

interface EscalesEditorProps {
  escales: EscaleDraft[];
  goalEth: number;
  onChange: (next: EscaleDraft[]) => void;
}

const fmt = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 3 });

/** Réglage des escales : 2 à 5 jalons, ±5 %, total exactement 100 %. */
export function EscalesEditor({ escales, goalEth, onChange }: EscalesEditorProps) {
  const update = (i: number, patch: Partial<EscaleDraft>) => onChange(escales.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="tag-b mb-2.5 p-0 text-gray">04 · Escales = jalons (2 à 5, total 100 %)</legend>
      <ol className="m-0 flex list-none flex-col gap-[5px] p-0">
        {escales.map((e, i) => (
          <li key={i} className="db-tile flex flex-col gap-3 rounded-md py-3 pl-5 pr-3.5">
            <div className="mono flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[18px] font-bold">
              <span className="flex-[0_0_34px] text-gray">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-[1_1_150px] tracking-[.04em]">ESCALE {i + 1}</span>
              <span className="flex-[0_0_120px] font-normal text-soft">{fmt((goalEth * e.pct) / 100)} ETH</span>
              <div className="flex items-center gap-1.5">
                <button type="button" className="db-step" disabled={e.pct <= MIN_PCT} onClick={() => update(i, { pct: Math.max(MIN_PCT, e.pct - STEP) })} aria-label={`Retirer 5 % à l'escale ${i + 1}`}>
                  −
                </button>
                <span className="w-[84px] text-center text-[26px] text-amber" aria-live="polite">
                  {e.pct} %
                </span>
                <button type="button" className="db-step" disabled={e.pct >= MAX_PCT} onClick={() => update(i, { pct: Math.min(MAX_PCT, e.pct + STEP) })} aria-label={`Ajouter 5 % à l'escale ${i + 1}`}>
                  +
                </button>
              </div>
              {escales.length > MIN_ESCALES && (
                <button type="button" className="db-step !bg-transparent !text-gray hover:!text-night" onClick={() => onChange(escales.filter((_, j) => j !== i))} aria-label={`Supprimer l'escale ${i + 1}`}>
                  <CrossIcon />
                </button>
              )}
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
              <input
                aria-label={`Intitulé du jalon ${i + 1}`}
                placeholder={`Intitulé du jalon ${i + 1}`}
                maxLength={120}
                value={e.title}
                onChange={(ev) => update(i, { title: ev.target.value })}
                className="field !min-h-[48px] bg-night !text-[15px]"
              />
              <input
                aria-label={`Preuve attendue pour le jalon ${i + 1}`}
                placeholder="Preuve attendue (facture, vidéo…)"
                maxLength={600}
                value={e.proof}
                onChange={(ev) => update(i, { proof: ev.target.value })}
                className="field !min-h-[48px] bg-night !text-[15px] !font-normal"
              />
            </div>
          </li>
        ))}
      </ol>
      {escales.length < MAX_ESCALES && (
        <button type="button" onClick={() => onChange([...escales, { title: "", proof: "", pct: STEP }])} className="btn btn-ghost btn-sm self-start border-dashed">
          + Ajouter une escale
        </button>
      )}
    </fieldset>
  );
}

/** Aperçu de l'itinéraire des tranches et contrôle de la somme. */
export function ItineraryPreview({ escales }: { escales: EscaleDraft[] }) {
  const sum = escales.reduce((a, e) => a + e.pct, 0);
  const isExact = sum === 100;
  const color = isExact ? COLORS.ok : "#FF9B7A";
  const message = isExact ? "EXACT" : sum < 100 ? `IL MANQUE ${100 - sum} %` : `${sum - 100} % EN TROP`;
  return (
    <div className="flex flex-col gap-[18px] rounded-[10px] bg-[#0E0E10] p-6" style={{ border: `1.5px solid ${color}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tag-b text-gray">Itinéraire des tranches</span>
        <span role="status" className="mono inline-flex items-center gap-2.5 text-[14px] font-bold tracking-[.08em]" style={{ color }}>
          <StatusLamp color={color} />
          TOTAL {sum} % · {message}
        </span>
      </div>
      <div className="flex h-[60px] gap-1" aria-hidden="true">
        {escales.map((e, i) => (
          <div
            key={i}
            className="db-seg mono flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap rounded bg-amber text-[15px] font-bold text-night"
            style={{ flex: `${e.pct} 1 0` }}
          >
            {e.pct} %
          </div>
        ))}
      </div>
    </div>
  );
}
