import type { Contract } from "ethers";

export const STATUS_LABELS = ["En cours", "Réussie", "Échouée", "Annulée"] as const;
export type StatusIndex = 0 | 1 | 2 | 3;

export interface Campaign {
  id: number;
  creator: string;
  beneficiary: string;
  goal: bigint;
  raised: bigint;
  released: bigint;
  refunded: bigint;
  deadline: number;
  /** Dernière avancée (clôture ou jalon approuvé) : point de départ du délai d'annulation. */
  lastProgressAt: number;
  status: StatusIndex;
  milestoneCount: number;
  approvedMilestones: number;
  withdrawnMilestones: number;
  metadataCID: string;
  milestonesBps: number[];
}

export interface Proposal {
  id: number;
  ptype: 0 | 1; // 0 = déblocage de jalon, 1 = gel
  milestoneIndex: number;
  quadratic: boolean;
  executed: boolean;
  proposer: string;
  snapshotBlock: number;
  voteEnd: number;
  campaignId: number;
  forVotes: bigint;
  againstVotes: bigint;
  participation: bigint;
  quorum: bigint;
  description: string;
  proof: string; // CID IPFS ou lien de preuve (déblocage uniquement)
  state: 0 | 1 | 2 | 3; // Active, Defeated, Succeeded, Executed
}

export const PROPOSAL_STATE_LABELS = ["Vote en cours", "Rejetée", "Adoptée", "Exécutée"] as const;

export async function loadCampaign(fund: Contract, id: number): Promise<Campaign> {
  const [c, bps] = await Promise.all([fund.getCampaign(id), fund.getMilestones(id)]);
  return {
    id,
    creator: c.creator,
    beneficiary: c.beneficiary,
    goal: c.goal,
    raised: c.raised,
    released: c.released,
    refunded: c.refunded,
    deadline: Number(c.deadline),
    lastProgressAt: Number(c.lastProgressAt),
    status: Number(c.status) as StatusIndex,
    milestoneCount: Number(c.milestoneCount),
    approvedMilestones: Number(c.approvedMilestones),
    withdrawnMilestones: Number(c.withdrawnMilestones),
    metadataCID: c.metadataCID,
    milestonesBps: (bps as bigint[]).map(Number),
  };
}

export async function loadCampaigns(fund: Contract): Promise<Campaign[]> {
  const count = Number(await fund.campaignCount());
  return Promise.all(Array.from({ length: count }, (_, i) => loadCampaign(fund, i)));
}

export async function loadProposals(governance: Contract): Promise<Proposal[]> {
  const count = Number(await governance.proposalCount());
  const ids = Array.from({ length: count }, (_, i) => i);
  const proposals = await Promise.all(
    ids.map(async (id) => {
      const [p, state] = await Promise.all([governance.getProposal(id), governance.state(id)]);
      return {
        id,
        ptype: Number(p.ptype) as 0 | 1,
        milestoneIndex: Number(p.milestoneIndex),
        quadratic: p.quadratic,
        executed: p.executed,
        proposer: p.proposer,
        snapshotBlock: Number(p.snapshotBlock),
        voteEnd: Number(p.voteEnd),
        campaignId: Number(p.campaignId),
        forVotes: p.forVotes,
        againstVotes: p.againstVotes,
        participation: p.participation,
        quorum: p.quorum,
        description: p.description,
        proof: p.proof,
        state: Number(state) as Proposal["state"],
      } satisfies Proposal;
    }),
  );
  return proposals.reverse(); // les plus récentes d'abord
}

/** Montant (frais inclus) de chaque tranche, identique au calcul du contrat. */
export function trancheAmounts(c: Campaign): bigint[] {
  const amounts = c.milestonesBps.map((bps) => (c.raised * BigInt(bps)) / 10_000n);
  const allButLast = amounts.slice(0, -1).reduce((a, b) => a + b, 0n);
  return [...amounts.slice(0, -1), c.raised - allButLast];
}
