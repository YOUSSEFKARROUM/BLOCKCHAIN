"""Détection d'anomalies sur les contributions CampusFund (bonus « IA au service de la blockchain »).

Principe
--------
1. On lit l'historique on-chain : events ``CampaignCreated`` et ``Contributed`` du contrat CampusFund,
   puis, pour chaque contributeur, la première adresse qui lui a envoyé des ETH (sa « source ») et
   son nombre de transactions avant de contribuer (nonce).
2. On calcule 6 indicateurs par campagne (voir ``campaign_features``).
3. Deux détecteurs donnent chacun un score de 0 à 100 :
   - des RÈGLES lisibles (montants répétés, adresses liées, adresses neuves, pic, concentration) ;
   - un ISOLATION FOREST (scikit-learn) entraîné sur un jeu de référence de campagnes : il isole les
     campagnes « qui ne ressemblent pas aux autres » sans qu'on lui dise ce qu'est une fraude.
4. Score final = 60 % règles + 40 % Isolation Forest, puis badge : Faible (< 35), Moyen (35-50), Élevé (>= 50).
   Seuils calibrés sur le tirage de calibration (graine 7) : 35 ≈ 95e centile des campagnes normales.
   Le résultat est écrit en JSON pour le front-end.

Utilisation
-----------
    python scripts/anomaly_detection.py --demo
        génère un jeu de démonstration avec fraudes simulées et mesure la qualité de la détection
    python scripts/anomaly_detection.py --rpc http://127.0.0.1:8545 --deployment deployments/31337.json \\
        --out frontend/public/risk-scores.json
        analyse les vraies campagnes on-chain (anvil ou Sepolia)
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.ensemble import IsolationForest

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "scripts" / "data"

FEATURES = ["repeated", "linked", "fresh", "burst", "top_share", "log_n"]
RULE_WEIGHTS = {"repeated": 25, "linked": 30, "fresh": 15, "burst": 20, "top_share": 10}
RULES_WEIGHT, FOREST_WEIGHT = 0.6, 0.4
LEVELS = [(35, "Faible"), (50, "Moyen"), (101, "Élevé")]
BURST_WINDOW_BLOCKS = 10
MIN_CONTRIBUTIONS_FOR_FULL_TRUST = 8  # en dessous, les ratios sont peu fiables : on les atténue
MAX_FUNDING_SCAN_BLOCKS = 20_000


@dataclass
class Contribution:
    campaign: int
    contributor: str
    amount_wei: int
    block: int
    funder: str | None  # première adresse ayant envoyé des ETH au contributeur (None = inconnue)
    nonce_before: int  # nombre de transactions envoyées par le contributeur avant cette contribution


# =============================================================================== indicateurs


def campaign_features(contribs: list[Contribution], creator_funder: str | None = None) -> dict:
    """Calcule les indicateurs d'UNE campagne. Tous sont des ratios entre 0 et 1 (sauf log_n)."""
    n = len(contribs)
    if n == 0:
        return {f: 0.0 for f in FEATURES} | {"n": 0, "creator_linked": 0.0}

    amounts = Counter(c.amount_wei for c in contribs)
    repeated = amounts.most_common(1)[0][1] / n if n >= 3 else 0.0

    contributors = {c.contributor: c for c in contribs}
    funders = Counter(c.funder for c in contributors.values() if c.funder)
    biggest_cluster = funders.most_common(1)[0][1] if funders else 0
    linked = biggest_cluster / len(contributors) if biggest_cluster >= 3 else 0.0

    fresh = sum(1 for c in contribs if c.nonce_before == 0) / n

    blocks = sorted(c.block for c in contribs)
    best, j = 0, 0
    for i, b in enumerate(blocks):  # fenêtre glissante de BURST_WINDOW_BLOCKS blocs
        while b - blocks[j] >= BURST_WINDOW_BLOCKS:
            j += 1
        best = max(best, i - j + 1)
    burst = best / n if n >= 6 else 0.0

    per_contributor = defaultdict(int)
    for c in contribs:
        per_contributor[c.contributor] += c.amount_wei
    top_share = max(per_contributor.values()) / sum(per_contributor.values()) if n >= 3 else 0.0

    top_funder = funders.most_common(1)[0][0] if funders else None
    creator_linked = 1.0 if creator_funder and creator_funder == top_funder and biggest_cluster >= 3 else 0.0

    return {
        "repeated": round(repeated, 4),
        "linked": round(linked, 4),
        "fresh": round(fresh, 4),
        "burst": round(burst, 4),
        "top_share": round(top_share, 4),
        "log_n": round(math.log1p(n), 4),
        "n": n,
        "creator_linked": creator_linked,
    }


