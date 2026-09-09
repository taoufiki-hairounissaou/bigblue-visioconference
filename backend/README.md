# BigBlue — Backend

## Structure du projet

```
backend/
├── src/
│   ├── server.js                 # Point d'entrée : HTTP + Socket.io + PeerJS
│   ├── app.js                    # Configuration Express (middlewares, routes)
│   ├── config/                   # (réservé pour config future : auth, etc.)
│   ├── db/
│   │   ├── pool.js               # Connexion PostgreSQL (pg Pool)
│   │   └── schema.sql            # Schéma SQL des tables du projet
│   ├── routes/
│   │   ├── health.routes.js      # GET /api/health, GET /api/health/db
│   │   └── rooms.routes.js       # GET /api/rooms/:roomId/participants
│   ├── services/
│   │   └── roomState.service.js  # État en mémoire des salles (participants, rôles)
│   └── sockets/
│       ├── index.js              # Enregistre tous les modules socket sur chaque connexion
│       ├── room.socket.js        # join-room, disconnect, liste des participants
│       ├── chat.socket.js        # send-message / receive-message
│       ├── hand.socket.js        # raise-hand / lower-hand
│       └── moderation.socket.js  # mute, kick, promote-presenter (réservé au modérateur)
├── public/
│   └── index.html                # Page de test (chat, levée de main, vidéo, participants)
├── package.json
├── .env.example                  # Modèle de configuration (copier en .env)
└── .gitignore
```

## Installation

```bash
npm install
cp .env.example .env
# éditer .env avec le vrai mot de passe PostgreSQL (voir infra/.env)
```

## Lancer le serveur

```bash
npm start
```
ou, pour le développement (redémarrage automatique à chaque modification) :
```bash
npm run dev
```

## Initialiser la base de données (une seule fois)

```bash
psql -h localhost -p 5432 -U bigblue_admin -d bigblue_db -f src/db/schema.sql
```
(mot de passe demandé = celui défini dans `infra/.env`)

## Fonctionnalités actuellement implémentées
- Connexion à une salle (`join-room`) avec attribution automatique du rôle modérateur au premier arrivant
- Chat public
- Levée de main
- Modération de base : mute/unmute, expulsion (kick), promotion/révocation présentateur
- Signalisation WebRTC (PeerJS) pour l'audio/vidéo
- Route de vérification de santé du serveur et de la base de données

## À venir
- Discussion privée
- Sondages
- Notes partagées
- Partage d'écran (côté frontend, s'appuie sur PeerJS)
- Enregistrement (local et serveur, stockage Minio)
- Persistance en base de données de l'historique des sessions (actuellement en mémoire uniquement)
