import { useState } from 'react';
import ParticipantsList from './ParticipantsList';
import ChatPanel from './ChatPanel';
import PollPanel from './PollPanel';
import NotesPanel from './NotesPanel';
import PrivateChatPanel from './PrivateChatPanel';

const TABS = [
  { id: 'participants', icon: '👥', label: 'Participants' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'private', icon: '🔒', label: 'Privé' },
  { id: 'poll', icon: '📊', label: 'Sondage' },
  { id: 'notes', icon: '📝', label: 'Notes' }
];

export default function SidePanel({
  participants, myId, isModerator, onModerate,
  messages, onSend,
  poll, onCreatePoll, onVotePoll, onClosePoll,
  note, onUpdateNote,
  privateMessages, onSendPrivate
}) {
  const [tab, setTab] = useState('participants');
  const me = participants.find((p) => p.peerId === myId);
  const canEditShared = me?.role === 'moderator' || me?.role === 'presenter';

  return (
    <aside className="side-panel">
      <nav className="side-panel-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'nav-item-active' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
            {t.id === 'participants' && <span className="nav-count">{participants.length}</span>}
          </button>
        ))}
      </nav>

      <div className="side-panel-body">
        {tab === 'participants' && (
          <ParticipantsList
            participants={participants}
            myId={myId}
            isModerator={isModerator}
            onModerate={onModerate}
          />
        )}
        {tab === 'chat' && (
          <ChatPanel messages={messages} myId={myId} onSend={onSend} />
        )}
        {tab === 'private' && (
          <PrivateChatPanel
            participants={participants}
            myId={myId}
            privateMessages={privateMessages}
            onSend={onSendPrivate}
          />
        )}
        {tab === 'poll' && (
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
        {tab === 'notes' && (
          <NotesPanel note={note} canEdit={canEditShared} onChange={onUpdateNote} />
        )}
      </div>
    </aside>
  );
}