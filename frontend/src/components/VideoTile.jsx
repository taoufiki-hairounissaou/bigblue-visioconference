import { useEffect, useRef } from 'react';

export default function VideoTile({ stream, label, muted = false, isSelf = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      ) : (
        <div className="video-tile-placeholder">
          <span>{label.substring(0, 2).toUpperCase()}</span>
        </div>
      )}
      <span className="video-tile-label">{isSelf ? 'Moi' : label}</span>
    </div>
  );
}
