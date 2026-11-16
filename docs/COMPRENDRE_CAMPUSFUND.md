# Comprendre CampusFund, sans rien connaître à la blockchain

Ce document explique CampusFund à quelqu'un qui n'a jamais étudié la blockchain : ce que fait le projet,
comment l'argent circule, qui décide, et les réponses aux questions qu'on nous pose le plus souvent.

---

## 1. Le problème en une minute

Un club étudiant veut acheter du matériel pour un tournoi. Il demande de l'argent aux étudiants, aux anciens,
aux parents, à des entreprises. Aujourd'hui, deux choses peuvent mal tourner :

- **le club reçoit tout l'argent d'un coup**, et personne ne sait vraiment comment il est dépensé ;
- **si le projet est abandonné**, il est très difficile de récupérer son argent.

**L'idée de CampusFund :** l'argent n'est pas donné au club d'un coup. Il est gardé par un programme
automatique, et il est versé **par morceaux**, seulement quand ceux qui ont payé ont **voté** que le club a
tenu sa promesse.

> **Image simple :** c'est comme un **notaire automatique** qui garde l'argent et ne le libère que lorsque
> les conditions écrites à l'avance sont remplies. Sauf qu'ici, personne ne peut corrompre le notaire, et tout
> le monde peut vérifier ce qu'il fait.

---

## 2. Les cinq mots à connaître

| Mot | Explication simple |
|---|---|
| **Blockchain** | Un grand registre public, copié sur des milliers d'ordinateurs. Ce qui y est écrit ne peut plus être effacé ni modifié. Tout le monde peut le lire. |
| **Contrat intelligent** (smart contract) | Un programme placé sur la blockchain. Il applique ses règles tout seul, toujours de la même façon. Personne, même pas ses créateurs, ne peut changer les règles une fois qu'il est en place. |
| **ETH** (Ether) | La monnaie de la blockchain Ethereum. Pour la démo, nous utilisons de l'ETH de **test** (réseau Sepolia) : il est gratuit et n'a aucune valeur. |
| **Portefeuille** (MetaMask) | Une application qui garde vos clés et vous permet de signer vos opérations. Votre « adresse » (ex. `0x0147…3f3bB`) est comme un numéro de compte. |
| **Frais de réseau** (gas) | Un petit montant payé au réseau pour chaque opération qui écrit sur la blockchain. Lire est gratuit, écrire coûte un peu. |

---

## 3. Qui fait quoi

| Acteur | Rôle |
|---|---|
| **Le porteur** | La personne qui crée la campagne pour le club. |
| **Le bénéficiaire** | Le portefeuille du club, qui recevra l'argent tranche par tranche. Souvent le même que le porteur. |
| **Les contributeurs** | Ceux qui donnent de l'argent : étudiants, anciens, parents, entreprises. Ils deviennent les **votants** de cette campagne. |
| **La communauté (la DAO)** | Tous ceux qui ont des jetons de vote. Elle peut **geler** une campagne suspecte. |
| **La trésorerie** | Un coffre de la plateforme qui reçoit 2 % de chaque versement. Il appartient aux 3 membres de l'équipe, et il faut 2 signatures sur 3 pour en sortir une grosse somme. |
| **L'IA** | Un programme qui analyse les contributions et **signale** les campagnes qui ressemblent à une fraude. Elle ne décide rien. |

> **DAO** = « organisation autonome décentralisée » : un groupe qui prend ses décisions par des votes
> enregistrés sur la blockchain, au lieu d'un chef ou d'un bureau.

---

## 4. L'enchaînement complet, sur un exemple

**Exemple :** le club d'échecs veut organiser un tournoi. Il a besoin de **1 000 dirhams** (pour la démo, ce
sont de petits montants en ETH de test, mais le principe est identique).

Il découpe son projet en **2 jalons** :

| Jalon | Ce qui doit être fait | Part de l'argent | Preuve promise |
|---|---|---|---|
| 1 | Acheter les jeux et les pendules | 50 % | La facture du fournisseur |
| 2 | Organiser la remise des prix | 50 % | Les photos et la liste des gagnants |

### Étape 1 — Créer la campagne (le porteur)
Le porteur remplit le formulaire : objectif, durée de la collecte, jalons, preuves promises.
- La description est publiée sur **IPFS**, un espace de stockage partagé ; seule son « empreinte » est
  inscrite sur la blockchain (c'est moins cher et on peut vérifier que le texte n'a pas changé).
