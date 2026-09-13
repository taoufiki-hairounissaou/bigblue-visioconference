const roomState = require('../services/roomState.service');
const pollState = require('../services/pollState.service');

module.exports = function registerPollHandlers(io, socket) {
  socket.on('create-poll', ({ roomId, requesterId, question, options }) => {
    const requester = roomState.getParticipant(roomId, requesterId);
    const allowed = requester && ['moderator', 'presenter'].includes(requester.role);
    if (!allowed || !question?.trim() || !Array.isArray(options)) return;

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) return;

    const poll = pollState.createPoll(roomId, question.trim(), cleanOptions);
    io.to(roomId).emit('poll-updated', pollState.serializePoll(poll));
  });

  socket.on('vote-poll', ({ roomId, userId, optionId }) => {
    const poll = pollState.vote(roomId, optionId, userId);
    if (poll) io.to(roomId).emit('poll-updated', pollState.serializePoll(poll));
  });

  socket.on('close-poll', ({ roomId, requesterId }) => {
    if (!roomState.isModerator(roomId, requesterId)) return;
    const poll = pollState.closePoll(roomId);
    if (poll) io.to(roomId).emit('poll-updated', pollState.serializePoll(poll));
  });
};
