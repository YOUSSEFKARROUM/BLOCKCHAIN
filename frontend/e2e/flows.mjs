// Tests de bout en bout des transactions, depuis l'interface, sans MetaMask.
//
// Prérequis : anvil lancé, démo chargée (scripts/demo-anvil.sh), serveur de dev sur le port 3000.
//   npm run e2e
//
// Un faux portefeuille (EIP-1193) est injecté dans la page : il relaie les requêtes à anvil, qui signe
// lui-même les transactions de ses comptes de test. Chaque parcours clique dans l'interface puis vérifie
// l'état SUR LA CHAÎNE. Un instantané anvil est pris au début et restauré à la fin : la démo reste intacte.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Contract, JsonRpcProvider, parseEther } from "ethers";

const APP = process.env.E2E_APP_URL ?? "http://localhost:3000";
const RPC = process.env.E2E_RPC_URL ?? "http://127.0.0.1:8545";
const DEBUG_PORT = 9351;
const WAIT_MS = 45_000;
const POLL_MS = 400;
const VOTE_PERIOD_S = 3_700;

// Rôles des comptes anvil dans la démo (voir scripts/foundry/SeedDemo.s.sol)
const CAMPAIGN = { robotique: 0, hackathon: 2, theatre: 3 };
const OPEN_RELEASE_PROPOSAL = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [process.env.CHROME_PATH];
  const cache = join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-"))) {
      candidates.push(join(cache, dir, "chrome-win64", "chrome.exe"));
    }
  }
  candidates.push(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  );
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error("Chrome introuvable : indiquez son chemin dans la variable CHROME_PATH.");
  return found;
}

/** Connexion minimale au protocole DevTools de Chrome. */
async function openBrowser() {
  const profile = mkdtempSync(join(tmpdir(), "campusfund-e2e-"));
  const proc = spawn(findChrome(), ["--headless=new", "--disable-gpu", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, "about:blank"]);
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
    } catch {
      await sleep(250);
    }
  }
  if (!targets) throw new Error("Chrome n'a pas démarré.");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message.result ?? message.error);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const close = async () => {
    ws.close();
    proc.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  };
  return { send, close };
}

/** Vrai une fois l'élément pris en charge par React : avant, un clic ou une saisie serait perdu. */
const IS_HYDRATED = `(el) => Object.keys(el).some((key) => key.startsWith("__reactProps"))`;

/** Faux portefeuille injecté avant le chargement de la page. */
function walletScript(account) {
  return `(() => {
    const request = async ({ method, params }) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") return ["${account}"];
      if (method === "wallet_switchEthereumChain") return null;
      const res = await fetch("${RPC}", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params: params ?? [] }),
      });
      const body = await res.json();
      if (body.error) throw Object.assign(new Error(body.error.message), { code: body.error.code, data: body.error.data });
      return body.result;
    };
    window.ethereum = { isMetaMask: true, request, on() {}, removeListener() {} };
  })();`;
}

class Page {
  constructor(browser) {
    this.browser = browser;
    this.scriptId = null;
  }

  async evaluate(expression) {
    const out = await this.browser.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return out?.result?.value;
  }

  /** Ouvre `path` avec `account` comme compte connecté. */
  async open(path, account) {
    if (this.scriptId) await this.browser.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: this.scriptId });
    const added = await this.browser.send("Page.addScriptToEvaluateOnNewDocument", { source: walletScript(account) });
    this.scriptId = added.identifier;
    await this.browser.send("Page.navigate", { url: `${APP}${path}` });
  }

  /** Clique le premier bouton actif dont le texte commence par `label` (dans le bloc contenant `within`). */
  async click(label, within = "") {
    const expression = `(() => {
      const scopes = ${JSON.stringify(within)}
        ? [...document.querySelectorAll("article, li, section, form")].filter((el) => el.innerText.includes(${JSON.stringify(within)}))
        : [document];
      for (const scope of scopes.reverse()) {
        const button = [...scope.querySelectorAll("button")].find((b) => b.innerText.trim().toLowerCase().startsWith(${JSON.stringify(label.toLowerCase())}) && !b.disabled && (${IS_HYDRATED})(b));
        if (button) { button.click(); return true; }
      }
      return false;
    })()`;
    await waitFor(`le bouton « ${label} »`, () => this.evaluate(expression));
  }

  /** Saisit une valeur dans un champ contrôlé par React. */
  async fill(selector, value) {
    const expression = `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el || !(${IS_HYDRATED})(el)) return false;
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()`;
    await waitFor(`le champ ${selector}`, () => this.evaluate(expression));
  }

  /** Messages d'état ou d'erreur visibles, pour le diagnostic d'un échec. */
  async feedback() {
    return this.evaluate(`[...document.querySelectorAll('[role="alert"], [role="status"], form p')].map((el) => el.innerText.trim()).filter(Boolean).join(" | ")`);
  }
}

async function waitFor(what, check) {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(POLL_MS);
  }
  throw new Error(`Délai dépassé en attendant ${what}.`);
}

