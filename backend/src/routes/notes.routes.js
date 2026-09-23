const express = require('express');
const PDFDocument = require('pdfkit');
const noteState = require('../services/noteState.service');
const { uploadRecording } = require('../services/minio.service');

const router = express.Router();

// Génère un PDF des notes partagées de la salle, le télécharge directement
// dans le navigateur, et en garde une copie dans Minio (même logique que
// pour les enregistrements : local + serveur).
router.get('/:roomId/export', (req, res) => {
  const { roomId } = req.params;
  const content = noteState.getNote(roomId);

  if (!content || !content.trim()) {
    return res.status(404).json({ error: 'Aucune note à exporter pour cette salle.' });
  }

  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.on('end', async () => {
    const buffer = Buffer.concat(chunks);

    // Stockage serveur (Minio), dans le même bucket que les enregistrements,
    // sous un sous-dossier "notes/" pour rester simple plutôt que de créer
    // un bucket dédié.
    try {
      const objectName = `notes/${roomId}/${Date.now()}.pdf`;
      await uploadRecording(objectName, buffer);
    } catch (err) {
      console.error('Erreur upload des notes (PDF) vers Minio :', err.message);
      // On ne bloque pas le téléchargement local même si l'upload serveur échoue
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="notes-${roomId}.pdf"`);
    res.send(buffer);
  });

  doc.fontSize(20).text('BigBlue — Notes partagées', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).fillColor('#666').text(`Salle : ${roomId}`, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(12).fillColor('#000').text(content, { align: 'left', lineGap: 4 });
  doc.end();
});

module.exports = router;
