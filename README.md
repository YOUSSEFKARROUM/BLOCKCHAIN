# CampusFund

**Financement participatif décentralisé de projets étudiants, gouverné par le jeton CFD.**
Mini-projet Blockchain, ENSA Béni Mellal, filière IA et Cybersécurité. Sujet : [`mini_projet_blockchain.pdf`](mini_projet_blockchain.pdf).

Les clubs créent des campagnes découpées en **jalons**. Les contributeurs financent en ETH et reçoivent des
**CFD** (1 ETH = 1000 CFD). Chaque tranche n'est versée qu'après le **vote des contributeurs de la campagne**,
pondéré par leur mise, et sur **preuve** du jalon. Toute la communauté (CFD délégués **au snapshot**) peut
aussi **geler** une campagne suspecte. Un **score de risque IA** signale
les campagnes à surveiller.

| | |
|---|---|
| Contrats | `CFDToken` (ERC20Votes) · `CampusFund` (jalons, statuts, remboursements) · `Governance` (DAO à snapshot) · `Treasury` (multisig 2-sur-3) |
| Tests | **157 tests Foundry verts** : unitaires, attaques, 8 fuzz × 1000, 5 invariants × 256 séquences. Couverture : **100 % des lignes et 97 % des branches** des 4 contrats |
| Audit | Slither : 18 findings, puis 13 restants, **tous traités** ([docs/audit](docs/audit/TRAITEMENT_FINDINGS.md)) |
| Attaques démontrées | réentrance (The DAO) et flash loan de gouvernance (Beanstalk) : réussite sur la version faible, échec sur la nôtre |
| IA | règles + Isolation Forest. Sur données **simulées** (10 tirages) : rappel 0,88 sur les fraudes connues, 0,38 sur des fraudes déguisées, précision ≈ 1 |
| Front | Next.js 14 + ethers v6 + MetaMask, 5 écrans (accueil, fiche, gouvernance, création, sécurité), 15 tests Vitest |

## Structure

```
contracts/   CFDToken, CampusFund, Governance, Treasury, interfaces/, demo/ (contrats volontairement vulnérables)
test/        unit/, attacks/, fuzz/, invariant/ (Handler + invariants), utils/
scripts/     foundry/ (Deploy, SeedDemo), anomaly_detection.py, ipfs/, demo-anvil.*, deploy-sepolia.*
frontend/    Next.js (App Router, TypeScript, Tailwind), routes /api/ipfs
docs/        GUIDE_PEDAGOGIQUE, CHOIX_DE_CONCEPTION, SECURITE, QUESTIONS_SOUTENANCE, RAPPORT, PLAN_SOUTENANCE,
             audit/ (Slither), coverage/, tests/ (sorties réelles), captures/
deployments/ adresses déployées par réseau (<chainId>.json)
```

## Installation

