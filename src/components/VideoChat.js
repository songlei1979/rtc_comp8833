import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5001'); // signaling server URL

const VideoChat = () => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const [name, setName] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);
  }, []);

  const handleReceiveOffer = async (incoming) => {
    peerRef.current = createPeer(false);
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit('answer', { sdp: peerRef.current.localDescription });
  };

  const handleAnswer = async (message) => {
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
  };

  const handleNewICECandidateMsg = (incoming) => {
    const candidate = new RTCIceCandidate(incoming);
    peerRef.current.addIceCandidate(candidate);
  };

  const createPeer = (isInitiator) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', e.candidate);
      }
    };

    peer.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    if (isInitiator) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        localVideoRef.current.srcObject = stream;
        peer.createOffer().then(offer => {
          peer.setLocalDescription(offer);
          socket.emit('offer', { sdp: offer });
        });
      });
    }

    return peer;
  };

  const startCall = () => {
    peerRef.current = createPeer(true);
    setConnected(true);
  };

  return (
    <div>
      {!connected && (
        <>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
          <button onClick={startCall}>Join</button>
        </>
      )}
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '300px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }} />
      </div>
    </div>
  );
};

export default VideoChat;
