# Plan de soutenance — 10 minutes

## Préparation (la veille et 30 min avant)

- [ ] `anvil` lancé, puis `bash scripts/demo-anvil.sh` (ou `.ps1`) : 5 campagnes, des votes et des tranches prêts.
- [ ] `cd frontend && npm run dev`, puis http://localhost:3000 ouvert.
- [ ] MetaMask : réseau « Anvil » (RPC `http://127.0.0.1:8545`, chainId 31337), comptes anvil n°5 (contributeur, a déjà voté) et n°6 importés.
  Clés de test **publiques** d'anvil, affichées par `anvil` au démarrage.
- [ ] Après chaque redémarrage d'anvil, faire dans MetaMask : Paramètres → Avancé → « Effacer les données
  d'activité ». Sinon il garde d'anciens nonces et les transactions échouent.
- [ ] Un terminal prêt pour `forge test --match-contract FlashLoanGovernance -vv`.
- [ ] Captures de secours ouvertes : `docs/captures/` (et les captures Sepolia).
- [ ] Onglet Etherscan Sepolia ouvert sur les contrats vérifiés (si déployés).

## Déroulé (10 min)

| Temps | Contenu | Support |
|---|---|---|
| 0:00 – 1:00 | **Le problème** : un club étudiant collecte de l'argent, mais qui garantit qu'il sera bien utilisé ? Les plateformes classiques demandent de faire confiance à un intermédiaire. CampusFund : fonds versés par jalons, sur vote de la communauté. | Page d'accueil |
| 1:00 – 2:30 | **Architecture** : 4 contrats (CFDToken, CampusFund, Governance, Treasury), métadonnées sur IPFS, front Next.js + ethers, script IA hors chaîne. Machine d'états d'une campagne. | Schéma de RAPPORT.md §3 |
| 2:30 – 5:30 | **Démo (3 min)**, voir ci-dessous | Front |
| 5:30 – 8:00 | **Sécurité** : réentrance (The DAO), snapshot contre flash loan (Beanstalk) avec le test en direct, multisig avec plafond journalier, renonciation aux rôles admin, Slither (18 → 13 findings, tous traités). | Terminal + SECURITE.md |
| 8:00 – 9:15 | **Tests** : 145 tests, fuzz 1000 tirages, 5 invariants, canaris, couverture 100 % des lignes des contrats principaux. **IA** : précision 1,0, rappel 0,87 sur un jeu jamais vu, et ses limites. | docs/coverage, demo_report.json |
| 9:15 – 10:00 | **Bilan et limites** : pas d'audit pro, Sybil sur le vote quadratique, jeton achetable avant une proposition. Pistes : timelock, délai de vote, identité étudiante. | — |

## La démo en 3 minutes (chronométrée)

1. **(0:00) Liste** : « 5 campagnes réelles de clubs. Badges IA : la bourse "TechAid" est en *Élevé 100/100*. »
   Survoler le badge pour lire les raisons.
2. **(0:30) Détail de TechAid** : montrer les 5 signaux (8 adresses financées par la même source, montants
   identiques, rafale de contributions). « Le script l'a signalée, mais seule la DAO peut agir. »
3. **(1:00) Gouvernance** : proposition n°3 « Geler TechAid ». Avec le compte n°6 : « Voter pour ». Le quorum
   se remplit en direct. Montrer « Pour / Contre / Quorum 10 % ».
4. **(1:45) +1 h** (bouton anvil), puis « Exécuter la décision ». Retour sur TechAid : statut **Annulée**. Les
   faux contributeurs peuvent seulement récupérer leur mise : le fraudeur n'a rien touché.
5. **(2:15) Robotique** : 1 tranche sur 3 versée, 1 approuvée. Proposition n°2 « jalon 2 » ouverte : « chaque
   tranche demande un nouveau vote ».
6. **(2:40) Terminal** : `forge test --match-contract FlashLoanGovernance -vv`. Le test *sans snapshot* gèle la
   campagne, le test *avec snapshot* échoue avec `NoVotingPower`. « C'est Beanstalk, et notre parade. »

## Plan B si la démo plante

| Panne | Réaction immédiate (< 20 s) |
|---|---|
| MetaMask refuse une transaction (nonce) | « Effacer les données d'activité » dans MetaMask, puis réessayer. Si ça échoue encore, passer au plan C. |
| Le front ne charge pas | Vérifier qu'anvil tourne (`cast block-number`). Sinon relancer `anvil` puis `scripts/demo-anvil.sh` (environ 1 min). Pendant ce temps, présenter les captures de `docs/captures/`. |
| Pas de réseau / Sepolia indisponible | Tout fonctionne en local (anvil) : la démo ne dépend pas d'Internet. Les métadonnées de démo sont en cache local. |
| Plan C : rien ne marche | Montrer les **tests** dans le terminal (`forge test -vv`) : ils rejouent tous les scénarios, attaques comprises. Puis les captures d'écran Sepolia et Etherscan dans le rapport. |

**Phrase de transition à préparer** : « Pendant que ça redémarre, je vous montre la même chose dans les
tests, qui sont la preuve la plus fiable. »

## Répartition dans le trinôme (suggestion)

- Membre 1 : contexte, architecture, démo du front.
- Membre 2 : sécurité (réentrance, snapshot/flash loan, multisig) et Slither.
- Membre 3 : tests et invariants, script IA, limites. Il répond aux questions sur les choix (CHOIX_DE_CONCEPTION.md).