- **À quoi ça sert :** la promesse devient **publique et impossible à modifier**. Tout contributeur sait,
  avant de payer, ce que le club s'engage à prouver.

### Étape 2 — Contribuer (les contributeurs)
Une étudiante donne 100 dirhams.
- L'argent **ne va pas au club** : il reste **bloqué dans le contrat**.
- En échange, elle reçoit des **jetons de vote (CFD)** : 1 ETH donné = 1 000 CFD. Plus elle donne, plus sa
  voix compte.
- **À quoi ça sert :** celui qui finance obtient le droit de **contrôler** l'usage de son argent.

### Étape 3 — Fin de la collecte
À la date prévue, la collecte s'arrête. N'importe qui clique sur **« Clôturer la collecte »** et le contrat
constate le résultat :
- **objectif atteint** → la campagne est **« Financée »**, l'argent reste bloqué en attendant les votes ;
- **objectif manqué** → la campagne passe en **« Remboursement »** : chacun récupère 100 % de sa mise.
- **À quoi ça sert :** après la clôture, plus personne ne peut contribuer, donc les voix sont **figées** :
  personne ne peut acheter des voix au dernier moment.

### Étape 4 — Demander le déblocage du jalon 1 (le porteur)
Le club a acheté les jeux. Il clique sur **« Demander le déblocage »** et joint **la facture** (un lien).
- La preuve est **obligatoire** : sans elle, le contrat refuse la demande.
- Cela **ouvre un vote**.
- **À quoi ça sert :** **pas d'argent sans justificatif.**

### Étape 5 — Voter (les contributeurs)
L'étudiante regarde la facture et vote **« pour »** ou **« contre »**.
- Seuls les **contributeurs de cette campagne** votent, avec un poids égal à leur mise.
- Le **porteur et le bénéficiaire ne votent pas** : on ne vote pas pour se payer soi-même.

