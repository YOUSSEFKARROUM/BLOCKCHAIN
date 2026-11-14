"use client";

import { isAddress, parseEther } from "ethers";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorBox, MilestoneTrack, StatusPill, TxFeedback } from "@/components/ui";
import { getContracts } from "@/lib/contracts";
import { type Campaign, trancheAmounts } from "@/lib/data";
import { eth } from "@/lib/format";
import { useCampaigns, useMetadata } from "@/lib/hooks";
import { useTx } from "@/lib/useTx";
import { useWeb3 } from "@/lib/web3";

export default function CreatorPage() {
  const { account } = useWeb3();
  const { data: campaigns } = useCampaigns();
  const mine = (campaigns ?? []).filter(
    (c) => account && (c.creator.toLowerCase() === account.toLowerCase() || c.beneficiary.toLowerCase() === account.toLowerCase()),
  );

  return (
    <div className="space-y-10 pt-6">
      <header>
        <h1 className="display-l two-tone">
          Espace porteur.
          <span>Lancer et piloter une campagne.</span>
        </h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <CreateForm />
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Mes campagnes</h2>
          {!account && <EmptyState title="Connectez MetaMask">pour voir les campagnes dont vous êtes porteur ou bénéficiaire.</EmptyState>}
          {account && mine.length === 0 && <EmptyState title="Aucune campagne pour ce compte" />}
          {mine.map((c) => (
            <MyCampaign key={c.id} campaign={c} />
          ))}
        </section>
      </div>
    </div>
  );
}

interface MilestoneDraft {
  title: string;
  description: string;
  percent: string;
}

const CATEGORIES = ["Compétition", "Matériel", "Événement", "Culture"];
const DURATIONS = [
  { label: "1 heure (démo)", seconds: 3_600 },
  { label: "1 jour", seconds: 86_400 },
  { label: "7 jours", seconds: 604_800 },
  { label: "30 jours", seconds: 2_592_000 },
  { label: "90 jours", seconds: 7_776_000 },
];

