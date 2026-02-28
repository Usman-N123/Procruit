import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Monitor, Code, Users, Maximize2, Minimize2
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

interface InterviewData {
    _id: string;
    meetingId: string;
    scheduledTime: string;
    status: string;
    candidateId: { _id: string; name: string; email: string; profilePicture?: string };
    recruiterId: { _id: string; name: string; email: string; profilePicture?: string };
    jobId?: { _id: string; title: string; company: string };
}

const InterviewRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    // Interview state
    const [interview, setInterview] = useState<InterviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Media state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isEditorFocused, setIsEditorFocused] = useState(false);

    // Code editor state
    const [code, setCode] = useState<string>('// Welcome to the Procruit Interview Sandbox\n// Write your code here...\n\nfunction solution() {\n  \n}\n');
    const [editorLanguage, setEditorLanguage] = useState('javascript');

    // Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const isInitiatorRef = useRef(false);

    // Remote user info
    const [remoteUser, setRemoteUser] = useState<PeerUser | null>(null);
    const [isRemoteConnected, setIsRemoteConnected] = useState(false);

    // User info
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

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
                // Create stream with no tracks as fallback
                localStreamRef.current = new MediaStream();
            }

            // 2. Connect to Socket.IO
            const socket = io(window.location.origin, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (!isMounted) return;
                addToast('info', 'Connected to interview server');
                socket.emit('join-room', interview.meetingId);
            });

            socket.on('connect_error', (err) => {
                if (!isMounted) return;
                addToast('error', `Connection error: ${err.message}`);
            });

            // Existing users already in room
            socket.on('room-users', (users: PeerUser[]) => {
                if (!isMounted || users.length === 0) return;
                // Connect to the first existing user (1-on-1 interview)
                const peer = users[0];
                setRemoteUser(peer);
                isInitiatorRef.current = true;
                createPeerConnection(peer.socketId, socket);
            });

            // New user joined
            socket.on('user-connected', (peer: PeerUser) => {
                if (!isMounted) return;
                addToast('success', `${peer.userName} has joined the interview`);
                setRemoteUser(peer);
                // If we haven't initiated yet, the new user will send an offer
                if (!peerConnectionRef.current) {
                    isInitiatorRef.current = false;
                    createPeerConnection(peer.socketId, socket);
                }
            });

            // WebRTC: Receive offer
            socket.on('offer', async ({ offer, from, userName }) => {
                if (!isMounted) return;
                try {
                    if (!peerConnectionRef.current) {
                        createPeerConnection(from, socket);
                    }
                    const pc = peerConnectionRef.current!;
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
                    const pc = peerConnectionRef.current;
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
                    const pc = peerConnectionRef.current;
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
                if (language) setEditorLanguage(language);
            });

            // User disconnected
            socket.on('user-disconnected', ({ userName }) => {
                if (!isMounted) return;
                addToast('info', `${userName} has left the interview`);
                setIsRemoteConnected(false);
                setRemoteUser(null);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
                // Clean up peer connection
                if (peerConnectionRef.current) {
                    peerConnectionRef.current.close();
                    peerConnectionRef.current = null;
                }
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
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [interview, error]);

    // ===========================
    // Create WebRTC Peer Connection
    // ===========================
    const createPeerConnection = useCallback((remoteSocketId: string, socket: Socket) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsRemoteConnected(true);
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
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                addToast('error', 'Connection to peer lost');
                setIsRemoteConnected(false);
            }
        };

        // If we are the initiator, create and send offer
        if (isInitiatorRef.current) {
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit('offer', {
                        offer: pc.localDescription,
                        to: remoteSocketId,
                    });
                })
                .catch((err) => console.error('Error creating offer:', err));
        }
    }, [addToast]);

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
            // Stop screen sharing, revert to camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
            }
            if (localStreamRef.current && peerConnectionRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
            }
            setIsScreenSharing(false);
        } else {
            // Start screen sharing
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;

                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace the video track in the peer connection
                if (peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                }

                // Show screen in local preview
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                // When user stops sharing from browser UI
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

    const endCall = () => {
        // Clean up everything
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Navigate back to dashboard
        const dashboardPath = user?.role === 'RECRUITER' ? '/recruiter/schedule' : '/candidate/interviews';
        navigate(dashboardPath);
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

    // Get participant names
    const otherParticipant = user?._id === interview?.recruiterId?._id
        ? interview?.candidateId
        : interview?.recruiterId;

    return (
        <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
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
                    {isRemoteConnected && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400">{remoteUser?.userName || otherParticipant?.name}</span>
                        </div>
                    )}
                    {!isRemoteConnected && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            <span className="text-xs text-yellow-400">Waiting for participant...</span>
                        </div>
                    )}
                    <Users size={16} className="text-neutral-500" />
                </div>
            </header>

            {/* Main Content — Split View */}
            <div className="flex-1 flex overflow-hidden">
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
                                onChange={(e) => setEditorLanguage(e.target.value)}
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

                {/* Right Side: Video Feeds */}
                <div className="flex-1 min-w-[300px] max-w-[480px] flex flex-col bg-neutral-950 border-l border-neutral-800">
                    {/* Remote Video (Large) */}
                    <div className="flex-1 relative bg-neutral-900">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!isRemoteConnected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                                        <Users size={32} className="text-neutral-600" />
                                    </div>
                                    <p className="text-neutral-500 text-sm">Waiting for the other participant...</p>
                                </div>
                            </div>
                        )}
                        {isRemoteConnected && (
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                                {remoteUser?.userName || otherParticipant?.name}
                            </div>
                        )}
                    </div>

                    {/* Local Video (Small, Picture-in-Picture style) */}
                    <div className="h-[180px] relative border-t border-neutral-800 bg-neutral-900">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center">
                                    <VideoOff size={24} className="text-neutral-600" />
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white">
                            You {isScreenSharing && '(Sharing Screen)'}
                        </div>
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

                {/* End Call */}
                <button
                    onClick={endCall}
                    className="w-14 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95"
                    title="End Call"
                >
                    <PhoneOff size={20} />
                </button>
            </footer>
        </div>
    );
};

export default InterviewRoom;
