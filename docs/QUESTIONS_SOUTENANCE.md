# 30 questions probables du jury (réponses courtes)

Chaque réponse tient en 20 à 30 secondes à l'oral. Les références renvoient au code et aux tests pour
montrer à l'écran si on vous le demande.

## Gouvernance

**1. Pourquoi un quorum de 10 % ?**
Assez haut pour qu'un petit groupe ne décide pas seul ; assez bas pour être atteignable dans une communauté
étudiante où beaucoup ne votent pas. Pour un déblocage, c'est 10 % des CFD **de la campagne** ; pour un gel,
10 % de l'offre **au snapshot** (`getPastTotalSupply`). Dans les deux cas, impossible à manipuler pendant le vote. Testé exactement à la limite :
`test_State_QuorumReachedExactly` et `testFuzz_QuorumRule`.

**2. Que se passe-t-il sans snapshot ?**
Un attaquant emprunte des millions de CFD en flash loan, vote, et rend les jetons dans la même transaction :
il décide seul. Nous le **démontrons** : `test_FlashLoan_SucceedsWithoutSnapshot` gèle une campagne honnête
avec 1 000 000 de CFD empruntés contre 10 000 votes honnêtes. Avec snapshot, le même attaquant a un poids
de 0 (`NoVotingPower`). C'est l'attaque Beanstalk (avril 2022, environ 182 M$).

**3. Pourquoi le bloc `block.number - 1` et pas `block.number` ?**
`getPastVotes` n'accepte qu'un bloc passé. Surtout, `-1` exclut les jetons obtenus dans le bloc même de la
proposition, y compris dans la même transaction (`test_FlashLoan_FailsEvenInProposalBlock`).

**4. Pourquoi faut-il déléguer pour voter ?**
Seulement pour les **gels**. Pour une tranche, on vote avec sa contribution à la campagne, sans rien faire de
plus. Pour un gel, c'est le standard ERC20Votes : l'historique des votes (checkpoints) coûte du gaz à chaque transfert, donc il
n'est tenu que pour ceux qui l'activent. Un contributeur qui ne vote jamais ne paie pas ce surcoût. On peut se
déléguer à soi-même ou à quelqu'un de confiance (procuration).

**5. Si je délègue après la création d'une proposition, je peux voter dessus ?**
Non. Le pouvoir est lu au snapshot, donc avant. C'est voulu : sinon on pourrait acheter du pouvoir après coup.
L'interface l'explique à l'utilisateur.

**6. Pourquoi « plus de pour que de contre » et pas 2/3 ?**
La majorité simple suffit pour une décision réversible par un nouveau vote. L'égalité = rejet : sans
majorité claire, on ne bouge pas l'argent. Un seuil de 2/3 rendrait les déblocages trop difficiles avec peu de
votants.

**7. Qui peut exécuter une proposition adoptée ?**
N'importe qui, et seulement après la fin du vote. Personne n'a de privilège d'exécution : si le porteur ne le
fait pas, un contributeur peut le faire.

**8. Un contributeur de la campagne A peut voter sur la campagne B. Est-ce normal ?**
Plus pour les tranches : seuls les contributeurs de B votent les déblocages de B, avec un poids égal à leur
mise (`test_ReleaseVote_RevertsForNonContributor`). Pour un **gel**, oui, c'est voulu : tout membre de la
communauté doit pouvoir signaler une fraude n'importe où, avec ses CFD délégués au snapshot.

**9. Et si personne ne vote jamais ? Les fonds sont bloqués ?**
Non, grâce à `cancelStale` : après 90 jours sans jalon approuvé, n'importe qui annule la campagne et les
contributeurs récupèrent le reste (`test_CancelStale_AfterInactivity`).

**10. À quoi sert le vote quadratique, et pourquoi est-il désactivé ?**
Le poids = √CFD, ce qui réduit l'influence des « baleines » : 4 petits porteurs battent 1 gros
(`test_Quadratic_SmallHoldersCanOutvoteWhale`). Mais il suffit de découper ses jetons sur plusieurs adresses
(attaque Sybil) pour le contourner. Il faudrait une identité unique (carte étudiante). D'où le paramètre,
désactivé par défaut et figé à la création de chaque proposition.

## Fonds et jalons

**11. Pourquoi des jalons ?**
Pour ne pas donner tout l'argent d'un coup à un porteur qui pourrait disparaître. Chaque tranche demande un
vote : la communauté vérifie la preuve (facture, vidéo) avant de payer la suite.

**12. Comment évitez-vous qu'il reste des centimes bloqués à cause des arrondis ?**
La dernière tranche verse `raised − released`, c'est-à-dire tout le reste
(`test_Withdraw_LastTrancheTakesRoundingDust`, `testFuzz_TranchesSumToRaised` sur 1000 tirages).

