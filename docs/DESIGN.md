# Design de l'interface CampusFund

Règles suivies par le front-end, et la raison de chacune. Les valeurs sont définies une seule fois dans
[`frontend/src/app/globals.css`](../frontend/src/app/globals.css).

## Direction

Noir, monochrome, typographie système. L'interface gère de l'argent bloqué dans un contrat : elle doit
paraître calme et précise, pas décorative. La maquette de référence fournie par l'équipe fixe le fond noir,
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

## Typographie

Police système (`-apple-system`, Segoe UI Variable sous Windows) : elle est déjà réglée pour l'écran et se
charge sans délai. L'interlettrage dépend de la taille : négatif sur les grands titres (`-0.04em`), nul sur le
texte courant. Les chiffres sont à largeur fixe pour que les montants s'alignent.

## Mise en page

Chaque section de l'accueil a son titre à gauche, qui reste visible pendant le défilement, et son contenu à
droite. Les campagnes sont des lignes cliquables et non des cartes : on compare plus vite des montants
alignés. Sur mobile, tout passe sur une colonne.

## Mouvement

- Le retour visuel part à l'appui du bouton, pas au relâchement.
- La lumière de la sphère suit le pointeur avec un ressort sans rebond. On peut changer de direction à tout
  moment, et le rendu s'arrête dès que le ressort est au repos.
- Une seule animation d'entrée : la lumière qui se pose sur la sphère au chargement.
- Les questions s'ouvrent en animant la hauteur depuis sa valeur courante, donc sans à-coup si on clique vite.

## Accessibilité

- `prefers-reduced-motion` : la sphère est fixe, les transitions deviennent de simples fondus.
- `prefers-reduced-transparency` : la barre du haut devient opaque.
- `prefers-contrast: more` : bordures et textes secondaires renforcés.
- Le focus clavier est toujours visible, et chaque statut est écrit en toutes lettres en plus de sa couleur.

## Honnêteté des contenus

Aucun chiffre n'est inventé. Les compteurs de l'accueil sont lus sur la blockchain, les badges de risque
viennent du script d'analyse, et la section Sécurité cite les résultats réels des tests et de l'audit. Quand
il n'y a pas de données, l'écran le dit et propose l'action suivante.
