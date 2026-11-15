"use client";

import { isAddress, parseEther } from "ethers";
import { useState } from "react";
import { ErrorPanel, TxStrip } from "@/components/board/Feedback";
import { getContracts } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";
import { type EscaleDraft, EscalesEditor, ItineraryPreview } from "./EscalesEditor";

const CATEGORIES = ["Compétition", "Matériel", "Événement", "Culture"];
const DAY = 86_400;
const DEMO_SECONDS = 3_600;
const MAX_DAYS = 90;

interface FormState {
  name: string;
  club: string;
  category: string;
  description: string;
  goal: string;
  days: string;
  isDemoHour: boolean;
  beneficiary: string;
}

const INITIAL: FormState = { name: "", club: "", category: CATEGORIES[0], description: "", goal: "4", days: "30", isDemoHour: false, beneficiary: "" };
const INITIAL_ESCALES: EscaleDraft[] = [40, 35, 25].map((pct) => ({ title: "", proof: "", pct }));

type Upload = { state: "idle" | "uploading" | "done" | "error"; message?: string; mode?: string };

function parseGoal(goal: string): bigint {
  try {
    return parseEther(goal || "0");
  } catch {
    return 0n;
  }
}

/** Ce qui empêche encore la publication, dans l'ordre du formulaire. */
function findProblems(form: FormState, escales: EscaleDraft[], beneficiary: string): string[] {
  const problems: string[] = [];
  const days = Number(form.days);
  if (form.name.trim().length < 3) problems.push("Nom de la campagne : 3 caractères minimum.");
  if (parseGoal(form.goal) <= 0n) problems.push("Objectif : un montant en ETH supérieur à 0.");
  if (!form.isDemoHour && (!Number.isInteger(days) || days < 1 || days > MAX_DAYS)) problems.push("Durée : un nombre entier de jours entre 1 et 90.");
  if (escales.reduce((a, e) => a + e.pct, 0) !== 100) problems.push("La somme des escales doit faire exactement 100 %.");
  if (escales.some((e) => e.title.trim().length < 3)) problems.push("Chaque escale doit avoir un intitulé.");
  if (form.club.trim().length < 2) problems.push("Club : nom manquant.");
  if (form.description.trim().length < 20) problems.push("Description : 20 caractères minimum.");
  if (!isAddress(beneficiary)) problems.push("Bénéficiaire : adresse invalide (ou connectez MetaMask).");
  return problems;
}

const LABEL = "tag-b text-gray";

function NumberField({ id, label, unit, value, onChange, hint, ...rest }: { id: string; label: string; unit: string; value: string; onChange: (v: string) => void; hint?: string; min?: string; max?: string; step?: string; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="db-tile flex items-center gap-3 rounded-lg px-5">
        <input id={id} type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="field-bare h-[72px] text-[40px] disabled:opacity-40" {...rest} />
        <span className="mono text-[16px] font-bold">{unit}</span>
      </div>
      {hint && <span className="mono text-[12px] text-gray">{hint}</span>}
    </div>
  );
}