Prérequis : Git, Node.js ≥ 20, Python ≥ 3.10, [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
git clone https://github.com/0xseljarida/blockchain-project.git && cd blockchain-project
git switch youssef
git submodule update --init --recursive      # forge-std et OpenZeppelin (lib/)
forge build
cd frontend && npm install && cd ..
pip install -r scripts/requirements.txt      # web3, scikit-learn, numpy, pytest
pip install slither-analyzer solc-select && solc-select install 0.8.24 && solc-select use 0.8.24   # audit
```

> Windows : Foundry fournit des binaires natifs (`foundry_*_win32_amd64.zip` sur la page des releases GitHub),
> à extraire dans `%USERPROFILE%\.foundry\bin` puis à ajouter au `PATH`. Ce projet a été développé ainsi.

## Commandes

```bash
forge test                                   # 157 tests
forge test --match-contract FlashLoanGovernance -vv   # démo de l'attaque flash loan
forge test --match-contract Reentrancy -vvvv          # trace complète de la réentrance
forge coverage --report summary --no-match-coverage "(test|scripts)"
slither . --filter-paths "lib/|test/" --exclude-dependencies
python -m pytest scripts/tests -q             # tests du script IA
python scripts/anomaly_detection.py --demo    # fraudes simulées, connues et déguisées, sur 10 tirages
cd frontend && npm test                      # 15 tests Vitest du front
```

## Démo locale (anvil)

```bash
anvil                                         # terminal 1
bash scripts/demo-anvil.sh                    # terminal 2 (Windows : scripts\demo-anvil.ps1)
cd frontend && npm run dev                    # http://localhost:3000
```

`demo-anvil` déploie les contrats et crée 5 campagnes de clubs, avec des votes, des tranches, un
remboursement et une campagne « sybil ». Il synchronise ensuite les ABI et adresses vers le front, puis
calcule les scores IA. Dans MetaMask, ajoutez le réseau `http://127.0.0.1:8545` (chainId 31337) et importez un
compte anvil (clés de test **publiques**, affichées au démarrage d'`anvil`). Sur anvil, les boutons
« +1 h / +1 j » de l'en-tête avancent le temps de la blockchain.

## Déploiement Sepolia

**État au 15/11/2026.** Une version est déployée et vérifiée sur Sepolia (adresses dans
[`deployments/11155111.json`](deployments/11155111.json), bloc 12072327, vote de 1 h). **Elle date d'avant les
changements de contrats du 15/11** (vote de déblocage par campagne, une proposition ouverte à la fois, preuve
obligatoire, paramètres figés). Le front compilé avec les nouvelles ABI ne lit plus correctement ces anciens
contrats : **il faut redéployer** avant de montrer Sepolia. Cela demande **vos** clés, qui ne doivent jamais
être partagées.

1. `cp .env.example .env`, puis remplir `SEPOLIA_RPC_URL`, `PRIVATE_KEY` (compte **de test** avec ~0,05 SepoliaETH),
   `ETHERSCAN_API_KEY` et `TREASURY_OWNER_1..3` (les adresses des 3 membres).
2. `bash scripts/deploy-sepolia.sh` (ou `.ps1`) : il déploie, vérifie le code sur Etherscan et écrit `deployments/11155111.json`.
3. `frontend/.env.local` : `NEXT_PUBLIC_CHAIN_ID=11155111`, `NEXT_PUBLIC_RPC_URL=<RPC Sepolia>`,
   `PINATA_JWT=<JWT Pinata>` (côté serveur uniquement), puis `npm run sync && npm run dev`.
4. Créer une ou deux campagnes depuis « Créer une campagne » (upload IPFS réel), contribuer, voter. Durée de
   vote : `VOTING_PERIOD=3600` (1 h). Elle est **figée** au déploiement.
5. Scores IA : `python scripts/anomaly_detection.py --rpc $SEPOLIA_RPC_URL --deployment deployments/11155111.json`
   (écrit `frontend/public/risk-scores-11155111.json`). Il faut un RPC qui conserve l'historique des
   événements : le RPC public `publicnode` répond « pruned history unavailable ».
6. Captures pour le rapport : liste dans [docs/RAPPORT.md](docs/RAPPORT.md) §9.3. Committer `deployments/11155111.json`.

## Limites connues

- **Pause** : le déployeur garde `PAUSER_ROLE`, un coupe-circuit qui peut suspendre contributions, retraits et
  remboursements, mais ne permet de prendre aucun fonds. Tous les autres rôles sont abandonnés.
- **Garder ses CFD** : un remboursement brûle les CFD reçus pour la mise. Un contributeur qui les a transférés
  doit les récupérer d'abord (sinon on pourrait transférer ses CFD, se faire rembourser et garder les voix).
- **Preuves** : la preuve d'un jalon est un lien ou un CID ; le contrat vérifie sa présence, pas son contenu.
  Ce sont les votants qui la jugent.
- **Chargement** : le front lit chaque campagne et chaque proposition par appel RPC (ethers les regroupe en
  lots). C'est suffisant pour quelques dizaines de campagnes ; au-delà de quelques centaines, il faudrait un
  indexeur d'événements (The Graph ou équivalent).
- **IA** : évaluée sur des données simulées par le script lui-même ; aucune vraie fraude n'a servi de test.

## Documentation

| Document | Contenu |
|---|---|
| [GUIDE_PEDAGOGIQUE](docs/GUIDE_PEDAGOGIQUE.md) | Chaque notion avec une analogie, puis chaque fichier ligne par ligne |
| [CHOIX_DE_CONCEPTION](docs/CHOIX_DE_CONCEPTION.md) | Taux, quorum, majorité, multisig, frais, durée de vote… et leurs justifications |
| [DESIGN](docs/DESIGN.md) | Le design « Tableau des départs » : palette, polices, composants, accessibilité |
| [SECURITE](docs/SECURITE.md) | Chaque exigence : notion, code, test, résultat ; The DAO et Beanstalk ; limites |
| [QUESTIONS_SOUTENANCE](docs/QUESTIONS_SOUTENANCE.md) | 30 questions probables du jury et leurs réponses courtes |
| [RAPPORT](docs/RAPPORT.md) | Plan du rapport de 10 à 15 pages |
| [PLAN_SOUTENANCE](docs/PLAN_SOUTENANCE.md) | Déroulé de 10 minutes, démo en 3 minutes, plan B |

## Sécurité du dépôt

Aucune clé privée n'est versionnée : `.env` et `frontend/.env.local` sont ignorés par Git. Les seules clés
présentes dans le dépôt (`scripts/demo-anvil.*`) sont les clés de test **publiques** d'anvil, sans aucune valeur.
