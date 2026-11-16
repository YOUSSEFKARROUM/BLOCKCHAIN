# Guide pédagogique — comprendre CampusFund ligne par ligne

Ce guide est écrit pour un débutant en blockchain. Première partie : les **notions**, chacune avec une analogie.
Deuxième partie : chaque **fichier important**, bloc de lignes par bloc de lignes. Les numéros de ligne
correspondent à la version du dépôt (branche `youssef`).

---

# Partie 1 — Les notions (avec une analogie pour chacune)

| Notion | En une phrase | Analogie |
|---|---|---|
| **Blockchain** | Un registre partagé par des milliers d'ordinateurs, où l'on ne peut qu'ajouter des pages (blocs), jamais effacer. | Un cahier de comptes photocopié chez tous les étudiants du campus : pour tricher, il faudrait falsifier toutes les copies en même temps. |
| **Smart contract** | Un programme déployé sur la blockchain, qui s'exécute exactement comme écrit et que personne ne peut modifier ensuite. | Un distributeur automatique : on met une pièce, on obtient la boisson, sans vendeur. Personne ne peut changer les règles une fois la machine installée. |
| **Transaction / gaz** | Toute modification de l'état coûte des frais (gaz), payés au réseau. | Un timbre sur une lettre : sans timbre, la lettre ne part pas. |
| **`msg.sender` / `msg.value`** | L'adresse qui appelle la fonction / les ETH envoyés avec l'appel. | « Qui frappe à la porte » et « combien il tend ». |
| **ERC-20** | Standard de jeton : `balanceOf`, `transfer`, `approve`… | Le format standard d'une carte de fidélité : tous les magasins (portefeuilles, échanges) savent la lire. |
| **Jeton de gouvernance (CFD)** | Un ERC-20 qui donne un droit de vote proportionnel à la détention. | Les parts d'une coopérative : plus vous avez apporté, plus votre voix pèse à l'assemblée. |
| **Délégation** | Pour voter sur un **gel**, on doit « activer » ses voix en les déléguant (à soi-même ou à quelqu'un). Pour une tranche, inutile : on vote avec sa contribution. | S'inscrire sur la liste électorale : avoir l'âge de voter ne suffit pas, il faut être inscrit. On peut aussi donner procuration. |
| **Snapshot** | Le pouvoir de vote est lu à un bloc **passé**, figé à la création du vote. | La liste électorale est arrêtée à une date : quelqu'un qui s'installe dans la ville après cette date ne vote pas. |
| **Quorum** | Participation minimale pour qu'un vote soit valable (ici 10 % des CFD). | Une assemblée générale ne peut pas décider si seulement 3 personnes sur 300 sont présentes. |
| **Majorité** | Plus de « pour » que de « contre » parmi les votes exprimés. | Le vote à main levée : l'égalité ne suffit pas pour adopter. |
| **Flash loan** | Prêt sans garantie de millions de jetons, à rendre dans la **même** transaction. | Emprunter la recette de la caisse 1 seconde, le temps de « montrer » qu'on est riche au guichet, puis la remettre. |
| **Réentrance** | Un contrat malveillant rappelle la fonction de retrait pendant qu'on lui envoie de l'argent, avant la mise à jour du solde. | Un guichetier qui donne les billets **puis** note le retrait dans le carnet : le client tend la main 10 fois avant qu'il écrive. |
| **Checks-Effects-Interactions** | Vérifier, puis mettre à jour l'état, puis seulement envoyer l'argent. | Le guichetier note d'abord le retrait, *puis* donne les billets. |
| **`nonReentrant`** | Un verrou : tant que la fonction tourne, on ne peut pas y ré-entrer. | La porte du guichet se verrouille dès qu'un client entre. |
| **Pull payment** | Chacun vient chercher son remboursement, au lieu qu'on envoie à tout le monde. | Un colis à retirer au point relais, plutôt qu'un livreur qui ferait le tour de 500 maisons et resterait bloqué à la première porte fermée. |
| **AccessControl (rôles)** | Seules certaines adresses peuvent appeler certaines fonctions. | Les badges d'accès : le badge « gardien » ouvre la salle serveur, le badge « étudiant » non. |
| **Circuit breaker (Pausable)** | Mettre la plateforme en pause en cas d'incident. | Le disjoncteur électrique : il coupe tout au premier court-circuit. |
| **Multisig 2-sur-3** | Il faut 2 signatures sur 3 pour sortir l'argent de la trésorerie. | Le coffre d'une association : président, trésorier, secrétaire. Deux des trois doivent tourner leur clé. |
| **Machine d'états** | Une campagne passe par des statuts précis, dans un ordre précis. | Un dossier administratif : « déposé » puis « accepté » ou « refusé ». On ne revient pas en arrière. |
| **Jalon (milestone)** | Les fonds sont versés par tranches, chaque tranche après un vote. | Un chantier payé par étapes : fondations, murs, toit. On paie chaque étape après vérification. |
| **IPFS / CID** | Stockage décentralisé où un fichier est désigné par l'empreinte de son contenu (CID). | L'empreinte digitale d'un document : changer une virgule change l'empreinte. On ne stocke on-chain que l'empreinte. |
| **Event** | Un journal émis par le contrat, lisible par les applications. | Le ticket de caisse : il n'influence rien, mais il prouve ce qui s'est passé. |
| **Test unitaire / fuzz / invariant** | Un cas précis / des milliers de valeurs aléatoires / une propriété vraie après n'importe quelle suite d'actions. | Tester un pont avec une voiture / avec 1000 véhicules au hasard / vérifier qu'il tient toujours, quel que soit l'ordre de passage. |
| **Isolation Forest** | Algorithme qui isole les points « qui ne ressemblent à aucun autre » en les séparant par des coupes aléatoires. | Dans une foule, il faut peu de questions pour retrouver la personne déguisée en dinosaure. Il en faut beaucoup pour retrouver un étudiant ordinaire. |

---

# Partie 2 — Les fichiers, ligne par ligne

## 2.1 `contracts/CFDToken.sol` — le jeton de vote

| Lignes | Code | Explication |
|---|---|---|
| 1-2 | `// SPDX…` `pragma solidity ^0.8.20;` | Licence, puis version du compilateur : 0.8.20 minimum. Depuis 0.8, un débordement (overflow) fait échouer la transaction automatiquement. |
| 4-7 | `import {ERC20}…` | On réutilise le code audité d'OpenZeppelin : ERC20 (le jeton), ERC20Votes (l'historique des votes), EIP712 (signatures typées, exigé par ERC20Votes), AccessControl (rôles). |
| 17 | `contract CFDToken is ERC20, ERC20Votes, AccessControl` | Héritage multiple : notre jeton **est** tout cela à la fois. |
| 19-21 | `MINTER_ROLE`, `BURNER_ROLE` | Deux rôles, identifiés par un hash. Seul CampusFund les recevra. |
| 24 | `RATE = 1000` | 1 wei contribué = 1000 « wei de CFD ». Les deux ont 18 décimales, donc 1 ETH = 1000 CFD. |
| 27-29 | `constructor(address admin) ERC20("CampusFund DAO Token", "CFD") EIP712(...)` | Au déploiement : nom, symbole, domaine de signature, et attribution du rôle admin (qui sera abandonné, voir Deploy). |
| 32-34 | `function mint(...) external onlyRole(MINTER_ROLE)` | Crée des jetons. `onlyRole` fait échouer l'appel si l'appelant n'a pas le rôle. |
| 38-40 | `function burn(address from, ...) onlyRole(BURNER_ROLE)` | Détruit les CFD d'un contributeur qui se fait rembourser. Il n'y a pas besoin d'`approve`, car le rôle est réservé à CampusFund, qui ne brûle que lors d'un `refund`. |
| 45-47 | `_update(...) override(ERC20, ERC20Votes)` | Les deux parents définissent `_update`. Solidity exige qu'on dise lequel appeler : `super` appelle les deux dans l'ordre. C'est là qu'ERC20Votes met à jour les **checkpoints** à chaque transfert. |

