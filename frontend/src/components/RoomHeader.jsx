import { useEffect, useState } from 'react';

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RoomHeader({ roomId, participantCount, connectionError, onLeave }) {
  const [elapsed, setElapsed] = useState(0);
  const isSecure = window.location.protocol === 'https:';

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="room-header">
      <span className="display room-brand">BigBlue</span>
      <span className="room-code">{roomId}</span>
      <span className={`badge-secure ${isSecure ? 'is-secure' : 'is-insecure'}`}>
        {isSecure ? '🔒 Sécurisé' : '⚠️ Non sécurisé'}
      </span>
      <span className="room-timer">⏱ {formatElapsed(elapsed)}</span>
      <span className="room-participant-count">👥 {participantCount}</span>
      {connectionError && <span className="room-warning">{connectionError}</span>}
      <button className="btn-ghost btn-danger room-leave" onClick={onLeave}>Quitter</button>
    </header>
  );
}
