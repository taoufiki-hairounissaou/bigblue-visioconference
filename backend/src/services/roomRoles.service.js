// Persiste le rôle de chaque utilisateur authentifié par salle, pour qu'il
// retrouve son rôle (modérateur/présentateur) même après un rechargement de page.
// NOTE : en mémoire pour l'instant ; à terme, pourrait être sauvegardé dans
// la table session_participants pour survivre à un redémarrage du serveur.

const roles = new Map(); // "roomId:userId" -> role

function key(roomId, userId) {
  return `${roomId}:${userId}`;
}

function getRole(roomId, userId) {
  return roles.get(key(roomId, userId));
}

function setRole(roomId, userId, role) {
  roles.set(key(roomId, userId), role);
}

function hasModerator(roomId) {
  for (const [k, role] of roles.entries()) {
    if (k.startsWith(`${roomId}:`) && role === 'moderator') return true;
  }
  return false;
}

module.exports = { getRole, setRole, hasModerator };
