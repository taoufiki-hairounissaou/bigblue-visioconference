# BigBlue — Plan de mise en œuvre et stratégie de déploiement

---

## 1. Architecture globale proposée

```
                              ┌─────────────────────┐
                              │        Client        │
                              │ (Navigateur - React) │
                              └──────────┬───────────┘
                                         │ HTTPS / WSS
                              ┌──────────▼───────────┐
                              │   Reverse Proxy       │
                              │   Nginx (TLS/Certbot) │
                              └──────────┬───────────┘
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
             ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
             │  API REST /    │   │ Serveur Socket │   │  Serveur TURN  │
             │  Auth (Node)   │   │ .io (signaling)│   │  (coturn)      │
             └───────┬───────┘   └───────┬───────┘   └────────────────┘
                     │                   │
             ┌───────▼───────┐   ┌───────▼───────┐
             │  PostgreSQL    │   │     Minio      │
             │  (données)     │   │  (enregistr.)  │
             └────────────────┘   └────────────────┘
```

**Remarque importante pour le déploiement sur VM :** PeerJS s'appuie sur WebRTC. En dehors d'un réseau local, une bonne partie des connexions échoueront en pur peer-to-peer à cause du NAT. Il faut donc prévoir un **serveur TURN (coturn)** sur la VM, en plus du serveur PeerJS (signaling). C'est un composant souvent oublié mais indispensable pour une visioconférence fiable en production.

---

## 2. Découpage en phases (proposition de roadmap)

### Phase 0 — Socle technique
- Mise en place de la VM (OS, Docker/Docker Compose, pare-feu)
- Installation PostgreSQL + Minio + Nginx + certificats HTTPS (Let's Encrypt)
- Squelette backend (Node.js/Express) + squelette frontend
- Authentification de base (comptes, rôles)

### Phase 1 — Cœur de la visioconférence
- Connexion à une salle (room)
- Audio/vidéo via PeerJS + serveur de signaling Socket.io
- Mise en place du serveur TURN (coturn)
- Gestion basique des participants (liste, statut micro/caméra)

### Phase 2 — Interaction temps réel
- Discussion publique (chat de salle)
- Levée de main
- Discussion privée (si activée)

### Phase 3 — Modération et droits
- Panneau modérateur (mute, kick, verrouillage de salle)
- Gestion des droits : promotion/rétrogradation présentateur
- Partage d'écran (réservé présentateur/modérateur)

### Phase 4 — Contenu collaboratif
- Notes partagées (édition temps réel)
- Sondages (création, réponse, résultats)

### Phase 5 — Enregistrement
- Enregistrement local (côté client)
- Enregistrement serveur + stockage Minio
- Interface de consultation/téléchargement des enregistrements

### Phase 6 — Consolidation
- Tests de charge (nombre de participants simultanés)
- Sécurisation (HTTPS partout, validation des entrées, limitation de débit)
- Documentation de déploiement

*(L'ordre est une proposition — on peut le réajuster selon tes priorités : par exemple, si le sondage est prioritaire pour un cas d'usage précis, on peut avancer la Phase 4.)*

---

## 3. Déploiement sur machine virtuelle

### 3.1 Pré-requis VM
- OS recommandé : Ubuntu Server (LTS)
- Accès root/sudo
- Ports ouverts :
  - **443** (HTTPS - Nginx)
  - **80** (redirection HTTPS + validation Let's Encrypt)
  - **3478 / 5349** (TURN - coturn, TCP/UDP)
  - Plage UDP dédiée pour le relais TURN (ex. 49152–65535)
- Nom de domaine pointant vers l'IP de la VM (nécessaire pour HTTPS et pour la fiabilité de WebRTC)

### 3.2 Conteneurisation (recommandé)
Utilisation de **Docker Compose** pour orchestrer les services sur la VM :
- `nginx` (reverse proxy + TLS)
- `backend` (API + Socket.io)
- `postgres`
- `minio`
- `coturn`

Avantages : déploiement reproductible, mise à jour simplifiée, isolation des services.

### 3.3 Sécurité au déploiement
- HTTPS obligatoire (WebRTC et Socket.io sécurisé l'exigent en production)
- Variables d'environnement pour les secrets (jamais en dur dans le code)
- Sauvegardes régulières de PostgreSQL et des données Minio
- Limitation d'accès réseau (pare-feu, accès SSH par clé uniquement)

---

## 4. Prochaines étapes concrètes
Pour qu'on avance efficacement, je propose qu'on clarifie ensemble :

1. **Spécifications de la VM** (CPU/RAM/stockage disponibles) pour dimensionner le nombre de participants simultanés qu'on peut viser raisonnablement.
2. **Stack backend précise** : Node.js confirmé ? Framework (Express, Fastify, NestJS) ?
3. **Stack frontend** : React, Vue, autre ?
4. Par quelle **phase** veux-tu qu'on commence concrètement le développement ?

Dis-moi ce que tu en penses, et on peut soit ajuster ce plan, soit attaquer directement la Phase 0 (mise en place du socle sur la VM).
