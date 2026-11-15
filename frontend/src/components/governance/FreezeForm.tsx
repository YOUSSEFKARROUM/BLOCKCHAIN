"use client";

import { useState } from "react";
import { TxStrip } from "@/components/board/Feedback";
import { fallbackName } from "@/lib/campaignView";
import type { Campaign } from "@/lib/data";
import { getContracts } from "@/lib/contracts";
import { useTx } from "@/lib/useTx";

const MIN_REASON = 5;
const MAX_REASON = 200;

/** Signaler un vol suspect : proposition de gel (réservée aux détenteurs du seuil de CFD). */
export function FreezeForm({ campaigns, thresholdCfd }: { campaigns: Campaign[]; thresholdCfd: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [reason, setReason] = useState("");
  const { status, send, busy } = useTx();
  const isValid = campaignId !== "" && reason.trim().length >= MIN_REASON;

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="btn btn-ghost btn-sm self-start" style={{ borderColor: "var(--alert)" }}>
        Signaler un vol suspect · proposer un gel
      </button>
    );
  }
  return (
    <form
      className="flex flex-col gap-5 rounded-[10px] border-[1.5px] border-alert bg-[#0E0E10] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) void send((s) => getContracts(s).governance.proposeFreeze(Number(campaignId), reason.trim()));
      }}
    >
      <h3 className="display display-s text-alert">Proposer un gel</h3>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="freeze-campaign" className="tag-b text-gray">
            Vol (campagne)
          </label>
          <select id="freeze-campaign" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="field db-tile">
            <option value="">Choisir…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {fallbackName(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="freeze-reason" className="tag-b text-gray">
            Motif (visible par tous)
          </label>
          <input
            id="freeze-reason"
            value={reason}
            maxLength={MAX_REASON}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : adresses toutes financées par le même compte"
            className="field db-tile !font-normal"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy || !isValid} className="btn btn-sm !min-h-[52px] bg-alert text-night">
          Déposer la demande de gel
        </button>
        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm !min-h-[52px]">
          Annuler
        </button>
        <span className="text-[14px] text-gray">Il faut au moins {thresholdCfd} CFD délégués avant ce bloc (anti-spam).</span>
      </div>
      <TxStrip status={status} />
    </form>
  );
}
