// Copie dans le front les ABI générées par `forge build` et les adresses de déploiement.
//   node frontend/scripts/sync-contracts.mjs      (depuis la racine ou depuis frontend/)
// Entrées  : out/<Contrat>.sol/<Contrat>.json, deployments/<chainId>.json
// Sortie   : frontend/src/config/contracts.json  { abis: {...}, deployments: { "31337": {...} } }
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(frontend, "..");
const CONTRACTS = ["CFDToken", "CampusFund", "Governance", "Treasury"];

const abis = {};
for (const name of CONTRACTS) {
  const file = join(root, "out", `${name}.sol`, `${name}.json`);
  if (!existsSync(file)) {
    console.error(`ABI introuvable : ${file}. Lancez d'abord \`forge build\` à la racine.`);
    process.exit(1);
  }
  abis[name] = JSON.parse(readFileSync(file, "utf8")).abi;
}

const deployments = {};
for (const file of readdirSync(join(root, "deployments"))) {
  if (!/^\d+\.json$/.test(file)) continue; // 31337.json, 11155111.json (pas demo-cids ni test-deploy)
  const d = JSON.parse(readFileSync(join(root, "deployments", file), "utf8"));
  deployments[String(d.chainId)] = d;
}

const outDir = join(frontend, "src", "config");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "contracts.json"), JSON.stringify({ abis, deployments }, null, 2) + "\n");
console.log(`ABI : ${CONTRACTS.join(", ")} ; réseaux : ${Object.keys(deployments).join(", ") || "aucun"}`);
