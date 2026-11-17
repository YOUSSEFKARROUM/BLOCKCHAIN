# Script de la démo (environ 2 min 30)

Site : https://campusfund.vercel.app (réseau Sepolia). Deux comptes MetaMask :
- **Club** : il crée la campagne et retire l'argent (bénéficiaire).
- **Étudiant** : il contribue et vote.

## À préparer la veille (avant d'entrer dans la salle)

- [ ] Les deux comptes ont un peu d'ETH Sepolia (0,05 suffit).
- [ ] Une campagne **en collecte** (pour contribuer en direct).
- [ ] Une campagne **financée** dont le vote de déblocage est **déjà terminé et adopté** (pour exécuter et retirer en direct, sans attendre 1 h).
- [ ] MetaMask déverrouillé, sur Sepolia, onglet du site déjà ouvert sur l'accueil.
- [ ] La vidéo [docs/video/campusfund-demo-sepolia.mp4](../docs/video/campusfund-demo-sepolia.mp4) ouverte dans un autre onglet (plan B).

## Le déroulé

| Temps | Ce que je fais | Ce que je dis |
|---|---|---|
| 0:00 | Accueil du site, liste des campagnes. | « Voici le site en ligne, branché sur Sepolia, le réseau de test d'Ethereum. Chaque ligne est une campagne d'un club, lue directement dans le contrat. » |
| 0:15 | Ouvrir la campagne **en collecte**. Montrer objectif, jalons, score IA. | « La campagne est découpée en jalons. L'argent ne part pas d'un coup : chaque tranche sera votée. Le score IA signale une campagne suspecte, mais il ne décide rien. » |
| 0:35 | **Compte étudiant** : saisir 0,01 ETH, « Contribuer », valider dans MetaMask. | « Je contribue comme un étudiant. MetaMask me demande de signer : c'est moi qui autorise, personne d'autre ne peut toucher à mon portefeuille. » |
| 0:55 | Transaction confirmée : montrer les CFD reçus. | « En échange, je reçois des jetons CFD. Ils me donnent un droit de vote, proportionnel à ce que j'ai donné. » |
| 1:10 | Page **Gouvernance** : montrer la proposition de déblocage, « Voter pour ». | « Le club demande la première tranche avec une preuve. Les contributeurs votent. Le club, lui, ne peut pas voter sur son propre déblocage. » |
| 1:30 | Montrer la barre Pour / Contre / quorum. | « Il faut au moins 10 % des voix pour que le vote compte. Dans la démo, le vote dure 1 heure ; en vrai, ce serait 3 à 7 jours. Je ne vais pas vous faire attendre une heure : voici une campagne dont le vote est déjà terminé. » |
| 1:45 | Ouvrir la proposition **déjà adoptée**, « Exécuter le déblocage ». | « Le vote est adopté, n'importe qui peut exécuter la décision : le contrat libère la tranche. » |
| 2:00 | **Compte club**, onglet « Créer » (ses campagnes) : « Retirer la tranche 1 », valider dans MetaMask. | « Seul le bénéficiaire peut retirer, et seulement la tranche votée. Le reste reste bloqué dans le contrat. » |
| 2:15 | Cliquer le lien Etherscan de la transaction. | « Tout est public et vérifiable : chaque contribution, chaque vote, chaque retrait. Si une campagne échoue ou est gelée, les contributeurs récupèrent leur mise. » |
| 2:30 | Retour aux diapositives (partie Sécurité). | « Voilà le cycle complet en vrai. Maintenant, comment on empêche quelqu'un de tricher ou de voler ce coffre ? » |

## Si quelque chose bloque

| Problème | Réaction (moins de 20 s) |
|---|---|
| MetaMask affiche « site malveillant » | « Continuer quand même » : c'est une fausse alerte sur les domaines `vercel.app` récents. |
| Transaction en attente trop longue | « Sepolia met parfois 15 à 30 s, c'est un réseau public. » Continuer à parler, ou passer à l'étape suivante. |
| Fonds insuffisants | Changer de compte, ou passer à la vidéo. |
| Le site ne charge pas | Lancer la vidéo de démo : « Voici la même démo enregistrée hier sur le vrai réseau. » |

**Phrase de secours :** « Pendant que la transaction se confirme, je vous montre la même étape dans la vidéo enregistrée. »
