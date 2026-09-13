// État en mémoire des sondages actifs, un par salle (le précédent est remplacé si on en recrée un).
const polls = new Map(); // roomId -> poll

function createPoll(roomId, question, options) {
  const poll = {
    id: Date.now().toString(36),
    question,
    options: options.map((label, idx) => ({ id: `opt${idx}`, label, votes: new Set() })),
    isClosed: false
  };
  polls.set(roomId, poll);
  return poll;
}

function vote(roomId, optionId, userId) {
  const poll = polls.get(roomId);
  if (!poll || poll.isClosed) return null;
  poll.options.forEach((o) => o.votes.delete(userId)); // un seul vote par utilisateur, remplace le précédent
  const opt = poll.options.find((o) => o.id === optionId);
  if (opt) opt.votes.add(userId);
  return poll;
}

function closePoll(roomId) {
  const poll = polls.get(roomId);
  if (poll) poll.isClosed = true;
  return poll;
}

function getPoll(roomId) {
  return polls.get(roomId);
}

// Transforme les Set (non sérialisables en JSON) en simples compteurs
function serializePoll(poll) {
  if (!poll) return null;
  return {
    id: poll.id,
    question: poll.question,
    isClosed: poll.isClosed,
    options: poll.options.map((o) => ({ id: o.id, label: o.label, votes: o.votes.size }))
  };
}

module.exports = { createPoll, vote, closePoll, getPoll, serializePoll };
