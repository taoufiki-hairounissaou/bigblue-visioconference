// État en mémoire des salles actives.
// NOTE : ceci est volontairement simple pour l'instant (pas de persistance).
// À terme, ces informations seront aussi écrites dans PostgreSQL (tables
// room_sessions / session_participants) pour garder un historique.

const rooms = new Map(); // roomId -> Map(peerId -> participant)

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, peerId, socketId) {
  const room = getRoom(roomId);
  const isFirst = room.size === 0;

  const participant = {
    peerId,
    socketId,
    role: isFirst ? 'moderator' : 'participant', // le premier arrivé devient modérateur
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
