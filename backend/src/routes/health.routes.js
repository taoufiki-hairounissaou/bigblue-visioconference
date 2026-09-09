const express = require('express');
const db = require('../db/pool');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BigBlue backend opérationnel' });
});

// Vérifie aussi que la base de données répond (utile pour diagnostiquer rapidement)
router.get('/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connectée' });
  } catch (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
    res.status(500).json({ status: 'error', database: 'non connectée', error: err.message });
  }
});

module.exports = router;
