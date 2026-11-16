# Prompt d'intégration du design « Tableau des départs » dans CampusFund

Copie tout ce qui suit dans ton assistant de code, ouvert à la racine du dépôt CampusFund, avec le dossier `design/` de cette archive placé à la racine.

---

Tu travailles sur CampusFund, une dApp de financement participatif pour clubs étudiants. Le front est dans `frontend/` : Next.js 14 (App Router, TypeScript), Tailwind, shadcn/ui, ethers v6, MetaMask. Il a quatre écrans : l'accueil (`/`), le détail d'une campagne (`/campaign/[id]`), l'espace porteur (`/creator`) et la gouvernance (`/governance`).

## Objectif

Remplacer l'habillage actuel (thème sombre monochrome) par le nouveau design « Tableau des départs », sans toucher à la logique blockchain. Les maquettes de référence sont dans `design/` :

| Maquette | Route à refaire |
|---|---|
| `design/Main.dc.html` | `/` |
| `design/Campaign.dc.html` | `/campaign/[id]` |
| `design/Governance.dc.html` | `/governance` |
| `design/Creator.dc.html` | `/creator` |
| `design/Logo.dc.html` | logo, favicon, image Open Graph, palette |

## Comment lire les maquettes

Ce sont des fichiers de maquette, pas du code à copier tel quel. Dans chacun :

- le balisage est entre `<x-dc>` et `</x-dc>`, avec tous les styles en `style="…"` : ce sont les valeurs exactes à reprendre (couleurs, tailles, espacements, rayons) ;
- `<helmet><style>` contient les polices, les animations (`@keyframes`) et les états de survol ;
- `{{ valeur }}`, `<sc-for>` et `<sc-if>` sont des trous, boucles et conditions : traduis-les en JSX (`{valeur}`, `.map()`, `&&`) ;
- la classe `Component` en bas du fichier montre l'état et les calculs d'exemple : sers-t'en pour comprendre le comportement, puis branche les vraies données ;
- ignore `support.js` : c'est le moteur de la maquette, il ne va pas dans le projet.

## Système visuel à mettre en place d'abord

Déclare ces jetons dans `tailwind.config` et les variables CSS globales, puis construis les composants partagés avant les pages.

- Couleurs : nuit `#09090A` (fond, avec une trame de points), ambre `#FFB800` (accent, signalétique), billet `#F2F0E8` (texte clair, cartes d'embarquement), palette `#232326` / `#1C1C1F` (tuiles), gris `#A9A9B2` (texte secondaire), vert `#4CD964` (versée), orange `#FF6A3D` (alerte, gel, remboursement).
- Polices, via `next/font/google` : Space Mono (400, 700) pour les palettes, les étiquettes et les données ; Archivo variable avec l'axe de largeur (`wdth` 62–125, `wght` 400–900) pour les grands titres condensés (`font-stretch` entre 64 % et 85 %) et le texte courant.
- Composants partagés à créer : `Flap` (une palette avec sa charnière centrale et son animation de retournement), `FlapText` (un mot en palettes, avec délais en cascade), `BoardRow` (une ligne du tableau des départs), `StatusLamp` (voyant coloré, clignotant ou non), `SignPanel` (bloc de signalétique ambre), `Logo` (les deux palettes C et F), `Header`.

## Vocabulaire de l'interface

La métaphore est celle d'un aéroport. Garde toujours le terme réel visible à côté du terme imagé, pour qu'un jury comprenne sans explication.

| Dans l'interface | Dans les contrats |
|---|---|
| Vol, départ | Campagne |
| Escale | Jalon |
| Décollage | Déblocage d'une tranche |
| Tour de contrôle | Gouvernance (DAO) |
| Plan de vol | Création d'une campagne |
| Scanner | Score de risque IA |
| Vol annulé | Campagne échouée ou gelée, remboursement |

## Ce qui ne doit pas changer

- Les appels aux contrats, les ABI, les hooks ethers, la lecture par RPC public et l'écriture par MetaMask.
- La traduction des erreurs des contrats (`frontend/src/lib/errors.ts`).
- La route serveur `/api/ipfs` et le cache local des CID.
- La lecture de `frontend/public/risk-scores.json` pour le score IA.
- Les boutons « +1 h / +1 j » sur anvil : restyle-les seulement.

## Données

Tout ce qui est chiffré dans les maquettes est un exemple : campagnes, clubs, montants, votes, pouvoir de vote. Remplace chaque valeur par la donnée lue sur la chaîne ou dans les métadonnées IPFS. Les textes entre crochets (`[Intitulé du jalon 1]`, `[0x… adresse du club]`) marquent les champs à alimenter. Les règles du protocole affichées (1 ETH = 1000 CFD, 2 % de frais au déblocage, quorum de 10 %, 2 à 5 jalons, etc.) sont exactes : lis-les depuis les contrats quand une constante existe, sinon garde-les en dur.

Prévois les états que les maquettes ne montrent pas : chargement (palettes vides qui se retournent), liste vide, portefeuille non connecté, mauvais réseau, transaction en attente, transaction refusée.

## Comportements à reproduire

- Accueil : le titre en palettes dont la troisième ligne alterne toutes les 4 secondes, l'horloge en direct, les filtres du tableau des départs, chaque ligne menant à la fiche de la campagne.
- Fiche : la carte d'embarquement avec l'itinéraire des escales, le guichet de contribution qui affiche les CFD reçus en palettes à mesure que le montant change.
- Tour de contrôle : le radar animé, les barres Pour / Contre / quorum qui s'animent après un vote, le bouton d'exécution pour une proposition adoptée.
- Plan de vol : le réglage des escales (2 à 5, total exactement 100 %, exprimé en points de base côté contrat), l'aperçu de l'itinéraire, le bouton de publication désactivé tant que le formulaire est invalide.

## Qualité

- Responsive : les pages doivent rester utilisables à 380 px de large (le tableau des départs défile horizontalement dans son cadre, les grilles passent sur une colonne).
- Accessibilité : vrais `<button>`, `<a>`, `<label>` ; le texte en palettes porte un `aria-label` lisible et ses lettres sont en `aria-hidden` ; contraste d'au moins 4,5:1 ; toutes les animations coupées sous `prefers-reduced-motion`.
- Les horloges et minuteries sont nettoyées au démontage des composants, et rien ne dépend de `window` au rendu serveur.

## Méthode

1. Lis les cinq maquettes et le front existant, puis propose un plan court (composants, ordre des pages) avant de coder.
2. Travaille sur une branche dédiée, dans cet ordre : jetons et polices, composants partagés, accueil, fiche, gouvernance, espace porteur, logo et favicon.
3. Après chaque page, lance `npm run lint` et `npm run build` dans `frontend/`, puis vérifie la page sur anvil avec le script de démonstration.
4. Termine par la liste de ce qui a été fait, de ce qui reste, et de tout écart volontaire par rapport aux maquettes.
