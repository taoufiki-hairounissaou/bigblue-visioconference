import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import StartJoinScreen from './components/StartJoinScreen';
import RoomScreen from './components/RoomScreen';
import { getAuth, logout } from './api/auth';

export default function App() {
  const [auth, setAuth] = useState(getAuth());
  const [showAuth, setShowAuth] = useState(false);
  const [roomId, setRoomId] = useState(null);

  if (!auth) {
    if (!showAuth) {
      return <LandingPage onEnter={() => setShowAuth(true)} />;
    }
    return <AuthScreen onAuthenticated={setAuth} />;
  }

  if (!roomId) {
    return (
      <StartJoinScreen
        user={auth.user}
        onJoin={setRoomId}
        onLogout={() => { logout(); setAuth(null); setShowAuth(false); }}
      />
    );
  }

  return <RoomScreen roomId={roomId} auth={auth} onLeave={() => setRoomId(null)} />;
}
