export default function NotesPanel({ note, canEdit, onChange }) {
  return (
    <div className="notes-panel">
      <textarea
        className="notes-textarea"
        value={note}
        readOnly={!canEdit}
        placeholder={canEdit ? 'Écrire une note partagée...' : 'Aucune note pour l\'instant.'}
        onChange={(e) => onChange(e.target.value)}
      />
      {!canEdit && <p className="notes-hint">Lecture seule — réservé au modérateur/présentateur.</p>}
    </div>
  );
}
