const express = require('express');
const multer = require('multer');
const db = require('../db/pool');
const { uploadRecording } = require('../services/minio.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/upload', upload.single('recording'), async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!req.file || !roomId) {
      return res.status(400).json({ error: 'Fichier ou roomId manquant' });
    }

    const objectName = `${roomId}/${Date.now()}.webm`;
    await uploadRecording(objectName, req.file.buffer);

    await db.query(
      'INSERT INTO recordings (storage_key) VALUES ($1)',
      [objectName]
    );

    res.json({ status: 'ok', storageKey: objectName });
  } catch (err) {
    console.error('Erreur upload enregistrement :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
