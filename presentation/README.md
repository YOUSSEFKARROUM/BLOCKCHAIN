# Présentation de soutenance (manim-slides)

Quinze diapositives animées, dans le style du site (nuit, ambre, palettes d'affichage), pour une soutenance
de **10 minutes**. Chaque diapositive contient les **notes de l'orateur** (ce qu'il faut dire).

## Installer (une seule fois)

```bash
pip install --user "manim==0.19.0" "manim-slides[pyside6-full]"
```

Manim 0.19 est nécessaire : manim-slides 5.7 n'est pas compatible avec Manim 0.22. Les polices du site
(Archivo, Space Mono, licence OFL) sont dans `fonts/` et chargées automatiquement.

## Générer les vidéos

Depuis ce dossier `presentation/` :

```bash
python -m manim render -qm part0_garde.py S00PageDeGarde
python -m manim render -qm part1_contexte.py S01Ouverture S02Probleme S03Idee S04Architecture
python -m manim render -qm part2_cycle.py S05Cycle S06Vote S07Garanties
python -m manim render -qm part3_securite.py S08Reentrance S09FlashLoan S10GardeFous
python -m manim render -qm part4_preuves.py S11Tests S12IA S13Demo S14Limites S15Conclusion
```

`-qm` = 720p ; `-qh` = 1080p (plus long à calculer).

## Présenter

```bash
python -m manim_slides present S00PageDeGarde S01Ouverture S02Probleme S03Idee S04Architecture S05Cycle S06Vote S07Garanties S08Reentrance S09FlashLoan S10GardeFous S11Tests S12IA S13Demo S14Limites S15Conclusion
```

Touches : **→ / Espace** suivant, **←** précédent, **F** plein écran, **Q** quitter. Ou ouvrez
`campusfund.html` (export navigateur, voir plus bas) : **S** affiche les notes de l'orateur.

Export HTML (présentation dans un navigateur, sans Python le jour J) :

```bash
python -m manim_slides convert S00PageDeGarde S01Ouverture S02Probleme S03Idee S04Architecture S05Cycle S06Vote S07Garanties S08Reentrance S09FlashLoan S10GardeFous S11Tests S12IA S13Demo S14Limites S15Conclusion campusfund.html --open
```

## Minutage (10 minutes)

| # | Diapositive | Durée | Message à faire passer |
|---|---|---|---|
| 0 | Page de garde | — | École, équipe, encadrant (affichée avant de commencer). |
| 1 | Ouverture | 0:20 | Les fonds débloqués sur vote. |
| 2 | Le problème | 0:40 | Aujourd'hui, on donne tout d'un coup et on espère. |
| 3 | L'idée | 0:40 | Un coffre automatique, une tranche par jalon, un vote par tranche. |
| 4 | Architecture | 0:40 | 4 contrats, IPFS, site, IA. |
| 5 | Le cycle (1/2) | 0:50 | Créer, contribuer, clôturer : l'argent reste au contrat. |
| 6 | Le cycle (2/2) | 1:00 | Prouver, voter, exécuter, retirer : 98 % au club, 2 % à la trésorerie. |
| 7 | Quand ça tourne mal | 0:25 | Échec, abandon, fraude : le non-versé est rendu. |
| 8 | Réentrance | 0:35 | The DAO rejouée et bloquée. |
| 9 | Prêt flash | 0:40 | Beanstalk rejouée et bloquée par la photo des voix. |
| 10 | Garde-fous | 0:25 | Multisig 2 sur 3 ; l'équipe a renoncé à ses droits. |
| 11 | Preuves | 0:25 | 159 tests, 100 % / 97 %, Slither propre. |
| 12 | IA | 0:35 | Elle signale (92/100), la DAO décide ; 88 % / 38 %, dit franchement. |
| 13 | Démo | 2:00 | Contribuer, voter, débloquer, puis le test de l'attaque. |
| 14 | Limites | 0:25 | Quatre limites, quatre pistes. |
| 15 | Conclusion | 0:20 | Trois phrases, merci. |

## Vidéo de démonstration (secours si la démo en direct échoue)

Depuis `frontend/`, avec anvil, la démo chargée et `npm run dev` lancés : `npm run demo:video`.
Elle produit `frontend/e2e/demo-video/campusfund-demo.mp4` (environ 1 min 40) : score IA, contribution,
vote, exécution, retrait de la tranche, avec un curseur et des sous-titres. La démo anvil est restaurée à la fin.
