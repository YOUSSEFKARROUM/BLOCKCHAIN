"""Tests des indicateurs et du score : python -m pytest scripts/tests -q"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import anomaly_detection as ad  # noqa: E402

ETH = 10**18


def _c(i: int, amount: float, block: int, funder: str | None, nonce: int = 5) -> ad.Contribution:
    return ad.Contribution(0, f"0x{i:040x}", int(amount * ETH), block, funder, nonce)


def test_sybil_campaign_has_all_signals() -> None:
    contribs = [_c(i, 0.5, 100 + i, "0xsource", nonce=0) for i in range(8)]
    f = ad.campaign_features(contribs, creator_funder="0xsource")
    assert f["repeated"] == 1.0
    assert f["linked"] == 1.0
    assert f["fresh"] == 1.0
    assert f["burst"] == 1.0
    assert f["creator_linked"] == 1.0
    assert ad.rule_score(f) == 100.0


def test_honest_campaign_scores_low() -> None:
    contribs = [_c(i, 0.1 + i * 0.37, 1_000 * i, f"0xf{i}") for i in range(10)]
    f = ad.campaign_features(contribs)
    assert f["repeated"] == 0.1
    assert f["linked"] == 0.0
    assert f["burst"] == 0.1  # minimum possible : 1 contribution sur 10 dans la fenêtre
    assert ad.rule_score(f) < 35


def test_small_campaigns_are_attenuated() -> None:
    # 2 contributions identiques ne suffisent pas à accuser une campagne
    contribs = [_c(0, 1, 10, None), _c(1, 1, 11, None)]
    f = ad.campaign_features(contribs)
    assert f["repeated"] == 0.0  # il faut au moins 3 contributions
    assert ad.rule_score(f) < 35


def test_empty_campaign() -> None:
    f = ad.campaign_features([])
    assert f["n"] == 0
    assert ad.rule_score(f) == 0


def test_levels() -> None:
    assert ad.level(10) == "Faible"
    assert ad.level(35) == "Moyen"
    assert ad.level(49.9) == "Moyen"
    assert ad.level(50) == "Élevé"
    assert ad.level(100) == "Élevé"


def test_demo_evaluation_detects_frauds_without_false_alarms() -> None:
    rows, meta = ad.generate_demo_dataset(seed=ad.EVALUATION_SEED)
    grouped: dict[int, list[ad.Contribution]] = {}
    for r in rows:
        grouped.setdefault(r.campaign, []).append(r)
    forest = ad.ForestScorer(ad.reference_features(seed=ad.TRAINING_SEED))
    res = ad.score_campaigns(grouped, {c: m["creator_funder"] for c, m in meta.items()}, forest)
    false_high = sum(1 for c, r in res.items() if r["level"] == "Élevé" and meta[c]["label"] == 0)
    detected = sum(1 for c, r in res.items() if r["level"] == "Élevé" and meta[c]["label"] == 1)
    assert false_high == 0
    assert detected >= 24  # au moins 80 % des 30 fraudes
