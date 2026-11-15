import { describe, expect, it } from "vitest";
import { boardStatus, escaleStates, fallbackName, flightCode, releaseProposalFor } from "./campaignView";
import type { Campaign, Proposal } from "./data";
import { proofHref } from "./proof";

const NOW = 1_000_000;

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 0,
    creator: "0xc",
    beneficiary: "0xb",
    goal: 10n,
    raised: 10n,
    released: 0n,
    refunded: 0n,
    deadline: NOW + 3_600,
    status: 0,
    milestoneCount: 3,
    approvedMilestones: 0,
    withdrawnMilestones: 0,
    metadataCID: "cid",
    milestonesBps: [5_000, 3_000, 2_000],
    ...overrides,
  };
}

function proposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 0,
    ptype: 0,
    milestoneIndex: 0,
    quadratic: false,
    executed: false,
    proposer: "0xc",
    snapshotBlock: 1,
    voteEnd: NOW + 3_600,
    campaignId: 0,
    forVotes: 0n,
    againstVotes: 0n,
    participation: 0n,
    quorum: 1n,
    description: "",
    proof: "",
    state: 0,
    ...overrides,
  };
}

describe("flightCode / fallbackName", () => {
  it("numérote les vols à partir de 1, sur deux chiffres", () => {
    expect(flightCode(0)).toBe("CF 01");
    expect(flightCode(11)).toBe("CF 12");
  });

  it("donne au nom de secours le même numéro que le vol", () => {
    expect(fallbackName(0)).toBe("Campagne CF 01");
  });
});

describe("boardStatus", () => {
  it("affiche « Collecte » pendant la collecte", () => {
    const status = boardStatus(campaign(), [], NOW);
    expect(status.label).toBe("Collecte");
    expect(status.filter).toBe("boarding");
  });

  it("affiche « À clôturer » une fois l'échéance passée", () => {
    expect(boardStatus(campaign({ deadline: NOW - 1 }), [], NOW).label).toBe("À clôturer");
  });

  it("donne la priorité à un gel proposé, en clignotant", () => {
    const status = boardStatus(campaign({ status: 1 }), [proposal({ ptype: 1 }), proposal()], NOW);
    expect(status.label).toBe("Gel proposé");
    expect(status.isBlinking).toBe(true);
  });

  it("affiche « Vote en cours » quand un déblocage est en vote", () => {
    expect(boardStatus(campaign({ status: 1 }), [proposal()], NOW).label).toBe("Vote en cours");
  });

  it("ignore les propositions d'une autre campagne ou déjà closes", () => {
    const others = [proposal({ campaignId: 1 }), proposal({ state: 3 })];
    expect(boardStatus(campaign({ status: 1 }), others, NOW).label).toBe("Financée");
  });

  it("suit l'avancement des tranches d'une campagne financée", () => {
    expect(boardStatus(campaign({ status: 1, approvedMilestones: 1 }), [], NOW).label).toBe("Tranche à retirer");
    expect(boardStatus(campaign({ status: 1, approvedMilestones: 1, withdrawnMilestones: 1 }), [], NOW).label).toBe("Tranche versée");
    const done = campaign({ status: 1, approvedMilestones: 3, withdrawnMilestones: 3 });
    expect(boardStatus(done, [], NOW).label).toBe("Terminée");
  });

  it("range les campagnes échouées et annulées dans le filtre « annulées »", () => {
    expect(boardStatus(campaign({ status: 2 }), [], NOW)).toMatchObject({ label: "Remboursement", filter: "cancel" });
    expect(boardStatus(campaign({ status: 3 }), [], NOW)).toMatchObject({ label: "Annulée", filter: "cancel" });
  });
});

describe("escaleStates", () => {
  it("distingue versée, approuvée, en vote et verrouillée", () => {
    const c = campaign({ status: 1, approvedMilestones: 2, withdrawnMilestones: 1, milestonesBps: [2_500, 2_500, 2_500, 2_500] });
    expect(escaleStates(c, [proposal({ milestoneIndex: 2 })])).toEqual(["paid", "approved", "voting", "locked"]);
  });

  it("ne marque « en vote » que le jalon visé par une proposition ouverte", () => {
    const c = campaign({ status: 1 });
    expect(escaleStates(c, [proposal({ state: 1 })])).toEqual(["locked", "locked", "locked"]);
  });
});

describe("releaseProposalFor", () => {
  it("trouve la proposition de déblocage ouverte du jalon demandé", () => {
    const target = proposal({ id: 7, milestoneIndex: 1 });
    expect(releaseProposalFor([proposal(), target], 0, 1)).toBe(target);
    expect(releaseProposalFor([target], 0, 2)).toBeUndefined();
  });
});

describe("proofHref", () => {
  const CID = "bafkreibll3uuz65ud2ck2jwnfqrw7ag3cnhgv5ziouvzw3z5xuvdiyu27m";

  it("transforme un CID (nu ou ipfs://) en lien de passerelle", () => {
    expect(proofHref(CID)).toBe(`https://ipfs.io/ipfs/${CID}`);
    expect(proofHref(`ipfs://${CID}`)).toBe(`https://ipfs.io/ipfs/${CID}`);
  });

  it("accepte un lien https", () => {
    expect(proofHref("https://exemple.org/facture.pdf")).toBe("https://exemple.org/facture.pdf");
  });

  it("refuse tout schéma dangereux ou inconnu", () => {
    expect(proofHref("javascript:alert(1)")).toBeNull();
    expect(proofHref("http://exemple.org")).toBeNull();
    expect(proofHref("demo://video.mp4")).toBeNull();
    expect(proofHref("une simple phrase")).toBeNull();
  });
});
