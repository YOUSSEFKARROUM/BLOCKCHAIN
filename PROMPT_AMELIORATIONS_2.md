# Prompts détaillés : deuxième revue de CampusFund

Chaque prompt ci-dessous est autonome : il dit où regarder, quoi changer, comment vérifier et quand s'arrêter.
Applique-les **dans l'ordre, un par un**, avec un commit par prompt.

## Règles communes à tous les prompts
- Lis le code concerné avant de le modifier. Ne change que ce que le prompt demande.
- N'invente aucune donnée (noms, chiffres, dates) : ce qui manque est marqué `[À REMPLACER]`.
- Si une commande échoue deux fois, arrête-toi et montre l'erreur exacte.
- Si la recommandation se révèle fausse en lisant le code, ne l'applique pas et dis pourquoi.
- Vérifications : contrats `forge build && forge test` ; IA `python -m pytest scripts/tests -q` ;
  front (dans `frontend/`) `npm run lint && npm run typecheck && npm test`, puis build avec
  `NEXT_DIST_DIR=.next-build npm run build` (ne jamais écraser `.next` du serveur de dev).

---

## Prompt 1 — Le porteur ne vote pas le déblocage de ses propres fonds

**Constat.** Dans `contracts/Governance.sol`, le poids d'un vote de déblocage est la contribution à la
campagne (`_votingPower`). Rien n'empêche le porteur ou le bénéficiaire de contribuer 10 % à sa propre
campagne : il atteint alors seul le quorum et, si les autres ne votent pas, débloque toutes ses tranches.

**À faire.**
1. Écris d'abord un test dans `test/unit/Governance.t.sol` : le porteur qui a contribué à sa campagne
   appelle `castVote` sur son propre déblocage et reçoit `NoVotingPower`. Même test pour le bénéficiaire
   quand il diffère du porteur. Lance-le : il doit échouer.
2. Dans `_votingPower`, pour une proposition `MilestoneRelease`, renvoie 0 si le votant est le porteur ou
   le bénéficiaire (`fund.campaignParties`). Le quorum reste calculé sur toute la collecte : la part du
   porteur ne compte donc plus, ce qui rend le quorum plus exigeant, pas moins.
3. Ne touche pas aux votes de gel.
4. Vérifie que `scripts/foundry/SeedDemo.s.sol` ne fait voter aucun porteur sur son propre déblocage.

**Limite à écrire telle quelle** dans `docs/SECURITE.md` (limites connues) : le porteur peut contourner
la règle avec une seconde adresse. Sans identité étudiante vérifiée, aucune règle on-chain ne l'empêche ;
le scanner IA (règle « adresses liées ») est le seul signal.

**Fini quand** les nouveaux tests passent, tous les anciens aussi.

---

## Prompt 2 — Code formaté et vérifié en intégration continue

**Constat.** `forge fmt --check` échoue alors que `foundry.toml` définit une règle de formatage.

**À faire.**
1. Lance `forge fmt` (il ne touche que `contracts/`, `test/`, `scripts/foundry/`). Vérifie avec
   `git diff --stat` que seule la mise en forme change, puis `forge build && forge test`.
2. Ajoute l'étape `forge fmt --check` au job `contrats` de `.github/workflows/ci.yml`, avant le build.
3. Mets à jour les numéros de ligne cités dans `docs/GUIDE_PEDAGOGIQUE.md` et `docs/SECURITE.md` s'ils
   ont bougé (compare avec `grep -n "function " contracts/*.sol`).

**Fini quand** `forge fmt --check` renvoie 0 et les tests passent.

---

## Prompt 3 — Données de démonstration crédibles

**Constat.** Dans `scripts/foundry/SeedDemo.s.sol`, les descriptions sont sans accents (« Prototype
termine : video ») et les preuves sont des adresses `demo://…` affichées comme du texte brut : un jury
qui lit la page de gouvernance voit des fautes et un lien qui n'ouvre rien.

**À faire.**
1. Écris les descriptions avec leurs accents, en littéraux `unicode"…"`.
2. Dans `frontend/src/components/governance/ProposalCard.tsx` (`ProofLink`), une preuve `demo://nom`
   s'affiche « nom · preuve fictive de démonstration », sans lien. Les autres cas ne changent pas.
   Ajoute le cas aux tests Vitest si la logique est extraite dans `lib/proof.ts`.
3. Redéploie la démo (`scripts/demo-anvil.sh`), `npm run sync` dans `frontend/`, recalcule les scores IA.

**Fini quand** la page `/governance` affiche les accents et la mention « preuve fictive ».

---

## Prompt 4 — Défauts de lisibilité de l'interface

Vérifie chaque point à 375, 768 et 1280 px avec une capture avant de passer au suivant.

1. **Texte barré par la charnière.** Le dégradé `.db-tile` trace un trait à mi-hauteur. Il traverse le
   texte dès que le bloc contient plusieurs lignes : lignes « Porteur / Bénéficiaire / Métadonnées » et
   lignes des jalons sur `/campaign/[id]`, encadrés d'aide et champs sur `/creator`. Réserve `.db-tile`
   aux palettes d'une seule ligne de caractères ; partout ailleurs, utilise un fond uni (`.db-panel`).
2. **Adresses déformées.** Sur la carte d'embarquement, l'adresse est affichée en capitales
   (« 0X15D3…6A65 ») : une adresse Ethereum ne se met jamais en capitales. Retire la transformation.
3. **Restes d'anglais et formulations.** « STATUT ON-CHAIN : SUCCESSFUL » devient le libellé français de
   `STATUS_LABELS`. « Échéance · il y a 2 h » devient « Collecte close · il y a 2 h ».
