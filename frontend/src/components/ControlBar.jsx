export default function ControlBar({ handRaised, onToggleHand, onToggleMic, onToggleCamera }) {
  return (
    <div className="control-bar">
      <button className="btn-control" onClick={onToggleMic} title="Activer/couper le micro">
        🎤
      </button>
      <button className="btn-control" onClick={onToggleCamera} title="Activer/couper la caméra">
        📷
      </button>
      <button
        className={`btn-control ${handRaised ? 'btn-control-active' : ''}`}
        onClick={onToggleHand}
        title="Lever/baisser la main"
      >
        ✋
      </button>
    </div>
  );
}