**13. Que reçoit un contributeur si la campagne est gelée après une tranche ?**
Sa part de ce qui reste : `contribution × (collecté − versé) / collecté`. Exemple testé : 3 ETH sur 10 déjà
versés, donc Alice (6 ETH) récupère 4,2 ETH.

**14. Pourquoi brûler les CFD au remboursement ?**
Sinon on récupérerait son argent en gardant ses droits de vote. Et l'invariant « CFD en circulation =
(contributions − remboursements) × 1000 » reste vrai.

**15. Pourquoi le taux de 1000 CFD par ETH ?**
L'ETH et le CFD ont 18 décimales, donc c'est une multiplication entière exacte, sans arrondi. Le vote reste
proportionnel à l'apport. 1000 rend les chiffres lisibles (0,1 ETH = 100 CFD).

**16. Pourquoi 2 % de frais, et pourquoi au versement ?**
Ils financent l'hébergement (IPFS, gaz de maintenance). Prélevés au versement d'une tranche, ils ne touchent
pas une campagne échouée : le contributeur récupère 100 %.

**17. Pourquoi un « pull payment » pour les remboursements ?**
Une boucle qui rembourse tout le monde peut dépasser la limite de gaz, ou être bloquée par un seul destinataire
qui refuse l'ETH (déni de service). Chacun vient chercher son dû.

## Sécurité

**18. Qu'est-ce qu'une réentrance, et comment vous protégez-vous ?**
Un contrat malveillant rappelle la fonction de retrait pendant qu'on lui envoie de l'ETH, avant la mise à jour
du solde. Notre défense : Checks-Effects-Interactions (on met à jour, puis on envoie) et `nonReentrant`. Démo :
le coffre faible perd 10 ETH, le coffre corrigé 0 (`test/attacks/Reentrancy.t.sol`). Historique : The DAO, 2016.

**19. Les deux protections ne sont-elles pas redondantes ?**
Si, volontairement : c'est la défense en profondeur. CEI protège même si on oublie le modificateur, et le
modificateur protège même si on se trompe dans l'ordre. Elles couvrent aussi la réentrance « inter-fonctions ».

**20. Le déployeur peut-il voler les fonds ?**
Non. Il renonce au rôle admin du jeton et de CampusFund au déploiement (`renounceRole`) : il ne peut plus
s'attribuer `MINTER_ROLE` ni `GOVERNANCE_ROLE`. Il garde seulement la pause (qui ne déplace aucun fonds) et les
paramètres de vote, qui sont bornés. Testé : `test_DeployWiresRolesAndRenouncesAdmin`.

**21. Pourquoi le multisig a-t-il un plafond par jour et non par transaction ?**
Avec un plafond par transaction, un propriétaire seul ferait 10 retraits de 0,99 ETH. Le plafond cumulé par
jour l'en empêche (`test_DailyLimit_BlocksSplittingAttack`).

**22. Pourquoi 2-sur-3 ?**
On tolère la perte d'une clé (les 2 autres suffisent) et on résiste au vol d'une clé (une seule ne suffit pas).

**23. Le circuit breaker bloque aussi les remboursements : n'est-ce pas dangereux ?**
C'est un compromis assumé : pendant un incident, la faille peut se trouver dans `refund`, donc on gèle tout. Le
pauseur peut *retarder*, jamais *prendre* : aucune fonction ne lui permet de déplacer des fonds.

**24. Pourquoi utiliser `block.timestamp` alors que Slither le signale ?**
Un validateur ne peut décaler l'heure que de quelques secondes, et nos durées font au moins 1 heure : sans
impact. Le snapshot, lui, utilise un numéro de bloc, là où la précision compte.

