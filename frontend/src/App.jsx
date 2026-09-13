import { useState } from 'react';
import JoinScreen from './components/JoinScreen';
import RoomScreen from './components/RoomScreen';

export default function App() {
  const [roomId, setRoomId] = useState(null);

  if (!roomId) {
    return <JoinScreen onJoin={setRoomId} />;
  }

  return <RoomScreen roomId={roomId} onLeave={() => setRoomId(null)} />;
}
