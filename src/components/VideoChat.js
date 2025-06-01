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
  const [mediaError, setMediaError] = useState(null);
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => {
    // Check if we're in a secure context
    const checkSecureContext = () => {
      const isSecure = window.isSecureContext ||
                      window.location.protocol === 'https:' ||
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';
      setIsSecureContext(isSecure);
      return isSecure;
    };

    if (!checkSecureContext()) {
      setMediaError('Media devices require a secure context (HTTPS) or localhost. Please access this app via localhost or HTTPS.');
      return;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Media devices not supported in this browser or context.');
      return;
    }

    // Request camera and mic on load
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setMediaError(null);
      })
      .catch(err => {
        console.error("Error accessing media devices:", err);
        let errorMessage = "Camera or microphone access failed: ";

        switch(err.name) {
          case 'NotAllowedError':
            errorMessage += "Permission denied. Please allow camera and microphone access.";
            break;
          case 'NotFoundError':
            errorMessage += "No camera or microphone found.";
            break;
          case 'NotReadableError':
            errorMessage += "Camera or microphone is already in use.";
            break;
          case 'OverconstrainedError':
            errorMessage += "Camera or microphone constraints cannot be satisfied.";
            break;
          case 'SecurityError':
            errorMessage += "Access blocked due to security restrictions.";
            break;
          default:
            errorMessage += err.message || "Unknown error occurred.";
        }

        setMediaError(errorMessage);
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
    if (!connected && localStreamRef.current) {
      peerRef.current = createPeer(true);
      setConnected(true);
    }
  };

  // Render error state
  if (mediaError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: 'red' }}>Media Access Error</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>{mediaError}</p>

        {!isSecureContext && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h4>Solutions:</h4>
            <ul style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>Access the app via <strong>localhost:3000</strong> instead of the IP address</li>
              <li>Set up HTTPS for your development server</li>
              <li>Use a reverse proxy with SSL termination</li>
            </ul>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {!connected && (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            style={{ padding: '8px', margin: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={startCall}
            disabled={!localStreamRef.current}
            style={{
              padding: '10px 20px',
              background: localStreamRef.current ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: localStreamRef.current ? 'pointer' : 'not-allowed',
              margin: '10px'
            }}
          >
            Join Call
          </button>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4>Your Video</h4>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '300px',
              height: '200px',
              border: '2px solid #28a745',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '300px',
              height: '200px',
              border: '2px solid #007bff',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
