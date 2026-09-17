const express = require('express');
const db = require('../db/pool');
const { hashPassword, verifyPassword, generateToken } = require('../services/auth.service');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { displayName, email, password } = req.body;
    if (!displayName?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Champs invalides (mot de passe : 6 caractères minimum).' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      'INSERT INTO users (display_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, display_name, email',
      [displayName.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, displayName: user.display_name, email: user.email } });
  } catch (err) {
    console.error('Erreur inscription :', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, displayName: user.display_name, email: user.email } });
  } catch (err) {
    console.error('Erreur connexion :', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