### Étape 6 — Fin du vote
Le vote dure une durée fixe. À la fin, deux règles décident :
- **quorum** : au moins **10 %** des voix de la campagne ont participé ;
- **majorité** : plus de « pour » que de « contre » (l'égalité vaut un refus).

Si les deux sont remplies, le jalon est **adopté**. Sinon, il est **rejeté** et l'argent reste bloqué.

### Étape 7 — Exécuter (n'importe qui)
Quelqu'un clique sur **« Exécuter le déblocage »** : le contrat inscrit officiellement que le jalon 1 est
approuvé.
- **À quoi ça sert :** appliquer une décision déjà prise. N'importe qui peut cliquer, il n'y a rien à
  décider de plus.

### Étape 8 — Retirer la tranche (le bénéficiaire)
Le club clique sur **« Retirer la tranche »**. Le contrat lui envoie :
- **98 %** de la tranche du jalon 1 (ici 490 dirhams) ;
- **2 %** à la trésorerie de la plateforme (10 dirhams).

Les 500 dirhams du jalon 2 **restent bloqués**. Pour les obtenir, le club recommencera à l'étape 4 avec les
photos de la remise des prix.

```
Créer → Contribuer → Clôturer → Prouver → Voter → Exécuter → Retirer
                                   └────── recommencer pour chaque jalon ──────┘
```

---

## 5. Quand les choses tournent mal

| Situation | Ce qui se passe |
|---|---|
| **L'objectif n'est pas atteint** | Chacun clique « Me faire rembourser » et récupère **100 %** de sa mise. Ses jetons de vote sont détruits. |
| **Les contributeurs votent contre** | Le jalon est refusé, l'argent reste bloqué. Le club peut présenter une meilleure preuve et redemander. |
| **Le club disparaît** | Si aucun jalon n'est approuvé pendant **90 jours**, n'importe qui peut annuler la campagne : chacun récupère ce qui n'a pas encore été versé. |
| **Une campagne paraît frauduleuse** | Un membre de la communauté propose un **gel**. Toute la communauté vote. Si le gel passe, la campagne est arrêtée et l'argent pas encore versé est rendu. |
| **Un incident technique grave** | L'équipe peut mettre la plateforme **en pause** (un coupe-circuit). Ce bouton ne permet de prendre aucun argent : il ne fait que suspendre. |

---

## 6. Questions fréquentes

### Sur le principe

**Pourquoi utiliser une blockchain et pas un simple site avec une base de données ?**
Avec un site classique, celui qui gère le serveur peut modifier les montants ou partir avec l'argent. Ici, les
règles sont dans un programme public que **personne ne peut modifier**, pas même l'équipe. On n'a pas besoin
de faire confiance à une personne : on peut vérifier.

**Qui garde l'argent pendant ce temps ?**
Personne. Il est dans le contrat, et seules les règles du contrat peuvent le faire sortir : un vote adopté
(vers le club) ou un échec / un gel (vers les contributeurs).

**Les étudiants n'ont pas beaucoup d'argent : qui contribue vraiment ?**
Les étudiants avec de petites sommes, les anciens élèves, les parents, des entreprises partenaires, l'école ou
l'association des étudiants. Le principe du financement participatif, c'est beaucoup de petites
contributions. Pour la démo, tout est en argent de test, gratuit.

### Sur les votes

**Qui peut voter ?**
- Pour **débloquer** une tranche : uniquement ceux qui ont contribué à **cette** campagne.
- Pour **geler** une campagne : toute la communauté qui possède des jetons de vote (et les a activés).

**Pourquoi le porteur ne peut-il pas voter ?**
Sinon il pourrait contribuer un peu à sa propre campagne et voter seul pour se payer. Limite connue : il
pourrait utiliser un deuxième compte ; c'est l'une des choses que l'IA cherche à repérer.

**Pourquoi la voix dépend-elle de la somme donnée ?**
Parce que c'est l'argent de chacun qui est en jeu : celui qui a mis plus risque plus. C'est le même principe
qu'une assemblée d'actionnaires.

**Et si un gros contributeur ne vote pas ?**
Personne ne l'y oblige. Mais :
- si les autres atteignent le quorum de 10 %, ils décident sans lui ;
- si le quorum n'est pas atteint, le vote est rejeté et l'argent reste bloqué.
Voter, c'est contrôler son argent ; s'abstenir, c'est laisser les autres décider ou bloquer le club.

**Quelqu'un peut-il emprunter beaucoup de jetons juste pour voter, puis les rendre ?**
Non. C'est une attaque célèbre (Beanstalk, 2022). Pour un déblocage, la voix dépend de la mise, figée à la fin
de la collecte. Pour un gel, on compte les jetons détenus **avant** l'ouverture du vote : des jetons empruntés
ensuite ne comptent pas. Notre projet rejoue cette attaque dans ses tests et montre qu'elle échoue.

### Sur les preuves

**Qui définit le type de preuve ?**
Le porteur, au moment de créer la campagne : pour chaque jalon, il écrit la preuve qu'il fournira (facture,
photos, vidéo…). C'est public avant la première contribution.

**Le programme vérifie-t-il que la facture est vraie ?**
Non, un programme ne peut pas juger un document. Il vérifie seulement qu'une preuve est fournie. **Ce sont les
contributeurs qui jugent**, en votant. Si la preuve ne correspond pas à la promesse, ils votent contre.

### Sur les durées et les chiffres

**Qui choisit les durées ?**
- **La durée de la collecte** : le porteur, entre 1 heure et 90 jours.
- **La durée d'un vote** : l'équipe, une seule fois, au lancement de la plateforme ; elle ne peut plus être
  changée. Le contrat impose entre 1 heure et 14 jours.

**Pourquoi 1 heure dans la démo ?**
Pour pouvoir montrer le cycle complet pendant la soutenance. En vrai, on viserait environ 30 jours de collecte
et 3 à 7 jours de vote.

**Comment justifier ces chiffres ?**
Ce sont des **paramètres**, choisis selon un critère : laisser à chacun le temps de s'informer et de voter,
sans bloquer l'argent trop longtemps.

| Paramètre | Valeur | Justification |
|---|---|---|
| Durée de collecte | 1 h à 90 jours | Kickstarter limite à 60 jours ; 90 jours ≈ un trimestre universitaire. |
| Durée de vote | 1 h (démo), 3 à 7 jours (réel) | Le temps de voir la preuve et de voter ; les DAO connues votent sur quelques jours. |
| Quorum | 10 % | Beaucoup de gens ne votent jamais : 50 % bloquerait tout, 1 % laisserait une personne décider. |
| Délai d'abandon | 90 jours | Le temps raisonnable pour réaliser un jalon ; au-delà, l'argent est rendu. |
| Frais | 2 % | Couvre la plateforme sans pénaliser les clubs ; prélevés seulement quand le club est payé. |