**Ce qu'ERC20Votes nous donne gratuitement** : `delegate(adresse)`, `getVotes(compte)` (voix actuelles),
`getPastVotes(compte, bloc)` (voix à un bloc passé, la base du snapshot) et `getPastTotalSupply(bloc)`.

## 2.2 `contracts/interfaces/ICampusFund.sol`

Une **interface** liste des fonctions sans leur code : c'est le « contrat d'API » entre Governance et
CampusFund. L'enum `Status` y est défini : `Active` (0, En cours), `Successful` (1, Réussie), `Failed`
(2, Échouée), `Cancelled` (3, Annulée).

## 2.3 `contracts/CampusFund.sol` — le cœur

| Lignes | Code | Explication |
|---|---|---|
| 18 | `contract CampusFund is ICampusFund, AccessControl, ReentrancyGuard, Pausable` | Quatre briques : notre interface, les rôles, le verrou anti-réentrance, la pause. |
| 19 | `using Address for address payable;` | Donne `adresse.sendValue(montant)`, qui envoie des ETH et **échoue proprement** si l'envoi rate (au lieu d'un `call` brut qu'on oublierait de vérifier). |
| 23-25 | `PAUSER_ROLE`, `GOVERNANCE_ROLE` | Le pauseur (circuit breaker) et la gouvernance (seul contrat qui peut approuver un jalon ou geler). |
| 28-36 | constantes | Bornes de durée (1 h à 90 j), 2 à 5 jalons, `BPS = 10 000` (100 %), `FEE_BPS = 200` (2 %), `STALE_PERIOD = 90 jours`. `constant` = gravé dans le code, impossible à modifier. |
| 38-39 | `token`, `treasury` `immutable` | Fixés une fois au déploiement, puis en lecture seule. Moins cher en gaz qu'une variable. |
| 42-56 | `struct Campaign` | La fiche d'une campagne : porteur, bénéficiaire, objectif, collecté, **versé** (`released`), **remboursé** (`refunded`), échéance, statut, compteurs de jalons, CID IPFS. Les `uint64` et `uint8` sont regroupés pour tenir dans moins de « cases » de stockage. |
| 58-61 | `campaignCount`, mappings | `_campaigns[id]` la fiche ; `_milestoneBps[id]` les pourcentages ; `contributionOf[id][adresse]` combien chacun a donné (sert au remboursement). |
| 63-68 | `totalOwed`, `totalContributed`, `totalRefundedPrincipal` | Comptabilité globale. Elle sert aux **invariants** : le contrat doit toujours détenir au moins `totalOwed`. |
| 70-86 | `event …` | Un journal par action. Le front et le script IA les lisent. |
| 88-106 | `error …` | Erreurs nommées, moins chères qu'un texte, et traduites en français par le front. |
| 108-114 | `constructor` | Refuse un jeton ou une trésorerie à l'adresse zéro ; donne au déployeur les rôles admin et pauseur. |
| 116-119 | `modifier exists(id)` | Garde réutilisable : la campagne doit exister. `_;` = « exécuter ensuite le corps de la fonction ». |
| 129-154 | `createCampaign` | **Checks** : objectif > 0, durée bornée, bénéficiaire non nul, CID non vide, jalons valides (`_checkMilestones`). Puis on écrit la fiche (`id = campaignCount++` : l'id vaut l'ancien compteur), on stocke les jalons et on émet `CampaignCreated`. `whenNotPaused` : impossible pendant une pause. |
| 157-164 | `cancelCampaign` | Seul le porteur, seulement si la campagne est **En cours** et **sans aucune contribution**. Sinon il pourrait bloquer l'argent des autres. |
| 169-189 | `withdrawTranche` | **Checks** (l. 172-174) : appelant = bénéficiaire, statut Réussie, au moins une tranche approuvée non retirée. **Calcul** (l. 176-178) : montant de la tranche, 2 % de frais. **Effects** (l. 181-183) : on note la tranche comme retirée et on baisse la dette **avant** d'envoyer. **Interactions** (l. 186-188) : frais à la trésorerie, puis 98 % au bénéficiaire. `nonReentrant` en plus : défense en profondeur. |
| 194-208 | `contribute` | `payable` : la fonction accepte des ETH. Checks : montant > 0, statut En cours, avant l'échéance. Effects : collecté, contribution personnelle, dette et total. Interaction : `token.mint` de `msg.value × 1000` CFD, en dernier. |
| 212-219 | `finalize` | Après l'échéance, n'importe qui la clôture : Réussie si `raised >= goal`, sinon Échouée. `lastProgressAt` démarre le compteur anti-blocage. |
| 225-245 | `refund` | Seulement si Échouée ou Annulée. Montant = `contribution × (raised − released) / raised` : 100 % si rien n'a été versé, au **prorata** si des tranches étaient déjà parties avant un gel. Effects : la contribution passe à 0 (impossible de recommencer) et la dette baisse. Interactions : brûler les CFD, puis envoyer les ETH en tout dernier. |
| 249-256 | `cancelStale` | Garde-fou : une campagne Réussie dont aucun jalon n'a été approuvé depuis 90 jours peut être annulée par n'importe qui. Les contributeurs récupèrent alors le reste. Sans lui, une DAO inactive bloquerait l'argent à vie. |
| 262-270 | `approveMilestone` | `onlyRole(GOVERNANCE_ROLE)` : **seul le contrat Governance**, donc seulement après un vote adopté. Les jalons s'approuvent **dans l'ordre** (`index == approvedMilestones`). |
| 274-279 | `freezeCampaign` | Gel décidé par la DAO : statut Annulée, remboursements ouverts. |
| 284-290 | `pause` / `unpause` | Circuit breaker, réservé au rôle PAUSER. |
| 294-336 | fonctions `view` | Lecture gratuite (sans transaction) pour le front et la gouvernance. |
| 341-344 | `_trancheAmount` | Tranche = `raised × bps / 10 000`, sauf la **dernière**, qui prend tout le reste : aucune poussière d'arrondi ne reste bloquée. |
| 346-355 | `_checkMilestones` | 2 à 5 jalons, chacun > 0, somme exactement 10 000 (100 %). |