function CreateForm() {
  const { account } = useWeb3();
  const { status, send, busy } = useTx();
  const [form, setForm] = useState({ name: "", club: "", category: CATEGORIES[0], description: "", goal: "2", duration: 604_800, beneficiary: "" });
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "", description: "", percent: "50" },
    { title: "", description: "", percent: "50" },
  ]);
  const [upload, setUpload] = useState<{ state: "idle" | "uploading" | "done" | "error"; message?: string; mode?: string }>({ state: "idle" });

  const total = milestones.reduce((s, m) => s + Number(m.percent || 0), 0);
  const beneficiary = form.beneficiary.trim() || account || "";
  const problems: string[] = [];
  if (form.name.trim().length < 3) problems.push("Titre trop court.");
  if (form.club.trim().length < 2) problems.push("Club manquant.");
  if (form.description.trim().length < 20) problems.push("Description : 20 caractères minimum.");
  let goalWei = 0n;
  try {
    goalWei = parseEther(form.goal || "0");
  } catch {
    problems.push("Objectif invalide.");
  }
  if (goalWei <= 0n) problems.push("L'objectif doit être > 0.");
  if (!isAddress(beneficiary)) problems.push("Adresse du bénéficiaire invalide.");
  if (milestones.some((m) => m.title.trim().length < 3)) problems.push("Chaque jalon doit avoir un titre.");
  if (milestones.some((m) => !Number.isInteger(Number(m.percent)) || Number(m.percent) <= 0)) problems.push("Pourcentages entiers > 0.");
  if (total !== 100) problems.push(`Les jalons totalisent ${total} % au lieu de 100 %.`);

  function setMilestone(i: number, patch: Partial<MilestoneDraft>) {
    setMilestones((list) => list.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  async function submit() {
    if (problems.length > 0) return;
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
          milestones: milestones.map((m) => ({ title: m.title.trim(), description: m.description.trim() })),
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
    const bps = milestones.map((m) => Number(m.percent) * 100);
    await send((s) => getContracts(s).fund.createCampaign(goalWei, form.duration, beneficiary, cid, bps));
  }

  return (
    <form
      className="card space-y-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2 className="font-display text-2xl">Nouvelle campagne</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Titre du projet</label>
          <input id="name" className="input" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. : Drone de cartographie du club aéro" />
        </div>
        <div>
          <label className="label" htmlFor="club">Club / association</label>
          <input id="club" className="input" maxLength={120} value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="cat">Catégorie</label>
          <select id="cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="desc">Description</label>
          <textarea id="desc" className="input min-h-28" maxLength={4000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="goal">Objectif (ETH)</label>
          <input id="goal" className="input" inputMode="decimal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value.replace(",", ".") })} />
        </div>
        <div>
          <label className="label" htmlFor="dur">Durée de la collecte</label>
          <select id="dur" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}>
            {DURATIONS.map((d) => (
              <option key={d.seconds} value={d.seconds}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="ben">Bénéficiaire (wallet du club)</label>
          <input id="ben" className="input font-mono text-xs" value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} placeholder={account ?? "0x…"} />
          <p className="mt-1 text-xs text-[var(--ink-soft)]">Vide = votre adresse connectée.</p>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="label">
          {milestones.length} jalons sur 5 possibles, total {total} %
        </legend>
        {milestones.map((m, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border border-[var(--line)] p-3 sm:grid-cols-[1fr_80px_auto]">
            <input className="input" aria-label={`Titre du jalon ${i + 1}`} placeholder={`Jalon ${i + 1} : titre`} value={m.title} onChange={(e) => setMilestone(i, { title: e.target.value })} />
            <input className="input text-right" aria-label={`Pourcentage du jalon ${i + 1}`} inputMode="numeric" value={m.percent} onChange={(e) => setMilestone(i, { percent: e.target.value })} />
            <button type="button" className="btn-ghost !px-3" disabled={milestones.length <= 2} onClick={() => setMilestones((l) => l.filter((_, j) => j !== i))} aria-label={`Supprimer le jalon ${i + 1}`}>
              Retirer
            </button>
            <input className="input sm:col-span-3" aria-label={`Preuve attendue pour le jalon ${i + 1}`} placeholder="Preuve attendue (facture, vidéo…)" value={m.description} onChange={(e) => setMilestone(i, { description: e.target.value })} />
          </div>
        ))}
        <button type="button" className="btn-ghost" disabled={milestones.length >= 5} onClick={() => setMilestones((l) => [...l, { title: "", description: "", percent: "0" }])}>
          Ajouter un jalon
        </button>
      </fieldset>

      {problems.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-[var(--ink-soft)]">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <button type="submit" className="btn-primary w-full" disabled={problems.length > 0 || busy || upload.state === "uploading"}>
        {upload.state === "uploading" ? "Envoi des métadonnées sur IPFS…" : busy ? "Transaction en cours…" : "Publier sur IPFS puis créer la campagne"}
      </button>
      {upload.state === "done" && (
        <p className={`rounded-xl p-3 text-xs ${upload.mode === "local" ? "tone-warn" : "tone-ok"}`}>
          {upload.mode === "local"
            ? "Mode dev : PINATA_JWT absent, métadonnées stockées localement (non publiées sur IPFS). CID : "
            : "Métadonnées épinglées sur IPFS (Pinata). CID : "}
          <span className="break-all font-mono">{upload.message}</span>
        </p>
      )}
      {upload.state === "error" && <ErrorBox title="Envoi IPFS impossible">{upload.message}</ErrorBox>}
      <TxFeedback status={status} />
    </form>
  );
}

function MyCampaign({ campaign: c }: { campaign: Campaign }) {
  const { account } = useWeb3();
  const { metadata } = useMetadata(c.metadataCID);
  const { status, send, busy } = useTx();
  const isBeneficiary = account?.toLowerCase() === c.beneficiary.toLowerCase();
  const isCreator = account?.toLowerCase() === c.creator.toLowerCase();
  const tranches = trancheAmounts(c);
  const canRequest = c.status === 1 && c.approvedMilestones < c.milestoneCount && (isCreator || isBeneficiary);
  const canWithdraw = c.status === 1 && c.withdrawnMilestones < c.approvedMilestones && isBeneficiary;
  const canCancel = c.status === 0 && c.raised === 0n && isCreator;
  const next = c.withdrawnMilestones;

  return (
    <div className="card space-y-3 p-5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/campaign/${c.id}`} className="font-display text-lg hover:underline">
          {metadata?.name ?? `Campagne n°${c.id}`}
        </Link>
        <StatusPill status={c.status} />
      </div>
      <MilestoneTrack bps={c.milestonesBps} approved={c.approvedMilestones} withdrawn={c.withdrawnMilestones} />
      <div className="flex flex-wrap gap-2">
        {canRequest && (
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() =>
              void send((s) =>
                getContracts(s).governance.proposeMilestoneRelease(c.id, `Jalon ${c.approvedMilestones + 1} atteint : ${metadata?.milestones[c.approvedMilestones]?.title ?? ""}`),
              )
            }
          >
            Demander le déblocage du jalon {c.approvedMilestones + 1}
          </button>
        )}
        {canWithdraw && (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.withdrawTranche(c.id))}>
            Retirer la tranche {next + 1} ({eth((tranches[next] * 98n) / 100n)} ETH nets)
          </button>
        )}
        {canCancel && (
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void send((s) => getContracts(s).fund.cancelCampaign(c.id))}>
            Annuler (aucune contribution)
          </button>
        )}
      </div>
      {c.status === 1 && !isBeneficiary && c.withdrawnMilestones < c.approvedMilestones && (
        <p className="text-xs text-[var(--ink-soft)]">Seul le bénéficiaire peut retirer les tranches approuvées.</p>
      )}
      <TxFeedback status={status} />
    </div>
  );
}
