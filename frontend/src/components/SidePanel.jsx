import { useState } from 'react';
import ParticipantsList from './ParticipantsList';
import ChatPanel from './ChatPanel';
import PollPanel from './PollPanel';
import NotesPanel from './NotesPanel';
import PrivateChatPanel from './PrivateChatPanel';

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
      <div className="side-panel-tabs">
        <button
          className={tab === 'participants' ? 'tab-active' : ''}
          onClick={() => setTab('participants')}
        >
          Participants ({participants.length})
        </button>
        <button
          className={tab === 'chat' ? 'tab-active' : ''}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          className={tab === 'private' ? 'tab-active' : ''}
          onClick={() => setTab('private')}
        >
          Privé
        </button>
        <button
          className={tab === 'poll' ? 'tab-active' : ''}
          onClick={() => setTab('poll')}
        >
          Sondage
        </button>
        <button
          className={tab === 'notes' ? 'tab-active' : ''}
          onClick={() => setTab('notes')}
        >
          Notes
        </button>
      </div>

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