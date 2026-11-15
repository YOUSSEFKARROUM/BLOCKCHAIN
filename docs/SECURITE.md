# Analyse de sécurité — CampusFund

Pour chaque exigence du sujet (§5) : **la notion**, **le code** qui l'implémente, **le test** qui la prouve et
**le résultat réel**. Toutes les sorties de test sont dans [`tests/forge-test-output.txt`](tests/forge-test-output.txt)
(157 tests, 0 échec).

---

## 1. Anti-réentrance

**Notion.** Quand un contrat envoie des ETH à une adresse, si cette adresse est un contrat, **son code s'exécute**
(fonction `receive`). S'il rappelle la fonction de retrait *avant* que le solde ait été mis à jour, il retire
plusieurs fois le même argent. Défense : **Checks-Effects-Interactions** (vérifier, mettre à jour l'état, *puis*
envoyer) et un verrou **`nonReentrant`** qui refuse toute ré-entrée.

**Historique — The DAO (juin 2016).** Un attaquant a exploité exactement ce schéma dans la fonction `splitDAO`
et a détourné environ **3,6 millions d'ETH** (près d'un tiers des fonds de la DAO). La communauté Ethereum a
réagi par un *hard fork* qui a annulé le vol. Ceux qui l'ont refusé ont continué la chaîne d'origine : c'est
**Ethereum Classic**.

**Code.**
- `CampusFund.withdrawTranche` (l. 169-189) : `nonReentrant`, puis `withdrawnMilestones`, `released` et `totalOwed`
  sont mis à jour **avant** `sendValue`.
- `CampusFund.refund` (l. 225-245) : `contributionOf = 0` et `totalOwed -= amount` **avant** le burn et l'envoi.
- `Treasury.execute` (l. 99-117) : `nonReentrant` en **premier** modificateur, `executed = true` avant l'envoi.
- Démo : `contracts/demo/VulnerableVault.sol` (faille volontaire), `SecureVault.sol` (corrigé),
  `ReentrancyAttacker.sol`.

**Tests** (`test/attacks/Reentrancy.t.sol`, `test/unit/Treasury.t.sol`).

| Test | Résultat réel |
|---|---|
| `test_Attack_SucceedsOnVulnerableVault` | **L'attaque réussit** : l'attaquant mise 1 ETH, repart avec 11 ETH, le coffre est vide, 10 ré-entrées. |
| `test_Attack_FailsOnSecureVault` | **L'attaque échoue** : toute la transaction est annulée, les 10 ETH des victimes restent. |
| `test_Attack_FailsOnWithdrawTranche` | Un bénéficiaire malveillant ne peut pas retirer 2 tranches d'un coup : revert `ReentrancyGuardReentrantCall`, 0 ETH sorti. |
| `test_Attack_FailsOnRefund` | Un contributeur malveillant ne peut pas se faire rembourser 2 fois. La victime reste remboursable. |
| `test_Reentrancy_Blocked` (Treasury) | Un propriétaire-contrat malveillant ne peut pas ré-exécuter pendant la réception. |

Slither signale `reentrancy-eth` (High) **uniquement** sur `VulnerableVault`, ce qui est attendu (voir `audit/TRAITEMENT_FINDINGS.md`).

## 2. Contrôle d'accès

**Notion.** Une fonction sensible sans restriction peut être appelée par n'importe qui. C'est la cause de
nombreux piratages, par exemple le portefeuille Parity (2017), dont une fonction d'initialisation était restée
publique. On utilise `AccessControl` d'OpenZeppelin : des **rôles** nommés, vérifiés par `onlyRole`.

**Code — qui peut faire quoi.**

| Rôle | Détenteur | Fonctions |
|---|---|---|
| `MINTER_ROLE`, `BURNER_ROLE` (CFDToken) | CampusFund **uniquement** | `mint`, `burn` |
| `GOVERNANCE_ROLE` (CampusFund) | Governance **uniquement** | `approveMilestone`, `freezeCampaign` |
| `PAUSER_ROLE` (CampusFund) | déployeur | `pause`, `unpause` |
| `PARAMS_ROLE` (Governance) | **personne** : abandonné au déploiement | durée de vote, seuil de proposition, mode quadratique : **figés** |
| `DEFAULT_ADMIN_ROLE` jeton, CampusFund et Governance | **personne** : abandonné au déploiement | aucun |
| propriétaires (Treasury) | 3 adresses | `submit`, `approve`, `revoke`, `execute` |
| bénéficiaire de la campagne | 1 adresse | `withdrawTranche` |

Point clé : `Deploy.s.sol` appelle `renounceRole(DEFAULT_ADMIN_ROLE)` sur le jeton et sur CampusFund. Même le
déployeur ne peut plus s'attribuer `MINTER_ROLE` ni `GOVERNANCE_ROLE`. Il ne peut ni frapper des CFD ni
débloquer des fonds sans vote.

