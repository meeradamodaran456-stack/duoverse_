import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function CallOverlay({
  socket,
  user,
  partner,
  outgoingCall,
  incomingCall,
  activeCall,
  setOutgoingCall,
  setIncomingCall,
  setActiveCall
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const { announce } = useAccessibility();

  const isVideo = (outgoingCall?.type === 'VIDEO') || (incomingCall?.type === 'VIDEO') || (activeCall?.type === 'VIDEO');
  const isIncoming = !!incomingCall && !activeCall;
  const isOutgoing = !!outgoingCall && !activeCall;
  const isConnected = !!activeCall;

  // Stun configuration for peer connection
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Timer for active call duration
  useEffect(() => {
    if (isConnected) {
      setCallDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isConnected]);

  // Clean up WebRTC peer connections
  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setOutgoingCall(null);
    setIncomingCall(null);
    setActiveCall(null);
    setErrorMsg('');
  };

  // Setup WebRTC and call signaling
  useEffect(() => {
    if (!socket) return;

    // A. Handle call acceptance (for caller)
    const handleCallAccepted = async ({ answer }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setActiveCall({ type: outgoingCall.type, status: 'connected' });
          announce('Call connected');
        }
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    };

    // B. Handle partner ICE candidates
    const handlePartnerIceCandidate = async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ice candidate:', err);
      }
    };

    socket.on('call-accepted', handleCallAccepted);
    socket.on('partner-ice-candidate', handlePartnerIceCandidate);

    // C. Setup connection if OUTGOING immediately
    if (isOutgoing) {
      setupCall(outgoingCall.type, true);
    }

    return () => {
      socket.off('call-accepted', handleCallAccepted);
      socket.off('partner-ice-candidate', handlePartnerIceCandidate);
    };
  }, [socket, isOutgoing]);

  const setupCall = async (callType, isCaller, offerFromPartner = null) => {
    try {
      // 1. Get media streams
      const constraints = {
        audio: true,
        video: callType === 'VIDEO' ? { facingMode: 'user' } : false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('getUserMedia failed, running call in audio-only/simulated mode:', err);
        // Fallback: If video failed, try audio only
        if (constraints.video) {
          constraints.video = false;
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          throw err;
        }
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local tracks to RTCPeerConnection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote track stream arriving
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle local ICE candidates to emit
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate });
        }
      };

      if (isCaller) {
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call-user', { offer, type: callType });
      } else if (offerFromPartner) {
        // Accept and create answer
        await pc.setRemoteDescription(new RTCSessionDescription(offerFromPartner));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('accept-call', { answer });
      }

    } catch (err) {
      console.error('WebRTC setup failed:', err);
      setErrorMsg('Could not connect: Media device permission required.');
      announce('Call setup failed due to media device issues.');
    }
  };

  // Decline incoming call
  const declineCall = () => {
    socket.emit('end-call', { duration: 0, status: 'MISSED', type: incomingCall?.type || 'AUDIO' });
    cleanup();
  };

  // Accept incoming call
  const acceptCall = () => {
    if (!incomingCall) return;
    setActiveCall({ type: incomingCall.type, status: 'ringing' });
    setupCall(incomingCall.type, false, incomingCall.offer);
    announce('Connecting call...');
  };

  // Hang up Call
  const endCall = () => {
    socket.emit('end-call', {
      duration: callDuration,
      status: 'COMPLETED',
      type: isVideo ? 'VIDEO' : 'AUDIO'
    });
    cleanup();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        announce(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        announce(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off');
      }
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="call-overlay">
      <div style={{ textAlign: 'center', color: 'white', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
          {partner?.name || 'Partner'}
        </h2>
        
        {/* Call Status texts */}
        {isIncoming && <p className="pulse" style={{ color: 'var(--primary-light)' }}>Incoming {isVideo ? 'Video' : 'Audio'} Call...</p>}
        {isOutgoing && <p className="pulse" style={{ color: 'var(--primary-light)' }}>Calling Partner...</p>}
        {isConnected && (
          <p style={{ color: 'var(--success)', fontWeight: '600' }}>
            Call Connected • {formatDuration(callDuration)}
          </p>
        )}
      </div>

      {errorMsg && (
        <div className="glass-panel" style={{ padding: '16px 24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--danger)' }}>
          {errorMsg}
        </div>
      )}

      {/* Video Streams Display */}
      {isVideo && (isConnected || isOutgoing) && (
        <div className="video-grid">
          {/* Local Feed */}
          <div className="video-container">
            <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 5 }}>
              You
            </span>
            <video ref={localVideoRef} className="video-element" autoPlay playsInline muted />
          </div>

          {/* Remote Feed */}
          <div className="video-container">
            <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 5 }}>
              {partner?.name || 'Partner'}
            </span>
            <video ref={remoteVideoRef} className="video-element" autoPlay playsInline />
          </div>
        </div>
      )}

      {/* Call controls layout */}
      <div className="call-actions">
        {isIncoming ? (
          <>
            <button onClick={declineCall} className="call-btn decline focus-ring" aria-label="Decline incoming call">
              <PhoneOff size={24} />
            </button>
            <button onClick={acceptCall} className="call-btn accept focus-ring" aria-label="Accept incoming call">
              <Phone size={24} />
            </button>
          </>
        ) : (
          <>
            {isConnected && (
              <button onClick={toggleMute} className="call-btn mute focus-ring" aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            {isConnected && isVideo && (
              <button onClick={toggleCamera} className="call-btn mute focus-ring" aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}>
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            )}

            <button onClick={endCall} className="call-btn decline focus-ring" aria-label="End call">
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
