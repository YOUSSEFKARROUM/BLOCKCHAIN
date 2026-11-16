// Enregistre une vidéo de démonstration du site, en pilotant Chrome sur la démo anvil.
//
// Prérequis : anvil + démo chargée (scripts/demo-anvil.sh) + serveur de dev sur le port 3000.
//   node e2e/demo-video.mjs            -> images dans e2e/demo-video/frames/
//   python e2e/assemble_video.py       -> e2e/demo-video/campusfund-demo.mp4
//
// Un faux portefeuille relaie les requêtes à anvil (comme npm run e2e). Un curseur et des sous-titres sont
// ajoutés à la page pour la vidéo. La démo est restaurée à son état initial à la fin (instantané anvil).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, JsonRpcProvider } from "ethers";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "demo-video", "frames");
const APP = "http://localhost:3000";
const RPC = "http://127.0.0.1:8545";
const PORT = 9371;
const WIDTH = 1280;
const HEIGHT = 720;
const VOTE_PERIOD_S = 3_700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const cache = join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  const candidates = [process.env.CHROME_PATH];
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-"))) candidates.push(join(cache, dir, "chrome-win64", "chrome.exe"));
  }
  candidates.push("C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome");
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome introuvable : indiquez son chemin dans CHROME_PATH.");
  return found;
}

/** Faux portefeuille + calque de démonstration (sous-titre et curseur), injectés avant chaque page. */
function pageScript(account) {
  return `(() => {
    const request = async ({ method, params }) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") return ["${account}"];
      if (method === "wallet_switchEthereumChain") return null;
      const res = await fetch("${RPC}", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params: params ?? [] }) });
      const body = await res.json();
      if (body.error) throw Object.assign(new Error(body.error.message), { code: body.error.code, data: body.error.data });
      return body.result;
    };
    window.ethereum = { isMetaMask: true, request, on() {}, removeListener() {} };
    const mount = () => {
      const style = document.createElement("style");
      style.textContent = \`
        #demo-caption { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 99999;
          max-width: 980px; padding: 14px 26px; border-radius: 12px; background: rgba(9,9,10,.92); color: #F2F0E8;
          font: 600 22px/1.35 system-ui, sans-serif; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,.45);
          border: 1.5px solid #FFB800; transition: opacity .35s ease; opacity: 0; pointer-events: none; }
        #demo-caption b { color: #FFB800; }
        #demo-step { display: block; font: 700 13px/1 ui-monospace, monospace; letter-spacing: .14em; color: #FFB800; margin-bottom: 6px; }
        #demo-cursor { position: fixed; left: 0; top: 0; z-index: 100000; width: 26px; height: 26px; margin: -13px 0 0 -13px;
          border-radius: 50%; background: rgba(255,184,0,.35); border: 3px solid #FFB800; pointer-events: none;
          transition: transform .7s cubic-bezier(.2,.8,.2,1), scale .12s ease; box-shadow: 0 0 0 6px rgba(255,184,0,.15); }
        #demo-cursor.press { scale: .7; }\`;
      document.head.appendChild(style);
      const caption = document.createElement("div"); caption.id = "demo-caption"; document.body.appendChild(caption);
      const cursor = document.createElement("div"); cursor.id = "demo-cursor"; document.body.appendChild(cursor);
      cursor.style.transform = "translate(" + (window.__cursorX ?? 640) + "px," + (window.__cursorY ?? 400) + "px)";
      window.__demo = {
        caption(step, html) { caption.innerHTML = (step ? '<span id="demo-step">' + step + '</span>' : "") + html; caption.style.opacity = html ? "1" : "0"; },
        move(x, y) { cursor.style.transform = "translate(" + x + "px," + y + "px)"; },
        press() { cursor.classList.add("press"); setTimeout(() => cursor.classList.remove("press"), 180); },
      };
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  })();`;
}

async function openBrowser() {
  const profile = mkdtempSync(join(tmpdir(), "campusfund-demo-"));
  const proc = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"]);
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    } catch {
      await sleep(250);
    }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let nextId = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result ?? m.error);
      pending.delete(m.id);
    } else if (m.method) listeners.forEach((fn) => fn(m));
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const close = async () => {
    ws.close();
    proc.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  };
  return { send, close, on: (fn) => listeners.push(fn) };
}

