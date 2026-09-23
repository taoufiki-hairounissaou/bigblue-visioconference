export default function NotesPanel({ roomId, note, canEdit, onChange }) {
  const hasContent = note && note.trim().length > 0;

  const downloadPdf = () => {
    window.open(`/api/notes/${roomId}/export`, '_blank');
  };

  return (
    <div className="notes-panel">
      <textarea
        className="notes-textarea"
        value={note}
        readOnly={!canEdit}
        placeholder={canEdit ? 'Écrire une note partagée...' : "Aucune note pour l'instant."}
        onChange={(e) => onChange(e.target.value)}
      />
      {!canEdit && <p className="notes-hint">Lecture seule — réservé au modérateur/présentateur.</p>}

      <button
        className="btn-ghost notes-export-btn"
        onClick={downloadPdf}
        disabled={!hasContent}
        title={hasContent ? 'Télécharger les notes en PDF' : 'Aucune note à exporter'}
      >
        📄 Télécharger en PDF
      </button>
    </div>
  );
}
