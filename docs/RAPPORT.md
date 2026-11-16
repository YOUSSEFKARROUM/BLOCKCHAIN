# CampusFund — Plateforme de financement participatif décentralisée à gouvernance par jeton

**Rapport de mini-projet Blockchain** — ENSA Béni Mellal, filière IA et Cybersécurité
Trinôme : **[À REMPLACER : Nom 1]**, **[À REMPLACER : Nom 2]**, **[À REMPLACER : Nom 3]** — Encadrant : **[À REMPLACER]** — Date : **[À REMPLACER : jj/mm/aaaa]**

> Plan détaillé prêt à convertir en PDF (10 à 15 pages), par exemple avec
> `pandoc docs/RAPPORT.md -o rapport.pdf`. Les mentions **[À REMPLACER]** sont des informations que seule
> l'équipe peut donner (noms, date, ce que nous avons appris) : elles ne doivent pas être inventées.
> Les blocs « 📷 » indiquent l'emplacement des captures.

---

## Résumé (½ page)

CampusFund permet aux clubs et aux projets étudiants de collecter des ETH sans intermédiaire. Chaque
contributeur reçoit des jetons de gouvernance CFD (1 ETH = 1000 CFD). Les fonds sont versés **jalon par
jalon**, chacun après le vote des contributeurs de la campagne (poids = leur mise) et sur preuve du jalon.
Toute la communauté peut aussi voter le gel d'une campagne suspecte. Quatre contrats Solidity (OpenZeppelin v5)
sont testés avec Foundry : 157 tests, fuzzing, 5 invariants, 100 % des lignes et 97 % des branches couvertes. L'audit Slither est traité et deux attaques réelles
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
| M3 Vote pondéré, quorum, majorité, délai | `Governance` : déblocage voté par les contributeurs de la campagne (poids = mise), gel voté par la communauté (snapshot), quorum 10 %, majorité stricte, exécution après la fin du vote |
| M4 Interface MetaMask | Next.js + ethers v6 : 5 écrans (accueil, fiche, gouvernance, création, sécurité) |

2.2 **Exigences de sécurité** (§5 du sujet) : renvoi vers la partie 5.
2.3 **Différenciation** : jalons avec preuve, vote par campagne, démo d'attaque flash loan, tests d'invariants, badge de risque IA évalué honnêtement, design « Tableau des départs ».
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
**Les cinq choix que le jury attaquera en premier.**

- **Quorum de 10 %.** Assez haut pour qu'un petit groupe ne décide pas seul, assez bas pour être atteint dans
  une communauté étudiante où beaucoup ne votent pas. Pour un déblocage, il porte sur les CFD de la campagne :
  une petite campagne n'a pas besoin des voix de toute la plateforme.
- **Snapshot au bloc précédent.** Pour un gel, le poids est lu à `block.number - 1` : un jeton emprunté ou
  acheté après la proposition, même dans la même transaction, ne compte pas (attaque Beanstalk rejouée et
  bloquée). Pour un déblocage, le poids est la contribution, figée depuis l'échéance : rien ne s'emprunte.
- **Multisig 2 sur 3 avec plafond journalier.** Une clé perdue ou volée ne suffit pas. Le plafond est cumulé
  sur la journée, sinon un seul propriétaire ferait dix retraits de 0,99 ETH.
- **Jeton global, vote par campagne.** Le CFD est une part de la communauté, utile pour signaler une fraude
  partout (gel). Mais les tranches d'une campagne ne sont votées que par ceux qui l'ont financée : un gros
  porteur ailleurs ne décide pas pour elle.
- **La pause bloque aussi les remboursements.** Un coupe-circuit doit tout geler pendant l'analyse d'un
  incident, la faille pouvant se trouver dans `refund`. En contrepartie, le titulaire de la pause peut retarder
  les remboursements, mais aucune fonction ne lui permet de prendre des fonds.

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
| CampusFund | 61 | ✅ |
| Governance | 47 | ✅ |
| Treasury | 22 | ✅ |
| Réentrance | 5 | ✅ |
| Flash loan | 4 | ✅ |
| Fuzz (1000 tirages chacun) | 8 | ✅ |
| Invariants (256 × 100 appels, 5 propriétés) | 1 suite | ✅ |
| Déploiement | 2 | ✅ |
| **Total** | **157** | **0 échec** |

6.3 Les invariants expliqués, et la preuve d'atteignabilité par les canaris.
6.4 **Couverture** (`docs/coverage/COUVERTURE.md`) : 100 % des lignes de CFDToken, CampusFund, Governance et
Treasury ; branches : 97 % sur les 4 contrats (75/77). Les deux branches restantes sont des refus dans un
modificateur, exécutés par les tests mais non attribués par `forge coverage`. Le total global (85 %) inclut les
contrats de démonstration volontairement vulnérables.
6.5 Bugs trouvés grâce aux tests (honnêteté) : seuil de risque mal calibré (rappel 33 %, puis 87 % après
recalibrage sur un tirage séparé) ; test de déploiement qui écrasait le fichier d'adresses anvil ; risque des
clés anvil comme propriétaires du multisig sur Sepolia, corrigé et testé. Après la revue du 15/11 : un
porteur pouvait ouvrir plusieurs demandes de déblocage pour le même jalon (corrigé : une seule à la fois) ; le
déployeur gardait l'administration de la gouvernance (abandonnée) ; le test de déploiement dépendait du `.env`
de la machine (isolé).

## 7. Audit statique (1 page)

