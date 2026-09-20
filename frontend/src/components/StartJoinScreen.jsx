import { useState } from 'react';

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8);
}

export default function StartJoinScreen({ user, onJoin, onLogout }) {
  const [meetingName, setMeetingName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const startMeeting = (e) => {
    e.preventDefault();
    const roomId = meetingName.trim() ? meetingName.trim() : generateRoomCode();
    onJoin(roomId);
  };

  const joinMeeting = (e) => {
    e.preventDefault();
    if (joinCode.trim()) onJoin(joinCode.trim());
  };

  return (
    <div className="start-join-screen">
      <header className="start-join-header">
        <span className="display landing-brand">BigBlue</span>
        <div className="start-join-user">
          <span>Bonjour {user.displayName}</span>
          <button className="auth-switch" onClick={onLogout}>Se déconnecter</button>
        </div>
      </header>

      <div className="start-join-cards">
        <form className="start-join-card" onSubmit={startMeeting}>
          <span className="start-join-icon">🎬</span>
          <h2>Démarrer une réunion</h2>
          <p>Crée une nouvelle salle. Tu seras automatiquement modérateur.</p>
          <input
            placeholder="Nom de la réunion (optionnel)"
            value={meetingName}
            onChange={(e) => setMeetingName(e.target.value)}
          />
          <button type="submit" className="btn-primary btn-block">Démarrer</button>
        </form>

        <form className="start-join-card" onSubmit={joinMeeting}>
          <span className="start-join-icon">🚪</span>
          <h2>Rejoindre une réunion</h2>
          <p>Entre le code partagé par l'organisateur pour rejoindre sa salle.</p>
          <input
            placeholder="Code de la réunion"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary btn-block">Rejoindre</button>
        </form>
      </div>
    </div>
  );
}