def rule_score(f: dict) -> float:
    """Score de règles 0-100 : somme pondérée des ratios, atténuée s'il y a peu de contributions."""
    trust = min(1.0, f["n"] / MIN_CONTRIBUTIONS_FOR_FULL_TRUST)
    score = sum(RULE_WEIGHTS[k] * f[k] for k in RULE_WEIGHTS) * trust
    if f.get("creator_linked"):
        score += 10  # le porteur a la même source de fonds que ses contributeurs
    return min(100.0, score)


def reasons(f: dict, contribs: list[Contribution]) -> list[str]:
    """Explications lisibles affichées dans le front-end."""
    out = []
    if f["repeated"] >= 0.5:
        amount, count = Counter(c.amount_wei for c in contribs).most_common(1)[0]
        out.append(f"{count} contributions du même montant ({amount / 1e18:g} ETH)")
    if f["linked"] >= 0.5:
        out.append(f"{f['linked']:.0%} des contributeurs financés par une même adresse")
    if f["fresh"] >= 0.5:
        out.append(f"{f['fresh']:.0%} des contributions viennent d'adresses neuves")
    if f["burst"] >= 0.6:
        out.append(f"pic : {f['burst']:.0%} des contributions en moins de {BURST_WINDOW_BLOCKS} blocs")
    if f["top_share"] >= 0.8:
        out.append(f"un seul contributeur apporte {f['top_share']:.0%} des fonds")
    if f.get("creator_linked"):
        out.append("le porteur est financé par la même source que ses contributeurs")
    return out


def level(score: float) -> str:
    return next(name for limit, name in LEVELS if score < limit)


# =============================================================================== Isolation Forest


class ForestScorer:
    """Isolation Forest entraîné sur un jeu de référence ; score = rang d'anomalie (0-100)."""

    def __init__(self, reference: list[dict], seed: int = 42):
        x = np.array([[f[k] for k in FEATURES] for f in reference])
        self.model = IsolationForest(n_estimators=300, contamination="auto", random_state=seed).fit(x)
        self.reference_scores = np.sort(self.model.decision_function(x))

    def score(self, f: dict) -> float:
        d = self.model.decision_function(np.array([[f[k] for k in FEATURES]]))[0]
        # part des campagnes de référence plus "normales" que celle-ci (decision plus haute = plus normal)
        more_normal = 1 - np.searchsorted(self.reference_scores, d) / len(self.reference_scores)
        return float(round(100 * more_normal, 2))


def final_score(rules: float, forest: float) -> float:
    return round(RULES_WEIGHT * rules + FOREST_WEIGHT * forest, 1)


# =============================================================================== jeu de démonstration


def _addr(rng: random.Random) -> str:
    return "0x" + "".join(rng.choice("0123456789abcdef") for _ in range(40))


def generate_demo_dataset(n_normal: int = 300, n_fraud: int = 30, seed: int = 7):
    """Campagnes synthétiques. Fraudes simulées de 3 types :
    - sybil : N adresses neuves financées par une même source, même montant, en rafale ;
    - pic coordonné : contributions massives en quelques blocs depuis des adresses neuves ;
    - auto-financement : le porteur alimente une poignée d'adresses qui apportent presque tout.
    """
    rng = random.Random(seed)
    rows: list[Contribution] = []
    meta: dict[int, dict] = {}
    cid = 0

    def honest(c_id: int, start: int, n: int):
        duration = rng.randint(2_000, 200_000)
        for _ in range(n):
            amount = round(rng.lognormvariate(-1.0, 0.9), rng.choice([1, 2, 3]))
            rows.append(Contribution(
                c_id, _addr(rng), max(1, int(max(amount, 0.01) * 1e18)), start + rng.randint(0, duration),
                _addr(rng) if rng.random() > 0.05 else None, rng.choice([0] * 1 + list(range(1, 400))),
            ))

    for _ in range(n_normal):
        honest(cid, rng.randint(0, 10**6), rng.randint(3, 40))
        meta[cid] = {"label": 0, "type": "normale", "creator_funder": _addr(rng)}
        cid += 1

    for k in range(n_fraud):
        start = rng.randint(0, 10**6)
        source = _addr(rng)
        kind = ["sybil", "pic", "auto-financement"][k % 3]
        honest(cid, start, rng.randint(0, 4))  # un peu de bruit honnête
        if kind == "sybil":
            amount = int(rng.choice([0.1, 0.25, 0.5, 1.0]) * 1e18)
            for i in range(rng.randint(6, 20)):
                rows.append(Contribution(cid, _addr(rng), amount, start + i * rng.randint(1, 2), source, 0))
        elif kind == "pic":
            for i in range(rng.randint(8, 25)):
                rows.append(Contribution(cid, _addr(rng), int(rng.uniform(0.2, 0.3) * 1e18),
                                         start + rng.randint(0, 6), _addr(rng), rng.choice([0, 0, 1])))
        else:
            for i in range(rng.randint(3, 5)):
                rows.append(Contribution(cid, _addr(rng), int(rng.uniform(2, 5) * 1e18),
                                         start + rng.randint(0, 50), source, rng.choice([0, 1])))
        meta[cid] = {"label": 1, "type": kind, "creator_funder": source if kind != "pic" else _addr(rng)}
        cid += 1
    return rows, meta


