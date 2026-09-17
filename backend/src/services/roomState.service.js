const roomRoles = require('./roomRoles.service');

// État en mémoire des salles actives.
const rooms = new Map(); // roomId -> Map(peerId -> participant)

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, peerId, socketId, userId, username) {
  const room = getRoom(roomId);

  // Rôle : on retrouve le rôle déjà attribué à cet utilisateur authentifié
  // dans cette salle (persistant tant que le serveur tourne), sinon le
  // premier utilisateur authentifié à rejoindre devient modérateur.
  let role = userId ? roomRoles.getRole(roomId, userId) : undefined;
  if (!role) {
    role = userId && !roomRoles.hasModerator(roomId) ? 'moderator' : 'participant';
    if (userId) roomRoles.setRole(roomId, userId, role);
  }

  const participant = {
    peerId,
    socketId,
    userId: userId || null,
    username: username || null,
    role,
    handRaised: false,
    muted: false
  };

  room.set(peerId, participant);
  return participant;
}

function removeParticipant(roomId, peerId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(peerId);
  if (room.size === 0) rooms.delete(roomId);
}

function listParticipants(roomId) {
  const room = rooms.get(roomId);
  return room ? Array.from(room.values()) : [];
}

function getParticipant(roomId, peerId) {
  const room = rooms.get(roomId);
  return room ? room.get(peerId) : undefined;
}

function updateParticipant(roomId, peerId, changes) {
  const participant = getParticipant(roomId, peerId);
  if (!participant) return null;
  Object.assign(participant, changes);

  // Si le rôle change (promotion/révocation/kick), on garde la persistance à jour
  if (changes.role && participant.userId) {
    roomRoles.setRole(roomId, participant.userId, changes.role);
  }

  return participant;
}

function isModerator(roomId, peerId) {
  const participant = getParticipant(roomId, peerId);
  return !!participant && participant.role === 'moderator';
}

module.exports = {
  addParticipant,
  removeParticipant,
  listParticipants,
  getParticipant,
  updateParticipant,
  isModerator
};
