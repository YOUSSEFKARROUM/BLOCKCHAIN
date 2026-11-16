# Prompt : appliquer la critique du jury à CampusFund, une tâche à la fois

Tu travailles sur CampusFund (contrats Foundry dans `contracts/`, tests dans `test/`, script IA dans
`scripts/anomaly_detection.py`, front Next.js 14 dans `frontend/`, documents dans `docs/`).
Applique les améliorations ci-dessous **dans l'ordre, une tâche à la fois**. Ne t'arrête qu'une fois la
dernière tâche terminée.

## Règles pour chaque tâche
1. Lis d'abord le code concerné. Ne change que ce que la tâche demande.
2. Vérifie avant de passer à la suite :
   - contrats : `forge build` puis `forge test` (tous verts) ;
   - IA : `python -m pytest scripts/tests -q` ;
   - front : `npm run lint`, `npm run typecheck`, `npm run build` dans `frontend/`, puis rendu à 375, 768 et 1280 px.
3. Un commit par tâche (conventional commits, en français).
4. N'invente aucune donnée : noms, dates, chiffres absents → `[À REMPLACER]`.
5. Si une commande échoue deux fois, arrête-toi et explique le problème.
6. Si une recommandation s'avère fausse en lisant le code, ne l'applique pas : dis pourquoi et traite le vrai problème.

## Tâches

### A. Contrats (avec un test par changement)
1. **Vote de déblocage pondéré par la contribution à la campagne.** Pour une proposition de déblocage,
   le poids d'un votant = sa contribution à CETTE campagne × 1000 (figée : on ne contribue plus à une
   campagne réussie), et le quorum = 10 % des CFD émis par cette campagne. Les gels restent votés par
   toute la communauté, avec les CFD délégués au snapshot. Tests : un non-contributeur ne peut pas voter
   sur un déblocage, le quorum dépend de la campagne, le vote de gel est inchangé.
2. **Une seule proposition ouverte par campagne et par type.** Refuser une nouvelle proposition tant que la
   précédente du même type est en vote ou adoptée sans être exécutée. Test : la deuxième est refusée, puis
   acceptée une fois la première rejetée.
3. **Preuve obligatoire pour un déblocage.** `proposeMilestoneRelease` exige un CID IPFS ou un lien de preuve,
   stocké dans la proposition. Test : une preuve vide est refusée et la preuve est relue.
4. **Rôles.** Le déployeur abandonne `PARAMS_ROLE` (paramètres figés au déploiement) et ne garde que
   `PAUSER_ROLE`, qui sert de coupe-circuit. Test de déploiement mis à jour.
5. **Couverture des branches.** Ajouter les tests qui manquent pour monter la couverture des branches, puis
   régénérer `docs/tests/` et `docs/coverage/`.
6. **Démo et front alignés.** Adapter `SeedDemo.s.sol`, redéployer sur anvil (`scripts/demo-anvil.sh`),
   `npm run sync`, puis adapter le front : poids de vote par contribution, champ de preuve, lien de preuve
   affiché dans le vote.

### B. Intelligence artificielle
7. **Évaluation honnête.** Ajouter des fraudes « inconnues » (montants variés, délais aléatoires, financement
   par plusieurs sources), évaluer sur plusieurs tirages (moyenne ± écart type), et mesurer l'Isolation
   Forest seule. Mettre à jour les tests et `scripts/data/demo_report.json`.
8. **Scores par réseau.** Écrire `risk-scores-<chainId>.json` et faire lire au front le fichier du réseau
   courant. Calculer les scores de Sepolia (lecture seule, RPC public).

### C. Interface (rendu vérifié à 375, 768 et 1280 px après chaque tâche)
9. **Accueil recentré** : titre, tableau des départs, quatre portes. Sécurité, scanner et contrats passent
   sur une page `/securite`.
10. **Tableau des départs** : liste de cartes sous 768 px, nom de campagne plus large au-dessus.
11. **Typographie** : la police monospace est réservée aux données. Étiquettes et paragraphes en Archivo,
    pas en capitales, au moins 13 à 14 px.
12. **Termes réels** sur les boutons et les données (Contribuer, Voter, Débloquer la tranche, Créer une
    campagne). La métaphore reste dans les titres.
13. **Animations sobres** : le titre ne tourne plus en boucle. Le radar est accompagné d'un résumé chiffré
    (votes ouverts, propositions à exécuter).
14. **Bandeau MetaMask discret.** Avertir que les CFD doivent être gardés pour être remboursé.
15. **Heure de la chaîne rafraîchie** régulièrement (comptes à rebours justes).
16. **Chiffres honnêtes et datés** : couverture lignes et branches, « sur données simulées » pour l'IA,
    date de mesure.

### D. Ingénierie
17. **Tests du front** (Vitest) pour la logique pure de `lib/campaignView.ts`.
18. **Intégration continue** GitHub Actions : `forge test`, `pytest`, lint, typecheck et build du front.

### E. Documents
19. **README et docs** : statut Sepolia exact (déployé, mais à redéployer avec le nouveau code),
    `DESIGN.md` réécrit, `SECURITE.md`, `CHOIX_DE_CONCEPTION.md` et `QUESTIONS_SOUTENANCE.md` mis à jour
    (vote par campagne, preuves, rôles, limite de chargement des données).
20. **Rapport** : compléter les blocs « ✎ » à partir des faits du dépôt. Noms, encadrant et date → `[À REMPLACER]`.
21. **Captures** : régénérer `docs/captures/` avec la nouvelle interface.
22. **Vérification finale** : tous les tests, le build, et un récapitulatif de ce qui est fait, de ce qui reste
    et des écarts.