async function main() {
  const provider = new JsonRpcProvider(RPC, 31337, { staticNetwork: true });
  const config = JSON.parse(readFileSync(new URL("../src/config/contracts.json", import.meta.url), "utf8"));
  const addresses = config.deployments["31337"];
  if (!addresses) throw new Error("Aucun déploiement anvil : lancez scripts/demo-anvil.sh.");
  const fund = new Contract(addresses.CampusFund, config.abis.CampusFund, provider);
  const governance = new Contract(addresses.Governance, config.abis.Governance, provider);
  const accounts = await provider.send("eth_accounts", []);
  const [porteur, contributeur, rembourse] = [accounts[3], accounts[5], accounts[6]];

  const appStatus = await fetch(APP).then((r) => r.status).catch(() => 0);
  if (appStatus !== 200) throw new Error(`Le serveur de dev ne répond pas sur ${APP}.`);
  if (Number(await fund.campaignCount()) !== 5) throw new Error("La démo n'est pas dans son état initial (5 campagnes attendues).");

  // evm_revert restaure l'état mais pas l'horloge d'anvil : on note l'avance de la chaîne sur l'horloge du PC
  // pour la rétablir à la fin. Sinon chaque lancement avancerait la démo d'une heure et fermerait ses votes.
  const chainAhead = (await provider.getBlock("latest")).timestamp - Math.floor(Date.now() / 1000);
  const snapshot = await provider.send("evm_snapshot", []);
  // Les votes de la démo durent 1 h en temps réel : un bloc miné maintenant dit s'ils sont encore ouverts.
  await provider.send("evm_mine", []);
  if (Number(await governance.state(OPEN_RELEASE_PROPOSAL)) !== 0) {
    await provider.send("evm_revert", [snapshot]);
    throw new Error("Les votes de la démo ont expiré (ils durent 1 h) : relancez scripts/demo-anvil.sh, puis npm run e2e.");
  }
  const browser = await openBrowser();
  const page = new Page(browser);
  const results = [];

  const flow = async (name, run) => {
    try {
      await run();
      results.push({ name, ok: true });
      console.log(`  OK     ${name}`);
    } catch (error) {
      const feedback = await page.feedback().catch(() => "");
      results.push({ name, ok: false });
      console.log(`  ÉCHEC  ${name}\n         ${error.message}${feedback ? `\n         Écran : ${feedback}` : ""}`);
    }
  };

  try {
    await flow("contribuer 0,1 ETH à une campagne en collecte", async () => {
      const before = await fund.contributionOf(CAMPAIGN.hackathon, contributeur);
      await page.open(`/campaign/${CAMPAIGN.hackathon}`, contributeur);
      await page.fill("#cf-amt", "0.1");
      await page.click("Contribuer");
      await waitFor("la contribution sur la chaîne", async () => (await fund.contributionOf(CAMPAIGN.hackathon, contributeur)) === before + parseEther("0.1"));
    });

    await flow("voter pour un déblocage", async () => {
      await page.open("/governance", contributeur);
      await page.click("Voter pour", `Proposition #${OPEN_RELEASE_PROPOSAL}`);
      await waitFor("le vote sur la chaîne", () => governance.hasVoted(OPEN_RELEASE_PROPOSAL, contributeur));
    });

    await flow("exécuter la proposition adoptée après la fin du vote", async () => {
      await provider.send("evm_increaseTime", [VOTE_PERIOD_S]);
      await provider.send("evm_mine", []);
      await page.open("/governance", contributeur);
      await page.click("Exécuter le déblocage", `Proposition #${OPEN_RELEASE_PROPOSAL}`);
      await waitFor("l'état « Exécutée »", async () => Number(await governance.state(OPEN_RELEASE_PROPOSAL)) === 3);
    });

    await flow("retirer la tranche débloquée (bénéficiaire)", async () => {
      const [, , before] = await fund.milestoneProgress(CAMPAIGN.robotique);
      await page.open("/creator", porteur);
      await page.click("Retirer la tranche");
      await waitFor("le retrait sur la chaîne", async () => (await fund.milestoneProgress(CAMPAIGN.robotique))[2] === before + 1n);
    });

    await flow("se faire rembourser d'une campagne échouée", async () => {
      if ((await fund.contributionOf(CAMPAIGN.theatre, rembourse)) === 0n) throw new Error("Le compte n'a rien à se faire rembourser.");
      await page.open(`/campaign/${CAMPAIGN.theatre}`, rembourse);
      await page.click("Me faire rembourser");
      await waitFor("le remboursement sur la chaîne", async () => (await fund.contributionOf(CAMPAIGN.theatre, rembourse)) === 0n);
    });

    await flow("créer une campagne", async () => {
      await page.open("/creator", porteur);
      await page.fill("#cf-title", "Campagne de test e2e");
      await page.fill("#cf-club", "Club de test");
      await page.fill("#cf-desc", "Campagne créée par le test de bout en bout, annulée à la fin.");
      for (const i of [1, 2, 3]) await page.fill(`[aria-label="Intitulé du jalon ${i}"]`, `Jalon de test ${i}`);
      await page.click("Publier la campagne");
      await waitFor("la campagne sur la chaîne", async () => Number(await fund.campaignCount()) === 6);
    });
  } finally {
    await browser.close();
    const reverted = await provider.send("evm_revert", [snapshot]);
    await provider.send("evm_setTime", [Math.floor(Date.now() / 1000) + chainAhead]);
    console.log(reverted ? "Démo restaurée à son état initial." : "ATTENTION : la démo n'a pas pu être restaurée, relancez scripts/demo-anvil.sh.");
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`${results.length - failed}/${results.length} parcours réussis.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