class Director {
  constructor(browser) {
    this.browser = browser;
    this.scriptId = null;
    this.frameCount = 0;
    this.index = [];
  }

  async startRecording() {
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    this.browser.on((m) => {
      if (m.method !== "Page.screencastFrame") return;
      const name = `${String(this.frameCount++).padStart(6, "0")}.jpg`;
      writeFileSync(join(OUT, name), Buffer.from(m.params.data, "base64"));
      this.index.push({ file: name, t: m.params.metadata.timestamp });
      this.browser.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
    });
    await this.browser.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: WIDTH, maxHeight: HEIGHT, everyNthFrame: 1 });
  }

  async stopRecording() {
    await this.browser.send("Page.stopScreencast");
    writeFileSync(join(OUT, "index.json"), JSON.stringify(this.index));
  }

  async eval(expression) {
    const out = await this.browser.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return out?.result?.value;
  }

  async open(path, account) {
    if (this.scriptId) await this.browser.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: this.scriptId });
    this.scriptId = (await this.browser.send("Page.addScriptToEvaluateOnNewDocument", { source: pageScript(account) })).identifier;
    await this.browser.send("Page.navigate", { url: `${APP}${path}` });
    await this.waitFor(() => this.eval("Boolean(window.__demo) && document.readyState === 'complete'"), 30_000);
    await sleep(2500); // données lues sur la chaîne, palettes retournées
  }

  async caption(step, html) {
    await this.eval(`window.__demo.caption(${JSON.stringify(step)}, ${JSON.stringify(html)})`);
  }

  async scrollTo(selectorExpression, offset = 140) {
    await this.eval(`(() => { const el = ${selectorExpression}; if (!el) return false;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - ${offset}, behavior: "smooth" }); return true; })()`);
    await sleep(1400);
  }

  /** Amène le curseur sur le bouton, l'enfonce, puis clique. */
  async click(label, within = "") {
    const finder = `(() => {
      const scopes = ${JSON.stringify(within)} ? [...document.querySelectorAll("article, li, section, form")].filter((el) => el.innerText.includes(${JSON.stringify(within)})) : [document];
      for (const scope of scopes.reverse()) {
        const b = [...scope.querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase().startsWith(${JSON.stringify(label.toLowerCase())}) && !x.disabled && Object.keys(x).some((k) => k.startsWith("__reactProps")));
        if (b) return b;
      }
      return null;
    })()`;
    await this.waitFor(() => this.eval(`Boolean(${finder})`), 30_000);
    await this.scrollTo(finder, 260);
    const point = await this.eval(`(() => { const r = (${finder}).getBoundingClientRect(); window.__cursorX = r.left + r.width / 2; window.__cursorY = r.top + r.height / 2;
      window.__demo.move(window.__cursorX, window.__cursorY); return [window.__cursorX, window.__cursorY]; })()`);
    if (!point) throw new Error(`bouton introuvable : ${label}`);
    await sleep(900);
    await this.eval("window.__demo.press()");
    await sleep(200);
    await this.eval(`(${finder}).click()`);
  }

  async type(selector, text) {
    await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const r = el.getBoundingClientRect();
      window.__demo.move(r.left + 60, r.top + r.height / 2); el.focus(); })()`);
    await sleep(800);
    let value = "";
    for (const ch of text) {
      value += ch;
      await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event("input", { bubbles: true })); })()`);
      await sleep(140);
    }
  }

  async waitForText(text, timeout = 45_000) {
    await this.waitFor(() => this.eval(`document.body.innerText.includes(${JSON.stringify(text)})`), timeout);
  }

  async waitFor(check, timeout) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await check()) return;
      await sleep(300);
    }
    throw new Error("délai dépassé");
  }
}

