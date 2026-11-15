import { PlaneIcon } from "@/components/board/Icons";
import { deployment } from "@/lib/contracts";
import { boardStatus, ESCALE_LABELS, type EscaleState, escaleStates, flightCode } from "@/lib/campaignView";
import { type Campaign, type Proposal, trancheAmounts } from "@/lib/data";
import { dateTime, eth, relative, shortAddress } from "@/lib/format";
import type { RiskEntry } from "@/lib/hooks";
import type { CampaignMetadata } from "@/lib/metadata";

const ONCHAIN_STATUS = ["Active", "Successful", "Failed", "Cancelled"];
const INK_SOFT = "#55554F"; // gris sur billet : contraste 6,6:1
const INK_OK = "#0B6B2A";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mono text-[11px] tracking-[.14em]" style={{ color: INK_SOFT }}>
        {label}
      </div>
      <div className="break-words uppercase">{children}</div>
    </div>
  );
}

function EscaleDot({ state }: { state: EscaleState }) {
  const fill = state === "paid" ? "var(--night)" : state === "locked" ? "var(--ticket)" : "var(--amber)";
  return (
    <span
      className={`box-border h-6 w-6 rounded-full border-[3px] border-night ${state === "voting" ? "db-blink" : ""}`}
      style={{ background: fill }}
    />
  );
}

function EscaleStateText({ state }: { state: EscaleState }) {
  if (state === "paid") return <span className="font-bold" style={{ color: INK_OK }}>VERSÉE</span>;
  if (state === "locked") return <span style={{ color: INK_SOFT }}>VERROUILLÉE</span>;
  return <span className="bg-amber px-1.5 font-bold uppercase">{ESCALE_LABELS[state]}</span>;
}

/** Itinéraire des escales : trait plein jusqu'à l'avion, pointillés ensuite. */
function Itinerary({ campaign: c, states, metadata }: { campaign: Campaign; states: EscaleState[]; metadata: CampaignMetadata | null }) {
  const n = states.length;
  const tranches = trancheAmounts(c);
  const firstUnpaid = states.findIndex((s) => s !== "paid");
  const current = firstUnpaid === -1 ? n - 1 : firstUnpaid;
  const center = (i: number) => `${((i + 0.5) / n) * 100}%`;
  const edge = `${(0.5 / n) * 100}%`;
  const summary = states.map((s, i) => `escale ${i + 1} ${ESCALE_LABELS[s].toLowerCase()}`).join(", ");
  return (
    <div className="relative pt-[34px]" role="img" aria-label={`${n} escales : ${summary}`}>
      <div className="absolute top-[45px] border-t-[3px] border-night" style={{ left: edge, right: edge }} />
      {current < n - 1 && <div className="absolute top-[45px] border-t-[3px] border-dashed border-ticket" style={{ left: center(current), right: edge }} />}
      <PlaneIcon className="db-bob absolute top-0 text-night" style={{ left: center(current) }} />
      <div className="mono relative grid text-center text-[12px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {states.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-1">
            <EscaleDot state={s} />
            <strong className="text-[14px]">ESCALE {i + 1}</strong>
            <span className="hidden sm:inline">{metadata?.milestones[i]?.title ?? `Jalon ${i + 1}`}</span>
            <span>
              {c.milestonesBps[i] / 100} % · {eth(tranches[i], 2)} ETH
            </span>
            <EscaleStateText state={s} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface BoardingPassProps {
  campaign: Campaign;
  proposals: Proposal[];
  metadata: CampaignMetadata | null;
  risk: RiskEntry | undefined;
  now: number;
  feePercent: number;
}

/** Carte d'embarquement : la campagne résumée sur un billet (maquette Campaign). */
export function BoardingPass({ campaign: c, proposals, metadata, risk, now, feePercent }: BoardingPassProps) {
  const status = boardStatus(c, proposals, now);
  const states = escaleStates(c, proposals);
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
              <div className="mono text-[11px] tracking-[.14em]" style={{ color: INK_SOFT }}>COLLECTÉ</div>
              <div className="display" style={{ fontSize: "clamp(40px, 6vw, 84px)", fontStretch: "70%", lineHeight: 0.85 }}>{eth(c.raised, 2)}</div>
            </div>
            <div aria-hidden="true" className="flex min-w-[60px] flex-1 items-center gap-2">
              <span className="flex-1 border-t-2 border-dashed border-night" />
              <PlaneIcon size={34} />
              <span className="flex-1 border-t-2 border-dashed border-night" />
            </div>
            <div className="text-right">
              <div className="mono text-[11px] tracking-[.14em]" style={{ color: INK_SOFT }}>OBJECTIF</div>
              <div className="display" style={{ fontSize: "clamp(40px, 6vw, 84px)", fontStretch: "70%", lineHeight: 0.85 }}>{eth(c.goal, 2)} ETH</div>
            </div>
          </div>
          <div className="mono grid gap-x-4 gap-y-[18px] text-[16px] font-bold" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))" }}>
            <Field label="CLUB">{metadata?.club ?? "—"}</Field>
            <Field label="STATUT">{status.label}</Field>
            <Field label="VERSÉ AU CLUB">{eth(toClub, 3)} ETH</Field>
            <Field label="EN SÉQUESTRE">{eth(escrow > 0n ? escrow : 0n, 3)} ETH</Field>
            <Field label="ÉCHÉANCE">
              <span title={dateTime(c.deadline)}>{relative(c.deadline, now)}</span>
            </Field>
            <Field label="BÉNÉFICIAIRE">{shortAddress(c.beneficiary)}</Field>
          </div>
          <Itinerary campaign={c} states={states} metadata={metadata} />
        </div>
      </div>
      <div className="flex flex-[1_1_190px] flex-col justify-between gap-4 border-l-[3px] border-dashed border-night px-6 py-[26px]">
        <div>
          <div className="mono text-[11px] tracking-[.14em]" style={{ color: INK_SOFT }}>SCANNER IA</div>
          {risk ? (
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="display whitespace-nowrap text-[96px]" style={{ fontStretch: "70%", lineHeight: 0.85, overflowWrap: "normal" }}>{Math.round(risk.score)}</span>
              <span className="mono text-[14px] font-bold uppercase" style={{ color: risk.level === "Faible" ? INK_OK : "#9A2A00" }}>
                {risk.level}
              </span>
            </div>
          ) : (
            <p className="mono m-0 mt-2 text-[13px] font-bold">NON CALCULÉ</p>
          )}
        </div>
        <div
          aria-hidden="true"
          className="h-[74px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #09090A 0, #09090A 3px, transparent 3px, transparent 5px, #09090A 5px, #09090A 6px, transparent 6px, transparent 10px, #09090A 10px, #09090A 14px, transparent 14px, transparent 16px)",
          }}
        />
        <div className="mono text-[11px] tracking-[.08em]" style={{ color: INK_SOFT }}>
          CONTRAT {deployment ? shortAddress(deployment.CampusFund) : "—"}
          <br />
          STATUT ON-CHAIN : {ONCHAIN_STATUS[c.status].toUpperCase()}
        </div>
      </div>
    </section>
  );
}
