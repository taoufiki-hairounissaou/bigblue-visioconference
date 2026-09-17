import { useState } from 'react';
import AuthScreen from './components/AuthScreen';
import JoinScreen from './components/JoinScreen';
import RoomScreen from './components/RoomScreen';
import { getAuth, logout } from './api/auth';

export default function App() {
  const [auth, setAuth] = useState(getAuth());
  const [roomId, setRoomId] = useState(null);

  if (!auth) {
    return <AuthScreen onAuthenticated={setAuth} />;
  }

  if (!roomId) {
    return (
      <JoinScreen
        user={auth.user}
        onJoin={setRoomId}
        onLogout={() => { logout(); setAuth(null); }}
      />
    );
  }

  return <RoomScreen roomId={roomId} auth={auth} onLeave={() => setRoomId(null)} />;
}