## 2.4 `contracts/Governance.sol` — la DAO

| Lignes | Code | Explication |
|---|---|---|
| 18 | `contract Governance is IVoting, AccessControl` | La DAO. `IVoting` = elle expose `castVote`. |
| 26-31 | constantes | Quorum 10 % (`QUORUM_BPS = 1000`), durée de vote entre 1 h et 14 jours. |
| 33-43 | enums | Deux types de proposition (déblocage, gel) et quatre états (Active, Rejetée, Adoptée, Exécutée). |
| 45-60 | `struct Proposal` | Le **snapshotBlock** et le **quorum** sont figés à la création. `quadratic` aussi : changer le mode pendant un vote n'a aucun effet. `participation` compte les CFD bruts (pour le quorum). `forVotes`/`againstVotes` comptent les poids (pour la majorité). |
| 126-138 | `proposeMilestoneRelease` | Seul le porteur ou le bénéficiaire, campagne Réussie, il reste un jalon à approuver, et une **preuve** (CID ou lien) est obligatoire (`MissingProof`, l. 130). Le jalon visé est le prochain (`approved`). |
| 141-149 | `proposeFreeze` | Tout détenteur d'au moins 100 CFD délégués **au bloc précédent** peut proposer un gel (anti-spam). |
| 155-188 | `_createProposal` | D'abord, **une seule proposition ouverte** par campagne et par type (l. 161-167, `ProposalAlreadyOpen`). Puis **le cœur anti-flash-loan** : `snapshot = block.number - 1` (l. 168). Le quorum (l. 183) vaut 10 % des CFD de la campagne pour un déblocage, 10 % de l'offre au snapshot pour un gel. La fin du vote = maintenant + durée. |
| 193-209 | `castVote` | Checks : la proposition existe, le vote est ouvert, pas de double vote. **Poids = `_votingPower`** (l. 199) : contribution à la campagne × 1000 pour un déblocage, CFD délégués au snapshot pour un gel. S'il est nul, revert `NoVotingPower`. En mode quadratique, poids = √CFD. On marque `hasVoted` puis on additionne. |
| 214-222 | `execute` | Appelable par **n'importe qui**, seulement si l'état est Adoptée (donc vote terminé). `executed = true` **avant** l'appel externe (CEI). Puis l'appel à `approveMilestone` ou `freezeCampaign`. |
| 226-235 | `state` | Exécutée ? Sinon vote en cours tant que `now <= voteEnd`. Sinon Adoptée si **participation ≥ quorum** et **pour > contre**, sinon Rejetée. |
| 238-253 | `votingPower`, `_votingPower` | Lecture du poids qu'aurait un votant (utilisée par le front) et règle du poids : contribution figée pour un déblocage, `getPastVotes` au snapshot pour un gel. **Le porteur et le bénéficiaire ont un poids nul sur le déblocage de leur propre campagne** (l. 248-249) : ils ne valident pas leurs propres fonds. |
| 262-282 | paramètres | Durée de vote (bornée), seuil de proposition, mode quadratique : réservés à `PARAMS_ROLE`, **abandonné au déploiement** : ces paramètres sont donc figés. |

