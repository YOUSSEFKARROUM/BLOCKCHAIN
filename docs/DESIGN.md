# Design de l'interface CampusFund

Règles suivies par le front-end, et la raison de chacune. Les valeurs sont définies une seule fois dans
[`frontend/src/app/globals.css`](../frontend/src/app/globals.css).

## Direction

Noir, blanc et gris uniquement. L'accueil est une mosaïque de tuiles : tout l'essentiel tient sur un écran,
sans défilement imposé. L'interface gère de l'argent bloqué dans un contrat : elle doit paraître calme et
précise.

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

Texte courant en police système (`-apple-system`, Segoe UI Variable sous Windows) : elle est déjà réglée pour
l'écran et se charge sans délai. Titres en Bricolage Grotesque, graisse 800 : la police système donnait des
titres sans caractère. Elle est téléchargée au build et servie par le site. L'interlettrage dépend de la taille : négatif sur les grands titres (`-0.04em`), nul sur le
texte courant. Les chiffres sont à largeur fixe pour que les montants s'alignent.

## Mise en page

L'accueil s'ouvre sur six tuiles : l'accroche, l'animation « Comment ça marche », la campagne à la une, le
vote en cours, les chiffres lus sur la blockchain et les garanties de sécurité. La liste complète des
campagnes et les questions suivent. Les campagnes sont des lignes cliquables : on compare plus vite des
montants alignés. La campagne à la une n'est jamais une campagne signalée à risque élevé. Sur mobile, les
tuiles passent sur une colonne.

## Mouvement

- Le retour visuel part à l'appui du bouton, pas au relâchement.
- « Comment ça marche » est une animation de 4 étapes qui joue seule, en boucle : les dons vont au coffre,
  les donateurs reçoivent leurs voix, le vote se remplit, une tranche part au club. On peut la mettre en
  pause ou cliquer sur une étape.
- La trame de points de la tuile d'accroche réagit au pointeur ; une onde la traverse une fois au chargement.
- Les chiffres montent de zéro à leur valeur quand ils apparaissent.
- Les questions s'ouvrent en animant la hauteur depuis sa valeur courante, donc sans à-coup si on clique vite.

## Accessibilité

- `prefers-reduced-motion` : l'animation ne joue pas seule et montre l'état final de chaque étape, la trame
  est fixe, les transitions deviennent de simples fondus.
- `prefers-reduced-transparency` : la barre du haut devient opaque.
- `prefers-contrast: more` : bordures et textes secondaires renforcés.
- Le focus clavier est toujours visible, et chaque statut est écrit en toutes lettres en plus de sa couleur.

## Honnêteté des contenus

Aucun chiffre n'est inventé. Les compteurs de l'accueil sont lus sur la blockchain, les badges de risque
viennent du script d'analyse, et la section Sécurité cite les résultats réels des tests et de l'audit. Quand
il n'y a pas de données, l'écran le dit et propose l'action suivante.

## Composants

Les composants de base viennent de shadcn/ui (dossier `frontend/src/components/shadcn/`) : boutons, badges,
jauges, onglets, accordéon, champs de formulaire. Leur code est copié dans le projet, donc adapté au site :
forme pilule, teintes sémantiques, retour visuel dès l'appui. Ils reposent sur Radix UI, qui gère le clavier
et les lecteurs d'écran. Les listes déroulantes restent des `<select>` natifs.