7.1 Méthode : Slither 0.11.6 (102 détecteurs) et `forge lint`.
7.2 Résultats : 18 findings, puis 13. Tableau des corrections et justifications ([audit/TRAITEMENT_FINDINGS.md](audit/TRAITEMENT_FINDINGS.md)).
7.3 Relance après les changements du 15/11 : mêmes 13 résultats, aucun High ni Medium
(`audit/slither-report-2026-11-15.txt`).
7.4 Annexe : rapports bruts `audit/slither-report-initial.txt` et `audit/slither-report-final.txt`.

## 8. Bonus : détection d'anomalies par IA (1 page)

8.1 Indicateurs (montants répétés, adresses liées, adresses neuves, pic, concentration) et pourquoi ils signalent une fraude.
8.2 Modèle : règles (60 %) et Isolation Forest (40 %) ; atténuation pour les petites campagnes.
8.3 Évaluation honnête, sur des données **simulées par notre script** : graines séparées (calibration,
entraînement, évaluation) et 10 tirages.

| Détecteur | Fraudes connues (précision / rappel) | Fraudes déguisées (précision / rappel) |
|---|---|---|
| Score combiné | 1,00 ± 0,01 / 0,88 ± 0,02 | 0,99 ± 0,03 / 0,38 ± 0,11 |
| Règles seules | 1,00 / 0,34 | 0,00 / 0,00 |
| Isolation Forest seule | 1,00 / 0,50 | 0,00 / 0,00 |

La combinaison fait nettement mieux que chaque détecteur seul. Mais face à des fraudes déguisées (montants
variés, contributions étalées, plusieurs sources de fonds), le rappel tombe à 0,38 : c'est la limite à
présenter. Aucune vraie fraude n'a servi de test.
8.4 Sur anvil : campagne sybil à 100/100, campagnes honnêtes sous 20.
📷 Capture : détail de la campagne signalée avec ses raisons (`docs/captures/anvil-campaign5.png`).

## 9. Interface et déploiement (1,5 page)

9.1 Les 5 écrans. 📷 `docs/captures/anvil-home.png`, `anvil-campaign2.png`, `anvil-governance.png`, `anvil-creator.png`, `anvil-securite.png` et `anvil-home-mobile.png` (375 px).
9.2 Gestion des cas d'erreur : MetaMask absent, mauvais réseau, transaction rejetée, erreurs Solidity traduites, CFD manquants avant un remboursement.
9.3 **Déploiement Sepolia.** Adresses du déploiement actuel (bloc 12072327, vote de 1 h). **Il précède les
changements de contrats du 15/11** : après le redéploiement (`scripts/deploy-sepolia.sh`), remplacer ce tableau
par les nouvelles adresses **[À REMPLACER après redéploiement]**.

| Contrat | Adresse Sepolia | Lien Etherscan |
|---|---|---|
| Treasury | `0xd56346AA32D6b91bb813ED356a10b2d8322acaB3` | https://sepolia.etherscan.io/address/0xd56346AA32D6b91bb813ED356a10b2d8322acaB3#code |
| CFDToken | `0x5Ad0412DBd714AaC28F6627324d94Fb01E409Cc1` | https://sepolia.etherscan.io/address/0x5Ad0412DBd714AaC28F6627324d94Fb01E409Cc1#code |
| CampusFund | `0xf2095C974371D742d27ab75B4B67B284a8095E7D` | https://sepolia.etherscan.io/address/0xf2095C974371D742d27ab75B4B67B284a8095E7D#code |
| Governance | `0x353594F8a5568E3524276D2BE1cF077d624bDa9C` | https://sepolia.etherscan.io/address/0x353594F8a5568E3524276D2BE1cF077d624bDa9C#code |

📷 **Captures Sepolia à insérer** :
1. Les 4 contrats sur Etherscan avec la coche « Contract Source Code Verified ».
2. Une transaction `createCampaign` sur Etherscan (hash, events).
3. Une contribution et le CFD reçu dans MetaMask.
4. Une proposition votée puis exécutée (event `ProposalExecuted`).
5. Un retrait de tranche avec les 2 % arrivés sur la trésorerie.
6. Le front connecté à Sepolia (réseau affiché dans l'en-tête, campagnes).
7. Les métadonnées visibles sur la passerelle Pinata (`https://gateway.pinata.cloud/ipfs/<CID>`).

## 10. Conclusion et perspectives (½ page)

**Bilan.** Les quatre exigences fonctionnelles et les cinq exigences de sécurité du sujet sont couvertes,
chacune prouvée par un test. Deux attaques historiques sont rejouées et bloquées. La revue du 15/11 a rendu le
vote plus juste (par campagne), plus difficile à forcer (une proposition à la fois, preuve obligatoire) et
moins centralisé (paramètres figés).

**Ce que l'équipe a appris :** **[À REMPLACER : à rédiger par l'équipe]**.

**Perspectives.** Timelock entre adoption et exécution ; délai avant l'ouverture du vote ; identité étudiante
(contre les Sybil) pour un vote quadratique sûr ; pause confiée à un multisig capable d'appeler des contrats ;
indexeur (The Graph) pour le front et le script IA ; évaluation de l'IA sur de vraies données.

## Annexes

A. Guide d'installation et commandes (README.md)
B. Sortie complète de `forge test` (`docs/tests/forge-test-output.txt`)
C. Rapports Slither bruts (`docs/audit/`)
D. Rapport de couverture (`docs/coverage/`)
E. Rapport d'évaluation du script IA (`scripts/data/demo_report.json`)
