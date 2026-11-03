import { interfaces } from "./contracts";

/** Traduction des erreurs personnalisées Solidity en messages compréhensibles. */
const MESSAGES: Record<string, string> = {
  InvalidGoal: "L'objectif doit être supérieur à 0.",
  InvalidDuration: "La durée doit être comprise entre 1 heure et 90 jours.",
  InvalidBeneficiary: "Adresse du bénéficiaire invalide.",
  InvalidMilestones: "Il faut 2 à 5 jalons, chacun > 0 %, pour un total de 100 %.",
  EmptyMetadata: "Le CID IPFS des métadonnées est vide.",
  CampaignNotFound: "Cette campagne n'existe pas.",
  WrongStatus: "Action impossible dans l'état actuel de la campagne.",
  DeadlinePassed: "La collecte est terminée.",
  DeadlineNotReached: "L'échéance n'est pas encore atteinte.",
  ZeroAmount: "Le montant doit être supérieur à 0.",
  NotCreator: "Seul le porteur de la campagne peut faire cela.",
  NotBeneficiary: "Seul le bénéficiaire peut retirer une tranche.",
  AlreadyHasContributions: "Impossible d'annuler : la campagne a déjà reçu des contributions.",
  NoApprovedTranche: "Aucune tranche approuvée par la DAO n'est disponible.",
  WrongMilestone: "Ce jalon n'est pas le prochain à valider (proposition périmée).",
  AllMilestonesApproved: "Tous les jalons sont déjà approuvés.",
  NothingToRefund: "Vous n'avez rien à récupérer sur cette campagne.",
  NotStale: "La campagne n'est pas inactive depuis 90 jours.",
  EnforcedPause: "La plateforme est en pause (circuit breaker activé).",
  ReentrancyGuardReentrantCall: "Ré-entrée bloquée.",
  NotCampaignOwner: "Seul le porteur ou le bénéficiaire peut demander un déblocage.",
  CampaignNotSuccessful: "La campagne doit être réussie pour demander un déblocage.",
  CampaignNotFreezable: "Seule une campagne en cours ou réussie peut être gelée.",
  BelowProposalThreshold: "Il faut au moins 100 CFD délégués (au bloc précédent) pour proposer un gel.",
  ProposalNotFound: "Proposition introuvable.",
  VotingClosed: "Le vote est terminé.",
  AlreadyVoted: "Vous avez déjà voté.",
  NoVotingPower:
    "Aucun pouvoir de vote au moment du snapshot : il fallait détenir ET avoir délégué vos CFD avant la création de la proposition.",
  NotSucceeded: "La proposition n'est pas adoptée (ou le vote n'est pas terminé).",
  ERC20InsufficientBalance: "Solde de CFD insuffisant : pour être remboursé, il faut rendre les CFD reçus.",
  AccessControlUnauthorizedAccount: "Vous n'avez pas le rôle requis.",
};

interface EthersLikeError {
  code?: string | number;
  shortMessage?: string;
  message?: string;
  data?: string;
  revert?: { name?: string };
  info?: { error?: { code?: number; message?: string; data?: string } };
  error?: { code?: number; data?: string | { data?: string } };
}

function revertData(e: EthersLikeError): string | undefined {
  if (typeof e.data === "string") return e.data;
  if (typeof e.info?.error?.data === "string") return e.info.error.data;
  const inner = e.error?.data;
  if (typeof inner === "string") return inner;
  if (inner && typeof inner.data === "string") return inner.data;
  return undefined;
}

function decodeCustomError(data: string | undefined): string | undefined {
  if (!data || data.length < 10) return undefined;
  for (const iface of interfaces) {
    try {
      const parsed = iface.parseError(data);
      if (parsed) return parsed.name;
    } catch {
      // essayer l'interface suivante
    }
  }
  return undefined;
}

export function isUserRejection(error: unknown): boolean {
  const e = (error ?? {}) as EthersLikeError;
  return e.code === "ACTION_REJECTED" || e.code === 4001 || e.info?.error?.code === 4001;
}

/** Message lisible pour n'importe quelle erreur levée par ethers / MetaMask. */
export function describeError(error: unknown): string {
  if (isUserRejection(error)) return "Transaction refusée dans MetaMask.";
  const e = (error ?? {}) as EthersLikeError;
  const name = e.revert?.name ?? decodeCustomError(revertData(e));
  if (name) return MESSAGES[name] ?? `Le contrat a refusé l'opération (${name}).`;
  if (e.code === "INSUFFICIENT_FUNDS") return "Solde ETH insuffisant pour cette transaction (montant + frais de gaz).";
  if (e.code === "NETWORK_ERROR" || e.code === "SERVER_ERROR")
    return "Impossible de joindre le nœud blockchain. Le réseau (ou anvil) est-il lancé ?";
  return e.shortMessage ?? e.message ?? "Erreur inconnue.";
}
