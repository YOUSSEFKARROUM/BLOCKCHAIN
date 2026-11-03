// Génère les fichiers de métadonnées des campagnes de démo, nommés par leur CID IPFS.
//   node scripts/ipfs/build-demo-metadata.mjs
// Sortie :
//   frontend/ipfs-cache/<cid>.json  -> contenu exact (servi par le front si la passerelle IPFS est indisponible)
//   deployments/demo-cids.json      -> { slug: cid } lu par le script de démo forge
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cidV1Raw } from "./cid.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const campaigns = JSON.parse(readFileSync(join(root, "scripts/ipfs/demo-campaigns.json"), "utf8"));
const cacheDir = join(root, "frontend/ipfs-cache");
mkdirSync(cacheDir, { recursive: true });

const index = {};
for (const { slug, ...metadata } of campaigns) {
  const content = JSON.stringify({ schema: "campusfund/v1", ...metadata });
  const cid = cidV1Raw(content);
  writeFileSync(join(cacheDir, `${cid}.json`), content);
  index[slug] = cid;
  console.log(`${slug.padEnd(11)} ${cid}`);
}
writeFileSync(join(root, "deployments/demo-cids.json"), JSON.stringify(index, null, 2) + "\n");
