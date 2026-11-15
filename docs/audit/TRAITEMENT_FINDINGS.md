# Audit statique : traitement des findings

**Outils** : Slither 0.11.6 (102 détecteurs) et `forge lint` (Foundry 1.9.0). Compilateur : solc 0.8.24.
**Commande Slither** :

```bash
slither . --filter-paths "lib/|test/" --exclude-dependencies --json docs/audit/slither-report-final.json
```

**Fichiers bruts** (non modifiés, sorties réelles des outils) :

| Fichier | Contenu |
|---|---|
| `slither-report-initial.txt` / `.json` | 1ʳᵉ exécution : **18 findings** |
| `slither-report-final.txt` / `.json` | Après corrections : **13 findings**, tous justifiés ci-dessous |
| `forge-lint.txt` | Lint Foundry sur les 4 contrats principaux : 22 alertes, toutes justifiées ci-dessous |

Les contrats de `contracts/demo/` sont **volontairement vulnérables** (démonstrations d'attaques pour la
soutenance). Ils ne sont pas déployés avec la plateforme et ne gèrent aucun fonds réel. Leurs findings
sont attendus : c'est même la preuve que Slither détecte la faille que nous montrons.

---

## 1. Findings corrigés (5 sur 18)

| # | Détecteur | Emplacement | Correction |
|---|---|---|---|
| 1 | `uninitialized-local` (Informational) | `CampusFund._checkMilestones` : `uint256 sum;` | Initialisation explicite : `uint256 sum = 0;`. Le comportement ne change pas (Solidity initialise déjà à 0), mais l'intention est claire pour le lecteur. |
| 2 | `missing-inheritance` | `Governance` doit hériter de `IVoting` | Création de `contracts/interfaces/IVoting.sol` ; `Governance is IVoting, AccessControl`. Le compilateur vérifie désormais la signature de `castVote`. |
| 3 | `missing-inheritance` | `NaiveGovernance` doit hériter de `IVoting` | `NaiveGovernance is IVoting`. |
| 4 | `missing-inheritance` | `SecureVault` doit hériter de `IVault` | Interface déplacée dans `contracts/demo/IVault.sol` ; `SecureVault is IVault, ReentrancyGuard`. |
| 5 | `missing-inheritance` | `VulnerableVault` doit hériter de `IVault` | `VulnerableVault is IVault`. |

Correction supplémentaire venant de `forge lint` : **`non-reentrant-not-first`** dans `Treasury.execute`.
`nonReentrant` est maintenant le **premier** modificateur, pour que le verrou soit posé avant tout autre code.

Après ces corrections, les 143 tests restent verts (vérifié par `forge test`).

## 2. Findings justifiés (13 restants)

### 2.1 Contrats de démonstration : vulnérables par conception (5)

| Détecteur | Emplacement | Justification |
|---|---|---|
| `reentrancy-eth` (**High**) | `VulnerableVault.withdraw` | **Faille voulue** : c'est la reproduction de The DAO. Le test `test_Attack_SucceedsOnVulnerableVault` montre l'attaque (10 ETH volés). Slither la détecte, ce qui prouve que l'outil aurait bloqué ce code en production. La version corrigée `SecureVault` n'apparaît pas dans ce détecteur. |
| `reentrancy-balance` | `MockFlashLender.flashLoan` | Un prêteur flash **doit** appeler l'emprunteur puis vérifier qu'il a été remboursé (`balanceAfter >= balanceBefore`) : c'est la définition même du flash loan (ERC-3156). Une ré-entrée ne peut que faire un emprunt imbriqué, qui doit lui aussi être remboursé. Le contrat ne stocke aucun état ni aucun ETH. |
| `low-level-calls` | `VulnerableVault.withdraw`, `SecureVault.withdraw`, `ReentrancyAttacker.collect` | Le `call` bas niveau est nécessaire pour montrer la réentrance (il transmet tout le gaz à `receive()`). Le cœur de la plateforme (`CampusFund`, `Treasury`) n'utilise **aucun** `call` direct : il passe par `Address.sendValue` d'OpenZeppelin, qui vérifie le résultat et remonte l'erreur. |

### 2.2 Utilisation de `block.timestamp` (7 : 5 dans le cœur, 2 dans la démo)

Emplacements : `CampusFund.contribute`, `finalize`, `cancelStale` ; `Governance.castVote`, `state` ;
`NaiveGovernance.castVote`, `execute`.