### Sur l'argent

**Qu'est-ce que le déblocage ?**
L'autorisation, obtenue par un vote, de verser la tranche d'un jalon. Les jalons se débloquent un par un, dans
l'ordre.

**Qu'est-ce que le retrait ?**
Le moment où le club **reçoit vraiment** l'argent d'un jalon débloqué : 98 % pour lui, 2 % pour la
trésorerie. Seul le bénéficiaire peut le faire.

**Qu'est-ce que la trésorerie ?**
Un coffre séparé qui reçoit les 2 % de frais. Ses 3 propriétaires (l'équipe) sont fixés au lancement. Pour
sortir plus d'1 ETH par jour, il faut **2 signatures sur 3** : un seul membre ne peut pas vider la caisse.

**Pourquoi y a-t-il des frais de réseau à chaque clic ?**
Chaque opération qui écrit sur la blockchain est traitée par le réseau, qui se fait payer un petit montant.
Sur le réseau de test, il est gratuit ; dans MetaMask, on peut baisser ce montant (« Avancé »).

### Sur l'IA

**À quoi sert le score de risque ?**
C'est un détecteur de fraude. Il donne une note de 0 à 100 à chaque campagne :
- **0 à 35, Faible** : rien de suspect ;
- **35 à 50, Moyen** : à surveiller ;
- **50 à 100, Élevé** : ressemble à une fraude.

**Que repère-t-il ?**
Des comptes neufs tous financés par la même personne, des contributions identiques au centime près, beaucoup
de contributions en quelques secondes : les signes d'un porteur qui se finance lui-même pour paraître
populaire.

**L'IA peut-elle bloquer une campagne ?**
Non. Elle **signale** ; c'est la communauté qui décide de proposer et de voter un gel. Elle est testée sur des
données simulées : elle repère 88 % des fraudes simples, mais seulement 38 % des fraudes bien déguisées. C'est
une aide, pas une preuve.

### Sur la sécurité

**L'équipe peut-elle partir avec l'argent ?**
Non. Au lancement, l'équipe a **renoncé** à ses droits d'administration : personne ne peut créer des jetons,
débloquer un jalon sans vote, ni sortir l'argent d'une campagne. Il ne lui reste qu'un bouton « pause », qui
suspend sans rien prendre.

**Le code a-t-il été vérifié ?**
Oui : 159 tests automatiques, des tests qui envoient des milliers de valeurs au hasard, une analyse par
l'outil Slither, et deux attaques réelles célèbres (The DAO en 2016, Beanstalk en 2022) rejouées et bloquées.
Le code des contrats est public et vérifié sur Etherscan.

**Pourquoi MetaMask affiche-t-il « site dangereux » ?**
C'est une fausse alerte : la détection automatique se méfie des sites récents qui demandent une connexion de
portefeuille. Le site ne peut déplacer aucun fonds sans votre signature. Un signalement de faux positif peut
être envoyé à MetaMask.

---

## 7. Les limites, à dire honnêtement

- **Une preuve peut être fausse** : le programme ne juge pas les documents, les votants si.
- **Un porteur peut utiliser plusieurs comptes** : sans identité étudiante vérifiée, aucune règle ne
  l'interdit ; l'IA peut seulement le signaler.
- **Il faut un portefeuille et de l'ETH** : c'est une barrière pour le grand public. En production, il
  faudrait permettre de payer en dirhams ou par carte, ou utiliser une monnaie stable (stablecoin).
- **La durée de vote est la même pour toutes les campagnes** : on pourrait l'adapter au montant en jeu.
- **Personne n'est obligé de voter** : si trop peu de gens votent, un club honnête peut rester bloqué.

---

## 8. Résumé en trois phrases

1. L'argent des contributeurs est **bloqué dans un programme public** que personne ne peut modifier.
2. Le club ne reçoit chaque morceau qu'après avoir **montré une preuve** et obtenu le **vote** de ceux qui ont payé.
3. Si le projet échoue, est abandonné ou est frauduleux, **l'argent non versé est rendu** aux contributeurs.
