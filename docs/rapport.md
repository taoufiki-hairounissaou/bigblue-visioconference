# Rapport de projet — BigBlue (Plateforme de Visioconférence)

## Sommaire
1. Introduction
2. Cahier des charges (résumé)
3. Mise en place de l'environnement (VM)
4. Configuration réseau et sécurité
5. Développement — Backend
6. Développement — Frontend
7. Intégration audio/vidéo (PeerJS / WebRTC)
8. Fonctionnalités temps réel
9. Base de données et stockage
10. Enregistrement
11. Tests
12. Conclusion et perspectives

---

## 1. Introduction
*(Contexte du projet, objectifs, technologies utilisées — reprendre l'essentiel du cahier des charges.)*

---

## 2. Cahier des charges (résumé)
*(Renvoyer vers docs/cahier-des-charges.md, ou en résumer les points clés ici.)*

---

## 3. Mise en place de l'environnement (VM)

### 3.1 Vérification des ressources initiales
Vérification des ressources disponibles sur la VM via les commandes `lscpu`, `free -h`, `df -h`, `lsblk`, `nproc`.

**Résultat initial :**
- CPU : 1 cœur
- RAM : 9,7 Gi
- Disque : 24,5 Go (1,9 Go libres)

*(Capture d'écran : `docs/screenshots/01-ressources-initiales.png`)*

### 3.2 Augmentation des ressources (CPU)
Passage de 1 à 2 CPU via VirtualBox (Configuration > Système > Processeur).

*(Capture d'écran : `docs/screenshots/02-config-cpu-virtualbox.png`)*

**Vérification post-modification :** `nproc` → 2 cœurs confirmés.

### 3.3 Agrandissement du disque virtuel
Commande utilisée (sur l'hôte, VM éteinte) :
```powershell
"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" modifymedium disk "C:\Users\azali\VirtualBox VMs\VMHAIROU\COURS PRINCIPAL\COURS PRINCIPAL.vdi" --resize 61440
```

*(Capture d'écran : `docs/screenshots/03-resize-disque-vboxmanage.png`)*

Résultat : disque virtuel passé de 25 Go à 60 Go.

### 3.4 Extension de la partition et du système de fichiers
```bash
sudo apt install cloud-guest-utils -y
sudo growpart /dev/sda 3
sudo resize2fs /dev/sda3
df -h
```

*(Capture d'écran : `docs/screenshots/04-growpart-resize2fs.png`)*

**Résultat final :**
```
Sys. de fichiers Taille Utilisé Dispo Uti% Monté sur
/dev/sda3           59G     21G   35G  38% /
```

La partition racine (`/dev/sda3`) est passée de 24,5 Go (1,9 Go libres) à **59 Go (35 Go libres)**, ce qui donne une marge suffisante pour l'installation de Docker, des images (Node, PostgreSQL, Minio, Nginx, coturn) et le stockage des futurs enregistrements.

**Récapitulatif des ressources finales de la VM :**
| Ressource | Avant | Après |
|---|---|---|
| CPU | 1 cœur | 2 cœurs |
| RAM | 9,7 Gi | 9,7 Gi (inchangé) |
| Disque | 24,5 Go (1,9 Go libres) | 59 Go (35 Go libres) |

---

## 4. Configuration réseau et sécurité

### 4.1 Mise en place du reverse proxy (Nginx)
Nginx est ajouté au `docker-compose.yml` comme reverse proxy. À ce stade du projet (avant l'existence du backend et du frontend), une configuration minimale est utilisée pour valider que le service fonctionne : une page de test statique répondant sur le port exposé.

```yaml
  nginx:
    image: nginx:alpine
    container_name: bigblue_nginx
    restart: unless-stopped
    ports:
      - "8082:80"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
```

Cette configuration Nginx de base sera remplacée plus tard par une vraie configuration de reverse proxy, redirigeant vers le backend Express, le frontend React, et gérant le HTTPS (certificats Let's Encrypt).

### 4.2 Conflits de ports rencontrés
Comme pour Minio (section 9.3), des conflits de ports ont été rencontrés lors de l'ajout de Nginx :
- Le port **80** était déjà occupé par un autre service sur la VM.
- Le port de repli **8080** était également indisponible.

Le port **8082** a finalement été retenu pour exposer Nginx côté hôte, sans modifier la configuration interne du conteneur (qui écoute toujours sur le port 80 en interne). Cette situation illustre à nouveau l'avantage de l'architecture en conteneurs : chaque conflit se résout par un simple remappage de port, sans affecter les autres services déjà en place sur la VM.

### 4.3 Erreur de syntaxe YAML rencontrée
Lors de l'ajout du bloc `nginx` au fichier `docker-compose.yml`, une erreur de type `did not find expected key` est apparue au démarrage. La cause identifiée grâce à `cat -A` (affichage des caractères invisibles) était une **erreur d'indentation** : la clé `nginx:` comportait un seul espace d'indentation au lieu de deux, cassant la structure hiérarchique attendue par le format YAML (très strict sur l'indentation, contrairement à d'autres formats de configuration).

*(Capture d'écran : `docs/screenshots/07-docker-compose-ps-avec-nginx.png`)*
*(Capture d'écran : `docs/screenshots/08-nginx-page-test-navigateur.png`)*

### 4.4 État des services après cette étape
```
NAME               IMAGE          SERVICE    STATUS   PORTS
bigblue_minio      minio/minio    minio      Up       0.0.0.0:9002->9000/tcp, 0.0.0.0:9003->9001/tcp
bigblue_nginx      nginx:alpine   nginx      Up       0.0.0.0:8082->80/tcp
bigblue_postgres   postgres:16    postgres   Up       0.0.0.0:5432->5432/tcp
```

### 4.5 Mise en place du serveur TURN (coturn)

WebRTC (utilisé par PeerJS pour les flux audio/vidéo) tente d'abord une connexion directe pair-à-pair entre deux navigateurs. En dehors d'un réseau local, cette connexion échoue fréquemment à cause des NAT/routeurs. Un serveur TURN sert alors de relais : il fait transiter le flux média via le serveur en dernier recours.

Configuration ajoutée au `docker-compose.yml` :
```yaml
  coturn:
    image: coturn/coturn
    container_name: bigblue_coturn
    restart: unless-stopped
    network_mode: host
    command: >
      -n
      --log-file=stdout
      --external-ip=<IP_VM>
      --realm=bigblue.local
      --user=${TURN_USER}:${TURN_PASSWORD}
      --lt-cred-mech
      --min-port=49152
      --max-port=49252
```

Contrairement aux autres services, coturn est configuré en `network_mode: host` : il doit accéder directement au réseau de la VM (et non au réseau isolé créé par Docker Compose) pour que la négociation WebRTC fonctionne correctement à travers le NAT. Une plage de ports UDP dédiée (`49152`–`49252`) est réservée pour le relais des flux média.

Les logs (`docker compose logs coturn`) confirment un démarrage sans erreur, avec un simple avertissement (`NO EXPLICIT RELAY ADDRESS(ES) ARE CONFIGURED`) : coturn a détecté automatiquement 5 adresses réseau disponibles (dont celles créées par Docker) et est prêt à relayer sur toutes. Ce point n'est pas bloquant à ce stade, mais pourra être affiné en Phase 1 en ajoutant explicitement `--relay-ip=<IP_VM>` si des soucis de connectivité WebRTC apparaissent lors des tests.

*(Capture d'écran : `docs/screenshots/09-docker-compose-ps-phase0-complete.png`)*

### 4.6 Bilan — Phase 0 terminée
Les quatre services du socle technique sont opérationnels :
| Service | Rôle | Port(s) |
|---|---|---|
| PostgreSQL | Données relationnelles | 5432 |
| Minio | Stockage objet (enregistrements) | 9002 (API) / 9003 (console) |
| Nginx | Reverse proxy | 8082 |
| coturn | Relais TURN pour WebRTC | réseau host, UDP 49152–49252 |

Cette base servira de fondation pour la Phase 1 (développement du backend Express et intégration de PeerJS/Socket.io pour l'audio/vidéo).

---

### 4.7 Fixation de l'adresse IP de la VM

Suite au changement d'IP observé en cours de développement (section 8.3, bug 2), une adresse IP statique a été configurée pour éviter toute réattribution future par DHCP.

La VM utilise NetworkManager (confirmé via `/etc/netplan/*.yaml`, qui délègue la gestion à NetworkManager plutôt que de la faire directement). La configuration a été fixée avec `nmcli` :

```bash
sudo nmcli connection modify "Connexion filaire 1" \
  ipv4.addresses <IP_FIXE_VM>/24 \
  ipv4.gateway <IP_PASSERELLE> \
  ipv4.dns "<IP_PASSERELLE>,8.8.8.8" \
  ipv4.method manual

sudo nmcli connection up "Connexion filaire 1"
```

**Remarque** : l'accès à l'interface d'administration du routeur (qui aurait permis une réservation DHCP, l'approche généralement recommandée) n'a pas été possible faute d'identifiants valides. La configuration IP statique côté VM a donc été retenue comme solution alternative, tout aussi fonctionnelle pour les besoins du projet.

Validation effectuée par redémarrage complet de la VM (`sudo reboot`) suivi d'une vérification (`hostname -I`) : l'adresse IP reste stable après redémarrage.

---

### 5.1 Initialisation du projet
Le backend est un projet Node.js séparé, dans le dossier `backend/` du dépôt :
```bash
mkdir -p backend/src
cd backend
npm init -y
```

### 5.2 Dépendances installées
```bash
npm install express socket.io peer cors dotenv
```
| Package | Rôle |
|---|---|
| `express` | Framework serveur HTTP / API REST |
| `socket.io` | Communication temps réel (chat, statuts, signaling) |
| `peer` | Serveur PeerJS pour la négociation WebRTC |
| `cors` | Autoriser les appels depuis le frontend (autre origine) |
| `dotenv` | Chargement des variables d'environnement depuis `.env` |

Un `.gitignore` propre au backend est créé pour exclure `node_modules/` (dépendances générées, ne doit jamais être versionné) et `.env` (secrets du backend, distincts de ceux d'`infra/`).

### 5.3 Serveur Express minimal (test de vie)
Un premier serveur minimal est mis en place avec une route `/api/health`, destinée à vérifier que le serveur répond correctement avant d'ajouter la logique métier :

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BigBlue backend opérationnel' });
});

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Serveur BigBlue démarré sur le port ${PORT}`);
});
```

### 5.4 Vérification
Test effectué depuis un navigateur, à l'adresse `http://<IP_VM>:4000/api/health` :
```json
{
  "status": "ok",
  "message": "BigBlue backend opérationnel"
}
```

Le serveur Express de base est fonctionnel. Cette route `/api/health` servira aussi de test de disponibilité (health check) pour la supervision du service une fois en production.

*(Capture d'écran : `docs/screenshots/10-backend-express-health-check.png`)*

## 5.5 Restructuration du backend (architecture propre)

Le code initial (tout dans un seul fichier `server.js`) a été réorganisé en une architecture modulaire, plus facile à maintenir à mesure que le projet grossit :

```
backend/src/
├── server.js          # Point d'entrée
├── app.js             # Configuration Express
├── db/                # Connexion PostgreSQL + schéma SQL
├── routes/             # Routes REST (health, rooms)
├── services/           # État des salles en mémoire (roomState)
└── sockets/             # Un fichier par fonctionnalité temps réel
    ├── room.socket.js       # Entrée/sortie de salle
    ├── chat.socket.js       # Chat public
    ├── hand.socket.js       # Levée de main
    └── moderation.socket.js # Modération et droits
```

### Nouveauté — gestion des rôles
Le premier participant à rejoindre une salle devient automatiquement **modérateur** ; les suivants sont **participants** par défaut, avec un rôle **présentateur** disponible sur promotion. Cette logique est centralisée dans `roomState.service.js`, un état en mémoire (à terme, ces informations seront aussi persistées en base pour garder un historique — tables `room_sessions` / `session_participants` déjà créées à cet effet).

### Nouveauté — modération (Phase 3, commencée en avance)
Le module `moderation.socket.js` implémente : `mute-user` / `unmute-user`, `kick-user`, `promote-presenter` / `revoke-presenter`. Chaque action vérifie que l'émetteur a bien le rôle `moderator` dans la salle avant de l'exécuter (`roomState.isModerator(...)`) — toute tentative par un utilisateur non autorisé est silencieusement ignorée.

## 9.5 Persistance en base de données — mise en place

Un schéma SQL complet (`src/db/schema.sql`) a été créé et exécuté sur PostgreSQL, avec 9 tables couvrant l'ensemble des modules du cahier des charges : `users`, `rooms`, `room_sessions`, `session_participants`, `polls`, `poll_options`, `poll_votes`, `recordings`, `moderation_logs`.

Le backend se connecte à PostgreSQL via un pool de connexions (`pg`), avec une route de vérification dédiée `/api/health/db` qui confirme que l'application (pas seulement la base) peut effectivement communiquer avec PostgreSQL.

### Bug rencontré et corrigé — caractère spécial dans le mot de passe
La route `/api/health/db` renvoyait une erreur `Invalid URL`. Cause identifiée : le mot de passe PostgreSQL contenait un caractère `/`, qui casse le format d'une URL de connexion (`postgresql://user:motdepasse@host:port/db`), car ce caractère y a une signification particulière (séparateur de chemin). Le mot de passe a été changé (à la fois côté PostgreSQL et dans les fichiers `.env` concernés) pour un mot de passe sans caractères spéciaux ambigus. **Bonne pratique retenue** : éviter `/ @ : # %` dans tout mot de passe destiné à être inséré dans une URL de connexion.

*(Capture d'écran : `docs/screenshots/14-schema-sql-9-tables-creees.png`)*
*(Capture d'écran : `docs/screenshots/15-api-health-db-connectee.png`)*

## Validation de la modération (test manuel)

En l'absence pour l'instant de boutons dédiés dans l'interface de test, la modération a été validée directement via la console du navigateur, en simulant deux utilisateurs dans la même salle (un modérateur, un participant) :

```
Tentative mute-user par [participant] sur [modérateur] — autorisé : false
Tentative mute-user par [modérateur] sur [participant] — autorisé : true
```

Ce test confirme que seul le modérateur peut effectuer des actions de modération, et que toute tentative par un participant standard est correctement rejetée.

*(Capture d'écran : `docs/screenshots/16-test-moderation-console-terminal.png`)*

---

## 6. Développement — Frontend

### 6.1 Décision de bascule
Jusqu'ici, les fonctionnalités backend étaient validées via une page de test HTML brute (`backend/public/index.html`), sans aucun souci d'interface ni d'expérience utilisateur. Une fois les mécaniques de base solides (connexion, rôles, chat, levée de main, modération), le choix a été fait de basculer sur le vrai frontend, plutôt que de continuer à accumuler des fonctionnalités côté backend sans interface : un produit qui prend forme visuellement est plus facile à évaluer et à faire évoluer.

### 6.2 Stack et structure
Frontend construit avec **React** (via **Vite**), dans un dossier `frontend/` séparé du backend :
```
frontend/src/
├── App.jsx                    # Bascule accueil / salle
├── api/socket.js              # Client Socket.io
├── hooks/useRoom.js           # Logique centrale : Socket.io + PeerJS + état de la salle
├── components/
│   ├── JoinScreen.jsx         # Écran d'accueil
│   ├── RoomScreen.jsx         # Écran de salle
│   ├── VideoGrid.jsx / VideoTile.jsx
│   ├── SidePanel.jsx          # Panneau à onglets Participants/Chat
│   ├── ParticipantsList.jsx   # Liste + actions de modération
│   ├── ChatPanel.jsx
│   └── ControlBar.jsx         # Micro / caméra / main levée
└── styles/                    # Un fichier CSS par zone
```

Toute la logique de connexion (rejoindre une salle, écouter les événements Socket.io, gérer les appels PeerJS) est centralisée dans un unique hook réutilisable, `useRoom.js`, ce qui garde les composants d'affichage simples.

### 6.3 Identité visuelle
Palette sombre dédiée (fond quasi-noir `#14171C`, panneaux ardoise, accent sarcelle `#00C2A8` pour les états actifs/en direct, accent ambre `#F5A623` pour les alertes et la main levée), typographies Space Grotesk (titres) et IBM Plex Sans (contenu) — un choix délibéré plutôt qu'un style par défaut.

### 6.4 Bug corrigé — PeerJS se connectait au service cloud public
Au premier test, le frontend affichait "Impossible d'établir la connexion audio/vidéo" et aucun participant n'apparaissait dans la liste. La console révélait des requêtes vers `0.peerjs.com` (le service cloud public de PeerJS) au lieu du backend local. Cause : le client PeerJS avait été initialisé avec seulement l'option `path`, sans préciser `host` et `port` — sans ces informations, PeerJS utilise ses valeurs par défaut (le service cloud). Correction :
```javascript
const peer = new Peer(undefined, {
  host: window.location.hostname,
  port: window.location.port,
  path: '/peerjs'
});
```

### 6.5 Fonctionnement en développement — deux serveurs distincts
Le frontend (Vite, port `5173`) et le backend (Express, port `4000`) sont deux processus séparés, chacun nécessitant sa propre session terminal active. Un oubli fréquent en cours de test (backend arrêté suite à la fermeture d'une session SSH) provoquait des erreurs `ECONNREFUSED` côté Vite — résolu simplement en relançant le backend. Un proxy Vite (`vite.config.js`) redirige les requêtes `/socket.io`, `/peerjs` et `/api` vers le backend, évitant les soucis de CORS en développement.

### 6.6 Validation
Test effectué avec deux onglets simultanés sur `http://<IP_VM>:5173`, salle `test1` :
- Les deux participants apparaissent dans le panneau, avec les rôles corrects (premier arrivant = Modérateur, second = Participant)
- Les boutons de modération (Mute, Présentateur, Expulser) n'apparaissent que pour le modérateur, et uniquement à côté des autres participants (pas de bouton sur soi-même)
- La levée de main met à jour l'indicateur visuel dans la liste et active visuellement le bouton de contrôle correspondant
- Chat et levée de main fonctionnent en temps réel entre les deux onglets

Comme pour la page de test précédente, la vidéo réelle (caméra) reste bloquée par la restriction `getUserMedia` en HTTP — les tuiles vidéo affichent un espace réservé avec les initiales de chaque participant en son absence, plutôt que de casser l'affichage.

*(Capture d'écran : `docs/screenshots/17-frontend-ecran-accueil.png`)*
*(Capture d'écran : `docs/screenshots/18-frontend-salle-deux-participants.png`)*

---

## 7. Intégration audio/vidéo (PeerJS / WebRTC)

### 7.1 Intégration côté serveur
Socket.io et le serveur PeerJS (`ExpressPeerServer`) ont été ajoutés au serveur Express existant :
- **Socket.io** gère l'entrée/sortie des utilisateurs dans une salle (`join-room`) et notifie les autres participants (`user-connected` / `user-disconnected`).
- **PeerJS server** gère la négociation WebRTC entre les navigateurs.

### 7.2 Page de test minimale
Une page HTML statique (`backend/public/index.html`) a été créée pour valider la mécanique audio/vidéo indépendamment du frontend React définitif : capture du flux caméra/micro local (`getUserMedia`), connexion à une salle fixe, et appel PeerJS vers les autres participants connectés.

### 7.3 Bug corrigé — chemin PeerJS dupliqué
Lors du premier test, une erreur 404 est apparue sur l'URL `/peerjs/peerjs/...` : le chemin était compté deux fois, car l'option `path: '/peerjs'` était définie à la fois dans la configuration du serveur PeerJS et dans le montage Express (`app.use('/peerjs', ...)`). Correction : suppression de l'option `path` du côté serveur PeerJS, le préfixe étant déjà géré par `app.use`.

### 7.4 Points en suspens — dépendants de la mise en place HTTPS
Deux comportements ont été observés lors du premier test, en HTTP (pas encore HTTPS) :
- **`getUserMedia` indisponible** : les navigateurs modernes désactivent l'accès caméra/micro sur une origine non sécurisée (HTTP) dès qu'on n'est pas sur `localhost`. Un contournement temporaire existe pour le test (flag Chrome `unsafely-treat-insecure-origin-as-secure`), mais la résolution définitive viendra de la mise en place de HTTPS (prévue avec Nginx + Let's Encrypt).
- **Erreur WebSocket `Invalid frame header`** lors de l'upgrade de connexion Socket.io : cause probable liée à une interception du trafic par un logiciel tiers (antivirus avec inspection web, extension de navigateur) sur la machine de test. À revalider une fois HTTPS en place (le trafic WSS chiffré est généralement moins sujet à ce type d'interception).

**Décision prise** : reporter la validation complète du flux audio/vidéo entre deux navigateurs à la mise en place de HTTPS, plutôt que de bloquer l'avancement du projet sur ce point. Le développement des modules suivants (chat, levée de main) peut se poursuivre en parallèle, car ils ne dépendent pas de `getUserMedia`.

---

## Fonctionnalité — Sondages

### Backend
Un nouveau service `pollState.service.js` gère l'état des sondages en mémoire (un sondage actif par salle). Trois événements Socket.io (`poll.socket.js`) : `create-poll` (réservé au modérateur ou présentateur), `vote-poll` (un seul vote par utilisateur, remplace le précédent en cas de changement d'avis), `close-poll` (réservé au modérateur). Le sondage en cours est aussi envoyé automatiquement à tout nouvel arrivant dans la salle, pour qu'il ne rate pas un sondage déjà lancé.

### Frontend
Nouveau composant `PollPanel.jsx`, intégré comme troisième onglet du panneau latéral (aux côtés de Participants et Chat). Affiche un formulaire de création (question + options dynamiques) si l'utilisateur a les droits, sinon les résultats en temps réel sous forme de barres de progression proportionnelles aux votes.

### Validation
Testé avec 3 participants simultanés : création du sondage par le modérateur, apparition instantanée chez les deux autres participants, votes comptabilisés et pourcentages mis à jour en temps réel dans tous les onglets sans rechargement de page.

**Point identifié pour amélioration future** : le rôle d'un participant (modérateur/présentateur) est actuellement lié à sa connexion PeerJS en cours, et est donc perdu en cas de rechargement de page. Une vraie gestion de comptes/sessions persistées en base de données (prévue dans le schéma SQL) résoudrait ce point.

*(Capture d'écran : `docs/screenshots/19-sondage-creation.png`)*
*(Capture d'écran : `docs/screenshots/20-sondage-votes-temps-reel.png`)*

---

## Fonctionnalité — Notes partagées

### Backend
Service `noteState.service.js` : une note texte par salle, en mémoire. Un seul événement Socket.io (`update-note`), réservé au modérateur ou présentateur (même vérification de rôle que pour les sondages). La note existante est envoyée automatiquement à qui rejoint la salle, comme pour le sondage en cours.

### Frontend
Nouveau composant `NotesPanel.jsx`, quatrième onglet du panneau latéral. Utilise un `<textarea>` : modifiable pour le modérateur/présentateur, en lecture seule (avec message explicite) pour les autres participants.

### Bug rencontré et corrigé
Une erreur `Uncaught SyntaxError: Unexpected identifier 'updateNote'` est apparue après l'ajout du nouveau champ dans l'objet retourné par `useRoom.js`. Cause : une virgule manquante entre deux propriétés de l'objet `return { ... }` — une erreur de syntaxe JavaScript classique lors de l'ajout d'un nouveau champ dans un objet existant. Corrigée en ajoutant la virgule manquante.

### Validation
Testé avec 2 participants : le modérateur écrit dans le champ, le texte apparaît **en temps réel** (sans rechargement) chez le participant, qui ne peut pas le modifier (champ en lecture seule, message explicite affiché).

*(Capture d'écran : `docs/screenshots/21-notes-cote-moderateur.png`)*
*(Capture d'écran : `docs/screenshots/22-notes-cote-participant-lecture-seule.png`)*

---

## Fonctionnalité — Discussion privée

### Backend
Nouveau module `privateChat.socket.js` : un événement `send-private-message` prenant un expéditeur, un destinataire et un message. Le message est envoyé à la fois au destinataire (via son `socketId`, retrouvé dans l'état de la salle) et à l'expéditeur lui-même, pour que sa propre interface se mette à jour immédiatement.

### Frontend
Nouveau composant `PrivateChatPanel.jsx`, onglet "Privé" du panneau latéral. Affiche la liste des autres participants sous forme de contacts cliquables ; sélectionner un contact ouvre une conversation filtrée (uniquement les messages échangés entre l'utilisateur courant et ce contact précis), avec son propre champ de saisie.

### Validation
Testé avec 3 participants simultanés : un message envoyé du modérateur vers un participant précis apparaît dans les deux comptes concernés uniquement — le troisième participant (non destinataire) ne voit rien dans sa messagerie privée. Confirmé également que le message n'apparaît à aucun moment dans le chat public, garantissant l'isolation attendue entre les deux canaux.

*(Capture d'écran : `docs/screenshots/23-message-prive-envoye.png`)*
*(Capture d'écran : `docs/screenshots/24-message-prive-recu.png`)*

---

### 8.1 Chat public
Ajout côté serveur d'un événement Socket.io `send-message`, diffusé à toute la salle via `io.to(roomId).emit('receive-message', ...)`. Côté client (page de test), un champ de saisie et une zone d'affichage des messages ont été ajoutés.

### 8.2 Levée de main
Ajout de deux événements symétriques `raise-hand` / `lower-hand`, diffusés aux autres participants de la salle (`socket.to(roomId).emit(...)`, l'émetteur n'a pas besoin de se notifier lui-même).

### 8.3 Bugs rencontrés et corrigés

**Bug 1 — Portée de variable (`socket is not defined`)**
Lors du premier ajout du code, les gestionnaires d'événements `send-message`, `raise-hand` et `lower-hand` avaient été placés par erreur **en dehors** du bloc `io.on('connection', (socket) => { ... })`, rendant la variable `socket` inaccessible. Correction : déplacement de ces gestionnaires à l'intérieur du bloc `connection`.

**Bug 2 — Adresse IP de la VM changée (DHCP)**
En cours de test, l'adresse IP de la VM a changé suite à un redémarrage (attribution dynamique par DHCP). Cela a nécessité la mise à jour de la configuration `coturn` (`--external-ip`) et des URLs de test. Ce point souligne la nécessité, avant un déploiement plus avancé, de réserver une adresse IP fixe pour la VM (réservation DHCP au niveau du routeur, ou configuration réseau statique — solution finalement retenue, voir section 4.7).

**Bug 3 — Erreur JavaScript bloquant tout le script**
Le code de test appelait `navigator.mediaDevices.getUserMedia(...)` sans vérifier au préalable que `navigator.mediaDevices` existe. En HTTP (hors `localhost`), cet objet est `undefined`, ce qui provoquait une erreur JavaScript **synchrone** interrompant l'exécution du reste du script — empêchant notamment l'émission de l'événement `join-room`, et donc bloquant entièrement le chat et la levée de main, alors que ces fonctionnalités n'ont pourtant aucun lien avec la caméra. Correction : ajout d'une vérification (`if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)`) avant l'appel, et réorganisation du code pour que `join-room` soit émis indépendamment de la disponibilité de la caméra.

Cette erreur illustre un principe important à retenir pour la suite du développement : une fonctionnalité non critique (ici la vidéo) ne doit jamais pouvoir bloquer le fonctionnement d'une fonctionnalité indépendante (ici le chat).

### 8.4 Résultat du test
Test effectué avec deux onglets simultanés sur `http://<IP_VM>:4000` :
- Envoi de messages : reçus instantanément dans l'autre onglet, avec identifiant de l'expéditeur.
- Les logs serveur confirment la connexion et l'entrée en salle de chaque client (`Nouvel utilisateur connecté`, `a rejoint la salle salle-test-bigblue`).

*(Capture d'écran : `docs/screenshots/11-chat-public-onglet-1.png`)*
*(Capture d'écran : `docs/screenshots/12-chat-public-onglet-2.png`)*
*(Capture d'écran : `docs/screenshots/13-logs-serveur-connexions.png`)*

Le chat public et la levée de main sont validés et fonctionnels. Le partage d'écran et la discussion privée pourront suivre le même schéma (Socket.io) lors de la Phase 3.

---

## 9. Base de données et stockage

### 9.1 Choix technique
PostgreSQL est utilisé pour toutes les données structurées et relationnelles du projet (utilisateurs, salles, sessions, sondages, métadonnées des enregistrements). Minio est utilisé comme stockage objet (compatible S3) pour les fichiers volumineux, en particulier les enregistrements vidéo/audio des sessions.

Ces deux services sont déployés via **Docker Compose**, ce qui permet de les isoler complètement du reste du système et de garder une configuration reproductible et versionnée (le fichier `docker-compose.yml` est dans le dépôt Git, les mots de passe restent dans un fichier `.env` non versionné).

### 9.2 Configuration
Le fichier `infra/docker-compose.yml` définit deux services :
- `postgres` (image officielle `postgres:16`), exposé sur le port `5432`, avec un volume Docker dédié (`postgres_data`) pour la persistance des données même en cas de redémarrage du conteneur.
- `minio` (image officielle `minio/minio`), avec un volume dédié (`minio_data`).

Les identifiants (utilisateur, mot de passe, nom de base) sont injectés via des variables d'environnement définies dans un fichier `.env` séparé, non commité sur GitHub (protégé par `.gitignore`), pour éviter d'exposer les secrets publiquement.

### 9.3 Conflit de port rencontré
Lors du premier démarrage, un conflit est apparu sur le port 9000 : une instance de Minio installée nativement sur la VM (dans le cadre d'un exercice précédent) occupait déjà ce port. Plutôt que de supprimer cette installation existante, le choix a été fait de **remapper les ports côté hôte** pour le conteneur Docker du projet, afin d'isoler complètement l'environnement BigBlue :
- API Minio (projet) : port **9002** (au lieu de 9000)
- Console web Minio (projet) : port **9003** (au lieu de 9001)

Cela illustre l'intérêt de Docker : chaque service reste isolé, et un conflit de port se résout simplement en changeant le mapping, sans toucher à la configuration interne du conteneur ni à l'installation existante.

*(Capture d'écran : `docs/screenshots/05-docker-compose-ps-postgres-minio.png`)*

### 9.4 Vérification
```
NAME               IMAGE         SERVICE    STATUS          PORTS
bigblue_minio      minio/minio   minio      Up              0.0.0.0:9002->9000/tcp, 0.0.0.0:9003->9001/tcp
bigblue_postgres   postgres:16   postgres   Up              0.0.0.0:5432->5432/tcp
```
Les deux conteneurs sont opérationnels. L'accès à la console web Minio (`http://<IP_VM>:9003`) confirme le bon fonctionnement du service de stockage.

---

## 10. Enregistrement
*(Enregistrement serveur et local, stockage dans Minio — à venir)*

---

## 11. Tests
*(Tests fonctionnels, tests de charge — à venir)*

---

## 12. Conclusion et perspectives
*(Bilan, difficultés rencontrées, améliorations possibles — à venir)*
