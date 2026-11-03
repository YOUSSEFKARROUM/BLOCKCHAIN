import { createHash } from "node:crypto";

// Même algorithme que scripts/ipfs/cid.mjs : CIDv1, codec raw (0x55), sha2-256. Côté serveur uniquement.
const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";

export function cidV1Raw(content: string | Uint8Array): string {
  const digest = createHash("sha256").update(content).digest();
  const bytes = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]);
  let bits = 0;
  let value = 0;
  let out = "b";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}
