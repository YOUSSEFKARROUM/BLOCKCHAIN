# Script de la démo en direct (environ 2 min 30)

Site : https://campusfund.vercel.app (réseau Sepolia). La démo vient juste après les diapositives
« Cycle d'une campagne » : on refait le même cycle, en vrai.

## Les deux comptes MetaMask

| Rôle | Compte | Ce qu'il fait en direct |
|---|---|---|
| **Étudiant** | `0x3346…93c7` | Il contribue, puis il vote. |
| **Club** | `0x0147…f3bB` | Il demande le déblocage, puis il retire la tranche. |

## Les campagnes utilisées

| Campagne | État préparé | Sert à |
|---|---|---|
| **Hackathon IA & Cybersécurité 2027** | En collecte (encore 29 jours) | Contribuer en direct. |
| **Tournoi d'échecs inter-écoles** | Financée, bénéficiaire = compte Club, aucun vote ouvert | Demander le déblocage et voter en direct. |
| **Atelier impression 3D pour tous** (la plus récente) | Financée, vote de déblocage **déjà adopté**, bénéficiaire = compte Club | Exécuter et retirer en direct, sans attendre 1 h. |
| **Atelier impression 3D pour tous** (la première des deux) | Même état | **Répétition** la veille, ou secours. |

## À vérifier 15 minutes avant

- [ ] MetaMask déverrouillé, réseau Sepolia, les deux comptes visibles.
- [ ] Le site est ouvert sur l'accueil, compte **Étudiant** connecté.
- [ ] Page Gouvernance : la proposition « Atelier impression 3D » affiche le bouton **Exécuter le déblocage**.
      Sinon, lancer `bash scripts/prepare-demo-live.sh 9 10` et lire ce qu'il répond.
- [ ] La vidéo [docs/video/campusfund-demo-sepolia.mp4](../docs/video/campusfund-demo-sepolia.mp4) est ouverte dans un autre onglet (plan B).
- [ ] Ne **pas** exécuter ni retirer « Atelier impression 3D » (la plus récente) avant la soutenance : c'est l'étape montrée en direct.

## Le déroulé

| Temps | Compte | Ce que je fais | Ce que je dis |
|---|---|---|---|
| 0:00 | Étudiant | Accueil : la liste des campagnes. | « Voici le site en ligne, branché sur Sepolia, le réseau de test d'Ethereum. Chaque ligne est une campagne d'un club, lue directement dans le contrat. » |
| 0:15 | Étudiant | Ouvrir **Hackathon IA & Cybersécurité 2027**. Montrer l'objectif, les jalons, le score IA. | « L'argent est découpé en jalons : rien ne part d'un coup. Le score IA signale une campagne suspecte, mais il ne décide rien. » |
| 0:30 | Étudiant | Saisir `0.001`, **Contribuer**, confirmer dans MetaMask. | « Je contribue comme un étudiant. MetaMask me demande de signer : personne d'autre ne peut toucher à mon portefeuille. En échange je reçois des jetons CFD, mon droit de vote. » |
| 0:55 | **Club** | Changer de compte. Onglet **Créer**, campagne **Tournoi d'échecs** : coller un lien de preuve, **Demander le déblocage du jalon 1**, confirmer. | « Maintenant je suis le club. La collecte a réussi, mais l'argent est toujours dans le contrat. Pour toucher la première tranche, je dois publier une preuve et demander un vote. » |
| 1:20 | **Étudiant** | Changer de compte. Page **Gouvernance** : la nouvelle proposition, **Voter pour**, confirmer. | « Les contributeurs votent, avec un poids égal à ce qu'ils ont donné. Le club, lui, ne peut pas voter sur son propre déblocage. » |
| 1:40 | Étudiant | Montrer les barres Pour / Contre / quorum. | « Il faut 10 % de participation. Ici le vote dure 1 heure ; en vrai, 3 à 7 jours. Je ne vous fais pas attendre : voici une campagne dont le vote s'est terminé cette nuit. » |
| 1:50 | Étudiant | Proposition **Atelier impression 3D** : **Exécuter le déblocage**, confirmer. | « Le vote est adopté. N'importe qui peut appliquer la décision : c'est le contrat qui libère la tranche, pas nous. » |
| 2:05 | **Club** | Changer de compte. Onglet **Créer**, **Atelier impression 3D** : **Retirer la tranche 1**, confirmer. | « Seul le bénéficiaire peut retirer, et seulement la tranche votée : 98 % pour le club, 2 % pour la trésorerie. Le reste reste bloqué jusqu'au prochain vote. » |
| 2:20 | Club | Ouvrir le lien Etherscan de la transaction. | « Tout est public : chaque contribution, chaque vote, chaque retrait. » |
| 2:30 | — | Retour aux diapositives (partie Sécurité). | « Voilà le cycle complet en vrai. Maintenant : comment on empêche quelqu'un de tricher ou de voler ce coffre ? » |

Lien de preuve à coller à 0:55 : `https://github.com/YOUSSEFKARROUM/BLOCKCHAIN`

## Version courte (si le temps manque : 1 min 30)

Garder seulement : contribuer (0:30), exécuter (1:50), retirer (2:05). Dire le vote à l'oral.

## Si quelque chose bloque

| Problème | Réaction (moins de 20 s) |
|---|---|
| MetaMask affiche « site malveillant » | « Continuer quand même » : fausse alerte sur les domaines `vercel.app` récents. Le dire calmement au jury. |
| Une transaction reste en attente | « Sepolia est un réseau public, un bloc toutes les 12 secondes. » Continuer à parler. |
| Le bouton attendu n'apparaît pas | Vérifier le compte connecté (c'est l'erreur la plus fréquente), puis recharger la page. |
| « Exécuter le déblocage » déjà utilisé | Prendre l'autre campagne « Atelier impression 3D » (la répétition). |
| Le site ou le réseau ne répond pas | Lancer la vidéo : « Voici la même démo, enregistrée sur le vrai réseau. » |

**Phrase de secours :** « Pendant que la transaction se confirme, je vous montre la même étape dans la vidéo enregistrée. »
