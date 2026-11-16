# Design — « Tableau des départs »

L'interface reprend le **style visuel** d'un tableau d'affichage à palettes (tuiles à charnière, ambre sur
fond nuit). Depuis le 16/11/2026, **les textes n'utilisent plus la métaphore du vol** : titres, boutons,
statuts et navigation emploient le vocabulaire du contrat (campagne, jalon, tranche, gouvernance, déblocage).

## Peu de texte : le visuel d'abord, l'explication au verso

Les règles sont montrées par des visuels (frise des jalons, barre des frais, compte à rebours du garde-fou,
barres du score IA). La phrase complète est au verso du bloc, derrière un bouton « ? » (`FlipNote`) : le bloc
se retourne comme une palette ; avec `prefers-reduced-motion`, il passe en fondu.

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
| `FlipNote` | Bloc à deux faces : visuel au recto, explication au verso, bouton « ? » accessible (`aria-expanded`). |
| `Header`, `Logo`, `Clock` | En-tête avec une précision sous chaque lien, logo en deux palettes C et F, horloge en palettes. |
| `RiskScale` | Échelle 0 · 35 · 50 · 100 du score de risque. |
| `Feedback` | États de transaction (signature, minage, confirmée, refusée), chargement, liste vide, erreur. |

## Écrans

| Route | Contenu |
|---|---|
| `/` | Titre en palettes, horloge, tableau des campagnes filtrable, quatre étapes (cycle de vie), appel à l'action. |
| `/campaign/[id]` | Résumé de la campagne (collecté, objectif, statut), frise des jalons et vote en cours avec sa preuve, score de risque IA, panneau de contribution. |
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
- Titre de l'accueil fixe (« Les fonds débloqués sur vote. ») au lieu d'une alternance toutes les 4 s.
- Sécurité, scanner et contrats déplacés de l'accueil vers `/securite`.
