# BigBlue — Plateforme de Visioconférence
## Document de compréhension générale et cahier des charges

---

## 1. Compréhension générale du projet

### 1.1 Contexte
BigBlue est une plateforme de visioconférence de type "BigBlueButton-like", destinée à permettre à des groupes d'utilisateurs (formation en ligne, réunions, webinaires, classes virtuelles) de communiquer en audio/vidéo, de partager du contenu, et d'interagir en temps réel, avec une gestion fine des rôles (modérateur, présentateur, participant).

### 1.2 Objectifs du projet
- Offrir un outil de visioconférence complet, autonome (auto-hébergé), sans dépendance à des services tiers de streaming.
- Permettre une communication multi-canal : audio, vidéo, chat public, chat privé, notes partagées.
- Donner aux modérateurs un contrôle complet sur la session (droits, présentateurs, enregistrement, sondages).
- Garantir la persistance des données (utilisateurs, sessions, sondages, enregistrements) via une base de données relationnelle et un stockage objet pour les médias.

### 1.3 Utilisateurs cibles et rôles
| Rôle | Description | Droits principaux |
|---|---|---|
| **Modérateur (host)** | Créateur ou responsable de la session | Tous droits : gérer participants, promouvoir présentateur, lancer/arrêter enregistrement, créer sondages, gérer sondages, kick/mute, verrouiller la salle |
| **Présentateur** | Utilisateur autorisé à partager écran/contenu | Partage d'écran, gestion des notes partagées, lancement de sondages (selon droits accordés) |
| **Participant** | Utilisateur standard | Audio/vidéo, chat public, chat privé, lever la main, répondre aux sondages |

### 1.4 Périmètre fonctionnel (résumé des modules)
1. Notes partagées (édition collaborative)
2. Discussion publique (chat de salle)
3. Discussion privée (chat 1-à-1, optionnel)
4. Conférence audio/vidéo (multi-participants)
5. Partage d'écran
6. Sondages (création, réponse, résultats)
7. Modération (gestion de salle)
8. Gestion des droits (promotion/rétrogradation présentateur)
9. Enregistrement (côté serveur et côté local)
10. Levée de main
11. Base de données (persistance globale)

---

## 2. Cahier des charges détaillé

### 2.1 Module — Notes partagées
**Objectif :** permettre à plusieurs utilisateurs d'éditer un document texte en temps réel pendant la session.

- Édition collaborative en temps réel (synchronisation via WebSocket/Socket.io)
- Historique des modifications (au minimum : dernière version sauvegardée en base)
- Accès restreint : lecture pour tous, écriture pour présentateur/modérateur (configurable)
- Export possible (texte brut / PDF) — à confirmer selon besoin
- Sauvegarde automatique périodique en base de données

### 2.2 Module — Discussion publique
- Chat visible par tous les participants de la salle
- Horodatage des messages, nom de l'expéditeur
- Historique conservé pendant la session (et en base si archivage requis)
- Modération possible : suppression de message, mute chat par le modérateur

### 2.3 Module — Discussion privée (optionnel)
- Chat en tête-à-tête entre deux participants
- Isolation stricte : message visible uniquement par l'émetteur et le destinataire
- Activable/désactivable par le modérateur au niveau de la salle
- Peut être désactivé selon les politiques de la session (paramètre configurable)

### 2.4 Module — Conférence audio/vidéo
- Flux audio/vidéo multi-participants en temps réel
- Connexions pair-à-pair via **PeerJS** (WebRTC), avec signalisation via **Socket.io/WebSocket**
- Gestion des flux : activer/désactiver caméra, activer/désactiver micro
- Gestion de la qualité (adaptation selon bande passante — à définir selon les capacités de PeerJS/WebRTC)
- Support prévu pour un nombre défini de participants simultanés (limite technique à définir selon architecture : SFU/mesh)

### 2.5 Module — Partage d'écran
- Partage réservé au(x) présentateur(s) et au modérateur
- Un seul flux de partage actif à la fois (à confirmer)
- Démarrage/arrêt du partage contrôlé par son émetteur ou interrompu par le modérateur
- Diffusion du flux à tous les participants de la salle

### 2.6 Module — Sondages
- Création de sondage par le modérateur (et présentateur si autorisé) : question + choix multiples (ou réponse libre — à préciser)
- Diffusion en temps réel à tous les participants
- Réponse anonyme ou nominative (à définir)
- Affichage des résultats en temps réel ou après clôture (paramétrable)
- Historique des sondages stocké en base de données (question, options, résultats, timestamp)

