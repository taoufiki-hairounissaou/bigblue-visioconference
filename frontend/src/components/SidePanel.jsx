import { useState } from 'react';
import ParticipantsList from './ParticipantsList';
import ChatPanel from './ChatPanel';
import PollPanel from './PollPanel';

export default function SidePanel({
  participants, myId, isModerator, onModerate,
  messages, onSend,
  poll, onCreatePoll, onVotePoll, onClosePoll
}) {
  const [tab, setTab] = useState('participants');
  const me = participants.find((p) => p.peerId === myId);
  const canCreatePoll = me?.role === 'moderator' || me?.role === 'presenter';

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
          className={tab === 'poll' ? 'tab-active' : ''}
          onClick={() => setTab('poll')}
        >
          Sondage
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
        {tab === 'poll' && (
          <PollPanel
            poll={poll}
            myId={myId}
            canCreate={canCreatePoll}
            isModerator={isModerator}
            onCreate={onCreatePoll}
            onVote={onVotePoll}
            onClose={onClosePoll}
          />
        )}
      </div>
    </aside>
  );
}
