import { useRoom } from '../hooks/useRoom';
import VideoGrid from './VideoGrid';
import SidePanel from './SidePanel';
import ControlBar from './ControlBar';

export default function RoomScreen({ roomId, onLeave }) {
  const {
    myId,
    myStream,
    participants,
    remoteStreams,
    messages,
    me,
    connectionError,
    kicked,
    sendMessage,
    toggleHand,
    moderate,
    toggleMic,
    toggleCamera
  } = useRoom(roomId);

  if (kicked) {
    return (
      <div className="join-screen">
        <div className="join-card">
          <h1 className="display">Expulsé de la salle</h1>
          <p className="join-subtitle">Le modérateur t'a retiré de cette session.</p>
          <button className="btn-primary btn-block" onClick={onLeave}>Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-screen">
      <header className="room-header">
        <span className="display">BigBlue</span>
        <span className="room-name">Salle : {roomId}</span>
        {connectionError && <span className="room-warning">{connectionError}</span>}
        <button className="btn-ghost btn-danger" onClick={onLeave}>Quitter</button>
      </header>

      <div className="room-body">
        <VideoGrid myId={myId} myStream={myStream} participants={participants} remoteStreams={remoteStreams} />
        <SidePanel
          participants={participants}
          myId={myId}
          isModerator={me?.role === 'moderator'}
          onModerate={moderate}
          messages={messages}
          onSend={sendMessage}
        />
      </div>

      <ControlBar
        handRaised={!!me?.handRaised}
        onToggleHand={toggleHand}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
      />
    </div>
  );
}
