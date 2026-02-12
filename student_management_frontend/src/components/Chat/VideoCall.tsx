import React, { useEffect, useRef, useState } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiAlertTriangle } from 'react-icons/fi';
import Button from '@/components/UI/Button';
import toast from 'react-hot-toast';

interface VideoCallProps {
  callId: number | string;
  isInitiator: boolean;
  onClose: () => void;
  currentUser: any;
  audioOnly?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ callId, isInitiator, onClose, currentUser, audioOnly = false }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(audioOnly);
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const iceCandidatesQueues = useRef<Map<string, RTCIceCandidate[]>>(new Map());

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = async () => {
    try {
      setStatus('Accessing media devices...');
      const constraints = {
        video: !audioOnly,
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current && !audioOnly) {
        localVideoRef.current.srcObject = stream;
      }

      setStatus('Connecting to signaling server...');
      const token = localStorage.getItem('access_token');
      // Ensure we use the correct protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
      const wsUrl = `${protocol}//${host}/ws/video-call/${callId}/?token=${token}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Video socket connected');
        setStatus('Waiting for participants...');
        
        // In a group call, we wait for user_joined or offer
        // If we're the initiator, we still wait for others to join before sending offers
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await handleSignalMessage(data, stream);
        } catch (e) {
          console.error('Error parsing signaling message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Please try again.');
        setStatus('Connection Failed');
        toast.error('Video call connection failed');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (status !== 'Call Ended') {
            setStatus('Disconnected');
            toast.error('Call disconnected');
        }
      };

    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone. Please allow permissions.');
      setStatus('Error');
    }
  };

  const createPeerConnection = (stream: MediaStream, targetUsername: string): RTCPeerConnection | undefined => {
    try {
      console.log('Creating peer connection for:', targetUsername);
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(targetUsername, pc);

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Remote track received from:', targetUsername);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(targetUsername, event.streams[0]);
          return next;
        });
        setStatus('Connected');
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            action: 'ice-candidate',
            candidate: event.candidate,
            target: targetUsername, // Target the specific user
            username: currentUser.username
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${targetUsername}:`, pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            removeParticipant(targetUsername);
        }
      };

      return pc;
    } catch (e) {
      console.error('Error creating peer connection:', e);
      return undefined;
    }
  };

  const removeParticipant = (username: string) => {
    const pc = peerConnections.current.get(username);
    if (pc) {
      pc.close();
      peerConnections.current.delete(username);
    }
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(username);
      return next;
    });
    iceCandidatesQueues.current.delete(username);
    
    if (peerConnections.current.size === 0) {
      setStatus('Waiting for participants...');
    }
  };

  const createOffer = async (pc: RTCPeerConnection, targetUsername: string) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: 'offer',
          offer: offer,
          target: targetUsername,
          username: currentUser.username
        }));
      }
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleSignalMessage = async (data: any, localStream: MediaStream) => {
    // Ignore own messages
    if (data.username === currentUser.username) return;

    // For group calls, check if this message is for us
    if (data.target && data.target !== currentUser.username) return;

    console.log('Received signal:', data.action, 'from:', data.username);

    try {
      if (data.action === 'user_joined') {
        // Someone joined. If we are already here, we create an offer for them.
        // In mesh, the person who was already there usually initiates.
        let pc = peerConnections.current.get(data.username);
        if (!pc) {
          pc = createPeerConnection(localStream, data.username);
          if (pc) {
            await createOffer(pc, data.username);
          }
        }
      } else if (data.action === 'offer') {
        let pc = peerConnections.current.get(data.username);
        if (!pc) {
          pc = createPeerConnection(localStream, data.username);
        }
        
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Process queued ICE candidates for this user
        const queue = iceCandidatesQueues.current.get(data.username) || [];
        while (queue.length > 0) {
            const candidate = queue.shift();
            if (candidate) await pc.addIceCandidate(candidate);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            action: 'answer',
            answer: answer,
            target: data.username,
            username: currentUser.username
          }));
        }
      } else if (data.action === 'answer') {
        const pc = peerConnections.current.get(data.username);
        if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            // Process queued ICE candidates
            const queue = iceCandidatesQueues.current.get(data.username) || [];
            while (queue.length > 0) {
                const candidate = queue.shift();
                if (candidate) await pc.addIceCandidate(candidate);
            }
        }
      } else if (data.action === 'ice-candidate') {
        const pc = peerConnections.current.get(data.username);
        const candidate = new RTCIceCandidate(data.candidate);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate);
        } else {
            let queue = iceCandidatesQueues.current.get(data.username);
            if (!queue) {
                queue = [];
                iceCandidatesQueues.current.set(data.username, queue);
            }
            queue.push(candidate);
        }
      } else if (data.action === 'user_left') {
        removeParticipant(data.username);
      }
    } catch (err) {
      console.error('Error handling signal:', err);
    }
  };

  const endCall = () => {
    setStatus('Call Ended');
    
    // Notify others
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'user_left',
        username: currentUser.username
      }));
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-6xl h-full flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
        
        {/* Videos Grid */}
        <div className={`flex-1 p-4 grid gap-4 ${
          remoteStreams.size === 0 ? 'grid-cols-1' :
          remoteStreams.size === 1 ? 'grid-cols-1 md:grid-cols-2' :
          remoteStreams.size === 2 ? 'grid-cols-1 md:grid-cols-3' :
          'grid-cols-2 md:grid-cols-4'
        }`}>
          
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-primary-500 shadow-lg">
            {!audioOnly ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <FiMic className={`h-16 w-16 ${isMuted ? 'text-red-500' : 'text-primary-400'}`} />
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black bg-opacity-60 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-sm font-medium text-white">You</span>
              {isMuted && <FiMicOff className="h-3.5 w-3.5 text-red-500" />}
            </div>
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams.entries()).map(([username, stream]) => (
            <div key={username} className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              {!audioOnly ? (
                <VideoElement stream={stream} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <FiMic className="h-16 w-16 text-primary-400" />
                  <AudioElement stream={stream} />
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black bg-opacity-60 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-sm font-medium text-white">{username}</span>
              </div>
            </div>
          ))}

          {/* Status Overlay when alone */}
          {remoteStreams.size === 0 && (
            <div className="flex flex-col items-center justify-center text-white p-8">
              {error ? (
                <div className="text-center p-8 bg-red-900/30 rounded-2xl border border-red-500/50 max-w-md">
                  <FiAlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3">Connection Failed</h3>
                  <p className="text-gray-400 mb-8">{error}</p>
                  <Button onClick={endCall} variant="danger" className="w-full">Close Call</Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary-500 opacity-20"></div>
                    <div className="relative rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500 mx-auto"></div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">{status}</h3>
                  <p className="text-gray-400">Waiting for others to join the call...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Controls Bar */}
        <div className="bg-gray-800/80 backdrop-blur-md border-t border-white/10 p-6 flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full transition-all transform hover:scale-110 ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <FiMicOff className="h-7 w-7" /> : <FiMic className="h-7 w-7" />}
          </button>
          
          {!audioOnly && (
            <button
              onClick={toggleVideo}
              className={`p-5 rounded-full transition-all transform hover:scale-110 ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
            >
              {isVideoOff ? <FiVideoOff className="h-7 w-7" /> : <FiVideo className="h-7 w-7" />}
            </button>
          )}
          
          <button
            onClick={endCall}
            className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all transform hover:scale-110 shadow-xl"
            title="End Call"
          >
            <FiPhoneOff className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper components for remote streams
const VideoElement: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
};

const AudioElement: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay />;
};

export default VideoCall;
