import VideoTile from './VideoTile';

export default function VideoGrid({ myId, myStream, participants, remoteStreams }) {
  const others = participants.filter((p) => p.peerId !== myId);

  return (
    <div className="video-grid" data-count={others.length + 1}>
      <VideoTile stream={myStream} label="Moi" muted isSelf />
      {others.map((p) => (
        <VideoTile key={p.peerId} stream={remoteStreams[p.peerId]} label={p.peerId.substring(0, 6)} />
      ))}
    </div>
  );
}
