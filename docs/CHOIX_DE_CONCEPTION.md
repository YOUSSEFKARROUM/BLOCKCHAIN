# Choix de conception — CampusFund

Chaque paramètre est une **décision**. Pour chacune : la valeur retenue, où elle se trouve dans le code, et
pourquoi. Les chiffres viennent du code, pas d'une estimation.

## 1. Paramètres économiques et de gouvernance

| Paramètre | Valeur | Où | Justification |
|---|---|---|---|
| **Taux CFD** | 1 ETH = **1000 CFD** | `CFDToken.RATE` | L'ETH et le CFD ont tous deux 18 décimales, donc `cfd = wei × 1000` est une **multiplication entière exacte** : aucun arrondi, aucune perte. Le pouvoir de vote reste strictement proportionnel à l'apport (exigence du sujet). 1000 donne des nombres lisibles : 0,1 ETH → 100 CFD, alors qu'avec 1:1 un petit don donnerait 0,001 CFD. N'importe quelle constante préserverait la proportionnalité : 1000 est un choix de lisibilité. |
| **Quorum** | **10 %** de l'offre de CFD au snapshot | `Governance.QUORUM_BPS = 1000` | Assez haut pour qu'un petit groupe ne décide pas seul du sort des fonds de tous ; assez bas pour être atteignable dans une communauté étudiante où beaucoup ne votent pas (la participation est souvent faible dans les DAO réelles). Calculé sur `getPastTotalSupply(snapshot)` : impossible à gonfler ou dégonfler après coup. |
| **Majorité** | « pour » **>** « contre » (majorité stricte des votes exprimés) | `Governance.state` | Règle simple et défendable. **L'égalité = rejet** : en cas de doute, on ne déplace pas l'argent (principe de précaution). Testé : `test_State_DefeatedOnTie`. |
| **Quorum compté en CFD bruts** | même en mode quadratique | `Proposal.participation` | Le quorum mesure la *participation* (combien de CFD se sont exprimés), la majorité mesure la *préférence*. Les séparer évite qu'activer le vote quadratique rende le quorum inatteignable. |
| **Snapshot** | bloc **précédant** la création de la proposition | `_createProposal` : `block.number - 1` | `getPastVotes` n'accepte qu'un bloc passé. Choisir `-1` exclut aussi tout jeton obtenu **dans le bloc même** de la proposition (y compris dans la même transaction) : test `test_FlashLoan_FailsEvenInProposalBlock`. |
| **Durée de vote** | paramétrable **1 h à 14 jours** ; 1 h (démo), 3 jours conseillés en production | `MIN/MAX_VOTING_PERIOD`, `.env VOTING_PERIOD` | Bornée pour qu'un administrateur ne puisse pas imposer un vote de 1 minute (vote « surprise ») ni bloquer la DAO avec un vote d'un an. 1 h permet une démo réelle sur Sepolia. |
| **Exécution** | seulement **après** la fin du vote, par **n'importe qui** | `Governance.execute` | « Délai de vote avant exécution automatique » (sujet). Personne n'a de privilège d'exécution : si le porteur ne l'exécute pas, un contributeur peut le faire. |
| **Seuil de proposition (gel)** | **100 CFD** délégués (= 0,1 ETH contribué) | `proposalThreshold` | Anti-spam : sans seuil, n'importe quelle adresse vide pourrait inonder la DAO de demandes de gel. Le déblocage de jalon, lui, est réservé au porteur/bénéficiaire (pas de seuil). |
| **Frais de plateforme** | **2 %** de chaque tranche versée | `CampusFund.FEE_BPS = 200` | Finance l'hébergement (Pinata/IPFS, nom de domaine, gaz de maintenance). Prélevés **au versement** et non à la contribution : si la campagne échoue, le contributeur récupère **100 %** de sa mise. |
| **Seuil du multisig** | 1 signature tant que le cumul du jour ≤ **1 ETH** ; sinon **2 sur 3** | `Treasury.DAILY_LIMIT` | Un seuil *par transaction* serait contournable : un propriétaire seul ferait 10 retraits de 0,99 ETH. Le plafond **cumulé par jour** bloque ce découpage (test `test_DailyLimit_BlocksSplittingAttack`). |
| **Propriétaires du multisig** | 3 adresses fixes (les 3 membres du trinôme) | constructeur `Treasury` | 2 sur 3 tolère la perte d'une clé et résiste à la compromission d'une clé. Pas de changement de propriétaires : cela simplifie le contrat, et donc l'audit (limite documentée). |

## 2. Cycle de vie des campagnes

