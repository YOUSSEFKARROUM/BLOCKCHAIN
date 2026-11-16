import { PlaneIcon } from "@/components/board/Icons";
import { deployment } from "@/lib/contracts";
import { boardStatus, flightCode, fundingPercent } from "@/lib/campaignView";
import { type Campaign, type Proposal, STATUS_LABELS } from "@/lib/data";
import { dateTime, eth, relative, shortAddress } from "@/lib/format";
import type { CampaignMetadata } from "@/lib/metadata";

const INK_SOFT = "#55554F"; // gris sur billet : contraste 6,6:1
const PLANE_SIZE = 34;

/** `isRaw` : valeur affichée telle quelle (une adresse Ethereum ne se met pas en capitales). */
function Field({ label, children, isRaw = false }: { label: string; children: React.ReactNode; isRaw?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="font-display text-[13px] font-medium" style={{ color: INK_SOFT }}>
        {label}
      </div>
      <div className={`break-words ${isRaw ? "" : "uppercase"}`}>{children}</div>
    </div>
  );
}

interface BoardingPassProps {
  campaign: Campaign;
  proposals: Proposal[];
  metadata: CampaignMetadata | null;
  now: number;
  feePercent: number;
}

/** Carte d'embarquement : la campagne résumée sur un billet (maquette Campaign). */
export function BoardingPass({ campaign: c, proposals, metadata, now, feePercent }: BoardingPassProps) {
  const status = boardStatus(c, proposals, now);
  const funded = fundingPercent(c);
  const planeAt = Math.min(100, funded);
  const toClub = (c.released * BigInt(10_000 - Math.round(feePercent * 100))) / 10_000n;
  const escrow = c.raised - c.released - c.refunded;
  return (
    <section
      aria-label="Carte d'embarquement de la campagne"
      className="db-pass on-ticket flex flex-wrap overflow-hidden rounded-[18px] bg-ticket text-night"
      style={{ boxShadow: "0 30px 80px rgba(0,0,0,.7)" }}
    >
      <div className="flex min-w-0 flex-[999_1_420px] flex-col">
        <div className="tag-b flex flex-wrap justify-between gap-2 bg-amber px-7 py-3.5 text-[13px]">
          <span>Carte d&apos;embarquement</span>
          <span>Vol {flightCode(c.id)}</span>
        </div>
        <div className="flex flex-col gap-[26px] px-7 pb-[30px] pt-[26px]">
          <div className="flex items-center gap-[18px]">
            <div>
              <div className="font-display text-[13px] font-medium" style={{ color: INK_SOFT }}>Collecté</div>
              <div className="display" style={{ fontSize: "clamp(40px, 6vw, 84px)", fontStretch: "70%", lineHeight: 0.85 }}>{eth(c.raised, 2)}</div>
            </div>
            {/* L'avion avance avec la collecte : à l'objectif, il arrive au bout de la ligne. */}
            <div className="flex min-w-[70px] flex-1 flex-col items-center gap-1">
              <div aria-hidden="true" className="relative w-full" style={{ height: PLANE_SIZE }}>
                <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-night" />
                <span className="db-bar absolute left-0 top-1/2 -mt-px border-t-[4px] border-night" style={{ width: `${planeAt}%` }} />
                <PlaneIcon size={PLANE_SIZE} className="absolute top-0" style={{ left: `clamp(0px, calc(${planeAt}% - ${PLANE_SIZE / 2}px), calc(100% - ${PLANE_SIZE}px))` }} />
              </div>
              <span className="mono text-[13px] font-bold">{funded} %</span>
            </div>
            <div className="text-right">
              <div className="font-display text-[13px] font-medium" style={{ color: INK_SOFT }}>Objectif</div>
              <div className="display" style={{ fontSize: "clamp(40px, 6vw, 84px)", fontStretch: "70%", lineHeight: 0.85 }}>{eth(c.goal, 2)} ETH</div>
            </div>
          </div>
          <div className="mono grid gap-x-4 gap-y-[18px] text-[16px] font-bold" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))" }}>
            <Field label="Club">{metadata?.club ?? "—"}</Field>
            <Field label="Statut">{status.label}</Field>
            <Field label="Versé au club">{eth(toClub, 3)} ETH</Field>
            <Field label="En séquestre">{eth(escrow > 0n ? escrow : 0n, 3)} ETH</Field>
            <Field label={c.deadline <= now ? "Collecte close" : "Fin de la collecte"}>
              <span title={dateTime(c.deadline)}>{relative(c.deadline, now)}</span>
            </Field>
            <Field label="Bénéficiaire" isRaw>{shortAddress(c.beneficiary)}</Field>
          </div>
        </div>
      </div>
      <div className="flex flex-[1_1_190px] flex-col justify-between gap-4 border-l-[3px] border-dashed border-night px-6 py-[26px]">
        <div>
          <div className="font-display text-[13px] font-medium" style={{ color: INK_SOFT }}>Vol</div>
          <span className="display whitespace-nowrap text-[64px]" style={{ fontStretch: "70%", lineHeight: 0.9, overflowWrap: "normal" }}>{flightCode(c.id)}</span>
        </div>
        <div
          aria-hidden="true"
          className="h-[74px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #09090A 0, #09090A 3px, transparent 3px, transparent 5px, #09090A 5px, #09090A 6px, transparent 6px, transparent 10px, #09090A 10px, #09090A 14px, transparent 14px, transparent 16px)",
          }}
        />
        <div className="mono text-[12px]" style={{ color: INK_SOFT }}>
          CONTRAT {deployment ? shortAddress(deployment.CampusFund) : "—"}
          <br />
          STATUT SUR LA CHAÎNE : {STATUS_LABELS[c.status].toUpperCase()}
        </div>
      </div>
    </section>
  );
}
