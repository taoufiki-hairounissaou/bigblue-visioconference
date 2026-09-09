const roomState = require('../services/roomState.service');

module.exports = function registerRoomHandlers(io, socket) {
  socket.on('join-room', (roomId, peerId) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.peerId = peerId;

    const participant = roomState.addParticipant(roomId, peerId, socket.id);
    console.log(`Utilisateur ${peerId} (${socket.id}) a rejoint la salle ${roomId} - rôle : ${participant.role}`);

    // Informe les autres participants qu'un nouvel utilisateur arrive (pour la connexion vidéo PeerJS)
    socket.to(roomId).emit('user-connected', peerId);

    // Diffuse la liste à jour des participants à toute la salle (y compris le nouvel arrivant)
    io.to(roomId).emit('room-users', roomState.listParticipants(roomId));

    socket.on('disconnect', () => {
      console.log(`Utilisateur ${peerId} (${socket.id}) déconnecté`);
      roomState.removeParticipant(roomId, peerId);
      socket.to(roomId).emit('user-disconnected', peerId);
      io.to(roomId).emit('room-users', roomState.listParticipants(roomId));
    });
  });
};