def score_campaigns(by_campaign: dict[int, list[Contribution]], creators: dict[int, str | None],
                    forest: ForestScorer) -> dict[int, dict]:
    results = {}
    for c_id, contribs in sorted(by_campaign.items()):
        f = campaign_features(contribs, creators.get(c_id))
        rules = rule_score(f)
        iso = forest.score(f) if f["n"] > 0 else 0.0
        # Peu de contributions = peu de preuves : l'Isolation Forest est atténué comme les règles.
        iso *= min(1.0, f["n"] / MIN_CONTRIBUTIONS_FOR_FULL_TRUST)
        score = final_score(rules, iso)
        results[c_id] = {
            "score": score, "level": level(score), "rulesScore": round(rules, 1), "forestScore": round(iso, 1),
            "features": f, "reasons": reasons(f, contribs),
        }
    return results


def reference_features(seed: int = 7) -> list[dict]:
    rows, meta = generate_demo_dataset(seed=seed)
    grouped = defaultdict(list)
    for r in rows:
        grouped[r.campaign].append(r)
    return [campaign_features(grouped[c], meta[c]["creator_funder"]) for c in sorted(grouped)]


CALIBRATION_SEED, TRAINING_SEED, EVALUATION_SEED = 7, 11, 23


def run_demo() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Trois tirages distincts : calibration des seuils (7), entraînement du modèle (11), évaluation (23).
    rows, meta = generate_demo_dataset(seed=EVALUATION_SEED)
    with open(DATA_DIR / "demo_dataset.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["campaign", "label", "type", "contributor", "amount_eth", "block", "funder", "nonce_before"])
        for r in rows:
            m = meta[r.campaign]
            w.writerow([r.campaign, m["label"], m["type"], r.contributor, r.amount_wei / 1e18, r.block,
                        r.funder or "", r.nonce_before])

    grouped = defaultdict(list)
    for r in rows:
        grouped[r.campaign].append(r)
    creators = {c: m["creator_funder"] for c, m in meta.items()}
    # Modèle entraîné sur un AUTRE tirage : on n'évalue pas sur les données d'entraînement.
    forest = ForestScorer(reference_features(seed=TRAINING_SEED))
    results = score_campaigns(grouped, creators, forest)

    tp = sum(1 for c, r in results.items() if r["level"] == "Élevé" and meta[c]["label"] == 1)
    fp = sum(1 for c, r in results.items() if r["level"] == "Élevé" and meta[c]["label"] == 0)
    fn = sum(1 for c, r in results.items() if r["level"] != "Élevé" and meta[c]["label"] == 1)
    flagged_medium = sum(1 for c, r in results.items() if r["level"] != "Faible" and meta[c]["label"] == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    by_type = defaultdict(lambda: [0, 0])
    for c, r in results.items():
        if meta[c]["label"]:
            by_type[meta[c]["type"]][0] += r["level"] == "Élevé"
            by_type[meta[c]["type"]][1] += 1

    report = {
        "seeds": {"calibration": CALIBRATION_SEED, "entrainement": TRAINING_SEED, "evaluation": EVALUATION_SEED},
        "campaigns": len(results), "frauds": sum(m["label"] for m in meta.values()),
        "confusion_Eleve_vs_label": {"vrais_positifs": tp, "faux_positifs": fp, "faux_negatifs": fn},
        "precision": round(precision, 3), "rappel": round(recall, 3),
        "normales_signalees_Moyen_ou_plus": flagged_medium,
        "detection_par_type": {k: f"{v[0]}/{v[1]}" for k, v in by_type.items()},
    }
    (DATA_DIR / "demo_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Jeu de données : {DATA_DIR / 'demo_dataset.csv'} ({len(rows)} contributions)")


# =============================================================================== lecture on-chain

CONTRIBUTED_ABI = {
    "anonymous": False, "name": "Contributed", "type": "event",
    "inputs": [
        {"indexed": True, "name": "id", "type": "uint256"},
        {"indexed": True, "name": "contributor", "type": "address"},
        {"indexed": False, "name": "amount", "type": "uint256"},
        {"indexed": False, "name": "cfdMinted", "type": "uint256"},
    ],
}
CAMPAIGN_CREATED_ABI = {
    "anonymous": False, "name": "CampaignCreated", "type": "event",
    "inputs": [
        {"indexed": True, "name": "id", "type": "uint256"},
        {"indexed": True, "name": "creator", "type": "address"},
        {"indexed": True, "name": "beneficiary", "type": "address"},
        {"indexed": False, "name": "goal", "type": "uint256"},
        {"indexed": False, "name": "deadline", "type": "uint64"},
        {"indexed": False, "name": "metadataCID", "type": "string"},
        {"indexed": False, "name": "milestonesBps", "type": "uint16[]"},
    ],
}


def _get_logs(contract_event, start: int, end: int, step: int = 5_000):
    logs = []
    for a in range(start, end + 1, step):
        logs.extend(contract_event.get_logs(from_block=a, to_block=min(end, a + step - 1)))
    return logs


def first_funders(w3, start: int, end: int, targets: set[str]) -> dict[str, str]:
    """Première adresse ayant envoyé des ETH à chaque cible. Parcourt les blocs (coûteux : borné)."""
    funders: dict[str, str] = {}
    if end - start > MAX_FUNDING_SCAN_BLOCKS:
        print(f"[!] {end - start} blocs : analyse des sources de financement limitée aux "
              f"{MAX_FUNDING_SCAN_BLOCKS} derniers blocs (utiliser un indexeur type Etherscan au-delà)",
              file=sys.stderr)
        start = end - MAX_FUNDING_SCAN_BLOCKS
    for b in range(start, end + 1):
        for tx in w3.eth.get_block(b, full_transactions=True).transactions:
            to = (tx["to"] or "").lower()
            if to in targets and to not in funders and tx["value"] > 0:
                funders[to] = tx["from"].lower()
    return funders


def analyse_chain(rpc: str, deployment_path: str, out_path: str) -> None:
    from web3 import Web3  # import tardif : le mode --demo n'a pas besoin de web3

    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        sys.exit(f"Impossible de joindre le nœud RPC {rpc}")
    deployment = json.loads(Path(deployment_path).read_text(encoding="utf-8"))
    fund = w3.eth.contract(address=Web3.to_checksum_address(deployment["CampusFund"]),
                           abi=[CONTRIBUTED_ABI, CAMPAIGN_CREATED_ABI])
    start, end = int(deployment.get("deployBlock", 0)), w3.eth.block_number

    created = _get_logs(fund.events.CampaignCreated, start, end)
    contributed = _get_logs(fund.events.Contributed, start, end)
    creators = {ev["args"]["id"]: ev["args"]["creator"].lower() for ev in created}
    targets = {ev["args"]["contributor"].lower() for ev in contributed} | set(creators.values())
    funders = first_funders(w3, start, end, targets)

    by_campaign: dict[int, list[Contribution]] = {cid: [] for cid in creators}
    for ev in contributed:
        who = ev["args"]["contributor"].lower()
        nonce_before = w3.eth.get_transaction_count(Web3.to_checksum_address(who), ev["blockNumber"] - 1)
        by_campaign[ev["args"]["id"]].append(Contribution(
            ev["args"]["id"], who, ev["args"]["amount"], ev["blockNumber"], funders.get(who), nonce_before))

    forest = ForestScorer(reference_features())
    results = score_campaigns(by_campaign, {c: funders.get(a) for c, a in creators.items()}, forest)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "chainId": deployment["chainId"], "campusFund": deployment["CampusFund"],
        "method": {"rulesWeight": RULES_WEIGHT, "forestWeight": FOREST_WEIGHT, "ruleWeights": RULE_WEIGHTS,
                   "levels": {"Faible": "< 35", "Moyen": "35 - 50", "Élevé": ">= 50"}},
        "campaigns": {str(k): v for k, v in results.items()},
    }
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    for c_id, r in results.items():
        print(f"campagne {c_id}: {r['score']:5.1f}  {r['level']:<6}  {'; '.join(r['reasons']) or '-'}")
    print(f"Scores écrits dans {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--demo", action="store_true", help="jeu synthétique avec fraudes simulées + évaluation")
    parser.add_argument("--rpc", default="http://127.0.0.1:8545")
    parser.add_argument("--deployment", default=str(ROOT / "deployments" / "31337.json"))
    parser.add_argument("--out", default=str(ROOT / "frontend" / "public" / "risk-scores.json"))
    args = parser.parse_args()
    if args.demo:
        run_demo()
    else:
        analyse_chain(args.rpc, args.deployment, args.out)


if __name__ == "__main__":
    main()
