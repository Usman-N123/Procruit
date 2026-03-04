import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Monitor, Code, Users, Maximize2, Minimize2, UserX
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { apiRequest } from '../utils/api';

// ICE servers for WebRTC
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface PeerUser {
    socketId: string;
    userId: string;
    userName: string;
}

interface RemoteStream {
    socketId: string;
    userId: string;
    userName: string;
    stream: MediaStream;
}

interface InterviewData {
    _id: string;
    meetingId: string;
    scheduledTime: string;
    status: string;
    candidateId: { _id: string; name: string; email: string; profilePicture?: string };
    recruiterId: { _id: string; name: string; email: string; profilePicture?: string };
    jobId?: { _id: string; title: string; company: string };
}

// ==============================
// Inline CSS for video grid
// ==============================
const VIDEO_GRID_STYLES = `
  .video-grid {
    display: grid;
    gap: 10px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    height: 100%;
    width: 100%;
    align-content: center;
    box-sizing: border-box;
    overflow-y: auto;
  }
  .video-tile {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    background: #111827;
    min-height: 160px;
    max-height: 40vh;
    border: 1px solid rgba(255,255,255,0.07);
    transition: box-shadow 0.2s;
  }
  .video-tile:hover {
    box-shadow: 0 0 0 2px rgba(123, 44, 191, 0.4);
  }
  .video-tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .video-tile .video-label {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: #fff;
    pointer-events: none;
  }
  .video-tile .kick-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(239, 68, 68, 0.85);
    border: none;
    border-radius: 6px;
    color: #fff;
    padding: 5px 7px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s;
    z-index: 10;
  }
  .video-tile:hover .kick-btn {
    opacity: 1;
  }
  .video-tile .kick-btn:hover {
    background: rgba(220, 38, 38, 1);
  }
  .video-tile .local-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(123, 44, 191, 0.75);
    backdrop-filter: blur(6px);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    pointer-events: none;
    letter-spacing: 0.5px;
  }
  .video-tile .video-off-overlay {
    position: absolute;
    inset: 0;
    background: #111827;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .video-tile .avatar-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const InterviewRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    // Interview state
    const [interview, setInterview] = useState<InterviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Waiting Room State
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [admissionRequests, setAdmissionRequests] = useState<PeerUser[]>([]);

    // Media state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isEditorFocused, setIsEditorFocused] = useState(false);

    // Code editor state
    const [code, setCode] = useState<string>('// Welcome to the Procruit Interview Sandbox\n// Write your code here...\n\nfunction solution() {\n  \n}\n');
    const [editorLanguage, setEditorLanguage] = useState('javascript');

    // Remote streams — one entry per connected peer
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

    // Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    // Map of socketId -> RTCPeerConnection (supports multiple peers)
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const isInitiatorRef = useRef(false);
    // Remote video elements — keyed by socketId
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
    // Mirror refs so socket closures always read current code/language
    const codeRef = useRef<string>(code);
    const languageRef = useRef<string>(editorLanguage);
    useEffect(() => { codeRef.current = code; }, [code]);
    useEffect(() => { languageRef.current = editorLanguage; }, [editorLanguage]);

    // Sync ref for admission status — socket handlers check this immediately
    // (React state updates are async and can race with simultaneous events)
    const admittedRef = useRef(false);
    // Queue of peers received via room-users BEFORE admission was confirmed
    const pendingPeersRef = useRef<PeerUser[]>([]);

    // User info
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'recruiter' || user?.role === 'ORG_ADMIN' || user?.role === 'org_admin';

    // ===========================
    // Fetch Interview Details
    // ===========================
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const data = await apiRequest(`/interviews/${id}`);
                setInterview(data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load interview');
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id]);

    // ===========================
    // Create WebRTC Peer Connection
    // ===========================
    const createPeerConnection = useCallback((remoteSocketId: string, peerUser: PeerUser, socket: Socket) => {
        // Avoid creating duplicate connections
        if (peerConnectionsRef.current.has(remoteSocketId)) {
            return peerConnectionsRef.current.get(remoteSocketId)!;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current.set(remoteSocketId, pc);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks — add/update in remoteStreams state
        pc.ontrack = (event) => {
            if (event.streams[0]) {
                const incomingStream = event.streams[0];
                setRemoteStreams((prev) => {
                    const exists = prev.find((rs) => rs.socketId === remoteSocketId);
                    if (exists) {
                        // Update the stream if connection re-negotiated
                        return prev.map((rs) =>
                            rs.socketId === remoteSocketId ? { ...rs, stream: incomingStream } : rs
                        );
                    }
                    return [
                        ...prev,
                        {
                            socketId: remoteSocketId,
                            userId: peerUser.userId,
                            userName: peerUser.userName,
                            stream: incomingStream,
                        },
                    ];
                });

                // Attach stream to the video element if it's already mounted
                const videoEl = remoteVideoRefs.current.get(remoteSocketId);
                if (videoEl) {
                    videoEl.srcObject = incomingStream;
                }
            }
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: remoteSocketId,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (
                pc.iceConnectionState === 'disconnected' ||
                pc.iceConnectionState === 'failed'
            ) {
                addToast('error', 'Connection to peer lost');
                setRemoteStreams((prev) => prev.filter((rs) => rs.socketId !== remoteSocketId));
                peerConnectionsRef.current.delete(remoteSocketId);
            }
        };

        return pc;
    }, [addToast]);

    // ===========================
    // Initialize Media & Socket
    // ===========================
    useEffect(() => {
        if (!interview || error) return;

        let isMounted = true;
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Helper: connects to peers — creates RTCPeerConnection and sends offers
        const connectToPeers = (peers: PeerUser[], socket: Socket) => {
            isInitiatorRef.current = true;
            peers.forEach((peer) => {
                const pc = createPeerConnection(peer.socketId, peer, socket);
                pc.createOffer()
                    .then((offer) => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit('offer', {
                            offer: pc.localDescription,
                            to: peer.socketId,
                        });
                    })
                    .catch((err) => console.error('Error creating offer:', err));
            });
        };

        const initRoom = async () => {
            // 1. Get local media stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err: any) {
                addToast('error', 'Camera/microphone access denied. You can still join but others will not see/hear you.');
                localStreamRef.current = new MediaStream();
            }

            // Recruiters are already considered admitted — they bypass the waiting room
            if (isRecruiter) {
                admittedRef.current = true;
            }

            // 2. Connect to Socket.IO
            const socket = io(window.location.origin, {
                auth: { token, userName: user?.name },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (!isMounted) return;
                addToast('info', 'Connected to interview server');
                socket.emit('join-room', {
                    roomId: interview.meetingId,
                    userId: user?._id || user?.id,
                    userName: user?.name || 'Unknown User',
                    role: user?.role,
                });
            });

            socket.on('waiting-for-host', () => {
                if (!isMounted) return;
                setIsWaitingForHost(true);
            });

            socket.on('admitted', () => {
                if (!isMounted) return;
                admittedRef.current = true;
                setIsWaitingForHost(false);
                addToast('success', '✅ You have been admitted to the interview!');
                socket.emit('request-editor-state', { roomId: interview.meetingId });

                // If any peers were queued (from room-users arriving before admitted),
                // initiate WebRTC connections now.
                if (pendingPeersRef.current.length > 0) {
                    connectToPeers(pendingPeersRef.current, socket);
                    pendingPeersRef.current = [];
                }
            });

            socket.on('admission-denied', () => {
                if (!isMounted) return;
                addToast('error', 'Your request to join was denied');
                socket.disconnect();
                const dashboardPath = isRecruiter ? '/recruiter/dashboard' : '/candidate/dashboard';
                navigate(dashboardPath);
            });

            socket.on('admission-request', (requestingUser: PeerUser) => {
                if (!isMounted) return;
                setAdmissionRequests(prev => {
                    if (prev.find(u => u.socketId === requestingUser.socketId)) return prev;
                    return [...prev, requestingUser];
                });
            });

            socket.on('admission-canceled', ({ socketId }) => {
                if (!isMounted) return;
                setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
            });

            socket.on('connect_error', (err) => {
                if (!isMounted) return;
                addToast('error', `Connection error: ${err.message}`);
            });

            // Existing users already in room — connect to each
            // For candidates: only proceed if already admitted; otherwise queue peers.
            socket.on('room-users', (users: PeerUser[]) => {
                if (!isMounted || users.length === 0) return;

                if (admittedRef.current) {
                    // Already admitted (recruiter or post-admission) — connect immediately
                    connectToPeers(users, socket);
                } else {
                    // Not yet admitted — queue peers for later
                    pendingPeersRef.current = [...pendingPeersRef.current, ...users];
                }
            });

            // New user joined — they will send us an offer
            socket.on('user-connected', (peer: PeerUser) => {
                if (!isMounted) return;
                addToast('success', `${peer.userName} has joined the interview`);
                createPeerConnection(peer.socketId, peer, socket);
            });

            // WebRTC: Receive offer
            socket.on('offer', async ({ offer, from, userId, userName }) => {
                if (!isMounted) return;
                try {
                    const peerUser: PeerUser = { socketId: from, userId, userName };
                    const pc = createPeerConnection(from, peerUser, socket);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', { answer, to: from });
                } catch (err) {
                    console.error('Error handling offer:', err);
                }
            });

            // WebRTC: Receive answer
            socket.on('answer', async ({ answer, from }) => {
                if (!isMounted) return;
                try {
                    const pc = peerConnectionsRef.current.get(from);
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                } catch (err) {
                    console.error('Error handling answer:', err);
                }
            });

            // WebRTC: Receive ICE candidate
            socket.on('ice-candidate', async ({ candidate, from }) => {
                if (!isMounted) return;
                try {
                    const pc = peerConnectionsRef.current.get(from);
                    if (pc && candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (err) {
                    console.error('Error handling ICE candidate:', err);
                }
            });

            // Code sync from peer
            socket.on('code-change', ({ code: incomingCode, language }) => {
                if (!isMounted) return;
                setCode(incomingCode);
                // language is only set on language-change events now, kept for backward compat
                if (language !== undefined) setEditorLanguage(language);
            });

            // Language-only change from peer
            socket.on('language-change', ({ language: incomingLang }) => {
                if (!isMounted) return;
                setEditorLanguage(incomingLang);
            });

            // Reconnect re-sync: ask the room for current editor state
            socket.on('provide-editor-state', ({ requesterId }) => {
                if (!isMounted) return;
                // Respond directly to the requester with our current state
                // We read directly from React state via a ref pattern
                socket.emit('editor-state-response', {
                    targetSocketId: requesterId,
                    code: codeRef.current,
                    language: languageRef.current,
                });
            });

            // Receive synced state after a reconnect
            socket.on('editor-state-sync', ({ code: syncedCode, language: syncedLang }) => {
                if (!isMounted) return;
                setCode(syncedCode);
                setEditorLanguage(syncedLang);
                addToast('info', 'Editor re-synced with the latest session state.');
            });

            // On reconnect: request editor state from anyone already in the room
            socket.io.on('reconnect', () => {
                if (!isMounted || !interview) return;
                socket.emit('join-room', {
                    roomId: interview.meetingId,
                    userId: user?._id || user?.id,
                    userName: user?.name || 'Unknown User',
                    role: user?.role,
                });
                socket.emit('request-editor-state', { roomId: interview.meetingId });
            });

            // User disconnected — remove their stream and peer connection
            socket.on('user-disconnected', ({ socketId, userName: disconnectedName }) => {
                if (!isMounted) return;
                addToast('info', `${disconnectedName} has left the interview`);
                const pc = peerConnectionsRef.current.get(socketId);
                if (pc) {
                    pc.close();
                    peerConnectionsRef.current.delete(socketId);
                }
                setRemoteStreams((prev) => prev.filter((rs) => rs.socketId !== socketId));
            });

            // ==============================
            // Kicked from room (target user)
            // ==============================
            socket.on('kicked-from-room', () => {
                if (!isMounted) return;
                addToast('error', 'You have been removed from the session by the host.');
                // Clean up all connections
                peerConnectionsRef.current.forEach((pc) => pc.close());
                peerConnectionsRef.current.clear();
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((t) => t.stop());
                }
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach((t) => t.stop());
                }
                socket.disconnect();
                // Redirect to appropriate dashboard after a short delay to let toast show
                setTimeout(() => {
                    const dashboardPath = user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';
                    navigate(dashboardPath);
                }, 1500);
            });
        };

        initRoom();

        return () => {
            isMounted = false;
            // Cleanup
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            peerConnectionsRef.current.forEach((pc) => pc.close());
            peerConnectionsRef.current.clear();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [interview, error]);

    // ===========================
    // Attach stream to video elements after render
    // ===========================

    // Callback ref for local video — re-attaches stream whenever the
    // <video> element mounts (e.g. when transitioning from waiting room
    // to the active room, React unmounts the old element and mounts a new one).
    const setLocalVideoRef = useCallback((el: HTMLVideoElement | null) => {
        (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
        if (el && localStreamRef.current) {
            el.srcObject = localStreamRef.current;
        }
    }, []);

    // When a video element mounts for a remote stream, attach the stream
    const setRemoteVideoRef = useCallback((socketId: string, el: HTMLVideoElement | null) => {
        remoteVideoRefs.current.set(socketId, el);
        if (el) {
            const rs = remoteStreams.find((r) => r.socketId === socketId);
            if (rs?.stream) {
                el.srcObject = rs.stream;
            }
        }
    }, [remoteStreams]);

    // ===========================
    // Control Functions
    // ===========================
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            videoTracks.forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
            }
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    peerConnectionsRef.current.forEach((pc) => {
                        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(videoTrack);
                    });
                }
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace track in all peer connections
                peerConnectionsRef.current.forEach((pc) => {
                    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
                addToast('info', 'Screen sharing started');
            } catch (err) {
                addToast('error', 'Failed to start screen sharing');
            }
        }
    };

    const admitCandidate = (socketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('admit-user', { targetSocketId: socketId });
            setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
        }
    };

    const denyCandidate = (socketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('deny-user', { targetSocketId: socketId });
            setAdmissionRequests(prev => prev.filter(u => u.socketId !== socketId));
        }
    };

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        const dashboardPath = user?.role === 'RECRUITER' ? '/recruiter/schedule' : '/candidate/interviews';
        navigate(dashboardPath);
    };

    const kickParticipant = (targetSocketId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('kick-user', { targetSocketId });
            addToast('info', 'Participant has been removed from the session.');
        }
    };

    // ===========================
    // Code Editor Change
    // ===========================
    const handleCodeChange = (value: string | undefined) => {
        const newCode = value || '';
        setCode(newCode);
        if (socketRef.current && interview) {
            socketRef.current.emit('code-change', {
                roomId: interview.meetingId,
                code: newCode,
                language: editorLanguage,
            });
        }
    };

    // ===========================
    // Loading / Error States
    // ===========================
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Loading interview room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <VideoOff className="text-red-400" size={28} />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Cannot Join Interview</h2>
                    <p className="text-neutral-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-[#7B2CBF] text-white rounded-lg hover:bg-[#9D4EDD] transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (isWaitingForHost) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6 px-4">
                <style>{VIDEO_GRID_STYLES}</style>
                <ToastContainer />

                {/* Camera preview so the candidate can check A/V before being admitted */}
                <div className="relative rounded-xl overflow-hidden border border-[#7B2CBF]/30 shadow-xl shadow-purple-900/20" style={{ width: 280, height: 200 }}>
                    <video
                        ref={setLocalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                            <VideoOff size={32} className="text-neutral-600" />
                        </div>
                    )}
                    <span style={{
                        position: 'absolute', bottom: 8, left: 8,
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#fff'
                    }}>{user?.name || 'You'}</span>

                    {/* Mini A/V controls */}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                            onClick={toggleMute}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs ${isMuted ? 'bg-red-500/80' : 'bg-black/60 hover:bg-black/80'
                                }`}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs ${isVideoOff ? 'bg-red-500/80' : 'bg-black/60 hover:bg-black/80'
                                }`}
                            title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
                        >
                            {isVideoOff ? <VideoOff size={13} /> : <Video size={13} />}
                        </button>
                    </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-[#7B2CBF]/20 border border-[#7B2CBF]/40 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-[#9D4EDD]" size={24} />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Waiting for Host</h2>
                    <p className="text-neutral-400 mb-6 text-center max-w-md text-sm">
                        You are in the waiting room. The host will admit you shortly.
                    </p>
                    <div className="flex gap-2 items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#7B2CBF] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#7B2CBF] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#7B2CBF] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (socketRef.current) socketRef.current.disconnect();
                        navigate(-1);
                    }}
                    className="px-6 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                >
                    Leave Waiting Room
                </button>
            </div>
        );
    }

    const totalConnected = remoteStreams.length + 1; // +1 for local

    return (
        <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
            {/* Inject video grid styles */}
            <style>{VIDEO_GRID_STYLES}</style>
            <ToastContainer />

            {/* Top Bar */}
            <header className="h-14 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between px-4 flex-shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-xs font-bold shadow-lg shadow-purple-500/20">
                        AI
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold">
                            {interview?.jobId?.title ? `Interview: ${interview.jobId.title}` : 'Procruit Interview'}
                        </h1>
                        <p className="text-xs text-neutral-500">
                            {interview?.meetingId?.slice(0, 8)}... • {interview?.status}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Participant count */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-full">
                        <Users size={12} className="text-neutral-400" />
                        <span className="text-xs text-neutral-400">{totalConnected} participant{totalConnected !== 1 ? 's' : ''}</span>
                    </div>

                    {remoteStreams.length > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            <span className="text-xs text-yellow-400">Waiting for participant...</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content — Split View */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Admission Requests Overlay (Recruiter Only) */}
                {isRecruiter && admissionRequests.length > 0 && (
                    <div className="absolute top-4 right-4 z-50 flex flex-col gap-3">
                        {admissionRequests.map(req => (
                            <div key={req.socketId} className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl shadow-2xl w-80 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#7B2CBF]/20 rounded-full flex items-center justify-center">
                                        <Users className="text-[#9D4EDD]" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">{req.userName}</p>
                                        <p className="text-xs text-neutral-400">wants to join</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => denyCandidate(req.socketId)}
                                        className="flex-1 py-1.5 px-3 rounded text-sm font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition border border-neutral-700"
                                    >
                                        Deny
                                    </button>
                                    <button
                                        onClick={() => admitCandidate(req.socketId)}
                                        className="flex-1 py-1.5 px-3 rounded text-sm font-medium bg-[#7B2CBF] text-white hover:bg-[#9D4EDD] transition"
                                    >
                                        Admit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Left Side: Code Editor */}
                <div className={`flex flex-col transition-all duration-300 ${isEditorFocused ? 'flex-[3]' : 'flex-[2]'}`}>
                    {/* Editor Header */}
                    <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <Code size={14} className="text-[#7B2CBF]" />
                            <span className="text-xs font-medium text-neutral-400">Coding Sandbox</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={editorLanguage}
                                onChange={(e) => {
                                    const lang = e.target.value;
                                    setEditorLanguage(lang);
                                    if (socketRef.current && interview) {
                                        socketRef.current.emit('language-change', {
                                            roomId: interview.meetingId,
                                            language: lang,
                                        });
                                    }
                                }}
                                className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded px-2 py-1 focus:border-[#7B2CBF] outline-none"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="csharp">C#</option>
                                <option value="go">Go</option>
                                <option value="rust">Rust</option>
                                <option value="sql">SQL</option>
                            </select>
                            <button
                                onClick={() => setIsEditorFocused(!isEditorFocused)}
                                className="text-neutral-500 hover:text-white transition-colors p-1"
                                title={isEditorFocused ? 'Minimize editor' : 'Maximize editor'}
                            >
                                {isEditorFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            language={editorLanguage}
                            theme="vs-dark"
                            value={code}
                            onChange={handleCodeChange}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16 },
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                bracketPairColorization: { enabled: true },
                                cursorBlinking: 'smooth',
                                smoothScrolling: true,
                                wordWrap: 'on',
                            }}
                        />
                    </div>
                </div>

                {/* Right Side: Dynamic CSS Grid Video Feeds */}
                <div className="flex-1 min-w-[300px] max-w-[520px] bg-neutral-950 border-l border-neutral-800 overflow-hidden">
                    <div className="video-grid" style={{ height: '100%' }}>

                        {/* Local Video Tile */}
                        <div className="video-tile">
                            <video
                                ref={setLocalVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {isVideoOff && (
                                <div className="video-off-overlay">
                                    <div className="avatar-circle">
                                        <VideoOff size={24} className="text-neutral-600" />
                                    </div>
                                </div>
                            )}
                            <span className="local-badge">YOU {isScreenSharing && '· SCREEN'}</span>
                            <span className="video-label">{user?.name || 'You'}</span>
                        </div>

                        {/* Remote Video Tiles — one per connected peer */}
                        {remoteStreams.map((rs) => (
                            <div key={rs.socketId} className="video-tile">
                                <video
                                    ref={(el) => setRemoteVideoRef(rs.socketId, el)}
                                    autoPlay
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <span className="video-label">{rs.userName}</span>

                                {/* Kick button — Recruiter only, appears on hover */}
                                {isRecruiter && (
                                    <button
                                        className="kick-btn"
                                        onClick={() => kickParticipant(rs.socketId)}
                                        title={`Remove ${rs.userName} from session`}
                                    >
                                        <UserX size={13} />
                                        Kick
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Empty waiting state — only when no remote peers connected */}
                        {remoteStreams.length === 0 && (
                            <div className="video-tile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                                <div className="avatar-circle" style={{ width: 72, height: 72 }}>
                                    <Users size={30} className="text-neutral-600" />
                                </div>
                                <p style={{ color: '#6b7280', fontSize: 13 }}>Waiting for participant...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Control Bar */}
            <footer className="h-16 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-center gap-3 flex-shrink-0 backdrop-blur-sm">
                {/* Mute */}
                <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isMuted
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Video Toggle */}
                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isVideoOff
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        }`}
                    title={isVideoOff ? 'Turn on Video' : 'Turn off Video'}
                >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>

                {/* Screen Share */}
                <button
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isScreenSharing
                        ? 'bg-[#7B2CBF]/20 text-[#7B2CBF] border border-[#7B2CBF]/30 hover:bg-[#7B2CBF]/30'
                        : 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                        }`}
                    title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                    <Monitor size={20} />
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-neutral-700 mx-1" />

                {/* End Call — visible to ALL users */}
                <button
                    onClick={endCall}
                    className="h-11 px-5 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95 text-sm font-medium"
                    title="End Call & Leave"
                >
                    <PhoneOff size={18} />
                    <span>End Call</span>
                </button>

                {/* Divider — only shown when recruiter controls appear */}
                {isRecruiter && remoteStreams.length > 0 && (
                    <>
                        <div className="w-px h-8 bg-neutral-700 mx-1" />
                        {/* Quick-kick from footer when only 1 remote peer */}
                        {remoteStreams.length === 1 && (
                            <button
                                onClick={() => kickParticipant(remoteStreams[0].socketId)}
                                className="h-11 px-4 rounded-full bg-neutral-800 text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium"
                                title={`Remove ${remoteStreams[0].userName} from session`}
                            >
                                <UserX size={18} />
                                <span>Kick Candidate</span>
                            </button>
                        )}
                    </>
                )}
            </footer>
        </div>
    );
};

export default InterviewRoom;
