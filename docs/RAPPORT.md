# CampusFund — Plateforme de financement participatif décentralisée à gouvernance par jeton

**Rapport de mini-projet Blockchain** — ENSA Béni Mellal, filière IA et Cybersécurité
Trinôme : _[Nom 1]_, _[Nom 2]_, _[Nom 3]_ — Encadrant : _[Nom]_ — Date : _[jj/mm/aaaa]_

> Plan détaillé prêt à convertir en PDF (10 à 15 pages), par exemple avec
> `pandoc docs/RAPPORT.md -o rapport.pdf`. Les blocs « ✎ » sont à rédiger ou compléter par l'équipe.
> Les blocs « 📷 » indiquent l'emplacement des captures.

---

## Résumé (½ page)

CampusFund permet aux clubs et aux projets étudiants de collecter des ETH sans intermédiaire. Chaque
contributeur reçoit des jetons de gouvernance CFD (1 ETH = 1000 CFD). Les fonds sont versés **jalon par
jalon**, chacun après un **vote pondéré** de la DAO. La DAO peut aussi geler une campagne suspecte.
Quatre contrats Solidity (OpenZeppelin v5) sont testés avec Foundry : 145 tests, fuzzing, 5 invariants et
100 % des lignes couvertes sur les contrats principaux. L'audit Slither est traité et deux attaques réelles
sont démontrées : la réentrance et le flash loan de gouvernance. Un script d'IA (règles + Isolation Forest)
attribue un score de risque à chaque campagne, affiché dans l'interface.

## 1. Introduction et contexte (1 page)

1.1 Le financement participatif centralisé : frais, confiance aveugle, censure possible.
1.2 Ce qu'apporte la blockchain : fonds sous séquestre programmé, règles publiques, traçabilité.
1.3 Positionnement : **projets étudiants et clubs universitaires**. Un club scientifique finance un
événement ou du matériel, et la communauté du campus contrôle l'usage des fonds.
1.4 Objectifs pédagogiques (rappel du sujet).

## 2. Cahier des charges (1,5 page)

2.1 **Exigences fonctionnelles** (M1 à M4), avec pour chacune sa fonction dans le code :

| Exigence | Réalisation |
|---|---|
| M1 Jeton CFD, mint à la contribution | `CFDToken` (ERC20 + ERC20Votes), `contribute` → `mint` |
| M2 createCampaign / contribute / statuts / refund / withdraw conditionné | `CampusFund` : machine d'états à 4 statuts, `withdrawTranche` après vote |
| M3 Vote pondéré, quorum, majorité, délai | `Governance` : snapshot, quorum 10 %, majorité stricte, exécution après la fin du vote |
| M4 Interface MetaMask | Next.js + ethers v6 : 4 écrans |

2.2 **Exigences de sécurité** (§5 du sujet) : renvoi vers la partie 5.
2.3 **Différenciation** : jalons, démo d'attaque flash loan, tests d'invariants, badge de risque IA, vote quadratique en option.
2.4 Contraintes : Solidity ^0.8.20, Foundry, Sepolia, IPFS (Pinata), Slither.

## 3. Architecture (2 pages)

3.1 **Vue d'ensemble**.

```
          ┌──────────────┐   CID IPFS    ┌──────────────┐
 MetaMask │  Front-end   │──────────────▶│  IPFS/Pinata │
   ◀────▶ │  Next.js     │  /api/ipfs    └──────────────┘
          │  ethers v6   │   (JWT côté serveur)
          └──────┬───────┘
     lecture RPC │ transactions signées
 ┌───────────────▼────────────────────────────────────────────┐
 │  CampusFund ──mint/burn──▶ CFDToken (ERC20Votes)            │
 │      ▲ approveMilestone / freeze    │ getPastVotes          │
 │      └──────── Governance ◀─────────┘                       │
 │      │ 2 % des tranches                                     │
 │      └──────────────▶ Treasury (multisig 2/3)               │
 └─────────────────────────────────────────────────────────────┘
          ▲ events
 ┌────────┴─────────┐  risk-scores-<id>.json
 │ anomaly_detection │──────────────────▶ badge dans le front
 │ (Python, sklearn) │
 └──────────────────┘
```

3.2 **Rôle de chaque contrat** et **tableau des rôles** AccessControl (reprendre SECURITE.md §2).
3.3 **Machine d'états d'une campagne** : `Active → Successful | Failed` (finalize) et
`Active | Successful → Cancelled` (annulation sans contribution, gel DAO, cancelStale). Diagramme à dessiner.
3.4 **Cycle de vie d'un vote** : proposition (snapshot), vote, fin, exécution.
3.5 **Organisation du dépôt** : `/contracts /test /frontend /scripts /docs`.

## 4. Choix techniques et de conception (1,5 page)

Reprendre et commenter le tableau de [CHOIX_DE_CONCEPTION.md](CHOIX_DE_CONCEPTION.md) : taux, quorum,
majorité, snapshot, durée de vote, frais, multisig et plafond journalier, jalons, pull payment, burn au
remboursement, renonciation aux rôles, Foundry plutôt que Hardhat, IPFS côté serveur.
✎ Justifier en 2-3 phrases les 5 choix que le jury attaquera en premier (quorum, snapshot, multisig, jeton global, pause des remboursements).

## 5. Analyse de sécurité (3 pages)

Pour chaque exigence : notion, code, test, résultat, histoire. Source : [SECURITE.md](SECURITE.md).

