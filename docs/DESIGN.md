# Design — « Tableau des départs »

L'interface reprend un tableau d'aéroport à palettes : chaque campagne est un **vol**, chaque jalon une
**escale**, chaque déblocage un **décollage**. La métaphore sert l'idée centrale du projet : l'argent reste
à quai et ne part qu'au signal, c'est-à-dire après un vote.

## Règle de lecture : la métaphore dans les titres, le vrai terme dans les actions

Un jury ou un contributeur doit comprendre sans traduire. La métaphore reste dans les grands titres et
l'ambiance (« Tour de contrôle », « Monter à bord »). Les boutons, les statuts et les données utilisent le
vocabulaire du contrat : « Voter pour », « Exécuter le déblocage », « Créer une campagne », « Jalon 2 »,
« Tranche à retirer ». La navigation montre les deux : « Tour de contrôle » avec « Gouvernance » dessous.

| Interface | Contrat |
|---|---|
| Vol, départ | Campagne |
| Escale | Jalon |
| Décollage | Déblocage d'une tranche |
| Tour de contrôle | Gouvernance (DAO) |
| Plan de vol | Création d'une campagne |
| Scanner | Score de risque IA |

## Palette

| Nom | Valeur | Usage |
|---|---|---|
| Nuit | `#09090A` | fond, avec une trame de points de 14 px |
| Ambre | `#FFB800` | accent et signalétique (boutons principaux, panneaux) |
| Billet | `#F2F0E8` | texte clair et cartes d'embarquement |
| Palette | `#232326` / `#1C1C1F` | tuiles à charnière |
| Gris | `#A9A9B2` | texte secondaire (contraste 8,7:1 sur la nuit) |
| Vert | `#4CD964` | tranche versée, vote adopté |
| Orange | `#FF6A3D` | alerte, gel, remboursement |

Les couleurs sont des variables CSS (`app/globals.css`) et des jetons Tailwind (`tailwind.config.ts`).
La couleur porte toujours un sens doublé d'un texte : un voyant vert est toujours accompagné du mot « Versée ».

## Typographie

- **Archivo** (axe de largeur), via `next/font` : grands titres condensés (`font-stretch` 64 à 72 %),
  paragraphes et étiquettes, en casse normale, 13 px minimum.
- **Space Mono** : réservée aux **données** (montants, adresses, codes de vol, compteurs) et à la
  signalétique (boutons, navigation). Elle n'est plus utilisée pour les étiquettes ni les paragraphes.

Les deux polices sont téléchargées au build et servies par le site : aucun appel à Google à l'exécution.

## Composants (`frontend/src/components/board/`)

| Composant | Rôle |
|---|---|
| `Flap`, `FlapText` | Palettes à charnière. Chaque lettre se retourne quand elle apparaît ou change. `aria-label` lisible, lettres en `aria-hidden`. Mode chargement : palettes vides qui tournent. |
| `BoardRow`, `BoardCard` | Ligne du tableau des départs (≥ 768 px) et carte équivalente (< 768 px). |
| `StatusLamp` | Voyant coloré, fixe ou clignotant, toujours accompagné d'un texte. |
| `SignPanel` | Panneau ambre (règles, appel à l'action). |
| `Header`, `Logo`, `Clock` | En-tête avec terme réel sous chaque lien, logo en deux palettes C et F, horloge en palettes. |
| `RiskScale` | Échelle 0 · 35 · 50 · 100 du score de risque. |
| `Feedback` | États de transaction (signature, minage, confirmée, refusée), chargement, liste vide, erreur. |

## Écrans

| Route | Contenu |
|---|---|
| `/` | Titre en palettes, horloge, tableau des départs filtrable, quatre portes (cycle de vie), appel à l'action. |
| `/campaign/[id]` | Carte d'embarquement (collecté, objectif, itinéraire des jalons), jalons et vote en cours avec sa preuve, scanner IA, guichet de contribution. |
| `/governance` | Pouvoir de vote, radar et résumé chiffré, règles du vote, propositions avec barres Pour / Contre / quorum. |
| `/creator` | Formulaire de création (jalons réglés par pas de 5 %, total exactement 100 %), campagnes du compte. |
| `/securite` | Tests, attaques rejouées, scanner IA et contrats déployés, avec la date de mesure. |

## Mouvement

- Les palettes se retournent **une fois**, à l'arrivée. Aucune boucle sur le titre.
- Retour visuel dès l'appui sur les boutons (léger enfoncement), barres de vote qui grandissent au montage
  puis suivent les votes.
- `prefers-reduced-motion` coupe toutes les animations ; `prefers-contrast: more` renforce les bordures.

## Accessibilité et mobile

- Vrais `<button>`, `<a>`, `<label>` ; filtres en `aria-pressed` ; titres en palettes lus en une phrase.
- Contraste vérifié : gris `#A9A9B2` sur nuit 8,7:1 ; gris `#55554F` sur billet 6,6:1.
- Rendu vérifié à 375, 768 et 1280 px : aucun défilement horizontal de la page ; sous 768 px, le tableau
  devient une liste de cartes.
- Les horloges et minuteries sont arrêtées au démontage ; rien ne dépend de `window` au rendu serveur.

## Écarts assumés par rapport aux maquettes

- Le formulaire de création garde les champs exigés par IPFS et le contrat (club, catégorie, description,
  bénéficiaire, intitulé et preuve de chaque jalon), et une durée « 1 h · démo ».
- Délégation et proposition de gel conservées en gouvernance.
- Titre de l'accueil fixe (« Les fonds décollent sur vote. ») au lieu d'une alternance toutes les 4 s.
- Sécurité, scanner et contrats déplacés de l'accueil vers `/securite`.
