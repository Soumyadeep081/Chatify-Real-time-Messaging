'use client';

import { useEffect, useRef, useState } from 'react';
import { insforge } from '../lib/insforge';
import { PhoneOff, MicOff, Mic, VideoOff, Video as VideoIcon } from 'lucide-react';

interface CallOverlayProps {
  callType: 'audio' | 'video';
  roomId: string;
  isCaller: boolean;
  targetName: string;
  currentUser: any;
  onEnd: () => void;
}

export default function CallOverlay({ callType, roomId, isCaller, targetName, currentUser, onEnd }: CallOverlayProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [status, setStatus] = useState<string>('Connecting...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<string>(`call:${roomId}`);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let peer: RTCPeerConnection | null = null;
    let handleSignal: any = null;

    const startCall = async () => {
      try {
        // 1. Get local media
        setStatus('Requesting permissions...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { facingMode: 'user' } : false,
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Setup WebRTC
        setStatus('Connecting to peer...');
        peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        peerRef.current = peer;

        // Add local tracks to peer
        stream.getTracks().forEach((track) => {
          peer!.addTrack(track, stream!);
        });

        // Listen for remote tracks
        peer.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setStatus('Connected');
        };

        // Subscribe to signaling channel
        await insforge.realtime.subscribe(channelRef.current);

        // Handle signaling messages
        handleSignal = async (payload: any) => {
          if (payload.roomId !== roomId) return;
          if (payload.senderId === currentUser.id) return; // ignore own signals
          const { type, data } = payload;

          if (type === 'offer') {
            await peer!.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await peer!.createAnswer();
            await peer!.setLocalDescription(answer);
            insforge.realtime.publish(channelRef.current, 'webrtc_signal', {
              roomId,
              senderId: currentUser.id,
              type: 'answer',
              data: answer,
            });
          } else if (type === 'answer') {
            await peer!.setRemoteDescription(new RTCSessionDescription(data));
          } else if (type === 'ice-candidate') {
            try {
              await peer!.addIceCandidate(new RTCIceCandidate(data));
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          } else if (type === 'end_call') {
             handleEndCall(false);
          }
        };

        insforge.realtime.on('webrtc_signal', handleSignal);

        // Send ICE candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            insforge.realtime.publish(channelRef.current, 'webrtc_signal', {
              roomId,
              senderId: currentUser.id,
              type: 'ice-candidate',
              data: event.candidate,
            });
          }
        };

        // Connection state
        peer.onconnectionstatechange = () => {
          if (peer?.connectionState === 'disconnected' || peer?.connectionState === 'failed') {
            setStatus('Connection lost. Reconnecting...');
            setTimeout(() => { if (peer?.connectionState !== 'connected') handleEndCall(false) }, 5000);
          }
        };

        // 3. If caller, create offer
        if (isCaller) {
          setStatus('Calling...');
          // Add a slight delay to ensure receiver has time to mount correctly 
          // (if they hit answer very quickly before network catches up)
          setTimeout(async () => {
             const offer = await peer!.createOffer();
             await peer!.setLocalDescription(offer);
             insforge.realtime.publish(channelRef.current, 'webrtc_signal', {
               roomId,
               senderId: currentUser.id,
               type: 'offer',
               data: offer,
             });
          }, 1000);
        } else {
          setStatus('Connecting...');
        }
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        setTimeout(() => handleEndCall(false), 3000);
      }
    };

    startCall();

    return () => {
      // Cleanup on unmount
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (peer) peer.close();
      insforge.realtime.off('webrtc_signal', handleSignal);
      insforge.realtime.unsubscribe(channelRef.current);
    };
  }, [roomId, isCaller, callType, currentUser.id]);

  const handleEndCall = (broadcast = true) => {
    if (broadcast) {
      insforge.realtime.publish(channelRef.current, 'webrtc_signal', {
        senderId: currentUser.id,
        type: 'end_call',
      });
    }
    
    // Stop tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    onEnd();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0]?.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!localStream.getVideoTracks()[0]?.enabled);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black text-white flex flex-col pt-safe animate-in fade-in duration-300">
      {/* Remote Video Background */}
      <div className="absolute inset-0 z-0">
         {remoteStream ? (
           <video 
             ref={remoteVideoRef} 
             autoPlay 
             playsInline 
             className={`w-full h-full object-cover transition-opacity duration-1000 opacity-100`} 
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-zinc-900 border-none border-0">
             <div className="flex flex-col items-center">
               <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-6 overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(255,255,255,0.05)] text-4xl text-white/50 animate-pulse">
                  {targetName[0]?.toUpperCase()}
               </div>
               <div className="text-xl px-12 text-center font-bold tracking-tight text-white mb-2">{targetName}</div>
               <div className="text-sm font-medium tracking-widest uppercase text-white/40">{status}</div>
             </div>
           </div>
         )}
      </div>

      {/* Top Header */}
      <div className="relative z-10 w-full p-6 pt-12 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
           {/* WhatsApp like top info */}
           <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10">
              🔒
           </div>
           <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#eaff96]">End-to-End Encrypted</div>
           </div>
        </div>
      </div>

      {/* Picture in Picture (Local Video) */}
      <div className="absolute right-6 top-6 lg:top-auto lg:bottom-[150px] z-20 w-[110px] h-[160px] md:w-[150px] md:h-[220px] rounded-3xl bg-zinc-900 overflow-hidden shadow-2xl border-2 border-white/10 pointer-events-none transition-all hover:scale-105 duration-300">
         <video 
           ref={localVideoRef} 
           autoPlay 
           playsInline 
           muted 
           className="w-full h-full object-cover" 
           style={{ transform: 'scaleX(-1)' }}
         />
         {(isMuted || isVideoOff) && (
           <div className="absolute bottom-3 right-3 flex space-x-1 p-1 bg-black/50 backdrop-blur-xl rounded-xl">
             {isMuted && <MicOff size={12} className="text-red-400" />}
             {isVideoOff && <VideoOff size={12} className="text-white/50" />}
           </div>
         )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-auto relative z-10 w-full p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-end">
        <div className="flex items-center space-x-6">
          {/* Audio toggle */}
          <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-xl ${
              isMuted 
                ? 'bg-white text-black' 
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          {/* End Call */}
          <button 
            onClick={() => handleEndCall(true)}
            className="w-20 h-20 rounded-[2rem] bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:scale-105"
          >
            <PhoneOff size={32} />
          </button>

          {/* Video toggle */}
          <button 
            onClick={toggleVideo}
            disabled={callType === 'audio'}
            className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-xl ${
              callType === 'audio' ? 'opacity-30 cursor-not-allowed bg-white/5 border border-white/5' :
              isVideoOff 
                ? 'bg-white text-black' 
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