async function main() {
  const provider = new JsonRpcProvider(RPC, 31337, { staticNetwork: true });
  const config = JSON.parse(readFileSync(join(HERE, "..", "src", "config", "contracts.json"), "utf8"));
  const governance = new Contract(config.deployments["31337"].Governance, config.abis.Governance, provider);
  const accounts = await provider.send("eth_accounts", []);
  const [club, student] = [accounts[3], accounts[5]];

  const chainAhead = (await provider.getBlock("latest")).timestamp - Math.floor(Date.now() / 1000);
  const snapshot = await provider.send("evm_snapshot", []);
  await provider.send("evm_mine", []);
  if (Number(await governance.state(2)) !== 0) {
    await provider.send("evm_revert", [snapshot]);
    throw new Error("Les votes de la démo ont expiré : relancez scripts/demo-anvil.sh.");
  }

  const browser = await openBrowser();
  await browser.send("Page.enable");
  await browser.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  const d = new Director(browser);
  try {
    await d.open("/", student);
    await d.startRecording();
    await d.caption("CAMPUSFUND", "Le financement des clubs étudiants, <b>débloqué tranche par tranche, sur vote</b>.");
    await sleep(3500);
    await d.scrollTo(`document.querySelector("#campagnes")`, 40);
    await d.caption("LES CAMPAGNES", "Chaque campagne est lue directement sur la blockchain : collecté, objectif, statut.");
    await sleep(4000);

    await d.open("/campaign/4", student);
    await d.caption("SCORE IA", "L'IA repère une campagne suspecte : comptes neufs, montants identiques. <b>92/100</b>.");
    await d.scrollTo(`[...document.querySelectorAll("section")].find((s) => s.innerText.includes("Score de risque IA"))`, 120);
    await sleep(4500);

    await d.open("/campaign/2", student);
    await d.caption("1 · CONTRIBUER", "Un étudiant contribue <b>0,1 ETH</b>. L'argent reste bloqué dans le contrat, pas chez le club.");
    await sleep(2000);
    await d.scrollTo(`document.querySelector("#cf-amt")`, 200);
    await d.type("#cf-amt", "0.1");
    await d.click("Contribuer");
    await d.waitForText("Transaction confirmée");
    await d.caption("1 · CONTRIBUER", "Confirmé. Il reçoit <b>100 CFD</b> : ce sont ses droits de vote.");
    await sleep(3500);

    await d.open("/governance", student);
    await d.caption("2 · VOTER", "Le club demande la tranche du jalon 2, <b>preuve jointe</b>. Les contributeurs votent.");
    await d.scrollTo(`[...document.querySelectorAll("article")].find((a) => a.innerText.includes("Proposition #2"))`, 120);
    await sleep(2500);
    await d.click("Voter pour", "Proposition #2");
    await d.waitForText("VOTÉ");
    await d.caption("2 · VOTER", "Vote enregistré : <b>quorum atteint</b>, majorité pour.");
    await sleep(3500);

    await provider.send("evm_increaseTime", [VOTE_PERIOD_S]);
    await provider.send("evm_mine", []);
    await d.open("/governance", student);
    await d.caption("3 · EXÉCUTER", "Une heure plus tard, le vote est clos. N'importe qui applique la décision.");
    await d.scrollTo(`[...document.querySelectorAll("article")].find((a) => a.innerText.includes("Proposition #2"))`, 120);
    await sleep(2000);
    await d.click("Exécuter le déblocage", "Proposition #2");
    await d.waitForText("DÉBLOQUÉE");
    await sleep(3000);

    await d.open("/creator", club);
    await d.caption("4 · RETIRER", "Le club retire sa tranche : <b>98 %</b> pour lui, <b>2 %</b> de frais pour la trésorerie.");
    await sleep(2000);
    await d.click("Retirer la tranche");
    await d.waitForText("Transaction confirmée");
    await sleep(3000);

    await d.open("/campaign/0", student);
    await d.caption("RÉSULTAT", "Jalon 2 versé. Le jalon 3 reste bloqué : <b>il faudra une nouvelle preuve et un nouveau vote</b>.");
    await d.scrollTo(`document.querySelector("#piste-title")`, 60);
    await sleep(5000);
    await d.stopRecording();
    console.log(`${d.frameCount} images enregistrées dans ${OUT}`);
  } finally {
    await browser.close();
    await provider.send("evm_revert", [snapshot]);
    await provider.send("evm_setTime", [Math.floor(Date.now() / 1000) + chainAhead]);
    console.log("Démo restaurée à son état initial.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