/** Plan de vol = création d'une campagne : métadonnées sur IPFS, puis createCampaign. */
export function FlightPlanForm() {
  const { account } = useWeb3();
  const { status, send, busy } = useTx();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [escales, setEscales] = useState<EscaleDraft[]>(INITIAL_ESCALES);
  const [upload, setUpload] = useState<Upload>({ state: "idle" });
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const beneficiary = form.beneficiary.trim() || account || "";
  const problems = findProblems(form, escales, beneficiary);
  const isValid = problems.length === 0;
  const isSending = busy || upload.state === "uploading";
  const goalEth = Number(form.goal) > 0 ? Number(form.goal) : 0;

  async function publish() {
    if (!isValid) return;
    setUpload({ state: "uploading" });
    let cid: string;
    try {
      const res = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          club: form.club.trim(),
          category: form.category,
          description: form.description.trim(),
          milestones: escales.map((e) => ({ title: e.title.trim(), description: e.proof.trim() })),
        }),
      });
      const body = (await res.json()) as { cid?: string; mode?: string; error?: string };
      if (!res.ok || !body.cid) throw new Error(body.error ?? `Erreur ${res.status}`);
      cid = body.cid;
      setUpload({ state: "done", message: cid, mode: body.mode });
    } catch (e) {
      setUpload({ state: "error", message: e instanceof Error ? e.message : "Échec de l'envoi IPFS" });
      return;
    }
    const duration = form.isDemoHour ? DEMO_SECONDS : Number(form.days) * DAY;
    const bps = escales.map((e) => e.pct * 100); // points de base côté contrat
    await send((s) => getContracts(s).fund.createCampaign(parseGoal(form.goal), duration, beneficiary, cid, bps));
  }

  const note = isValid ? "Tout est en ordre. Les métadonnées partent sur IPFS, puis MetaMask demande la signature de la transaction." : problems[0];

  return (
    <form
      className="m-0 flex min-w-0 flex-[999_1_600px] flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        void publish();
      }}
    >
      <div className="flex flex-col gap-2.5">
        <label htmlFor="cf-title" className={LABEL}>
          01 · Nom de la campagne
        </label>
        <input id="cf-title" type="text" maxLength={120} placeholder="EX. HACKATHON IA 24 H" value={form.name} onChange={(e) => set({ name: e.target.value })} className="field db-tile !min-h-[72px] !text-[26px] uppercase tracking-[.04em]" />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        <NumberField id="cf-goal" label="02 · Objectif en ETH" unit="ETH" min="0" step="0.1" value={form.goal} onChange={(v) => set({ goal: v })} />
        <div className="flex flex-col gap-2.5">
          <NumberField id="cf-days" label="03 · Durée de la collecte" unit="JOURS" min="1" max="90" step="1" value={form.days} onChange={(v) => set({ days: v })} disabled={form.isDemoHour} />
          <button type="button" aria-pressed={form.isDemoHour} onClick={() => set({ isDemoHour: !form.isDemoHour })} className={`btn btn-sm self-start !min-h-[40px] ${form.isDemoHour ? "btn-amber" : "btn-ghost"}`}>
            1 h · démo
          </button>
          <span className="mono text-[12px] text-gray">DE 1 H À 90 JOURS SUR LE CONTRAT</span>
        </div>
      </div>

      <EscalesEditor escales={escales} goalEth={goalEth} onChange={setEscales} />
      <ItineraryPreview escales={escales} />

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="cf-club" className={LABEL}>05 · Club</label>
          <input id="cf-club" maxLength={120} value={form.club} onChange={(e) => set({ club: e.target.value })} placeholder="Ex. Club IA" className="field db-tile" />
        </div>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="cf-cat" className={LABEL}>06 · Catégorie</label>
          <select id="cf-cat" value={form.category} onChange={(e) => set({ category: e.target.value })} className="field db-tile">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <label htmlFor="cf-desc" className={LABEL}>07 · Description (publiée sur IPFS)</label>
        <textarea id="cf-desc" maxLength={4000} value={form.description} onChange={(e) => set({ description: e.target.value })} className="field" />
      </div>
      <div className="flex flex-col gap-2.5">
        <label htmlFor="cf-ben" className={LABEL}>08 · Bénéficiaire (wallet du club)</label>
        <input id="cf-ben" value={form.beneficiary} onChange={(e) => set({ beneficiary: e.target.value })} placeholder={account ?? "0x…"} className="field db-tile !text-[14px]" />
        <span className="mono text-[12px] text-gray">VIDE = VOTRE ADRESSE CONNECTÉE</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <button type="submit" disabled={!isValid || isSending} className="btn btn-amber !min-h-[68px] !px-[34px] !text-[16px]">
          {upload.state === "uploading" ? "Envoi sur IPFS…" : busy ? "Transaction en cours…" : status.kind === "success" ? "Plan de vol déposé" : "Publier la campagne"}
        </button>
        <span className="flex-[1_1_280px] text-[15px] text-[#C9C7C0]" aria-live="polite">
          {note}
        </span>
      </div>
      {upload.state === "done" && (
        <p className="mono m-0 break-all rounded-md bg-tile-2 px-4 py-3 text-[12px]" style={{ color: upload.mode === "local" ? "var(--amber)" : "var(--ok)" }}>
          {upload.mode === "local" ? "MODE DEV : PINATA_JWT ABSENT, MÉTADONNÉES GARDÉES EN LOCAL. CID : " : "MÉTADONNÉES ÉPINGLÉES SUR IPFS. CID : "}
          {upload.message}
        </p>
      )}
      {upload.state === "error" && <ErrorPanel title="Envoi IPFS impossible">{upload.message}</ErrorPanel>}
      <TxStrip status={status} />
    </form>
  );
}
