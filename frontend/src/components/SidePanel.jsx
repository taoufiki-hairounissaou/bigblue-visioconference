import { useState } from 'react';
import ParticipantsList from './ParticipantsList';
import ChatPanel from './ChatPanel';

export default function SidePanel({ participants, myId, isModerator, onModerate, messages, onSend }) {
  const [tab, setTab] = useState('participants');

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
      </div>

      <div className="side-panel-body">
        {tab === 'participants' ? (
          <ParticipantsList
            participants={participants}
            myId={myId}
            isModerator={isModerator}
            onModerate={onModerate}
          />
        ) : (
          <ChatPanel messages={messages} myId={myId} onSend={onSend} />
        )}
      </div>
    </aside>
  );
}
