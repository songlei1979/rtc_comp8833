import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://172.31.1.20:5001'); // replace with your actual signaling server URL

const VideoChat = () => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef(null);
  const [name, setName] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Request camera and mic on load
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing media devices:", err);
        alert("Camera or microphone not found or permission denied.");
      });

    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);

    // Clean up
    return () => {
      socket.off('offer', handleReceiveOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleNewICECandidateMsg);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleReceiveOffer = async (incoming) => {
    try {
      peerRef.current = createPeer(false);

      console.log('Setting remote description...');
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(incoming.sdp));

      // Wait for signaling state to become 'have-remote-offer' before creating answer
      if (peerRef.current.signalingState !== 'have-remote-offer') {
        await new Promise(resolve => {
          const checkState = () => {
            if (peerRef.current.signalingState === 'have-remote-offer') {
              peerRef.current.removeEventListener('signalingstatechange', checkState);
              resolve();
            }
          };
          peerRef.current.addEventListener('signalingstatechange', checkState);
        });
      }

      console.log('Creating answer...');
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      console.log('Answer set locally, sending answer...');
      socket.emit('answer', { sdp: peerRef.current.localDescription });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (message) => {
    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleNewICECandidateMsg = (incoming) => {
    try {
      const candidate = new RTCIceCandidate(incoming);
      peerRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding received ICE candidate', error);
    }
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    // Add local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));
    }

    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socket.emit('offer', { sdp: peer.localDescription });
        })
        .catch(error => console.error('Error creating offer:', error));
    }

    return peer;
  };

  const startCall = () => {
    if (!connected) {
      peerRef.current = createPeer(true);
      setConnected(true);
    }
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
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '300px', border: '2px solid #ccc', margin: '10px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', border: '2px solid #ccc', margin: '10px' }} />
      </div>
    </div>
  );
};

export default VideoChat;