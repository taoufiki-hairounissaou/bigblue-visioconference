const express = require('express');
const roomState = require('../services/roomState.service');

const router = express.Router();

// Retourne l'état actuel (en mémoire) des participants d'une salle.
// Utile pour le frontend au chargement initial, avant de recevoir les mises à jour via Socket.io.
router.get('/:roomId/participants', (req, res) => {
  const { roomId } = req.params;
  res.json({ roomId, participants: roomState.listParticipants(roomId) });
});

module.exports = router;
