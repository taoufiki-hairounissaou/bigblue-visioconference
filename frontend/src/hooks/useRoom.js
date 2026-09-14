import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { socket } from '../api/socket';

export function useRoom(roomId) {
  const [myId, setMyId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); // peerId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [poll, setPoll] = useState(null);
  const [note, setNote] = useState('');
  const [kicked, setKicked] = useState(false);

  const peerRef = useRef(null);
  const callsRef = useRef({}); // peerId -> call, pour pouvoir les fermer proprement

  const me = participants.find((p) => p.peerId === myId);

  // --- Connexion initiale ---
  useEffect(() => {
  const peer = new Peer(undefined, {
    host: window.location.hostname,
    port: window.location.port,
    path: '/peerjs'
  });
    peerRef.current = peer;

    socket.connect();

    peer.on('open', (id) => {
      setMyId(id);
      socket.emit('join-room', roomId, id);
    });

    peer.on('error', (err) => {
      console.error('Erreur PeerJS :', err);
      setConnectionError("Impossible d'établir la connexion audio/vidéo.");
    });

    // Caméra/micro : ne bloque jamais le reste de l'app si indisponible
    // (voir rapport.md, section 8.3 - erreur historique corrigée)
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(setMyStream)
        .catch((err) => {
          console.warn('Caméra/micro indisponible :', err);
        });
    }

    socket.on('room-users', setParticipants);

    socket.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-disconnected', (peerId) => {
      callsRef.current[peerId]?.close();
      delete callsRef.current[peerId];
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    socket.on('you-were-kicked', () => setKicked(true));
    socket.on('poll-updated', setPoll);
    socket.on('note-updated', setNote);

    return () => {
      peer.destroy();
      socket.disconnect();
      socket.off('room-users');
      socket.off('receive-message');
      socket.off('user-disconnected');
      socket.off('you-were-kicked');
      socket.off('poll-updated');
      socket.off('note-updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // --- Appels PeerJS : répondre aux appels entrants, appeler les nouveaux venus ---
  useEffect(() => {
    const peer = peerRef.current;
    if (!peer || !myStream) return;

    const handleIncomingCall = (call) => {
      call.answer(myStream);
      call.on('stream', (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }));
      });
      callsRef.current[call.peer] = call;
    };

    peer.on('call', handleIncomingCall);

    const handleUserConnected = (peerId) => {
      const call = peer.call(peerId, myStream);
      call.on('stream', (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
      });
      callsRef.current[peerId] = call;
    };

    socket.on('user-connected', handleUserConnected);

    return () => {
      peer.off('call', handleIncomingCall);
      socket.off('user-connected', handleUserConnected);
    };
  }, [myStream]);

  // --- Actions ---
  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !myId) return;
      socket.emit('send-message', { roomId, userId: myId, message: text });
    },
    [roomId, myId]
  );

  const toggleHand = useCallback(() => {
    if (!myId || !me) return;
    socket.emit(me.handRaised ? 'lower-hand' : 'raise-hand', { roomId, userId: myId });
  }, [roomId, myId, me]);

  const createPoll = useCallback(
  (question, options) => {
    if (!myId) return;
    socket.emit('create-poll', { roomId, requesterId: myId, question, options });
  }, [roomId, myId]);

  const votePoll = useCallback(
  (optionId) => {
    if (!myId) return;
    socket.emit('vote-poll', { roomId, userId: myId, optionId });
  }, [roomId, myId]);

  const closePoll = useCallback(() => {
    if (!myId) return;
    socket.emit('close-poll', { roomId, requesterId: myId });
  }, [roomId, myId]);

  const updateNote = useCallback(
   (content) => {
     if (!myId) return;
     setNote(content); // mise à jour locale immédiate (pas d'attente de l'aller-retour serveur)
     socket.emit('update-note', { roomId, requesterId: myId, content });
  }, [roomId, myId]);

  const moderate = useCallback(
    (action, targetId) => {
      if (!myId) return;
      socket.emit(action, { roomId, requesterId: myId, targetId });
    },
    [roomId, myId]
  );

  const toggleMic = useCallback(() => {
    myStream?.getAudioTracks().forEach((track) => { track.enabled = !track.enabled; });
  }, [myStream]);

  const toggleCamera = useCallback(() => {
    myStream?.getVideoTracks().forEach((track) => { track.enabled = !track.enabled; });
  }, [myStream]);

  return {
    myId,
    myStream,
    participants,
    remoteStreams,
    messages,
    me,
    connectionError,
    kicked,
    poll,
    note,
    sendMessage,
    toggleHand,
    moderate,
    toggleMic,
    toggleCamera,
    createPoll,
    votePoll,
    closePoll,
    updateNote
  };
}
