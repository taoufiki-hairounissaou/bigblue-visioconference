const roomState = require('../services/roomState.service');
const pollState = require('../services/pollState.service');

module.exports = function registerRoomHandlers(io, socket) {
  socket.on('join-room', (roomId, peerId) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.peerId = peerId;

    const participant = roomState.addParticipant(roomId, peerId, socket.id);
    console.log(`Utilisateur ${peerId} (${socket.id}) a rejoint la salle ${roomId} - rôle : ${participant.role}`);

    socket.to(roomId).emit('user-connected', peerId);
    io.to(roomId).emit('room-users', roomState.listParticipants(roomId));

    // Envoie le sondage en cours (s'il y en a un) au nouvel arrivant uniquement
    const currentPoll = pollState.getPoll(roomId);
    if (currentPoll) {
      socket.emit('poll-updated', pollState.serializePoll(currentPoll));
    }

    socket.on('disconnect', () => {
      console.log(`Utilisateur ${peerId} (${socket.id}) déconnecté`);
      roomState.removeParticipant(roomId, peerId);
      socket.to(roomId).emit('user-disconnected', peerId);
      io.to(roomId).emit('room-users', roomState.listParticipants(roomId));
    });
  });
};