**Justification** : un validateur peut décaler le timestamp d'un bloc de quelques secondes seulement (sur
Ethereum post-Merge, les créneaux sont fixes à 12 s). Nos durées font **au moins 1 heure** (campagne :
1 h à 90 jours ; vote : 1 h à 14 jours ; garde-fou anti-blocage : 90 jours). Gagner quelques secondes ne
permet ni de voler des fonds ni de changer l'issue d'un vote de manière significative.
Utiliser des numéros de bloc pour les échéances serait moins lisible pour les utilisateurs (« fin le
15 décembre à 18 h » contre « fin au bloc 7 312 455 »). Le **snapshot** de vote, lui, utilise bien un
**numéro de bloc** (`getPastVotes`), car c'est là que la précision compte (voir SECURITE.md).

### 2.3 `unused-return` (1)

`Governance.proposeMilestoneRelease` : `(uint8 count, uint8 approved,) = fund.milestoneProgress(id)`.
**Justification** : la 3ᵉ valeur (`withdrawn`, le nombre de tranches retirées) n'est volontairement pas
utilisée. Pour proposer le déblocage du jalon suivant, seuls comptent le nombre total de jalons et le
nombre déjà approuvés. La valeur de retour n'est pas un code d'erreur : l'ignorer n'est donc pas
dangereux (le cas visé par ce détecteur est un `transfer` ERC-20 dont on ignore le `bool`).

## 3. Alertes `forge lint` sur les contrats principaux (22)

| Alerte | Nb | Justification |
|---|---|---|
| `block-timestamp` | 7 | Identique au §2.2. |
| `unsafe-typecast` | 6 | Conversions bornées par la logique : `uint64(block.timestamp + durée)` (dépassement en l'an 584 milliards) ; `uint8(milestonesBps.length)` ≤ 5 (vérifié par `_checkMilestones`) ; `uint8 index + 1` ≤ 5 ; `uint64(block.number - 1)`. Aucune troncature possible. |
| `arbitrary-send-eth` | 2 | `CampusFund.withdrawTranche` envoie au **bénéficiaire enregistré** de la campagne (pas à une adresse passée en paramètre), et seulement après un vote DAO. `Treasury.execute` envoie à la destination **approuvée par le multisig**. Ces destinations sont contrôlées par la logique métier. |
| `missing-events-access-control` | 3 | Faux positif : chaque écriture de `approvedBy` émet un event (`Submitted` + `Approved`, `Approved`, `Revoked`). |
| `require-revert-in-loop` | 2 | `_checkMilestones` (≤ 5 itérations) et le constructeur de `Treasury` (3 itérations) : boucles bornées de **validation**. Échouer à la première erreur est le comportement voulu. |
| `reentrancy-no-eth` | 1 | `CampusFund.refund` appelle `token.burn` après la mise à jour de l'état. La fonction est `nonReentrant`, le jeton est notre propre contrat (de confiance) et l'envoi d'ETH arrive en dernier. Le test `test_Attack_FailsOnRefund` montre qu'une ré-entrée échoue. |
| `unused-return` | 1 | Identique au §2.3. |

## 4. Bilan

- **0 finding High ou Medium non résolu dans les contrats déployés** (`CFDToken`, `CampusFund`, `Governance`, `Treasury`).
- Le seul finding High (`reentrancy-eth`) concerne `VulnerableVault`, vulnérable par conception et jamais déployé.
- Chaque protection revendiquée est **prouvée par un test** (voir SECURITE.md) et pas seulement par l'absence d'alerte.
- Limite : l'analyse statique ne remplace pas un audit humain professionnel. Slither ne voit pas les
  failles de logique économique : c'est le rôle des tests d'invariants (voir `docs/coverage/` et `test/invariant/`).

## 5. Nouvel audit après les changements du 15/11/2026

Changements analysés : vote de déblocage réservé aux contributeurs de la campagne, une seule proposition
ouverte par campagne et par type, preuve obligatoire pour un déblocage, nouvelle lecture `votingPower`.

Commande : `python -m slither . --filter-paths "lib/|test/" --exclude-dependencies`
Sortie complète : [`slither-report-2026-11-15.txt`](slither-report-2026-11-15.txt).

**13 résultats, exactement les mêmes détecteurs et les mêmes nombres** qu'au §3. Les nouvelles lignes de
`Governance` relèvent des cas déjà traités : `block-timestamp` (fin du vote, §2.2) et `unused-return`
(lecture de `milestoneProgress`, §2.3). Aucun nouveau type de finding, aucun High ou Medium.
