import { CID_PATTERN } from "./metadata";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

/**
 * Transforme la preuve saisie par le porteur en lien cliquable SÛR.
 * Accepté : `https://…`, `ipfs://<CID>` ou un CID nu. Tout le reste (javascript:, data:, texte libre)
 * renvoie null : la preuve est alors affichée comme simple texte.
 */
export function proofHref(proof: string): string | null {
  const value = proof.trim();
  const cid = value.startsWith("ipfs://") ? value.slice("ipfs://".length) : value;
  if (CID_PATTERN.test(cid)) return `${IPFS_GATEWAY}${cid}`;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
