import type { Campaign, Proposal } from "./data";

/** Couleurs du tableau des départs (maquettes). */
export const COLORS = {
  amber: "#FFB800",
  ticket: "#F2F0E8",
  ok: "#4CD964",
  alert: "#FF6A3D",
  gray: "#A9A9B2",
} as const;

export type BoardFilter = "all" | "flying" | "boarding" | "cancel";

export const BOARD_FILTERS: { value: BoardFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "flying", label: "Financées" },
  { value: "boarding", label: "En collecte" },
  { value: "cancel", label: "Annulées" },
];

export interface BoardStatus {
  label: string;
  color: string;
  isBlinking: boolean;
  filter: Exclude<BoardFilter, "all">;
}

/** Numéro de vol affiché : campagne 0 → « CF 01 ». */
export function flightCode(id: number): string {
  return `CF ${String(id + 1).padStart(2, "0")}`;
}

/** Nom de secours tant que les métadonnées IPFS ne sont pas lues : même numéro que le vol. */
export function fallbackName(id: number): string {
  return `Campagne ${flightCode(id)}`;
}

function openProposal(proposals: Proposal[], campaignId: number, ptype: 0 | 1): Proposal | undefined {
  return proposals.find((p) => p.campaignId === campaignId && p.ptype === ptype && p.state === 0);
}

function activeStatus(c: Campaign, hasFreeze: boolean, now: number): BoardStatus {
  if (hasFreeze) return { label: "Gel proposé", color: COLORS.alert, isBlinking: true, filter: "boarding" };
  if (now >= c.deadline) return { label: "À clôturer", color: COLORS.amber, isBlinking: false, filter: "boarding" };
  return { label: "Collecte", color: COLORS.ticket, isBlinking: false, filter: "boarding" };
}

function fundedStatus(c: Campaign, hasFreeze: boolean, hasRelease: boolean): BoardStatus {
  const base = { filter: "flying" as const };
  if (hasFreeze) return { ...base, label: "Gel proposé", color: COLORS.alert, isBlinking: true };
  if (hasRelease) return { ...base, label: "Vote en cours", color: COLORS.amber, isBlinking: true };
  if (c.approvedMilestones > c.withdrawnMilestones) return { ...base, label: "Prête au décollage", color: COLORS.amber, isBlinking: false };
  if (c.withdrawnMilestones === c.milestoneCount) return { ...base, label: "Arrivée", color: COLORS.ok, isBlinking: false };
  if (c.withdrawnMilestones > 0) return { ...base, label: "Tranche versée", color: COLORS.ok, isBlinking: false };
  return { ...base, label: "Financée", color: COLORS.ok, isBlinking: false };
}

/** Statut affiché sur le tableau, dérivé de l'état on-chain et des propositions ouvertes. */
export function boardStatus(c: Campaign, proposals: Proposal[], now: number): BoardStatus {
  const hasFreeze = Boolean(openProposal(proposals, c.id, 1));
  const hasRelease = Boolean(openProposal(proposals, c.id, 0));
  switch (c.status) {
    case 0:
      return activeStatus(c, hasFreeze, now);
    case 1:
      return fundedStatus(c, hasFreeze, hasRelease);
    case 2:
      return { label: "Remboursement", color: COLORS.alert, isBlinking: false, filter: "cancel" };
    default:
      return { label: "Vol annulé", color: COLORS.alert, isBlinking: false, filter: "cancel" };
  }
}

export type EscaleState = "paid" | "approved" | "voting" | "locked";

export const ESCALE_LABELS: Record<EscaleState, string> = {
  paid: "Versée",
  approved: "Approuvée, à retirer",
  voting: "Vote en cours",
  locked: "Verrouillée",
};

/** État de chaque escale (jalon) : versée, approuvée, en vote ou verrouillée. */
export function escaleStates(c: Campaign, proposals: Proposal[]): EscaleState[] {
  const voting = proposals.find((p) => p.campaignId === c.id && p.ptype === 0 && p.state === 0);
  return c.milestonesBps.map((_, i) => {
    if (i < c.withdrawnMilestones) return "paid";
    if (i < c.approvedMilestones) return "approved";
    if (voting && voting.milestoneIndex === i) return "voting";
    return "locked";
  });
}

/** Proposition de déblocage ouverte pour un jalon donné (pour afficher ses compteurs). */
export function releaseProposalFor(proposals: Proposal[], campaignId: number, milestoneIndex: number): Proposal | undefined {
  return proposals.find((p) => p.campaignId === campaignId && p.ptype === 0 && p.milestoneIndex === milestoneIndex && p.state === 0);
}
