import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { socket } from '../api/socket';

export function useRoom(roomId, auth) {
  const [myId, setMyId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [kicked, setKicked] = useState(false);
  const [poll, setPoll] = useState(null);
  const [note, setNote] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]);

  // Partage d'écran
  const [screenStream, setScreenStream] = useState(null);
  const [sharingPeerId, setSharingPeerId] = useState(null);

  // Enregistrement
  const [isRecording, setIsRecording] = useState(false);

  const peerRef = useRef(null);
  const callsRef = useRef({});
  const screenCallsRef = useRef({});
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const me = participants.find((p) => p.peerId === myId);

  // --- Connexion initiale : Socket.io + PeerJS ---
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
      socket.emit('join-room', { roomId, peerId: id, token: auth?.token });
    });

    peer.on('error', (err) => {
      console.error('Erreur PeerJS :', err);
      setConnectionError("Impossible d'établir la connexion audio/vidéo.");
    });

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(setMyStream)
        .catch((err) => {
          console.warn('Caméra/micro indisponible :', err);
        });
    }

    socket.on('room-users', setParticipants);
    socket.on('receive-message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('poll-updated', setPoll);
    socket.on('note-updated', setNote);
    socket.on('receive-private-message', (msg) => setPrivateMessages((prev) => [...prev, msg]));

    socket.on('screen-share-started', ({ peerId }) => setSharingPeerId(peerId));
    socket.on('screen-share-stopped', () => {
      setSharingPeerId(null);
      setScreenStream((prev) => {
        // ne coupe pas notre propre flux local si c'est nous qui partageons encore
        return prev;
      });
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

    return () => {
      peer.destroy();
      socket.disconnect();
      socket.off('room-users');
      socket.off('receive-message');
      socket.off('user-disconnected');
      socket.off('you-were-kicked');
      socket.off('poll-updated');
      socket.off('note-updated');
      socket.off('receive-private-message');
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // --- Réception des appels PeerJS (caméra ou écran) ---
  useEffect(() => {
    const peer = peerRef.current;
    if (!peer) return;

    const handleIncomingCall = (call) => {
      if (call.metadata?.type === 'screen') {
        call.answer();
        call.on('stream', (stream) => {
          setScreenStream(stream);
          setSharingPeerId(call.peer);
        });
        return;
      }
      call.answer(myStream || undefined);
      call.on('stream', (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }));
      });
      callsRef.current[call.peer] = call;
    };

    peer.on('call', handleIncomingCall);
    return () => peer.off('call', handleIncomingCall);
  }, [myStream]);

  // --- Appeler les nouveaux venus avec notre flux caméra ---
  useEffect(() => {
    if (!myStream) return;
    const peer = peerRef.current;

    const handleUserConnected = (peerId) => {
      const call = peer.call(peerId, myStream);
      call.on('stream', (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
      });
      callsRef.current[peerId] = call;
    };

    socket.on('user-connected', handleUserConnected);
    return () => socket.off('user-connected', handleUserConnected);
  }, [myStream]);

  // --- Actions : chat, main levée, modération, contrôles média ---
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

  // --- Sondages ---
  const createPoll = useCallback(
    (question, options) => {
      if (!myId) return;
      socket.emit('create-poll', { roomId, requesterId: myId, question, options });
    },
    [roomId, myId]
  );

  const votePoll = useCallback(
    (optionId) => {
      if (!myId) return;
      socket.emit('vote-poll', { roomId, userId: myId, optionId });
    },
    [roomId, myId]
  );

  const closePoll = useCallback(() => {
    if (!myId) return;
    socket.emit('close-poll', { roomId, requesterId: myId });
  }, [roomId, myId]);

  // --- Notes partagées ---
  const updateNote = useCallback(
    (content) => {
      if (!myId) return;
      setNote(content);
      socket.emit('update-note', { roomId, requesterId: myId, content });
    },
    [roomId, myId]
  );

  // --- Discussion privée ---
  const sendPrivateMessage = useCallback(
    (toId, text) => {
      if (!text.trim() || !myId) return;
      socket.emit('send-private-message', { roomId, fromId: myId, toId, message: text });
    },
    [roomId, myId]
  );

  // --- Partage d'écran ---
  const startScreenShare = useCallback(async () => {
    if (!myId) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setSharingPeerId(myId);

      stream.getVideoTracks()[0].onended = () => stopScreenShare();

      participants.forEach((p) => {
        if (p.peerId === myId) return;
        const call = peerRef.current.call(p.peerId, stream, { metadata: { type: 'screen' } });
        screenCallsRef.current[p.peerId] = call;
      });

      socket.emit('start-screen-share', { roomId, requesterId: myId });
    } catch (err) {
      console.warn('Partage d\'écran refusé ou indisponible :', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, roomId, participants]);

  const stopScreenShare = useCallback(() => {
    screenStream?.getTracks().forEach((t) => t.stop());
    Object.values(screenCallsRef.current).forEach((c) => c.close());
    screenCallsRef.current = {};
    setScreenStream(null);
    setSharingPeerId(null);
    if (myId) socket.emit('stop-screen-share', { roomId, requesterId: myId });
  }, [screenStream, roomId, myId]);

  const toggleScreenShare = useCallback(() => {
    if (sharingPeerId === myId) stopScreenShare();
    else startScreenShare();
  }, [sharingPeerId, myId, startScreenShare, stopScreenShare]);

  // --- Enregistrement (local + serveur) ---
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }
    if (!myStream) {
      console.warn('Impossible d\'enregistrer : aucun flux caméra/micro disponible.');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(myStream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });

      // Enregistrement local : téléchargement direct dans le navigateur
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bigblue-${roomId}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      // Enregistrement serveur : envoi vers le backend (stockage Minio)
      const formData = new FormData();
      formData.append('recording', blob, 'recording.webm');
      formData.append('roomId', roomId);
      fetch('/api/recordings/upload', { method: 'POST', body: formData }).catch((err) => {
        console.error('Échec de l\'envoi de l\'enregistrement au serveur :', err);
      });

      setIsRecording(false);
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [isRecording, myStream, roomId]);

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
    privateMessages,
    screenStream,
    sharingPeerId,
    isRecording,
    sendMessage,
    toggleHand,
    moderate,
    toggleMic,
    toggleCamera,
    createPoll,
    votePoll,
    closePoll,
    updateNote,
    sendPrivateMessage,
    toggleScreenShare,
    toggleRecording
  };
}