### 2.7 Module — Modération (partie modérateur)
- Vue d'ensemble de tous les participants et de leur statut (micro, caméra, main levée, rôle)
- Actions : mute/unmute un participant, expulser (kick), verrouiller la salle, désactiver le chat privé
- Contrôle du droit de partage d'écran
- Contrôle de démarrage/arrêt de l'enregistrement
- Gestion des sondages (lancement, clôture)

### 2.8 Module — Gestion des droits (devenir présentateur)
- Le modérateur peut promouvoir un participant au rôle de présentateur
- Le modérateur peut révoquer ce rôle à tout moment
- Un seul présentateur actif à la fois (ou plusieurs — à clarifier selon besoin métier)
- Notification en temps réel du changement de rôle à l'ensemble des participants

### 2.9 Module — Enregistrement (serveur et local)
**Enregistrement serveur :**
- Capture côté serveur des flux audio/vidéo/partage d'écran de la session
- Stockage des fichiers d'enregistrement dans **Minio** (stockage objet compatible S3)
- Accès à l'enregistrement réservé au modérateur (et éventuellement téléchargement pour les participants selon droits)
- Métadonnées (durée, date, participants, salle) stockées en **PostgreSQL**

**Enregistrement local :**
- Capture côté client (navigateur) du flux propre à l'utilisateur (via l'API MediaRecorder ou équivalent)
- Téléchargement local du fichier sans transiter par le serveur

### 2.10 Module — Levée de main
- Bouton "lever la main" disponible pour chaque participant
- Indicateur visuel visible par le modérateur (et idéalement par tous)
- File d'attente ordonnée (ordre chronologique des mains levées)
- Le modérateur peut réinitialiser/baisser la main d'un participant

### 2.11 Module — Base de données
**PostgreSQL** — données structurées et relationnelles :
- Utilisateurs (comptes, rôles)
- Salles / sessions (métadonnées, historique)
- Participants par session (rôle, horodatage entrée/sortie)
- Sondages et réponses
- Métadonnées des enregistrements
- Logs de modération (actions du modérateur)

**Minio** — stockage objet :
- Fichiers d'enregistrement (vidéo/audio)
- Fichiers partagés éventuels (documents, exports de notes)

---

## 3. Architecture technique — Stack proposée

| Composant | Technologie | Rôle |
|---|---|---|
| Signalisation temps réel (chat, sondages, statuts, main levée) | **Socket.io** | Communication bidirectionnelle serveur-client |
| Communication média (audio/vidéo/partage écran) | **PeerJS** (WebRTC) | Connexions peer-to-peer pour les flux médias |
| Transport bas niveau alternatif/complémentaire | **WebSocket** | Canal de communication temps réel générique |
| Sécurisation des échanges | **HTTPS** | Chiffrement des communications client-serveur (obligatoire pour WebRTC) |
| Base de données relationnelle | **PostgreSQL** | Persistance des données structurées |
| Stockage objet | **Minio** | Stockage des enregistrements et fichiers volumineux |

### Points d'architecture à trancher ensemble par la suite
- Mesh vs SFU pour la conférence vidéo (impact direct sur le nombre max de participants)
- Mode de stockage des notes partagées (base de données uniquement, ou moteur type CRDT/OT pour la collaboration temps réel)
- Granularité des droits (rôles fixes vs permissions personnalisées)
- Politique de rétention des enregistrements et des chats

---

## 4. Exigences non-fonctionnelles
- **Sécurité** : authentification des utilisateurs, connexions chiffrées (HTTPS/WSS), contrôle d'accès par rôle
- **Scalabilité** : capacité à gérer plusieurs salles simultanées, dimensionnement à définir
- **Performance** : latence faible pour l'audio/vidéo et le chat
- **Fiabilité** : reconnexion automatique en cas de coupure réseau
- **Portabilité** : accessible depuis navigateur web (pas d'installation client requise)

---

## 5. Prochaine étape
Une fois ce document validé/ajusté, nous passerons à la définition de la **méthode de mise en œuvre** : découpage en lots/sprints, architecture détaillée (schéma de la base de données, schéma des flux WebRTC/Socket.io), et ordre de priorité des modules à développer.
