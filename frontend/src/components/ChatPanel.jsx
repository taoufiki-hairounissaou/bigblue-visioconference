import { useState, useRef, useEffect } from 'react';

function resolveName(peerId, myId, participants) {
  if (peerId === myId) return 'Moi';
  const p = participants.find((x) => x.peerId === peerId);
  return p?.username || peerId.substring(0, 8);
}

export default function ChatPanel({ messages, myId, participants, onSend }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="chat-empty">Aucun message pour l'instant.</p>}
        {messages.map((m, i) => (
          <p key={i} className="chat-message">
            <span className="chat-author">{resolveName(m.userId, myId, participants)}</span>
            {m.message}
          </p>
        ))}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire un message..."
        />
        <button type="submit" className="btn-primary">Envoyer</button>
      </form>
    </div>
  );
}
