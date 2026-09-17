import { useEffect, useRef } from 'react';

function StreamVideo({ stream, muted = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);
  if (!stream) return null;
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

function Avatar({ label, initials, stream, muted, role, handRaised, isMuted }) {
  return (
    <div className={`avatar-tile role-ring-${role}`}>
      {stream ? (
        <StreamVideo stream={stream} muted={muted} className="avatar-video" />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
      {handRaised && <span className="avatar-badge avatar-badge-hand">✋</span>}
      {isMuted && <span className="avatar-badge avatar-badge-mute">🔇</span>}
      <span className="avatar-label">{label}</span>
    </div>
  );
}

export default function StageView({ myId, myUsername, myStream, participants, remoteStreams, screenStream, sharingPeerId }) {
  const isSharing = !!screenStream;
  const sharer = participants.find((p) => p.peerId === sharingPeerId);
  const sharerLabel = sharingPeerId === myId ? 'Moi' : (sharer?.username || sharingPeerId?.substring(0, 8));

  return (
    <div className="stage-view">
      <div className="stage-main">
        {isSharing ? (
          <>
            <StreamVideo stream={screenStream} muted={sharingPeerId === myId} className="stage-video" />
            <span className="stage-label">🖥️ {sharerLabel} partage son écran</span>
          </>
        ) : myStream ? (
          <StreamVideo stream={myStream} muted className="stage-video" />
        ) : (
          <div className="stage-placeholder">Caméra désactivée</div>
        )}
      </div>

      <div className="avatar-strip">
        <Avatar
          label="Moi"
          initials={(myUsername || 'MO').substring(0, 2).toUpperCase()}
          stream={isSharing ? null : myStream}
          muted
          role="self"
          handRaised={false}
          isMuted={false}
        />
        {participants
          .filter((p) => p.peerId !== myId)
          .map((p) => {
            const name = p.username || p.peerId.substring(0, 8);
            return (
              <Avatar
                key={p.peerId}
                label={name}
                initials={name.substring(0, 2).toUpperCase()}
                stream={remoteStreams[p.peerId]}
                muted={false}
                role={p.role}
                handRaised={p.handRaised}
                isMuted={p.muted}
              />
            );
          })}
      </div>
    </div>
  );
}
