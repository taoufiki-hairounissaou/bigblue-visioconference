const roomState = require('../services/roomState.service');
const noteState = require('../services/noteState.service');

module.exports = function registerNoteHandlers(io, socket) {
  socket.on('update-note', ({ roomId, requesterId, content }) => {
    const requester = roomState.getParticipant(roomId, requesterId);
    const allowed = requester && ['moderator', 'presenter'].includes(requester.role);
    if (!allowed) return;

    const saved = noteState.updateNote(roomId, content);
    socket.to(roomId).emit('note-updated', saved); // pas besoin de se renvoyer à soi-même
  });
};
