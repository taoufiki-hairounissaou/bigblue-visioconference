// Une note partagée par salle, en mémoire.
const notes = new Map(); // roomId -> contenu texte

function getNote(roomId) {
  return notes.get(roomId) || '';
}

function updateNote(roomId, content) {
  notes.set(roomId, content);
  return content;
}

module.exports = { getNote, updateNote };
