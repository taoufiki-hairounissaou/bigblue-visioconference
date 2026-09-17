import { useState } from 'react';

export default function JoinScreen({ user, onJoin, onLogout }) {
  const [roomInput, setRoomInput] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (roomInput.trim()) onJoin(roomInput.trim());
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1 className="display">BigBlue</h1>
        <p className="join-subtitle">Bonjour {user.displayName} — rejoindre une salle</p>
        <form onSubmit={submit}>
          <input
            autoFocus
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Nom de la salle"
          />
          <button type="submit" className="btn-primary btn-block">Entrer</button>
        </form>
        <button className="auth-switch" onClick={onLogout}>Se déconnecter</button>
      </div>
    </div>
  );
}
