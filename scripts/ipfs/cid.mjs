// Calcul d'un CID IPFS (CIDv1, codec "raw", hachage sha2-256), sans dépendance.
// C'est l'identifiant que donne `ipfs add --cid-version=1` (ou Pinata en CIDv1) pour un petit fichier
// (< 256 Kio, un seul bloc). Le CID est l'empreinte du CONTENU : modifier un octet change le CID.
import { createHash } from "node:crypto";

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";

function base32(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
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

/** @param {Uint8Array | string} content */
export function cidV1Raw(content) {
  const digest = createHash("sha256").update(content).digest();
  // <version=1><codec raw=0x55><multihash: sha2-256=0x12, longueur=0x20, empreinte>
  const cid = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]);
  return "b" + base32(cid); // préfixe multibase "b" = base32 minuscule
}
