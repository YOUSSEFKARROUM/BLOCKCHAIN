# Rapport de couverture (sortie réelle de forge coverage)

Commande : `forge coverage --report summary --report lcov --no-match-coverage "(test|scripts)"`
Date : 2026-11-03 — forge 1.9.0, solc 0.8.24

| File                                  | % Lines           | % Statements     | % Branches      | % Funcs         |
|---|---|---|---|---|
| contracts/CFDToken.sol                | 100.00% (8/8)     | 100.00% (4/4)    | N/A (0/0)       | 100.00% (4/4)   |
| contracts/CampusFund.sol              | 100.00% (130/130) | 99.40% (165/166) | 97.14% (34/35)  | 100.00% (21/21) |
| contracts/Governance.sol              | 100.00% (79/79)   | 100.00% (99/99)  | 100.00% (22/22) | 100.00% (12/12) |
| contracts/Treasury.sol                | 100.00% (51/51)   | 98.25% (56/57)   | 92.31% (12/13)  | 100.00% (12/12) |
| contracts/demo/FlashLoanAttacker.sol  | 100.00% (14/14)   | 100.00% (12/12)  | 50.00% (3/6)    | 100.00% (3/3)   |
| contracts/demo/MockFlashLender.sol    | 100.00% (7/7)     | 100.00% (8/8)    | 100.00% (1/1)   | 100.00% (2/2)   |
| contracts/demo/NaiveGovernance.sol    | 100.00% (24/24)   | 100.00% (21/21)  | 56.25% (9/16)   | 100.00% (4/4)   |
| contracts/demo/ReentrancyAttacker.sol | 100.00% (16/16)   | 100.00% (13/13)  | 57.14% (4/7)    | 100.00% (4/4)   |
| contracts/demo/SecureVault.sol        | 100.00% (8/8)     | 100.00% (7/7)    | 100.00% (4/4)   | 100.00% (2/2)   |
| contracts/demo/VulnerableVault.sol    | 100.00% (8/8)     | 100.00% (7/7)    | 50.00% (2/4)    | 100.00% (2/2)   |
| Total                                 | 100.00% (345/345) | 99.49% (392/394) | 84.26% (91/108) | 100.00% (66/66) |

Le fichier `lcov.info` permet de générer un rapport HTML : `genhtml docs/coverage/lcov.info -o docs/coverage/html` (outil lcov).
