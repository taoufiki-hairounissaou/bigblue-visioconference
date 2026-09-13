import { useState } from 'react';

export default function JoinScreen({ onJoin }) {
  const [roomInput, setRoomInput] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (roomInput.trim()) onJoin(roomInput.trim());
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1 className="display">BigBlue</h1>
        <p className="join-subtitle">Rejoindre une salle de visioconférence</p>
        <form onSubmit={submit}>
          <input
            autoFocus
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Nom de la salle"
          />
          <button type="submit" className="btn-primary btn-block">Entrer</button>
        </form>
      </div>
    </div>
  );
}
