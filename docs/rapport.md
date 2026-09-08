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
      --external-ip=192.168.1.185
      --realm=bigblue.local
      --user=${TURN_USER}:${TURN_PASSWORD}
      --lt-cred-mech
      --min-port=49152
      --max-port=49252
```

Contrairement aux autres services, coturn est configuré en `network_mode: host` : il doit accéder directement au réseau de la VM (et non au réseau isolé créé par Docker Compose) pour que la négociation WebRTC fonctionne correctement à travers le NAT. Une plage de ports UDP dédiée (`49152`–`49252`) est réservée pour le relais des flux média.

Les logs (`docker compose logs coturn`) confirment un démarrage sans erreur, avec un simple avertissement (`NO EXPLICIT RELAY ADDRESS(ES) ARE CONFIGURED`) : coturn a détecté automatiquement 5 adresses réseau disponibles (dont celles créées par Docker) et est prêt à relayer sur toutes. Ce point n'est pas bloquant à ce stade, mais pourra être affiné en Phase 1 en ajoutant explicitement `--relay-ip=192.168.1.185` si des soucis de connectivité WebRTC apparaissent lors des tests.

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

## 5. Développement — Backend

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
Test effectué depuis un navigateur sur la machine hôte, à l'adresse `http://192.168.1.185:4000/api/health` :
```json
{
  "status": "ok",
  "message": "BigBlue backend opérationnel"
}
```

Le serveur Express de base est fonctionnel. Cette route `/api/health` servira aussi de test de disponibilité (health check) pour la supervision du service une fois en production.

*(Capture d'écran : `docs/screenshots/10-backend-express-health-check.png`)*

---

## 6. Développement — Frontend
*(Structure React, composants principaux — à venir)*

---

## 7. Intégration audio/vidéo (PeerJS / WebRTC)
*(Mise en place du serveur de signaling, connexion peer-to-peer, serveur TURN coturn — à venir)*

---

## 8. Fonctionnalités temps réel
*(Chat public/privé, sondages, levée de main, notes partagées — à venir)*

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
