<a id="readme-top"></a>

<!-- BADGES -->
[![CI][ci-shield]][ci-url]
[![Sepolia][sepolia-shield]][sepolia-url]
[![Démo en ligne][demo-shield]][demo-url]
[![Tests][tests-shield]](#tests-et-audit)
[![Couverture][coverage-shield]](docs/coverage)

<!-- EN-TÊTE -->
<br />
<div align="center">
  <a href="https://campusfund.vercel.app">
    <img src="docs/brand/logo-campusfund.svg" alt="Logo CampusFund" width="96" height="96">
  </a>

  <h3 align="center">CampusFund</h3>

  <p align="center">
    Financement participatif décentralisé de projets étudiants : les fonds sont débloqués sur vote.
    <br />
    <a href="docs/COMPRENDRE_CAMPUSFUND.md"><strong>Comprendre le projet en 10 minutes »</strong></a>
    <br />
    <br />
    <a href="https://campusfund.vercel.app">Voir la démo</a>
    &middot;
    <a href="docs/video/campusfund-demo-sepolia.mp4">Vidéo de démonstration</a>
    &middot;
    <a href="https://github.com/YOUSSEFKARROUM/BLOCKCHAIN/issues">Signaler un problème</a>
  </p>
</div>

<!-- TABLE DES MATIÈRES -->
<details>
  <summary>Table des matières</summary>
  <ol>
    <li>
      <a href="#à-propos-du-projet">À propos du projet</a>
      <ul>
        <li><a href="#construit-avec">Construit avec</a></li>
      </ul>
    </li>
    <li>
      <a href="#pour-commencer">Pour commencer</a>
      <ul>
        <li><a href="#prérequis">Prérequis</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#utilisation">Utilisation</a>
      <ul>
        <li><a href="#démo-locale-anvil">Démo locale (anvil)</a></li>
        <li><a href="#réseau-de-test-sepolia">Réseau de test Sepolia</a></li>
        <li><a href="#tests-et-audit">Tests et audit</a></li>
        <li><a href="#présentation">Présentation</a></li>
      </ul>
    </li>
    <li><a href="#structure-du-dépôt">Structure du dépôt</a></li>
    <li><a href="#feuille-de-route">Feuille de route</a></li>
    <li><a href="#limites-connues">Limites connues</a></li>
    <li><a href="#documentation">Documentation</a></li>
    <li><a href="#contribuer">Contribuer</a></li>
    <li><a href="#licence">Licence</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#remerciements">Remerciements</a></li>
  </ol>
</details>

<!-- À PROPOS -->
## À propos du projet

[![Capture de CampusFund][product-screenshot]](https://campusfund.vercel.app)

Aujourd'hui, quand on finance le projet d'un club, on donne tout d'un coup et on espère que l'argent sera
bien utilisé. CampusFund remplace cette confiance aveugle par un coffre automatique :

* **Des jalons** : chaque campagne est découpée en 2 à 5 tranches, chacune liée à une preuve promise.
* **Des voix** : chaque contributeur reçoit des jetons **CFD** (1 ETH = 1000 CFD), qui sont ses droits de vote.
* **Un vote par tranche** : le club publie une preuve (facture, photos), puis les contributeurs votent,
  pondérés par leur mise. Le club ne vote pas sur son propre déblocage.
* **Des filets de sécurité** : objectif manqué, projet abandonné ou fraude, l'argent non versé est rendu.
* **Un scanner IA** : un score de risque signale les campagnes suspectes. Il alerte, seule la DAO décide.

| | |
|---|---|
| Contrats | `CFDToken` (ERC20Votes) · `CampusFund` (jalons, statuts, remboursements) · `Governance` (DAO à snapshot) · `Treasury` (multisig 2 sur 3) |
| Tests | **159 tests Foundry** : unitaires, attaques, 8 fuzz × 1000, 5 invariants × 256 séquences. Couverture : **100 % des lignes, 97 % des branches** |
| Audit | Slither : 18 findings, puis 13 restants, **tous traités** ([docs/audit](docs/audit/TRAITEMENT_FINDINGS.md)) |
| Attaques rejouées | Réentrance (The DAO) et prêt flash de gouvernance (Beanstalk) : réussies sur la version faible, bloquées sur la nôtre |
| IA | Règles + Isolation Forest. Sur données **simulées** : rappel 0,88 sur les fraudes connues, 0,38 sur les fraudes déguisées |
| Site | Next.js 14 + ethers v6 + MetaMask, 5 écrans (accueil, fiche, gouvernance, création, sécurité), 25 tests Vitest |

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

### Construit avec

[![Solidity][solidity-shield]][solidity-url]
[![Foundry][foundry-shield]][foundry-url]
[![OpenZeppelin][openzeppelin-shield]][openzeppelin-url]
[![Next.js][next-shield]][next-url]
[![React][react-shield]][react-url]
[![TypeScript][typescript-shield]][typescript-url]
[![Tailwind CSS][tailwind-shield]][tailwind-url]
[![ethers][ethers-shield]][ethers-url]
[![Python][python-shield]][python-url]
[![scikit-learn][sklearn-shield]][sklearn-url]
[![IPFS][ipfs-shield]][ipfs-url]

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- POUR COMMENCER -->
## Pour commencer

### Prérequis

* Git, Node.js ≥ 20, Python ≥ 3.10
* [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`)
* L'extension [MetaMask](https://metamask.io/) dans le navigateur

> **Windows** : Foundry fournit des binaires natifs (`foundry_*_win32_amd64.zip` sur la page des releases
> GitHub), à extraire dans `%USERPROFILE%\.foundry\bin` puis à ajouter au `PATH`.

### Installation

1. Cloner le dépôt avec ses sous-modules (forge-std et OpenZeppelin)
   ```sh
   git clone --recurse-submodules https://github.com/YOUSSEFKARROUM/BLOCKCHAIN.git
   cd BLOCKCHAIN
   ```
2. Compiler les contrats
   ```sh
   forge build
   ```
3. Installer le site
   ```sh
   cd frontend && npm install && cd ..
   ```
4. Installer le script IA
   ```sh
   pip install -r scripts/requirements.txt
   ```
5. Facultatif, pour l'audit
   ```sh
   pip install slither-analyzer solc-select
   solc-select install 0.8.24 && solc-select use 0.8.24
   ```
6. Copier les fichiers d'environnement : `.env.example` vers `.env`, et `frontend/.env.example` vers
   `frontend/.env.local`. Ils ne sont jamais versionnés.

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- UTILISATION -->
## Utilisation

### Démo locale (anvil)

```sh
anvil                                  # terminal 1 : blockchain locale
bash scripts/demo-anvil.sh             # terminal 2 (Windows : scripts\demo-anvil.ps1)
cd frontend && npm run dev             # http://localhost:3000
```

`demo-anvil` déploie les contrats et crée 5 campagnes de clubs, avec des votes, des tranches, un
remboursement et une campagne « sybil ». Il copie les ABI et les adresses dans le site, puis calcule les
scores IA. Dans MetaMask, ajoutez le réseau `http://127.0.0.1:8545` (chainId 31337) et importez un compte
anvil (clés de test **publiques**, affichées au démarrage). Les boutons « +1 h / +1 j » de l'en-tête avancent
le temps de la blockchain locale.

### Réseau de test Sepolia

Les contrats sont déployés et **vérifiés** sur Sepolia (bloc 12148292, vote de 1 h). Le site en ligne
<https://campusfund.vercel.app> est branché dessus.

| Contrat | Adresse |
|---|---|
| Treasury | [`0xC54160c9EBde7Ba4c9D9E0EB7B583F8CB3d71575`](https://sepolia.etherscan.io/address/0xC54160c9EBde7Ba4c9D9E0EB7B583F8CB3d71575#code) |
| CFDToken | [`0x0C8baD1D5FCc1b47D757b0468b719B7E22521c31`](https://sepolia.etherscan.io/address/0x0C8baD1D5FCc1b47D757b0468b719B7E22521c31#code) |
| CampusFund | [`0x9ED175d941378C899576CE5B71103E6185B4a6Ee`](https://sepolia.etherscan.io/address/0x9ED175d941378C899576CE5B71103E6185B4a6Ee#code) |
| Governance | [`0xd61923C47c8f0059370d8C96404C325163DEa802`](https://sepolia.etherscan.io/address/0xd61923C47c8f0059370d8C96404C325163DEa802#code) |

Le déployeur n'a gardé que le rôle de pause. Pour refaire un déploiement complet :

1. Remplir `.env` : `SEPOLIA_RPC_URL`, `PRIVATE_KEY` (compte **de test** avec environ 0,05 SepoliaETH),
   `ETHERSCAN_API_KEY` et `TREASURY_OWNER_1..3` (les adresses des 3 membres).
2. `bash scripts/deploy-sepolia.sh` (ou `.ps1`) : déploie, vérifie le code sur Etherscan et écrit
   `deployments/11155111.json`. Si le déploiement s'arrête faute de fonds, `scripts/foundry/ResumeDeploy.s.sol`
   le termine sans redéployer le reste.
3. Remplir `frontend/.env.local` : `NEXT_PUBLIC_CHAIN_ID=11155111`, `NEXT_PUBLIC_RPC_URL=<RPC Sepolia>`,
   `PINATA_JWT=<JWT Pinata>` (côté serveur uniquement), puis `npm run sync && npm run dev`.
4. Scores IA : `python scripts/anomaly_detection.py --rpc $SEPOLIA_RPC_URL --deployment deployments/11155111.json`.
   Le RPC doit conserver l'historique des événements.
5. Préparer la démo en direct (vote déjà adopté) : `bash scripts/prepare-demo-live.sh <id campagne>`.

### Tests et audit

```sh
forge test                                            # 159 tests
forge test --match-contract FlashLoanGovernance -vv   # l'attaque du prêt flash, rejouée
forge test --match-contract Reentrancy -vvvv          # la réentrance, trace complète
forge coverage --report summary --no-match-coverage "(test|scripts)"
slither . --filter-paths "lib/|test/" --exclude-dependencies
python -m pytest scripts/tests -q                     # tests du script IA
python scripts/anomaly_detection.py --demo            # fraudes simulées sur 10 tirages
cd frontend && npm test                               # 25 tests Vitest
cd frontend && npm run e2e                            # parcours complet en cliquant dans le site (anvil)
```

Le test de bout en bout (`npm run e2e`) contribue, vote, exécute, retire, rembourse et crée une campagne en
cliquant dans l'interface, puis vérifie l'état sur la chaîne. Il faut anvil, la démo chargée et `npm run dev`
lancés. La démo est restaurée à la fin.

### Présentation

La présentation de soutenance (10 minutes) est faite avec [manim-slides](https://github.com/jeertmans/manim-slides).
Elle s'ouvre sans Python dans un navigateur : [presentation/campusfund.html](presentation/campusfund.html).
Les commandes de rendu, le minutage et le script oral sont dans [presentation/README.md](presentation/README.md).

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- STRUCTURE -->
## Structure du dépôt

```
contracts/      CFDToken, CampusFund, Governance, Treasury, interfaces/, demo/ (versions volontairement vulnérables)
test/           unit/, attacks/, fuzz/, invariant/, utils/
scripts/        foundry/ (déploiement, démo), anomaly_detection.py (IA), ipfs/, demo-anvil.*, deploy-sepolia.*
frontend/       site Next.js (App Router, TypeScript, Tailwind), routes /api/ipfs, e2e/
deployments/    adresses déployées par réseau (<chainId>.json)
docs/           guides, rapport, sécurité, audit/, coverage/, captures/, video/
presentation/   présentation manim-slides (sources, export HTML, scripts oraux)
campusfund-design/  maquettes du design « Tableau des départs »
```

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- FEUILLE DE ROUTE -->
## Feuille de route

- [x] Contrats : jalons, vote par tranche, gel, remboursements, trésorerie multisig
- [x] Vote au snapshot contre les prêts flash ; le porteur ne vote pas son propre déblocage
- [x] 159 tests, fuzz, invariants, audit Slither traité
- [x] Score de risque IA (règles + Isolation Forest)
- [x] Site complet, déployé sur Vercel et Sepolia
- [ ] Délai d'exécution (timelock) entre la fin du vote et le déblocage
- [ ] Identité étudiante vérifiée, contre les doubles comptes
- [ ] Indexeur d'événements (The Graph ou équivalent) au-delà de quelques centaines de campagnes
- [ ] Audit de sécurité professionnel avant tout usage avec de vrais fonds

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- LIMITES -->
## Limites connues

* **Seconde adresse** : le porteur ne vote pas le déblocage de ses fonds, mais peut contribuer et voter depuis
  une autre adresse. Sans identité vérifiée, seul le scanner IA le signale.
* **Pause** : le déployeur garde `PAUSER_ROLE`, qui suspend contributions, retraits et remboursements, mais ne
  permet de prendre aucun fonds. Tous les autres rôles sont abandonnés.
* **Garder ses CFD** : un remboursement brûle les CFD reçus pour la mise. Un contributeur qui les a transférés
  doit les récupérer d'abord.
* **Preuves** : la preuve d'un jalon est un lien ou un CID ; le contrat vérifie sa présence, pas son contenu.
  Ce sont les votants qui la jugent.
* **Chargement** : le site lit chaque campagne par appel RPC. Suffisant pour quelques dizaines de campagnes.
* **IA** : évaluée sur des données simulées ; aucune vraie fraude n'a servi de test.

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- DOCUMENTATION -->
## Documentation

| Document | Contenu |
|---|---|
| [COMPRENDRE_CAMPUSFUND](docs/COMPRENDRE_CAMPUSFUND.md) | Le projet expliqué sans prérequis en blockchain |
| [GUIDE_PEDAGOGIQUE](docs/GUIDE_PEDAGOGIQUE.md) | Chaque notion avec une analogie, puis chaque fichier ligne par ligne |
| [CHOIX_DE_CONCEPTION](docs/CHOIX_DE_CONCEPTION.md) | Taux, quorum, majorité, multisig, frais, durée de vote, et leurs justifications |
| [DESIGN](docs/DESIGN.md) | Le design « Tableau des départs » : palette, polices, composants, accessibilité |
| [SECURITE](docs/SECURITE.md) | Chaque exigence : notion, code, test, résultat ; The DAO et Beanstalk ; limites |
| [QUESTIONS_SOUTENANCE](docs/QUESTIONS_SOUTENANCE.md) | 30 questions probables du jury et leurs réponses |
| [RAPPORT](docs/RAPPORT.md) | Plan du rapport |
| [PLAN_SOUTENANCE](docs/PLAN_SOUTENANCE.md) | Déroulé de la soutenance et plan B |

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- CONTRIBUER -->
## Contribuer

Le projet est un travail de groupe, mais les suggestions sont les bienvenues.

1. Forker le projet
2. Créer une branche (`git checkout -b feat/ma-proposition`)
3. Committer (`git commit -m "feat: ma proposition"`)
4. Pousser la branche (`git push origin feat/ma-proposition`)
5. Ouvrir une pull request

Avant d'ouvrir une pull request : `forge fmt --check`, `forge test`, `npm run lint` et `npm test` dans
`frontend/` doivent passer (la CI les relance). Aucune clé privée ne doit être versionnée : `.env` et
`frontend/.env.local` sont ignorés par Git, et les seules clés présentes dans le dépôt
(`scripts/demo-anvil.*`) sont les clés de test **publiques** d'anvil.

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- LICENCE -->
## Licence

[À REMPLACER] Aucune licence n'a encore été choisie. Le code est publié à des fins pédagogiques ; les
dépendances (OpenZeppelin, forge-std) gardent leur propre licence MIT.

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- CONTACT -->
## Contact

Mini-projet Blockchain · ENSA Béni Mellal, Université Sultan Moulay Slimane · filière IA et Cybersécurité ·
2026/2027.

* **AIT KARROUM Youssef**
* **Othmane ALIOUALI**
* **Saad-Eddine EL JARIDA**

Encadrant : **Pr. Hamza TOUIL**

Dépôt : <https://github.com/YOUSSEFKARROUM/BLOCKCHAIN>

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- REMERCIEMENTS -->
## Remerciements

* Pr. Hamza TOUIL, pour l'encadrement du projet
* [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
* [Foundry](https://github.com/foundry-rs/foundry)
* [Slither](https://github.com/crytic/slither)
* [manim-slides](https://github.com/jeertmans/manim-slides)
* [Pinata](https://pinata.cloud/) pour l'hébergement IPFS
* [Shields.io](https://shields.io/) pour les badges
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template) pour la structure de ce fichier

<p align="right">(<a href="#readme-top">retour en haut</a>)</p>

<!-- LIENS ET IMAGES -->
[ci-shield]: https://img.shields.io/github/actions/workflow/status/YOUSSEFKARROUM/BLOCKCHAIN/ci.yml?branch=main&style=for-the-badge&label=CI
[ci-url]: https://github.com/YOUSSEFKARROUM/BLOCKCHAIN/actions/workflows/ci.yml
[sepolia-shield]: https://img.shields.io/badge/Sepolia-contrats%20v%C3%A9rifi%C3%A9s-627EEA?style=for-the-badge&logo=ethereum&logoColor=white
[sepolia-url]: https://sepolia.etherscan.io/address/0x9ED175d941378C899576CE5B71103E6185B4a6Ee#code
[demo-shield]: https://img.shields.io/badge/D%C3%A9mo-campusfund.vercel.app-FFB800?style=for-the-badge&logo=vercel&logoColor=black
[demo-url]: https://campusfund.vercel.app
[tests-shield]: https://img.shields.io/badge/tests-159%20Foundry-1E9E45?style=for-the-badge
[coverage-shield]: https://img.shields.io/badge/couverture-100%25%20lignes-1E9E45?style=for-the-badge
[product-screenshot]: docs/captures/anvil-home.png
[solidity-shield]: https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white
[solidity-url]: https://soliditylang.org/
[foundry-shield]: https://img.shields.io/badge/Foundry-forge%20%C2%B7%20anvil-DEA584?style=for-the-badge
[foundry-url]: https://book.getfoundry.sh/
[openzeppelin-shield]: https://img.shields.io/badge/OpenZeppelin-v5-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white
[openzeppelin-url]: https://www.openzeppelin.com/contracts
[next-shield]: https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[next-url]: https://nextjs.org/
[react-shield]: https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/
[typescript-shield]: https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[tailwind-shield]: https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[tailwind-url]: https://tailwindcss.com/
[ethers-shield]: https://img.shields.io/badge/ethers-v6-2535A0?style=for-the-badge
[ethers-url]: https://docs.ethers.org/v6/
[python-shield]: https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white
[python-url]: https://www.python.org/
[sklearn-shield]: https://img.shields.io/badge/scikit--learn-Isolation%20Forest-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white
[sklearn-url]: https://scikit-learn.org/
[ipfs-shield]: https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white
[ipfs-url]: https://ipfs.tech/
