const ROLE_LABEL = {
  moderator: 'Modérateur',
  presenter: 'Présentateur',
  participant: 'Participant'
};

export default function ParticipantsList({ participants, myId, isModerator, onModerate }) {
  return (
    <ul className="participants-list">
      {participants.map((p) => {
        const isSelf = p.peerId === myId;
        return (
          <li key={p.peerId} className="participant-row">
            <div className="participant-info">
              <span className="participant-name">{isSelf ? 'Moi' : p.peerId.substring(0, 8)}</span>
              <span className={`role-badge role-${p.role}`}>{ROLE_LABEL[p.role]}</span>
              {p.handRaised && <span className="hand-indicator" title="Main levée">✋</span>}
              {p.muted && <span className="mute-indicator" title="Muet">🔇</span>}
            </div>

            {isModerator && !isSelf && (
              <div className="participant-actions">
                <button className="btn-ghost" onClick={() => onModerate(p.muted ? 'unmute-user' : 'mute-user', p.peerId)}>
                  {p.muted ? 'Réactiver' : 'Mute'}
                </button>
                {p.role !== 'presenter' ? (
                  <button className="btn-ghost" onClick={() => onModerate('promote-presenter', p.peerId)}>
                    Présentateur
                  </button>
                ) : (
                  <button className="btn-ghost" onClick={() => onModerate('revoke-presenter', p.peerId)}>
                    Révoquer
                  </button>
                )}
                <button className="btn-ghost btn-danger" onClick={() => onModerate('kick-user', p.peerId)}>
                  Expulser
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