5.1 Réentrance : CEI + nonReentrant ; démo VulnerableVault (10 ETH volés) contre SecureVault ; The DAO 2016.
5.2 Contrôle d'accès : tableau des rôles ; renonciation de l'admin au déploiement.
5.3 Circuit breaker : Pausable, ce qui est suspendu, compromis sur les remboursements.
5.4 Multisig 2-sur-3 : submit / approve / execute, plafond journalier contre le découpage.
5.5 Manipulation de gouvernance : snapshot `getPastVotes(block.number − 1)` ; démo flash loan (réussite
sans snapshot, échec avec) ; Beanstalk 2022.
5.6 Protections supplémentaires : pull payment, anti-blocage, invariants, sécurité du front (secret serveur,
anti path traversal, limite de débit).
5.7 **Limites et améliorations** (SECURITE.md §8).

## 6. Tests et résultats (2 pages)

6.1 Stratégie : unitaires (chaque fonction, chaque revert), attaques, fuzz, invariants, test du script de déploiement.
6.2 **Résultats réels** (copier depuis `docs/tests/forge-test-output.txt`) :

| Suite | Tests | Résultat |
|---|---|---|
| CFDToken | 7 | ✅ |
| CampusFund | 60 | ✅ |
| Governance | 37 | ✅ |
| Treasury | 21 | ✅ |
| Réentrance | 5 | ✅ |
| Flash loan | 4 | ✅ |
| Fuzz (1000 tirages chacun) | 8 | ✅ |
| Invariants (256 × 100 appels, 5 propriétés) | 1 suite | ✅ |
| Déploiement | 2 | ✅ |
| **Total** | **145** | **0 échec** |

6.3 Les invariants expliqués, et la preuve d'atteignabilité par les canaris.
6.4 **Couverture** (`docs/coverage/COUVERTURE.md`) : 100 % des lignes de CFDToken, CampusFund, Governance et
Treasury ; branches : 97 % (CampusFund), 100 % (Governance), 92 % (Treasury).
6.5 Bugs trouvés grâce aux tests (honnêteté) : seuil de risque mal calibré (rappel 33 %, puis 87 % après
recalibrage sur un tirage séparé) ; test de déploiement qui écrasait le fichier d'adresses anvil ; risque des
clés anvil comme propriétaires du multisig sur Sepolia, corrigé et testé.

## 7. Audit statique (1 page)

7.1 Méthode : Slither 0.11.6 (102 détecteurs) et `forge lint`.
7.2 Résultats : 18 findings, puis 13. Tableau des corrections et justifications ([audit/TRAITEMENT_FINDINGS.md](audit/TRAITEMENT_FINDINGS.md)).
7.3 Annexe : rapports bruts `audit/slither-report-initial.txt` et `audit/slither-report-final.txt`.

## 8. Bonus : détection d'anomalies par IA (1 page)

8.1 Indicateurs (montants répétés, adresses liées, adresses neuves, pic, concentration) et pourquoi ils signalent une fraude.
8.2 Modèle : règles (60 %) et Isolation Forest (40 %) ; atténuation pour les petites campagnes.
8.3 Évaluation honnête : trois graines (calibration / entraînement / évaluation). Précision 1,0, rappel 0,867,
5,7 % des campagnes normales en « Moyen », 0 en « Élevé ». Auto-financement détecté 6 fois sur 10 : c'est la limite.
8.4 Sur anvil : campagne sybil à 100/100, campagnes honnêtes sous 20.
📷 Capture : détail de la campagne TechAid avec ses signaux (`docs/captures/anvil-campaign4.png`).

## 9. Interface et déploiement (1,5 page)

9.1 Les 4 écrans. 📷 `docs/captures/anvil-home.png`, `anvil-campaign4.png`, `anvil-governance.png`, `anvil-creator.png`.
9.2 Gestion des cas d'erreur : MetaMask absent, mauvais réseau, transaction rejetée, erreurs Solidity traduites.
9.3 **Déploiement Sepolia** (✎ à compléter après `scripts/deploy-sepolia.sh`) :

| Contrat | Adresse Sepolia | Lien Etherscan (vérifié) |
|---|---|---|
| Treasury | ✎ | ✎ |
| CFDToken | ✎ | ✎ |
| CampusFund | ✎ | ✎ |
| Governance | ✎ | ✎ |

📷 **Captures Sepolia à insérer** :
1. Les 4 contrats sur Etherscan avec la coche « Contract Source Code Verified ».
2. Une transaction `createCampaign` sur Etherscan (hash, events).
3. Une contribution et le CFD reçu dans MetaMask.
4. Une proposition votée puis exécutée (event `ProposalExecuted`).
5. Un retrait de tranche avec les 2 % arrivés sur la trésorerie.
6. Le front connecté à Sepolia (bandeau du réseau, campagnes).
7. Les métadonnées visibles sur la passerelle Pinata (`https://gateway.pinata.cloud/ipfs/<CID>`).

## 10. Conclusion et perspectives (½ page)

Bilan des objectifs ; ce que l'équipe a appris (✎) ; perspectives : timelock entre adoption et exécution,
délai avant l'ouverture du vote, identité étudiante (contre les Sybil) pour un vote quadratique sûr, pauseur
confié au multisig, indexeur (The Graph) pour le script IA sur Sepolia.

## Annexes

A. Guide d'installation et commandes (README.md)
B. Sortie complète de `forge test` (`docs/tests/forge-test-output.txt`)
C. Rapports Slither bruts (`docs/audit/`)
D. Rapport de couverture (`docs/coverage/`)
E. Rapport d'évaluation du script IA (`scripts/data/demo_report.json`)
