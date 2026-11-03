import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CID_PATTERN, MAX_METADATA_BYTES } from "./metadata";

/** Caches locaux : démo versionnée (ipfs-cache/) et uploads en mode dev sans Pinata (.local-ipfs/). */
const DIRS = [join(process.cwd(), "ipfs-cache"), join(process.cwd(), ".local-ipfs")];
const LOCAL_DIR = DIRS[1];

export async function readLocal(cid: string): Promise<string | null> {
  if (!CID_PATTERN.test(cid)) return null; // empêche toute traversée de chemin (../)
  for (const dir of DIRS) {
    try {
      return await readFile(join(dir, `${cid}.json`), "utf8");
    } catch {
      // pas dans ce dossier
    }
  }
  return null;
}

export async function writeLocal(cid: string, content: string): Promise<void> {
  if (!CID_PATTERN.test(cid) || content.length > MAX_METADATA_BYTES) throw new Error("CID ou contenu invalide");
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(join(LOCAL_DIR, `${cid}.json`), content, "utf8");
}

export async function readGateway(cid: string): Promise<string | null> {
  if (!CID_PATTERN.test(cid)) return null;
  const gateway = process.env.IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/";
  try {
    const res = await fetch(`${gateway}${cid}`, { signal: AbortSignal.timeout(6000), cache: "force-cache" });
    if (!res.ok) return null;
    const text = await res.text();
    return text.length <= MAX_METADATA_BYTES ? text : null;
  } catch {
    return null;
  }
}

/** Envoi sur IPFS via Pinata (le JWT ne quitte jamais le serveur). Renvoie le CID. */
export async function pinToPinata(jwt: string, content: string, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([content], { type: "application/json" }), "metadata.json");
  form.append("pinataMetadata", JSON.stringify({ name: `campusfund:${name.slice(0, 60)}` }));
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Pinata a répondu ${res.status}`);
  const body = (await res.json()) as { IpfsHash?: string };
  if (!body.IpfsHash || !CID_PATTERN.test(body.IpfsHash)) throw new Error("Réponse Pinata inattendue");
  return body.IpfsHash;
}