## 2.5 `contracts/Treasury.sol` — le multisig 2-sur-3

| Lignes | Code | Explication |
|---|---|---|
| 16-17 | `DAILY_LIMIT = 1 ether`, `REQUIRED_APPROVALS = 2` | Le seuil et le nombre de signatures. |
| 19-24 | `struct Transaction` | Destinataire, montant, nombre d'approbations, exécutée ou non. |
| 26-31 | stockage | Les 3 propriétaires, qui a approuvé quoi, et combien a été retiré **avec une seule signature** chaque jour. |
| 48-58 | modificateurs | `onlyOwner` : un des 3 propriétaires. `pending` : la transaction existe et n'est pas exécutée. |
| 60-67 | constructeur | 3 adresses non nulles et **distinctes** (sinon une seule personne détiendrait 2 « clés »). |
| 69-71 | `receive()` | Accepte les ETH (les frais de CampusFund) et émet `Deposit`. |
| 74-81 | `submit` | Un propriétaire propose un retrait, qu'il approuve d'office. |
| 83-88 / 91-96 | `approve` / `revoke` | Ajouter ou retirer sa signature tant que ce n'est pas exécuté. |
| 99-117 | `execute` | Si moins de 2 signatures : autorisé **seulement** si le cumul du jour reste ≤ 1 ETH (l. 104-111). Sinon revert `NotEnoughApprovals`. Puis CEI : `executed = true`, event, envoi. |
| 135-139 | `requiredApprovals` | Lecture pratique : combien de signatures faudrait-il maintenant ? |

