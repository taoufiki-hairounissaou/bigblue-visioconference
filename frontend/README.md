# BigBlue — Frontend

Interface React (Vite) pour la plateforme de visioconférence BigBlue. Remplace la page de test HTML utilisée jusqu'ici dans `backend/public/`.

## Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Bascule accueil / salle
│   ├── main.jsx                   # Point d'entrée
│   ├── api/socket.js              # Client Socket.io
│   ├── hooks/useRoom.js           # Logique centrale : Socket.io + PeerJS + état de la salle
│   ├── components/
│   │   ├── JoinScreen.jsx         # Écran d'accueil (saisie du nom de salle)
│   │   ├── RoomScreen.jsx         # Écran de salle (assemble tout)
│   │   ├── VideoGrid.jsx / VideoTile.jsx   # Grille vidéo
│   │   ├── SidePanel.jsx          # Panneau à onglets
│   │   ├── ParticipantsList.jsx   # Liste + actions de modération
│   │   ├── ChatPanel.jsx          # Chat public
│   │   └── ControlBar.jsx         # Micro / caméra / main levée
│   └── styles/                    # Un fichier CSS par zone de l'interface
├── vite.config.js                 # Proxy vers le backend (Socket.io, PeerJS, API)
└── package.json
```

## Installation

```bash
npm install
cp .env.example .env
# éditer .env si le backend n'est pas sur localhost:4000
```

## Lancer en développement

```bash
npm run dev
```
Accessible sur `http://<IP_VM>:5173` (le `--host` dans le script `dev` rend le serveur accessible depuis l'extérieur de la VM, pas seulement en local).

## Build pour la production

```bash
npm run build
```
Génère le dossier `dist/`, à servir ensuite par Nginx.

## Fonctionnalités implémentées
- Écran d'accueil avec saisie du nom de salle
- Connexion à une salle (Socket.io + PeerJS)
- Grille vidéo (soi-même + participants distants)
- Chat public
- Liste des participants avec rôle et statut (main levée, muet)
- Levée de main
- Modération (mute/unmute, expulsion, promotion présentateur) — actions visibles uniquement pour le modérateur
- Contrôles micro/caméra

## À venir
- Discussion privée
- Sondages
- Notes partagées
- Partage d'écran
- Enregistrement
