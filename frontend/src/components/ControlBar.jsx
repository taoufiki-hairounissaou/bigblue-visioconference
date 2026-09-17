const PANEL_BUTTONS = [
  { id: 'participants', icon: '👥', label: 'Participants' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'private', icon: '🔒', label: 'Privé' },
  { id: 'poll', icon: '📊', label: 'Sondage' },
  { id: 'notes', icon: '📝', label: 'Notes' }
];

export default function ControlBar({
  handRaised,
  isSharing,
  isRecording,
  activePanel,
  participantCount,
  onToggleHand,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onTogglePanel
}) {
  return (
    <div className="control-bar-v2">
      <div className="control-group">
        <button className="btn-control" onClick={onToggleMic} title="Activer/couper le micro">🎤</button>
        <button className="btn-control" onClick={onToggleCamera} title="Activer/couper la caméra">📷</button>
        <button
          className={`btn-control ${isSharing ? 'btn-control-active' : ''}`}
          onClick={onToggleScreenShare}
          title="Partager l'écran"
        >
          🖥️
        </button>
        <button
          className={`btn-control ${handRaised ? 'btn-control-active' : ''}`}
          onClick={onToggleHand}
          title="Lever/baisser la main"
        >
          ✋
        </button>
        <button
          className={`btn-control ${isRecording ? 'btn-control-recording' : ''}`}
          onClick={onToggleRecording}
          title={isRecording ? "Arrêter l'enregistrement" : 'Démarrer l\'enregistrement'}
        >
          {isRecording ? '⏺️' : '⏹️'}
        </button>
      </div>

      <div className="control-group control-group-panels">
        {PANEL_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            className={`btn-panel-toggle ${activePanel === btn.id ? 'btn-panel-toggle-active' : ''}`}
            onClick={() => onTogglePanel(btn.id)}
            title={btn.label}
          >
            <span>{btn.icon}</span>
            {btn.id === 'participants' && <span className="panel-toggle-count">{participantCount}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
