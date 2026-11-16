import { formatEther } from "ethers";

const MAX_ETH_DIGITS = 6;

/**
 * Montant en ETH, à la française. `digits` est la précision habituelle ; un petit montant non nul garde
 * au moins un chiffre significatif (0,002 ETH ne s'affiche jamais « 0 »).
 */
export function eth(wei: bigint, digits = 3): string {
  const n = Number(formatEther(wei));
  const abs = Math.abs(n);
  const needed = abs > 0 && abs < 1 ? Math.ceil(-Math.log10(abs)) : 0;
  const maximumFractionDigits = Math.min(MAX_ETH_DIGITS, Math.max(digits, needed));
  return n.toLocaleString("fr-FR", { maximumFractionDigits });
}

export function cfd(amount: bigint): string {
  return Number(formatEther(amount)).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function percent(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((part * 10_000n) / total) / 100;
}

export function dateTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

/** "dans 3 j 4 h" / "il y a 2 h" */
export function relative(seconds: number, nowSeconds: number): string {
  const diff = seconds - nowSeconds;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86_400);
  const h = Math.floor((abs % 86_400) / 3_600);
  const m = Math.floor((abs % 3_600) / 60);
  const text = d > 0 ? `${d} j ${h} h` : h > 0 ? `${h} h ${m} min` : `${m} min`;
  return diff >= 0 ? `dans ${text}` : `il y a ${text}`;
}
