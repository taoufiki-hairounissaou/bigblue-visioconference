import { useState } from 'react';

export default function PollPanel({ poll, myId, canCreate, isModerator, onCreate, onVote, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const updateOption = (idx, value) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const addOption = () => setOptions([...options, '']);

  const submit = (e) => {
    e.preventDefault();
    onCreate(question, options);
    setQuestion('');
    setOptions(['', '']);
  };

  const totalVotes = poll ? poll.options.reduce((sum, o) => sum + o.votes, 0) : 0;

  if (poll) {
    return (
      <div className="poll-panel">
        <h3 className="poll-question">{poll.question}</h3>
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              className="poll-option"
              disabled={poll.isClosed}
              onClick={() => onVote(opt.id)}
            >
              <span className="poll-option-bar" style={{ width: `${pct}%` }} />
              <span className="poll-option-label">{opt.label}</span>
              <span className="poll-option-pct">{pct}% ({opt.votes})</span>
            </button>
          );
        })}
        {poll.isClosed && <p className="poll-closed">Sondage clôturé</p>}
        {isModerator && !poll.isClosed && (
          <button className="btn-ghost" onClick={onClose}>Clôturer le sondage</button>
        )}
      </div>
    );
  }

  if (!canCreate) {
    return <p className="poll-empty">Aucun sondage en cours.</p>;
  }

  return (
    <form className="poll-panel" onSubmit={submit}>
      <input
        placeholder="Question du sondage"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {options.map((opt, idx) => (
        <input
          key={idx}
          placeholder={`Option ${idx + 1}`}
          value={opt}
          onChange={(e) => updateOption(idx, e.target.value)}
        />
      ))}
      <button type="button" className="btn-ghost" onClick={addOption}>+ Ajouter une option</button>
      <button type="submit" className="btn-primary">Lancer le sondage</button>
    </form>
  );
}