**25. Que montre Slither, et qu'en avez-vous fait ?**
18 findings au départ ; 5 corrigés (variable non initialisée, 4 héritages d'interface manquants), 13 justifiés.
Le seul finding « High » est dans `VulnerableVault`, vulnérable exprès. Détail dans `audit/TRAITEMENT_FINDINGS.md`.

## Tests, IA, technique

**26. Quelle différence entre un test unitaire, un fuzz et un invariant ?**
Unitaire : un scénario précis. Fuzz : la même propriété avec 1000 valeurs aléatoires. Invariant : une propriété
vérifiée après **n'importe quelle suite** d'actions aléatoires (256 séquences × 100 appels). Exemple : « le
contrat détient toujours au moins ce qu'il doit ».

**27. Comment savez-vous que vos invariants ne passent pas « à vide » ?**
Avec des canaris : des invariants volontairement faux (« aucune tranche n'est jamais retirée ») qui
**échouent**. C'est la preuve que le fuzzer atteint bien les votes, tranches, gels et remboursements
(`scripts/invariant-canary`).

**28. Comment marche le badge de risque IA ?**
Un script Python lit les events et calcule 5 indicateurs : montants répétés, adresses financées par la même
source, adresses neuves, pic de contributions, concentration. Il les combine à 60 % par des règles et à 40 %
par un Isolation Forest. Sur des données **simulées par notre script** (10 tirages) : rappel 0,88 sur les fraudes
connues, mais seulement 0,38 sur des fraudes déguisées (montants variés, contributions étalées, plusieurs
sources), pour une précision proche de 1. Les règles seules ou la forêt seule font nettement moins bien que la
combinaison. Aucune vraie fraude n'a servi de test. Il est indicatif :
seule la DAO peut geler.

**29. Pourquoi ne pas mettre le modèle d'IA dans le smart contract ?**
L'exécution on-chain coûte du gaz à chaque opération et doit être déterministe. Un modèle de ML y serait
hors de prix et non vérifiable. On calcule hors chaîne et on laisse la décision à la DAO.

**30. Pourquoi IPFS, et pourquoi seulement le CID on-chain ?**
Stocker un texte on-chain coûte très cher. Le CID est l'empreinte du contenu : si quelqu'un modifie la
description, le CID change et ne correspond plus à celui enregistré. On garde donc l'intégrité pour quelques
dizaines d'octets. Le JWT Pinata reste côté serveur, sinon n'importe qui pourrait le voler.

---

### Bonus : questions pièges

- **« Votre contrat est-il sûr à 100 % ? »** Non, et personne ne peut le garantir. Il est testé (159 tests,
  invariants, fuzzing), analysé (Slither) et ses limites sont documentées (SECURITE.md §8). Pour de vrais
  fonds, il faudrait un audit professionnel.
- **« Avez-vous écrit le code vous-même ? »** La logique métier (jalons, machine d'états, multisig, snapshot,
  attaques, script IA) est originale. Les briques standard (ERC20, rôles, verrou) viennent d'OpenZeppelin,
  comme le sujet l'autorise.
- **« On peut quand même acheter du pouvoir de vote ? »** Oui, *avant* une proposition (le jeton est
  transférable). Le snapshot empêche seulement l'achat *après*. Une amélioration serait un délai entre la
  création et l'ouverture du vote.

## Questions ajoutées après la revue du 15/11/2026

**31. Un porteur peut-il relancer un vote rejeté jusqu'à ce qu'il passe ?**
Pas tant qu'un vote du même type est en cours ou adopté sans être exécuté (`ProposalAlreadyOpen`). Après un
rejet, il peut proposer à nouveau : c'est un nouveau vote, avec un nouveau quorum.

**32. Que prouve la preuve d'un jalon ?**
Le contrat vérifie seulement qu'un lien ou un CID est fourni (`MissingProof` sinon). C'est aux votants de
l'ouvrir et de juger. Le front n'en fait un lien que s'il est en `https:` ou IPFS, pour éviter un lien piégé.

**33. Le déployeur garde-t-il un pouvoir ?**
Seulement `PAUSER_ROLE` : il peut mettre la plateforme en pause (y compris les remboursements) pendant un
incident, mais aucune fonction ne lui permet de prendre des fonds. Les paramètres de vote et tous les rôles
d'administration sont abandonnés au déploiement.

**34. Pourquoi la couverture des branches n'est-elle pas de 100 % ?**
Sur les 4 contrats, elle est de 97 % (75/77). Les deux branches restantes sont des refus dans un modificateur
(`exists`, `pending`) : les tests y passent, mais `forge coverage` ne les attribue pas. Le total global (85 %)
inclut les contrats de démonstration volontairement vulnérables.

## Questions ajoutées après la revue du 16/11/2026

- **« Le porteur peut-il voter le déblocage de ses propres fonds ? »** Non. S'il contribue à sa campagne, sa
  mise ne lui donne aucune voix sur ses tranches (`_votingPower` renvoie 0 pour le porteur et le
  bénéficiaire). Avant cette règle, 10 % de mise suffisaient à atteindre seul le quorum quand les autres
  s'abstenaient. Limite assumée : il peut utiliser une seconde adresse, ce qu'aucun contrat ne peut empêcher
  sans identité vérifiée ; le scanner IA signale les adresses liées.
- **« Avez-vous testé l'interface, ou seulement les contrats ? »** Les deux. `npm run e2e` pilote un vrai
  navigateur : il contribue, vote, exécute, retire, rembourse et crée une campagne en cliquant dans les
  pages, puis vérifie l'état sur la chaîne. Le portefeuille est simulé (les requêtes vont à anvil) : c'est
  MetaMask lui-même qui n'est pas automatisé.
- **« Pourquoi garder des fonctions que personne ne peut appeler ? »** `setVotingPeriod`,
  `setProposalThreshold` et `setQuadraticVoting` exigent `PARAMS_ROLE`, abandonné au déploiement. Elles
  restent pour un déploiement où ce rôle serait confié à un timelock. C'est discutable : la version la plus
  simple les supprimerait et rendrait ces paramètres `immutable`.
