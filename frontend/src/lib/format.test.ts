import { parseEther } from "ethers";
import { describe, expect, it } from "vitest";
import { eth } from "./format";

describe("eth", () => {
  it("garde le nombre de décimales demandé pour les montants courants", () => {
    expect(eth(parseEther("4.5"), 2)).toBe("4,5");
    expect(eth(parseEther("1.7644"), 3)).toBe("1,764");
  });

  it("n'arrondit jamais un petit montant non nul à zéro", () => {
    expect(eth(parseEther("0.002"), 2)).toBe("0,002");
    expect(eth(parseEther("0.0005"), 2)).toBe("0,0005");
    expect(eth(parseEther("0.00196"), 3)).toBe("0,002");
  });

  it("affiche 0 pour un montant nul", () => {
    expect(eth(0n, 2)).toBe("0");
  });
});
