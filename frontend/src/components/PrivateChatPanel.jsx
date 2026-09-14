import { useState, useMemo } from 'react';

export default function PrivateChatPanel({ participants, myId, privateMessages, onSend }) {
  const [activePeerId, setActivePeerId] = useState(null);
  const [draft, setDraft] = useState('');

  const others = participants.filter((p) => p.peerId !== myId);

  const conversation = useMemo(() => {
    if (!activePeerId) return [];
    return privateMessages.filter(
      (m) => (m.fromId === myId && m.toId === activePeerId) ||
             (m.fromId === activePeerId && m.toId === myId)
    );
  }, [privateMessages, myId, activePeerId]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || !activePeerId) return;
    onSend(activePeerId, draft);
    setDraft('');
  };

  if (others.length === 0) {
    return <p className="chat-empty" style={{ padding: 14 }}>Aucun autre participant à contacter.</p>;
  }

  return (
    <div className="private-chat-panel">
      <div className="private-chat-contacts">
        {others.map((p) => (
          <button
            key={p.peerId}
            className={activePeerId === p.peerId ? 'contact-active' : ''}
            onClick={() => setActivePeerId(p.peerId)}
          >
            {p.peerId.substring(0, 8)}
          </button>
        ))}
      </div>

      {activePeerId ? (
        <div className="private-chat-conversation">
          <div className="chat-messages">
            {conversation.length === 0 && <p className="chat-empty">Aucun message échangé.</p>}
            {conversation.map((m, i) => (
              <p key={i} className="chat-message">
                <span className="chat-author">{m.fromId === myId ? 'Moi' : m.fromId.substring(0, 8)}</span>
                {m.message}
              </p>
            ))}
          </div>
          <form className="chat-form" onSubmit={submit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message privé..."
            />
            <button type="submit" className="btn-primary">Envoyer</button>
          </form>
        </div>
      ) : (
        <p className="chat-empty" style={{ padding: 14 }}>Choisis un participant pour lui écrire.</p>
      )}
    </div>
  );
}