## 2.6 `contracts/demo/` — les attaques (pédagogiques, jamais déployées)

- **`VulnerableVault.sol`** : `withdraw` envoie (l. 21) **avant** de remettre le solde à zéro (l. 23). C'est la faille de The DAO.
- **`SecureVault.sol`** : même coffre, corrigé (mise à zéro avant l'envoi, plus `nonReentrant`).
- **`ReentrancyAttacker.sol`** : dépose 1 ETH, appelle `withdraw`. Sa fonction `receive` rappelle `withdraw` tant que le coffre a des fonds.
- **`NaiveGovernance.sol`** : poids = `balanceOf` **au moment du vote** (l. 46), donc sans snapshot. Faille de type Beanstalk.
- **`MockFlashLender.sol`** : prête des CFD et vérifie qu'ils sont revenus à la fin de la même transaction (sinon tout est annulé).
- **`FlashLoanAttacker.sol`** : dans `onFlashLoan`, il se délègue les CFD empruntés, vote, puis rembourse.

## 2.7 Les tests (`test/`)

- `utils/BaseTest.sol` : déploie jeton et CampusFund, crée des acteurs (`makeAddr`), leur donne des ETH (`vm.deal`). Des fonctions utilitaires créent des campagnes réussies ou échouées.
- `utils/GovernanceBase.sol` : ajoute la vraie Governance. `_nextBlock()` avance d'un bloc, car le snapshot a besoin d'un bloc passé.
- **Cheatcodes Foundry** utilisés : `vm.prank(a)` (le prochain appel vient de `a`), `vm.warp(t)` (changer l'heure), `vm.roll(n)` (changer le numéro de bloc), `vm.expectRevert(err)` (le prochain appel doit échouer avec cette erreur), `vm.expectEmit` (vérifier un event), `bound(x, min, max)` (borner une valeur de fuzz).
- `unit/` : un test par fonction et par cas d'échec. `attacks/` : réentrance et flash loan. `fuzz/` : 8 propriétés × 1000 tirages.
- `invariant/Handler.sol` : un « joueur » aléatoire qui crée, contribue, avance le temps, vote, exécute, retire, rembourse, gèle et transfère, dans un ordre aléatoire. Les variables **ghost** notent ce qui s'est réellement passé (ex. le nombre de déblocages exécutés).
- `invariant/Invariants.t.sol` : 5 propriétés vérifiées **après chaque appel** du handler.
- `scripts/invariant-canary/` : contre-preuve. Des invariants faux exprès (« aucune tranche n'est jamais retirée ») **échouent**, ce qui prouve que le fuzzer atteint bien ces chemins.

## 2.8 Scripts

- **`scripts/foundry/Deploy.s.sol`** : déploie dans l'ordre Treasury, CFDToken, CampusFund, Governance. Ensuite il câble les rôles, puis **le déployeur renonce** à l'admin du jeton et du fonds (l. 63-64). Hors anvil, il exige les 3 propriétaires du multisig. Enfin il écrit `deployments/<chainId>.json`.
- **`scripts/foundry/SeedDemo.s.sol`** : 3 étapes sur anvil (5 campagnes de clubs, votes, tranches, un remboursement, une campagne « sybil »).
- **`scripts/demo-anvil.sh` / `.ps1`** : enchaîne tout, y compris les sauts dans le temps (`cast rpc evm_increaseTime`).
- **`scripts/deploy-sepolia.sh` / `.ps1`** : vérifie le `.env`, le réseau et le solde, puis lance `forge script --broadcast --verify`.
- **`scripts/ipfs/cid.mjs`** : calcule un CID IPFS (CIDv1, codec raw, sha-256), soit l'empreinte du contenu encodée en base32.

## 2.9 `scripts/anomaly_detection.py` — le badge de risque IA

1. **Lecture on-chain** (`analyse_chain`) : events `CampaignCreated` et `Contributed`. Pour chaque contributeur : la **première adresse qui lui a envoyé des ETH** (sa « source ») et son **nonce** (nombre de transactions avant de contribuer ; 0 = adresse neuve).
2. **Indicateurs** (`campaign_features`), tous entre 0 et 1 :
   - `repeated` : part des contributions ayant le montant le plus fréquent (des robots donnent souvent le même montant) ;
   - `linked` : part des contributeurs financés par **la même source** (un seul individu derrière plusieurs adresses) ;
   - `fresh` : part d'adresses neuves ;
   - `burst` : part maximale des contributions dans une fenêtre de 10 blocs (pic) ;
   - `top_share` : part du plus gros contributeur.
3. **Règles** (`rule_score`) : somme pondérée sur 100, atténuée s'il y a moins de 8 contributions (peu de preuves = prudence). Plus 10 si le porteur a la même source que ses contributeurs.
4. **Isolation Forest** (`ForestScorer`) : entraîné sur un jeu de référence synthétique. Le score est la part des campagnes de référence « plus normales » que celle-ci.
5. **Score final** = 60 % règles + 40 % forêt. Faible < 35 ≤ Moyen < 50 ≤ Élevé.
6. **Mode `--demo`** : 330 campagnes synthétiques dont 30 fraudes (sybil, pic coordonné, auto-financement). On utilise **trois graines différentes** pour calibrer, entraîner et évaluer, afin de ne pas tricher. Sur 10 tirages : rappel 0,88 ± 0,02 pour une précision de 1,00. Le mode compare aussi des **fraudes déguisées** (montants variés, contributions étalées, plusieurs sources) : le rappel tombe à 0,38 ± 0,11. Les règles seules et la forêt seule font nettement moins bien que la combinaison. Ce sont des données simulées : c'est la limite à dire au jury.

## 2.10 Le front-end (`frontend/src/`)

| Fichier | Rôle |
|---|---|
| `config/chain.ts` | Réseau cible (31337 ou 11155111) et RPC de lecture. |
| `config/contracts.json` | **ABI générées par `forge build`** et adresses déployées (`npm run sync`). |
| `lib/web3.tsx` | Contexte React : détecte MetaMask, connecte, suit le compte et le réseau, bascule ou ajoute le réseau (code d'erreur 4902), fournit le `signer`. La **lecture** passe par un `JsonRpcProvider` : on peut consulter sans MetaMask. |
| `lib/useTx.ts` | Envoie une transaction et suit ses étapes : « confirmez dans MetaMask », « en attente », « confirmée » ou erreur. Les vérifications préalables (MetaMask présent, compte connecté, bon réseau) sont faites avant l'envoi. |
| `lib/errors.ts` | Décode les erreurs Solidity (`NoVotingPower`…) et les traduit en français. Gère « transaction refusée » (code 4001). |
| `lib/hooks.ts` | Chargement des campagnes, propositions, métadonnées IPFS et scores IA. Rechargement après chaque transaction. |
| `app/api/ipfs/route.ts` | Envoi des métadonnées sur Pinata **côté serveur** (le JWT n'atteint jamais le navigateur), avec validation, limite de taille et limite de débit. |
| `app/api/ipfs/[cid]/route.ts` | Lecture d'un CID (cache local puis passerelle IPFS). Le CID est validé par une expression régulière, ce qui empêche `../` (path traversal). |
| `app/page.tsx` | Écran 1 : tableau des départs (cartes sous 768 px), fonctionnement en quatre portes. |
| `app/campaign/[id]/page.tsx` | Écran 2 : détail, contribution, clôture, remboursement. |
| `app/governance/page.tsx` | Écran 3 : pouvoir de vote, délégation (gels), propositions avec preuve, quorum, vote, exécution, gel. |
| `app/creator/page.tsx` | Écran 4 : création (IPFS puis transaction), demande de déblocage avec preuve, retrait. |
| `app/securite/page.tsx` | Écran 5 : tests, attaques rejouées, scanner IA, contrats déployés (avec date de mesure). |
| `lib/campaignView.ts`, `lib/proof.ts` | Logique d'affichage pure (statuts, jalons, liens de preuve sûrs), testée par Vitest. |
| `components/DevTimeTravel.tsx` | Sur anvil uniquement : boutons « +1 h / +1 j » pour la démo (impossible sur un vrai réseau). |

---

# Partie 3 — Parcours complet d'un euro… pardon, d'un ETH

1. Le Club Robotique crée sa campagne. Les métadonnées partent sur IPFS et seul le CID est stocké on-chain.
2. Alice envoie 1,5 ETH avec `contribute`. Elle reçoit 1500 CFD (et se les délègue, pour pouvoir voter les gels).
3. L'échéance passe et quelqu'un appelle `finalize` : 4,5 ETH ≥ 4 ETH, la campagne est Réussie.
4. Le porteur appelle `proposeMilestoneRelease` avec la preuve du jalon (facture en IPFS).
5. Alice vote « pour » avec le poids de sa mise, 1500 CFD. Le quorum (10 % des 4500 CFD de la campagne) est atteint.
6. N'importe qui appelle `execute`. Governance appelle `approveMilestone`.
7. Le bénéficiaire appelle `withdrawTranche` : 40 % de 4,5 ETH = 1,8 ETH, dont 0,036 ETH vers la
   trésorerie et 1,764 ETH vers le club.
8. Si la DAO découvre une fraude, elle vote un gel. Alice récupère alors sa part de ce qui reste et ses CFD sont brûlés.