| Paramètre | Valeur | Justification |
|---|---|---|
| **Nombre de jalons** | 2 à 5 | 1 seul jalon reviendrait à tout verser d'un coup (aucun contrôle) ; au-delà de 5, trop de votes pour un projet étudiant. |
| **Unité des jalons** | points de base (10 000 = 100 %), somme exacte vérifiée | Entiers sans virgule. La **dernière tranche verse le reste** (`raised − released`) : aucune poussière d'arrondi ne reste bloquée (`test_Withdraw_LastTrancheTakesRoundingDust`). |
| **Jalons dans l'ordre** | `index == approvedMilestones` | On ne peut pas approuver le jalon 3 avant le 1. Une proposition périmée (jalon déjà approuvé) échoue à l'exécution. |
| **Durée de collecte** | 1 h à 90 jours | 1 h pour les démos ; 90 jours maximum pour qu'une collecte ne reste pas ouverte indéfiniment. |
| **Statuts** | `Active → Successful / Failed` (clôture), `Active / Successful → Cancelled` | Machine d'états stricte : chaque fonction vérifie le statut (`WrongStatus`). Pas de retour en arrière possible. |
| **Clôture (`finalize`)** | appelable par n'importe qui après l'échéance | Constater une échéance ne demande aucun privilège. |
| **Annulation par le porteur** | seulement sans aucune contribution | Sinon un porteur pourrait annuler pour bloquer des fonds ; une fois l'argent reçu, seule la DAO peut annuler (gel). |
| **Garde-fou `cancelStale`** | 90 jours sans approbation de jalon → annulable par tous | Sans lui, une DAO inactive (quorum jamais atteint) bloquerait les fonds **pour toujours**. Le compteur repart à chaque jalon approuvé. |

## 3. Choix de sécurité structurants

| Choix | Justification |
|---|---|
| **Pull payment** pour les remboursements | Chacun vient chercher ses fonds (`refund`). Une boucle « rembourser tout le monde » pourrait dépasser la limite de gaz ou être bloquée par un seul destinataire qui refuse l'ETH (déni de service). |
| **Brûler les CFD au remboursement** | Sinon on pourrait se faire rembourser et garder ses droits de vote. L'invariant « CFD en circulation = (contributions − remboursements) × 1000 » reste vrai. Conséquence assumée : il faut détenir ses CFD pour être remboursé. |
| **Délégation obligatoire** (standard ERC20Votes) | Le contrat n'écrit l'historique des votes (checkpoints, coûteux en gaz) que pour ceux qui l'activent. Un contributeur qui ne vote jamais ne paie pas ce surcoût. Bonus sécurité : des jetons « dormants » ne votent pas. |
| **Jeton de vote commun à toutes les campagnes** | Le CFD représente une part de la communauté CampusFund : tout membre peut signaler une fraude n'importe où. Limite assumée : un contributeur de la campagne A vote sur B (expliqué dans QUESTIONS_SOUTENANCE.md). |
| **Le déployeur renonce aux rôles admin** du jeton et de CampusFund | Sinon il pourrait s'accorder `MINTER_ROLE` (frapper des CFD et contrôler la DAO) ou `GOVERNANCE_ROLE` (débloquer sans vote). Après déploiement, **personne** ne peut changer ces rôles (test `test_DeployWiresRolesAndRenouncesAdmin`). |
| **La pause bloque aussi les remboursements** | Un circuit breaker doit tout geler pendant l'analyse d'un incident (une faille pourrait se trouver dans `refund`). Contrepartie : le rôle PAUSER peut retarder les remboursements, mais **jamais prendre les fonds** (aucune fonction ne le permet). |
| **Échéances en timestamp, snapshot en numéro de bloc** | Durées humaines (« fin le 15 décembre ») pour les échéances ; précision au bloc pour le snapshot, là où une manipulation compterait. |
| **Vote quadratique désactivé par défaut** | Plus égalitaire (√CFD), mais vulnérable à l'attaque Sybil : couper 10 000 CFD en 100 adresses de 100 CFD multiplie le poids par 10. Il faudrait une preuve d'identité unique (ex. carte étudiante). D'où une extension derrière un paramètre, figée à la création de chaque proposition. |

## 4. Choix techniques

| Choix | Justification |
|---|---|
| **Foundry** plutôt que Hardhat | Tests écrits en Solidity (même langage que les contrats), fuzzing et **invariants natifs**, exécution très rapide (145 tests en ~30 s, fuzz compris), `forge coverage`, `forge script` pour déployer et vérifier. |
| **OpenZeppelin v5.4** | Code audité pour ERC20, ERC20Votes, AccessControl, ReentrancyGuard, Pausable : on n'écrit soi-même que la logique métier. |
| **solc 0.8.24** | Version stable ; overflow vérifié automatiquement depuis 0.8 (plus besoin de SafeMath). |
| **Erreurs personnalisées** (`error WrongStatus(...)`) | Moins de gaz que des chaînes, et décodables par le front (traduction française dans `frontend/src/lib/errors.ts`). |
| **Next.js + ethers v6** | Imposés par le cahier des charges. Lecture via un RPC public (consultation sans MetaMask), écriture via MetaMask. |
| **IPFS via une route serveur** (`/api/ipfs`) | Le JWT Pinata reste sur le serveur : mis dans le navigateur, n'importe qui pourrait le copier et épingler des fichiers à nos frais. |
| **CID calculé localement pour la démo** | CIDv1 raw sha-256, identique à celui d'IPFS pour un petit fichier. Le contenu est vérifiable, et la démo marche hors ligne. |
| **Script IA hors chaîne** | Un modèle de ML ne tourne pas dans l'EVM (coût, déterminisme). Le score est **indicatif** : la décision (gel) reste à la DAO. |
