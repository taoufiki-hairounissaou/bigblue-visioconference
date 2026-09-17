import ParticipantsList from './ParticipantsList';
import ChatPanel from './ChatPanel';
import PollPanel from './PollPanel';
import NotesPanel from './NotesPanel';
import PrivateChatPanel from './PrivateChatPanel';

const TITLES = {
  participants: 'Participants',
  chat: 'Chat',
  private: 'Messages privés',
  poll: 'Sondage',
  notes: 'Notes partagées'
};

export default function PanelDrawer({
  activePanel, onClose,
  participants, myId, isModerator, onModerate,
  messages, onSend,
  poll, onCreatePoll, onVotePoll, onClosePoll,
  note, onUpdateNote,
  privateMessages, onSendPrivate
}) {
  if (!activePanel) return null;

  const canEditShared = isModerator || participants.find((p) => p.peerId === myId)?.role === 'presenter';

  return (
    <div className="panel-drawer">
      <div className="panel-drawer-header">
        <span>{TITLES[activePanel]}</span>
        <button className="panel-drawer-close" onClick={onClose}>✕</button>
      </div>
      <div className="panel-drawer-body">
        {activePanel === 'participants' && (
          <ParticipantsList
            participants={participants}
            myId={myId}
            isModerator={isModerator}
            onModerate={onModerate}
          />
        )}
        {activePanel === 'chat' && (
          <ChatPanel messages={messages} myId={myId} participants={participants} onSend={onSend} />
        )}
        {activePanel === 'private' && (
          <PrivateChatPanel
            participants={participants}
            myId={myId}
            privateMessages={privateMessages}
            onSend={onSendPrivate}
          />
        )}
        {activePanel === 'poll' && (
          <PollPanel
            poll={poll}
            myId={myId}
            canCreate={canEditShared}
            isModerator={isModerator}
            onCreate={onCreatePoll}
            onVote={onVotePoll}
            onClose={onClosePoll}
          />
        )}
        {activePanel === 'notes' && (
          <NotesPanel note={note} canEdit={canEditShared} onChange={onUpdateNote} />
        )}
      </div>
    </div>
  );
}
