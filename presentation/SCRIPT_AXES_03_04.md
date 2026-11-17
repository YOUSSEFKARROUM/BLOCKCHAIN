# Mon script : axes 03 et 04

Durée : environ 1 min 30 pour le cycle, 2 min 30 pour la démo.

---

## 1. Avant de commencer

### Trois points à connaître

1. **Ne pas toucher à la campagne n° 10 avant la soutenance** (ni exécuter, ni retirer).
   C'est la plus récente des deux « Atelier impression 3D pour tous ». Pour répéter, utiliser la n° 9 (la première des deux).
2. **Les noms des deux campagnes s'affichent maintenant correctement sur le site** (vérifié après le redéploiement de Vercel).
3. **Accents de la n° 9** : le fichier publié sur IPFS a des accents cassés (erreur d'encodage à l'envoi).
   Le site affiche le texte corrigé depuis son cache, mais le fichier IPFS lui-même reste abîmé. La n° 10 est propre : c'est elle qu'on montre au jury.

### Les deux comptes MetaMask

| Rôle | Compte | Ce qu'il fait |
|---|---|---|
| **Étudiant** | `0x3346…93c7` | Il contribue, puis il vote. |
| **Club** | `0x0147…f3bB` | Il demande le déblocage, puis il retire la tranche. |

### À vérifier 15 minutes avant

- [ ] MetaMask déverrouillé, réseau Sepolia, les deux comptes visibles.
- [ ] Site ouvert sur l'accueil, compte **Étudiant** connecté.
- [ ] Page Gouvernance : « Atelier impression 3D » affiche le bouton **Exécuter le déblocage**.
      Sinon : `bash scripts/prepare-demo-live.sh 9 10` (au moins 1 h 10 avant).
- [ ] Vidéo de secours ouverte dans un autre onglet : `docs/video/campusfund-demo-sepolia.mp4`.

---

## 2. Axe 03 · Le cycle d'une campagne

### Diapositive « Le cycle (1/2) »

> « Prenons un exemple : le club d'échecs veut organiser un tournoi.
>
> **Un** : le club crée la campagne et découpe l'argent en jalons.
>
> **Deux** : les étudiants contribuent. L'argent ne va pas au club, il reste bloqué dans le contrat. En échange, chacun reçoit des jetons : ce sont ses voix.
>
> **Trois** : à la date prévue, la collecte se ferme. Objectif atteint : la campagne est financée. Sinon : tout le monde est remboursé. »

### Diapositive « Le cycle (2/2) »

> « **Quatre** : le club a acheté le matériel. Il demande la première tranche, avec la facture comme preuve.
>
> **Cinq** : les contributeurs votent. Le club ne vote pas pour lui-même.
>
> **Six** : si le vote est adopté, le contrat libère la tranche.
>
> **Sept** : le club retire son argent : 490 dirhams pour lui, 10 pour la trésorerie. Le reste attend le prochain vote. »

### Diapositive « Quand ça tourne mal »

> « Et si ça se passe mal ? Objectif manqué, projet abandonné, ou fraude : dans les trois cas, l'argent non versé revient aux contributeurs.
>
> Passons à la pratique : je vous montre ce cycle en vrai. »

---

## 3. Axe 04 · La démonstration

### Diapositive « DEMO »

> « Voici notre site, en ligne sur le réseau de test Sepolia. »

### Sur le site

| # | Compte | Je fais | Je dis |
|---|---|---|---|
| 1 | Étudiant | J'ouvre **Hackathon IA & Cybersécurité 2027**, je saisis `0.001`, **Contribuer**. | « Je contribue comme un étudiant. Je signe avec MetaMask, et je reçois mes voix. » |
| 2 | **Club** | Onglet **Créer**, **Tournoi d'échecs** : je colle la preuve, **Demander le déblocage du jalon 1**. | « Maintenant je suis le club. Pour toucher l'argent, je dois donner une preuve et demander un vote. » |
| 3 | **Étudiant** | Page **Gouvernance** : **Voter pour**. | « Les contributeurs votent. Le vote dure 1 heure, je ne vous fais pas attendre : voici un vote déjà terminé. » |
| 4 | Étudiant | **Atelier impression 3D** (n° 10) : **Exécuter le déblocage**. | « Le vote est adopté : c'est le contrat qui libère la tranche, pas nous. » |
| 5 | **Club** | Onglet **Créer**, **Atelier impression 3D** : **Retirer la tranche 1**. | « Seul le club peut retirer, et seulement la tranche votée. » |

Preuve à coller à l'étape 2 : `https://github.com/YOUSSEFKARROUM/BLOCKCHAIN`

### Phrase de fin (vers l'axe 05, Sécurité)

> « Voilà le cycle complet, en vrai. Maintenant : comment empêcher quelqu'un de tricher ? »

---

## 4. Si quelque chose bloque

| Problème | Réaction |
|---|---|
| MetaMask affiche « site malveillant » | « Continuer quand même » : fausse alerte sur les domaines `vercel.app` récents. |
| Une transaction reste en attente | « Sepolia est un réseau public, un bloc toutes les 12 secondes. » Continuer à parler. |
| Le bouton attendu n'apparaît pas | Vérifier le compte connecté, puis recharger la page. |
| « Exécuter le déblocage » déjà utilisé | Prendre l'autre « Atelier impression 3D » (la n° 9). |
| Le site ne répond pas | Lancer la vidéo : « Voici la même démo, enregistrée sur le vrai réseau. » |

Version détaillée et minutée de la démo : [SCRIPT_DEMO.md](SCRIPT_DEMO.md).
