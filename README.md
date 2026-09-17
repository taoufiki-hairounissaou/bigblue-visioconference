# BigBlue — Plateforme de Visioconférence

Projet de plateforme de visioconférence auto-hébergée (type BigBlueButton), développé avec Node.js/Express (backend), React (frontend), PeerJS/Socket.io (temps réel), PostgreSQL (données) et Minio (stockage des enregistrements).

## Fonctionnalités
- Authentification (inscription / connexion)
- Notes partagées
- Discussion publique / privée
- Conférence audio/vidéo (WebRTC via PeerJS)
- Partage d'écran
- Sondages en temps réel
- Modération et gestion des droits (présentateur)
- Enregistrement (local et serveur, stockage Minio)
- Levée de main

## Stack technique
| Composant | Technologie |
|---|---|
| Backend | Node.js + Express |
| Frontend | React (Vite) |
| Temps réel | Socket.io / WebSocket |
| Audio/Vidéo | PeerJS (WebRTC) + coturn (TURN) |
| Base de données | PostgreSQL |
| Stockage objet | Minio |
| Authentification | JWT + bcrypt |
| Sécurité | HTTPS (certificat auto-signé en développement) |

## Documentation
- [Cahier des charges](docs/cahier-des-charges.md)
- [Plan de mise en œuvre](docs/plan-mise-en-oeuvre.md)
- [Rapport de projet complet](docs/rapport.md) — démarche détaillée, bugs rencontrés et corrigés, captures d'écran de chaque étape

---

## Guide d'installation — reproduire l'environnement

Ce guide permet de faire tourner le projet sur une machine (VM Linux recommandée, type Ubuntu Server, ou machine de développement avec Docker).

### Prérequis
- Docker et Docker Compose (v2, commande `docker compose`)
- Node.js 20+ et npm
- `git`
- `openssl` (généralement déjà installé sur Linux)
- `psql` (client PostgreSQL) : `sudo apt install postgresql-client`

### 1. Cloner le dépôt
```bash
git clone https://github.com/taoufiki-hairounissaou/bigblue-visioconference.git
cd bigblue-visioconference
```

### 2. Lancer le socle technique (PostgreSQL, Minio, Nginx, coturn)
```bash
cd infra
```
Crée le fichier `.env` (non fourni dans le dépôt pour des raisons de sécurité) :
```bash
cat > .env << 'EOF'
POSTGRES_USER=bigblue_admin
POSTGRES_PASSWORD=choisis_un_mot_de_passe
POSTGRES_DB=bigblue_db

MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=choisis_un_mot_de_passe

TURN_USER=bigblue_turn
TURN_PASSWORD=choisis_un_mot_de_passe
EOF
```
Puis lance les services :
```bash
docker compose up -d
docker compose ps
```
Les 4 conteneurs (`postgres`, `minio`, `nginx`, `coturn`) doivent apparaître avec le statut `Up`.

> Si les ports 5432, 9000/9001 ou 80 sont déjà utilisés sur ta machine, adapte le mapping de ports dans `infra/docker-compose.yml` (voir `docs/rapport.md`, section 9.3 et 4.2, pour des exemples de résolution de conflit rencontrés pendant le développement).

### 3. Installer et configurer le backend
```bash
cd ../backend
npm install
```
Crée le fichier `.env` :
```bash
cat > .env << 'EOF'
PORT=4000
DATABASE_URL=postgresql://bigblue_admin:MEME_MOT_DE_PASSE_QUE_INFRA@localhost:5432/bigblue_db
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=MEME_MOT_DE_PASSE_QUE_INFRA
JWT_SECRET=une-longue-chaine-aleatoire-a-toi
EOF
```
(remplace les mots de passe par ceux choisis à l'étape 2 — génère une valeur pour `JWT_SECRET` avec `openssl rand -hex 32`)

Initialise les tables de la base de données :
```bash
psql -h localhost -p 5432 -U bigblue_admin -d bigblue_db -f src/db/schema.sql
psql -h localhost -p 5432 -U bigblue_admin -d bigblue_db -f migration_add_password.sql
```

Lance le backend :
```bash
npm start
```
Le serveur démarre sur `http://localhost:4000`. Vérifie avec :
```
http://localhost:4000/api/health
http://localhost:4000/api/health/db
```

### 4. Installer et configurer le frontend
Dans un **second terminal** (le backend doit continuer de tourner) :
```bash
cd frontend
npm install
```
Crée le fichier `.env` :
```bash
echo "VITE_BACKEND_URL=http://localhost:4000" > .env
```

Génère un certificat HTTPS auto-signé (nécessaire pour tester la caméra/micro/partage d'écran, bloqués par les navigateurs en HTTP) :
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

Lance le frontend :
```bash
npm run dev
```
L'interface est accessible sur `https://localhost:5173` (accepter l'avertissement de sécurité du navigateur, normal avec un certificat auto-signé).

### 5. Tester
1. Ouvre `https://localhost:5173`, crée un compte, connecte-toi.
2. Entre un nom de salle, autorise la caméra/micro si demandé.
3. Ouvre un **deuxième onglet/navigateur** en navigation privée, crée un second compte, rejoins la **même salle**.
4. Teste : chat, levée de main, sondage, notes partagées, messagerie privée, modération (le premier arrivé est modérateur), partage d'écran, enregistrement.

### Dépannage
- **Le port 5432/9000/80 est déjà utilisé** → adapte le mapping dans `infra/docker-compose.yml`.
- **`getUserMedia`/caméra ne fonctionne pas** → vérifie que l'URL commence bien par `https://`, et que les permissions caméra/micro du navigateur sont autorisées pour le site.
- **Erreur de connexion à la base de données** → vérifie que `DATABASE_URL` dans `backend/.env` utilise le même mot de passe que `POSTGRES_PASSWORD` dans `infra/.env`.
- Pour toute autre erreur rencontrée pendant le développement (avec sa solution), voir `docs/rapport.md`, qui documente chaque bug corrigé au fil du projet.

## Déploiement
Le projet a été développé et testé sur une machine virtuelle (VirtualBox, Ubuntu), avec IP fixe configurée localement. Voir `docs/rapport.md` pour le détail complet des étapes de déploiement.
