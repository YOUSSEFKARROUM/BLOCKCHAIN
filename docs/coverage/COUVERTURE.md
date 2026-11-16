# Rapport de couverture (sortie réelle de forge coverage)

Commande : `forge coverage --report summary --report lcov --no-match-coverage "(test|scripts)"`
Date : 2026-11-16 — forge 1.9.0, solc 0.8.24 — 159 tests verts

## Les 4 contrats du projet

| Contrat | Lignes | Instructions | Branches | Fonctions |
|---|---|---|---|---|
| CFDToken | 100 % (8/8) | 100 % (4/4) | aucune branche | 100 % (4/4) |
| CampusFund | 100 % (132/132) | 99,40 % (166/167) | 97,14 % (34/35) | 100 % (22/22) |
| Governance | 100 % (98/98) | 100 % (130/130) | 100 % (30/30) | 100 % (14/14) |
| Treasury | 100 % (51/51) | 98,25 % (56/57) | 92,31 % (12/13) | 100 % (12/12) |
| **Total projet** | **100 % (289/289)** | **99,4 % (356/358)** | **97,4 % (76/78)** | **100 % (52/52)** |

**Les deux branches signalées comme non couvertes sont bien testées.** Ce sont deux refus placés dans un
modificateur : `exists` de CampusFund (campagne inexistante) et `pending` de Treasury (transaction
inexistante). Les tests `test_Read_RevertsForUnknownCampaign` et `test_Approve_RevertsForUnknownTransaction`
passent par ces refus et réussissent, mais `forge coverage` ne les compte pas : il n'attribue pas les
branches exécutées dans un modificateur.

## Tableau complet, contrats de démonstration compris

Le total global (85,34 % des branches) est tiré vers le bas par les contrats de `contracts/demo/`. Ils sont
**volontairement vulnérables** (VulnerableVault, NaiveGovernance) ou ne servent qu'à mener les attaques :
seul le chemin de l'attaque y est exercé.

| File                                  | % Lines           | % Statements      | % Branches      | % Funcs         |
|---|---|---|---|---|
| contracts/CFDToken.sol                | 100.00% (8/8)     | 100.00% (4/4)     | N/A (0/0)       | 100.00% (4/4)   |
| contracts/CampusFund.sol              | 100.00% (132/132) | 99.40% (166/167)  | 97.14% (34/35)  | 100.00% (22/22) |
| contracts/Governance.sol              | 100.00% (98/98)   | 100.00% (130/130) | 100.00% (30/30) | 100.00% (14/14) |
| contracts/Treasury.sol                | 100.00% (51/51)   | 98.25% (56/57)    | 92.31% (12/13)  | 100.00% (12/12) |
| contracts/demo/FlashLoanAttacker.sol  | 100.00% (14/14)   | 100.00% (12/12)   | 50.00% (3/6)    | 100.00% (3/3)   |
| contracts/demo/MockFlashLender.sol    | 100.00% (7/7)     | 100.00% (8/8)     | 100.00% (1/1)   | 100.00% (2/2)   |
| contracts/demo/NaiveGovernance.sol    | 100.00% (24/24)   | 100.00% (21/21)   | 56.25% (9/16)   | 100.00% (4/4)   |
| contracts/demo/ReentrancyAttacker.sol | 100.00% (16/16)   | 100.00% (13/13)   | 57.14% (4/7)    | 100.00% (4/4)   |
| contracts/demo/SecureVault.sol        | 100.00% (8/8)     | 100.00% (7/7)     | 100.00% (4/4)   | 100.00% (2/2)   |
| contracts/demo/VulnerableVault.sol    | 100.00% (8/8)     | 100.00% (7/7)     | 50.00% (2/4)    | 100.00% (2/2)   |
| Total                                 | 100.00% (366/366) | 99.53% (424/426)  | 85.34% (99/116) | 100.00% (69/69) |

Le fichier `lcov.info` permet de générer un rapport HTML : `genhtml docs/coverage/lcov.info -o docs/coverage/html` (outil lcov).
