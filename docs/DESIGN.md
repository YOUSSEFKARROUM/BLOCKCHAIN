# Design de l'interface CampusFund

Règles suivies par le front-end, et la raison de chacune. Les valeurs sont définies une seule fois dans
[`frontend/src/app/globals.css`](../frontend/src/app/globals.css).

## Direction

Fond noir pour les écrans de travail, grands aplats de couleur pour raconter le produit. L'interface gère
de l'argent bloqué dans un contrat : les écrans où l'on agit restent calmes et précis, et la couleur sert à
expliquer. La maquette de référence fournie par l'équipe fixe le fond noir,
les titres en deux tons et les campagnes présentées en lignes.

## Couleur

| Rôle | Valeur | Usage |
|---|---|---|
| Fond | `#000000` | page |
| Surface | `#131315`, `#1c1c1e` | cartes, champs |
| Texte | `#f5f5f7`, `#a1a1a6`, `#6e6e73` | principal, secondaire, discret |
| Vert | `#30d158` | réussi, « pour », tranche versée, risque faible |
| Ambre | `#ffd60a` | avertissement, risque moyen |
| Rouge | `#ff453a` | erreur, « contre », annulé, risque élevé |
| Bleu | `#64d2ff` | en cours |

La couleur ne sert qu'à porter un sens (statut, risque, vote). Tout le reste est en niveaux de gris, pour
qu'un badge rouge se remarque immédiatement.

Les quatre étapes du produit ont chacune leur teinte, utilisée en fond dans la scène d'ouverture et reprise
dans les titres des sections : bleu pour donner (campagnes), violet pour les voix, corail pour le vote
(gouvernance), vert pour le déblocage (sécurité).

## Typographie

Texte courant en police système (`-apple-system`, Segoe UI Variable sous Windows) : elle est déjà réglée pour
l'écran et se charge sans délai. Titres en Bricolage Grotesque, graisse 800 : la police système donnait des
titres sans caractère. Elle est téléchargée au build et servie par le site. L'interlettrage dépend de la taille : négatif sur les grands titres (`-0.04em`), nul sur le
texte courant. Les chiffres sont à largeur fixe pour que les montants s'alignent.

## Mise en page

Chaque section de l'accueil a son titre à gauche, qui reste visible pendant le défilement, et son contenu à
droite. Les campagnes sont des lignes cliquables et non des cartes : on compare plus vite des montants
alignés. Sur mobile, tout passe sur une colonne.

## Mouvement

- Le retour visuel part à l'appui du bouton, pas au relâchement.
- L'accueil s'ouvre sur une scène pilotée par le défilement, qui explique le produit en 4 temps : les dons
  tombent dans le coffre, chaque donateur reçoit ses voix, le vote se remplit, une tranche part vers le club.
  Chaque étape a sa couleur. La scène suit le défilement avec un ressort sans rebond : on peut s'arrêter,
  revenir en arrière ou accélérer à tout moment, et le rendu s'arrête dès que le ressort est au repos.
- Les pièces rebondissent à l'arrivée, parce qu'elles tombent : c'est le seul rebond de l'interface.
- Les questions s'ouvrent en animant la hauteur depuis sa valeur courante, donc sans à-coup si on clique vite.

## Accessibilité

- `prefers-reduced-motion` : la scène saute directement à l'état final de chaque étape, les transitions
  deviennent de simples fondus.
- `prefers-reduced-transparency` : la barre du haut devient opaque.
- `prefers-contrast: more` : bordures et textes secondaires renforcés.
- Le focus clavier est toujours visible, et chaque statut est écrit en toutes lettres en plus de sa couleur.

## Honnêteté des contenus

Aucun chiffre n'est inventé. Les compteurs de l'accueil sont lus sur la blockchain, les badges de risque
viennent du script d'analyse, et la section Sécurité cite les résultats réels des tests et de l'audit. Quand
il n'y a pas de données, l'écran le dit et propose l'action suivante.