**Tests.** `test_MintOnlyMinter`, `test_BurnOnlyBurner`, `test_Approve_OnlyGovernance` (même l'admin échoue),
`test_Freeze_OnlyGovernance`, `test_Pause_OnlyPauser`, `test_Unpause_OnlyPauser`, `test_Params_OnlyParamsRole`,
`test_OnlyOwners` (Treasury), `test_Withdraw_RevertsIfNotBeneficiary`, `test_DeployWiresRolesAndRenouncesAdmin`.
Résultat : **tous verts**. Chacun vérifie le revert exact (`AccessControlUnauthorizedAccount(compte, rôle)`).

## 3. Circuit breaker (pause d'urgence)

**Notion.** Comme un disjoncteur électrique, on coupe tout dès qu'un incident est détecté, le temps de
comprendre, pour éviter que les dégâts continuent.

**Code.** `CampusFund is Pausable` ; `whenNotPaused` sur `createCampaign`, `contribute`, `withdrawTranche` et
`refund` ; `pause()` et `unpause()` réservés à `PAUSER_ROLE`.

**Test.** `test_Pause_BlocksContributeWithdrawRefundCreate` : pendant la pause, les 4 actions échouent avec
`EnforcedPause`. Après `unpause`, le retrait fonctionne de nouveau. **Vert.**

**Limite assumée.** Le pauseur peut retarder les remboursements, mais aucune fonction ne lui permet de
**prendre** des fonds.

## 4. Multisignature 2-sur-3

**Notion.** Comme un coffre de banque à deux clés : une seule personne ne peut pas sortir l'argent. Avec
2 signatures sur 3, on tolère la perte d'une clé et on résiste au vol d'une clé.

**Code.** `contracts/Treasury.sol`, écrit par nous (pas Safe). Fonctionnement : `submit` (le proposant
approuve d'office), puis `approve` par un 2ᵉ propriétaire, puis `execute`. Au-delà de **1 ETH cumulé par jour**,
`execute` exige 2 approbations (l. 104-111).

**Tests** (`test/unit/Treasury.t.sol`, 21 tests + 1 fuzz).

| Test | Ce qu'il prouve |
|---|---|
| `test_LargeWithdrawal_RevertsWithOneSignature` | 1 ETH + 1 wei avec une seule signature : refusé. |
| `test_LargeWithdrawal_TwoOfThree` | 2 signatures : 5 ETH versés. |
| `test_DailyLimit_BlocksSplittingAttack` | 0,6 ETH puis 0,6 ETH par le même propriétaire : le 2ᵉ est refusé. |
| `test_Revoke_RemovesApproval` | Une approbation retirée ne compte plus. |
| `testFuzz_TreasuryLargeNeedsTwo` | Pour **1000 montants aléatoires** > 1 ETH, une signature ne suffit jamais. |

## 5. Anti-manipulation de la gouvernance (snapshot)

**Notion.** Si le poids d'un vote est le solde **au moment du vote**, un attaquant peut emprunter
énormément de jetons pendant une seule transaction (**flash loan** : prêt sans garantie, rendu dans la même
transaction), voter, puis rendre les jetons. Défense : lire le pouvoir de vote **à un bloc passé, figé à la
création de la proposition** (snapshot), avec `ERC20Votes.getPastVotes`.

**Historique — Beanstalk (17 avril 2022).** L'attaquant a emprunté environ 1 milliard de dollars en flash loans
(Aave, Uniswap, SushiSwap), obtenu la majorité qualifiée des votes, puis exécuté **dans la même
transaction**, via une fonction d'urgence, une proposition qui lui envoyait les fonds du protocole. Pertes
pour le protocole : environ **182 millions de dollars**. Le vote comptait les jetons détenus au moment de
l'exécution, pas à un instant figé.

**Code.**
- `Governance._createProposal` (l. 157) : `snapshot = block.number - 1`.
- `Governance.castVote` (l. 186) → `_votingPower` : pour un **gel**, `token.getPastVotes(votant, snapshotBlock)` ;
  pour un **déblocage**, la contribution du votant à la campagne × 1000, **figée** (on ne contribue plus à une
  campagne réussie). Aucun jeton emprunté ne compte dans les deux cas. Poids nul → revert `NoVotingPower`.
- Quorum (l. 172) : 10 % de `getPastTotalSupply(snapshot)` (gel) ou des CFD émis par la campagne (déblocage).
- Démo de la version faible : `contracts/demo/NaiveGovernance.sol` (`balanceOf` au moment du vote),
  `MockFlashLender.sol`, `FlashLoanAttacker.sol`.

**Tests** (`test/attacks/FlashLoanGovernance.t.sol`). Scénario : une campagne honnête, la communauté vote
**contre** son gel (10 000 CFD). Un attaquant **sans aucun CFD** emprunte 1 000 000 CFD.

| Test | Résultat réel |
|---|---|
| `test_FlashLoan_SucceedsWithoutSnapshot` | **Sans snapshot, l'attaque réussit** : 1 000 000 « pour » contre 10 000 « contre », prêt remboursé, l'attaquant finit à 0 CFD… et la campagne honnête est **gelée**. |
| `test_FlashLoan_FailsWithSnapshot` | **Avec snapshot, l'attaque échoue** : `NoVotingPower`, 0 vote « pour », campagne toujours active. |
| `test_FlashLoan_FailsEvenInProposalBlock` | Même avec les jetons détenus et délégués **dans le bloc de la proposition**, le poids reste 0 (snapshot = bloc précédent). |
| `test_Vote_TokensAcquiredAfterSnapshotDoNotCount` | 50 ETH contribués après la proposition ne donnent aucun poids. |
| `test_Vote_TransferAfterSnapshotDoesNotDoubleVote` | Voter, transférer ses CFD à un complice, revoter : refusé. |
| `testFuzz_LateTokensNeverCount` | Pour 1000 montants achetés après le snapshot, le poids reste celui du snapshot. |

## 6. Audit statique

Slither 0.11.6 : **18 findings** au départ, **13** après corrections, **0 High/Medium** non résolu dans les
contrats déployés. Chaque finding est traité dans [`audit/TRAITEMENT_FINDINGS.md`](audit/TRAITEMENT_FINDINGS.md).
Rapports bruts : `audit/slither-report-initial.txt` et `audit/slither-report-final.txt`.

## 7. Au-delà du sujet

| Protection | Code | Preuve |
|---|---|---|
| **Invariants** (propriétés vraies après *toute* suite d'actions) | `test/invariant/` | 256 séquences × 100 appels aléatoires, 0 violation. Les « canaris » prouvent que votes, tranches, gels et remboursements sont réellement explorés. |
| Solvabilité : `balance ≥ dette` | `invariant_SolventBalance` | vert |
| Offre CFD = (contributions − remboursements) × 1000 | `invariant_SupplyMatchesContributions` | vert |
| Aucune tranche sans vote exécuté | `invariant_NoTrancheWithoutVote` | vert |
| La trésorerie ne reçoit que les frais | `invariant_TreasuryGetsOnlyFees` | vert |
| Pull payment (pas de boucle de remboursement) | `refund` | `test_Refund_*` |
| Anti-blocage des fonds | `cancelStale` | `test_CancelStale_*` |
| Le déployeur ne garde aucun pouvoir sur les fonds | `Deploy.s.sol` | `test_DeployWiresRolesAndRenouncesAdmin` |
| Pas de clés anvil publiques comme propriétaires sur Sepolia | `Deploy.s.sol` | `test_DeployRefusesWithoutOwnersOutsideAnvil` |
| Front : secret Pinata côté serveur, CID filtré (anti path traversal), taille et débit limités, en-têtes HTTP | `frontend/src/app/api/ipfs` | requêtes réelles : `..%2F..%2Fpackage.json` → 400 |
| Détection de fraude (bonus IA) | `scripts/anomaly_detection.py` | campagne sybil : 100/100 ; sur données simulées (10 tirages) : rappel 0,88 (fraudes connues) et 0,38 (fraudes déguisées), précision ≈ 1 |

## 8. Limites connues (honnêteté)

- **Pas d'audit humain professionnel** : Slither et les tests réduisent le risque sans le supprimer.
- **Vote quadratique** vulnérable aux identités multiples (Sybil) : c'est pourquoi il est désactivé par défaut.
- **Jeton transférable** : on peut *acheter* du pouvoir de vote **avant** une proposition. Le snapshot
  empêche seulement l'achat *après*. Pistes : délai de verrouillage, ou délai entre création et début du vote.
- **Pauseur et paramètres** gardés par le déployeur. Amélioration : les confier au multisig ou à un timelock.
- **Script IA** : un fraudeur patient (montants variés, financement par des sources différentes) peut passer
  sous les seuils. Le score est une aide, pas une preuve.

## Ajouts du 15/11/2026

| Protection | Code | Test |
|---|---|---|
| Seuls les contributeurs d'une campagne votent ses tranches, avec un poids = leur mise | `Governance._votingPower` | `test_ReleaseVote_RevertsForNonContributor`, `test_ReleaseVote_WorksWithoutDelegation` |
| Quorum d'un déblocage = 10 % des CFD de la campagne, pas de toute la plateforme | `Governance._createProposal` | `test_ReleaseQuorum_IsTenPercentOfCampaign` |
| Une seule proposition ouverte par campagne et par type (pas de relance jusqu'à un vote creux) | `_lastProposal`, `ProposalAlreadyOpen` | `test_Release_RevertsWhileAnotherIsOpen`, `test_Release_RevertsWhileSucceededNotExecuted`, `test_Release_AllowedAgainAfterDefeat`, `test_Freeze_RevertsWhileAnotherIsOpen` |
| Preuve obligatoire pour demander un déblocage | `proposeMilestoneRelease(…, proof)`, `MissingProof` | `test_Release_RevertsWithoutProof`, `test_Release_StoresProof` |
| Paramètres de vote figés, plus d'admin de gouvernance | `Deploy.s.sol` | `test_DeployWiresRolesAndRenouncesAdmin` |
| Lien de preuve affiché seulement s'il est sûr (`https:` ou IPFS) | `frontend/src/lib/proof.ts` | `campaignView.test.ts` (« refuse tout schéma dangereux ») |

Slither relancé après ces changements : mêmes 13 résultats, aucun High ni Medium
([TRAITEMENT_FINDINGS §5](audit/TRAITEMENT_FINDINGS.md)).