4. **Score affiché deux fois** sur la fiche (talon de la carte et panneau du scanner). Garde le panneau,
   et mets dans le talon ce qui manque : le nombre de contributeurs n'étant pas lu, n'invente rien ;
   laisse le code de vol, le contrat et le statut.
5. **Noms tronqués** dans le tableau des départs à 1280 px (« COUPE DE FRANCE DE ROBOTI… ») alors que la
   colonne du montant est à moitié vide. Rééquilibre la grille pour donner la place au nom.
6. **Titres des propositions trop gros** sur `/governance` (4 lignes de 34 px par carte). Ramène-les à une
   taille de sous-titre : la donnée importante est la barre de vote.
7. **Pouvoir de vote sans portefeuille** : quatre palettes vides ne disent rien. Affiche la phrase
   « Connectez un portefeuille pour voir votre pouvoir de vote ».
8. **Promesse fausse sur l'accueil** : « Objectif manqué ou gel : 100 % de la mise rendue ». Après un gel,
   les tranches déjà versées ne reviennent pas (`refund` rembourse au prorata du reste). Écris :
   « Objectif manqué : 100 % de la mise rendue. Gel : tout ce qui n'a pas encore été versé. »

**Fini quand** lint, types, tests et build passent et que les six captures ne montrent plus ces défauts.

---

## Prompt 5 — Tester les transactions depuis l'interface, sans MetaMask

**Constat.** Aucune écriture (contribuer, voter, exécuter, retirer, rembourser, créer) n'a jamais été
vérifiée depuis l'interface : seule la lecture des pages l'a été. C'est le plus gros risque de la démo.

**À faire.**
1. Écris un script `frontend/e2e/flows.mjs` (Node, sans dépendance nouvelle) qui pilote Chrome sans
   affichage par le protocole DevTools.
2. Avant le chargement de chaque page, injecte un faux `window.ethereum` (EIP-1193) qui relaie les
   requêtes à anvil (`http://127.0.0.1:8545`). `eth_requestAccounts` et `eth_accounts` renvoient le compte
   anvil choisi ; anvil signe lui-même `eth_sendTransaction` pour ses comptes de test.
3. Prends un `evm_snapshot` au début et fais `evm_revert` à la fin, même en cas d'échec : la démo doit
   rester intacte.
4. Parcours, en vérifiant à chaque fois l'état **sur la chaîne** (pas seulement l'écran) :
   - contribuer 0,1 ETH à la campagne en collecte → `contributionOf` augmente ;
   - voter « pour » sur le déblocage ouvert → `hasVoted` vrai ;
   - avancer le temps de 1 h, exécuter la proposition → état « Exécutée » ;
   - le bénéficiaire retire la tranche → `withdrawnMilestones` augmente ;
   - un contributeur de la campagne échouée se fait rembourser → `contributionOf` nul ;
   - le porteur crée une campagne → `campaignCount` augmente.
5. Ajoute le script `"e2e": "node e2e/flows.mjs"` et documente dans le README : il faut anvil, la démo
   chargée et le serveur de dev lancés.
6. Chaque bug trouvé : corrige le code de l'interface, pas le test.

**Fini quand** les six parcours passent deux fois de suite et que la démo est revenue à son état initial.

---

## Prompt 6 — Documents et chiffres alignés

1. Cherche tous les nombres de tests écrits en dur (`grep -rn "157"` hors `lib/` et `node_modules/`) et
   mets-les à jour avec la sortie réelle de `forge test`. Régénère `docs/tests/forge-test-output.txt`.
2. `docs/SECURITE.md`, `docs/CHOIX_DE_CONCEPTION.md`, `docs/QUESTIONS_SOUTENANCE.md` : ajoute la règle
   « le porteur ne vote pas son déblocage », sa limite (seconde adresse), et les tests de bout en bout.
3. `README.md` : commande `npm run e2e` et ses prérequis.
4. Régénère `docs/captures/` à 1280 px, plus l'accueil à 375 px.

**Fini quand** aucun document ne contredit le code.

---

## Prompt 7 — Vérification finale

Relance toutes les vérifications, puis écris un récapitulatif : ce qui est fait, ce qui reste à
l'équipe, et les écarts par rapport à ces prompts.

---

## Prompts à lancer par l'équipe (décisions ou accès que l'assistant n'a pas)

### Prompt 8 — Supprimer le code que personne ne peut appeler *(décision de conception)*
Le déploiement abandonne `PARAMS_ROLE` : `setVotingPeriod`, `setProposalThreshold` et
`setQuadraticVoting` ne sont donc plus appelables, et le vote quadratique ne peut jamais être activé.
Choisis : (a) supprimer ces trois fonctions, le rôle et le mode quadratique, et rendre `votingPeriod` et
`proposalThreshold` `immutable` ; ou (b) garder le vote quadratique comme option choisie au constructeur.
Dans les deux cas : adapter les tests, `Deploy.s.sol`, le front (`quadratic`) et les documents.

### Prompt 9 — Redéployer sur Sepolia *(clés de l'équipe)*
Lance `scripts/deploy-sepolia.sh` avec le `.env` de l'équipe, vérifie les quatre contrats sur Etherscan,
`npm run sync`, remplace le tableau des adresses de `docs/RAPPORT.md` §9.3 et le statut du README, puis
calcule les scores IA avec un RPC d'archive :
`python scripts/anomaly_detection.py --rpc $SEPOLIA_RPC_URL --deployment deployments/11155111.json`.

### Prompt 10 — Compléter le rapport *(informations de l'équipe)*
Dans `docs/RAPPORT.md`, remplace les quatre `[À REMPLACER]` : noms du trinôme, encadrant, date, et le
paragraphe « ce que l'équipe a appris » (à écrire par l'équipe, pas par un assistant).
