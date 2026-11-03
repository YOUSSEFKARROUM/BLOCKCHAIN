import { Contract, type ContractRunner, Interface, type InterfaceAbi } from "ethers";
import generated from "@/config/contracts.json";
import { CHAIN_ID } from "@/config/chain";

/** Fichier généré par `npm run sync` à partir de `forge build` et de deployments/<chainId>.json. */
interface Deployment {
  chainId: number;
  deployBlock: number;
  votingPeriod: number;
  CFDToken: string;
  CampusFund: string;
  Governance: string;
  Treasury: string;
}

type ContractName = "CFDToken" | "CampusFund" | "Governance" | "Treasury";

const abis = generated.abis as Record<ContractName, InterfaceAbi>;
const deployments = generated.deployments as Record<string, Deployment>;

export const deployment: Deployment | null = deployments[String(CHAIN_ID)] ?? null;

export interface Contracts {
  token: Contract;
  fund: Contract;
  governance: Contract;
  treasury: Contract;
}

export function getContracts(runner: ContractRunner): Contracts {
  if (!deployment) {
    throw new Error(`Aucun déploiement pour le réseau ${CHAIN_ID}. Lancez le déploiement puis \`npm run sync\`.`);
  }
  return {
    token: new Contract(deployment.CFDToken, abis.CFDToken, runner),
    fund: new Contract(deployment.CampusFund, abis.CampusFund, runner),
    governance: new Contract(deployment.Governance, abis.Governance, runner),
    treasury: new Contract(deployment.Treasury, abis.Treasury, runner),
  };
}

/** Interfaces utilisées pour décoder les erreurs personnalisées des contrats. */
export const interfaces: Interface[] = (Object.keys(abis) as ContractName[]).map((n) => new Interface(abis[n]));
