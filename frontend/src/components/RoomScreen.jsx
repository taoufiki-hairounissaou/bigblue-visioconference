import { useState } from 'react';
import { useRoom } from '../hooks/useRoom';
import RoomHeader from './RoomHeader';
import StageView from './StageView';
import ControlBar from './ControlBar';
import PanelDrawer from './PanelDrawer';

export default function RoomScreen({ roomId, auth, onLeave }) {
  const [activePanel, setActivePanel] = useState(null);

  const {
    myId,
    myStream,
    participants,
    remoteStreams,
    messages,
    me,
    connectionError,
    kicked,
    poll,
    note,
    privateMessages,
    screenStream,
    sharingPeerId,
    isRecording,
    sendMessage,
    toggleHand,
    moderate,
    toggleMic,
    toggleCamera,
    createPoll,
    votePoll,
    closePoll,
    updateNote,
    sendPrivateMessage,
    toggleScreenShare,
    toggleRecording
  } = useRoom(roomId, auth);

  const togglePanel = (id) => setActivePanel((prev) => (prev === id ? null : id));

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
      <RoomHeader
        roomId={roomId}
        participantCount={participants.length}
        connectionError={connectionError}
        onLeave={onLeave}
      />

      <div className="room-body-v2">
        <StageView
          myId={myId}
          myUsername={auth?.user?.displayName}
          myStream={myStream}
          participants={participants}
          remoteStreams={remoteStreams}
          screenStream={screenStream}
          sharingPeerId={sharingPeerId}
        />

        <PanelDrawer
          activePanel={activePanel}
          onClose={() => setActivePanel(null)}
          participants={participants}
          myId={myId}
          isModerator={me?.role === 'moderator'}
          onModerate={moderate}
          messages={messages}
          onSend={sendMessage}
          poll={poll}
          onCreatePoll={createPoll}
          onVotePoll={votePoll}
          onClosePoll={closePoll}
          note={note}
          onUpdateNote={updateNote}
          privateMessages={privateMessages}
          onSendPrivate={sendPrivateMessage}
        />
      </div>

      <ControlBar
        handRaised={!!me?.handRaised}
        isSharing={sharingPeerId === myId}
        isRecording={isRecording}
        activePanel={activePanel}
        participantCount={participants.length}
        onToggleHand={toggleHand}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={toggleRecording}
        onTogglePanel={togglePanel}
      />
    </div>
  );
}
