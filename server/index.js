const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const { errorHandler } = require('./middleware/errorMiddleware');

// Create HTTP server (shared between Express and Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Request Logger (Debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', stripeRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handler (Must be last)
app.use(errorHandler);

// ============================
// Socket.IO Signaling Server
// ============================

// JWT Authentication Middleware for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userName = socket.handshake.auth?.userName || decoded.name || 'Unknown User';
    socket.userRole = decoded.role || 'CANDIDATE';
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Track active rooms
const activeRooms = new Map(); // roomId -> Set of { socketId, userId, userName, role }
const waitingRooms = new Map(); // roomId -> Set of { socketId, userId, userName, role }

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.userName} (${socket.userId})`);

  // Helper: checks if a role string is a host (recruiter or org admin)
  const isHostRole = (role) =>
    role === 'RECRUITER' || role === 'recruiter' ||
    role === 'ORG_ADMIN' || role === 'org_admin';

  // --- Join Interview Room ---
  // Accepts: plain roomId string OR { roomId, userName, role } object
  socket.on('join-room', (payload) => {
    // Support both legacy string and new object payload
    const interviewId = typeof payload === 'string' ? payload : payload?.roomId;
    if (!interviewId) return;

    // Allow client to override auth-derived values (useful for richer notifications)
    if (typeof payload === 'object') {
      if (payload.userName) socket.userName = payload.userName;
      if (payload.role) socket.userRole = payload.role;
    }

    socket.currentRoom = interviewId;

    // Initialize room sets
    if (!activeRooms.has(interviewId)) {
      activeRooms.set(interviewId, new Set());
    }
    if (!waitingRooms.has(interviewId)) {
      waitingRooms.set(interviewId, new Set());
    }

    const isRecruiter = isHostRole(socket.userRole);
    const hostPresent = Array.from(activeRooms.get(interviewId)).some(u => isHostRole(u.role));

    if (isRecruiter) {
      // Host automatically joins the room
      socket.join(interviewId);
      activeRooms.get(interviewId).add({
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole,
      });

      // Notify other users already in the room
      socket.to(interviewId).emit('user-connected', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
      });

      // Send list of existing active users to the host
      const roomUsers = [];
      activeRooms.get(interviewId).forEach((user) => {
        if (user.socketId !== socket.id) {
          roomUsers.push(user);
        }
      });
      socket.emit('room-users', roomUsers);

      // Notify host of any waiting candidates
      const waiting = Array.from(waitingRooms.get(interviewId));
      waiting.forEach(user => {
        socket.emit('admission-request', user);
      });

      console.log(`[Socket.IO] Host ${socket.userName} joined room: ${interviewId}`);
    } else {
      // Candidate flow
      if (!hostPresent) {
        // Wait for host
        waitingRooms.get(interviewId).add({
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
        });
        socket.emit('waiting-for-host');
        console.log(`[Socket.IO] Candidate ${socket.userName} waiting for host in room: ${interviewId}`);
      } else {
        // Host is present, candidate requests admission
        waitingRooms.get(interviewId).add({
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
        });
        socket.emit('waiting-for-host');

        // Let hosts in the room know someone wants to join
        io.to(interviewId).emit('admission-request', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
        });
        console.log(`[Socket.IO] Candidate ${socket.userName} requesting admission to room: ${interviewId}`);
      }
    }
  });

  // --- Admit User (Host action) ---
  socket.on('admit-user', ({ targetSocketId }) => {
    const interviewId = socket.currentRoom;
    if (!interviewId || !waitingRooms.has(interviewId)) return;

    const waitingSet = waitingRooms.get(interviewId);
    let targetUser = null;
    for (const u of waitingSet) {
      if (u.socketId === targetSocketId) {
        targetUser = u;
        break;
      }
    }

    if (targetUser) {
      waitingSet.delete(targetUser);

      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.join(interviewId);
        activeRooms.get(interviewId).add(targetUser);

        targetSocket.emit('admitted');

        targetSocket.to(interviewId).emit('user-connected', {
          socketId: targetUser.socketId,
          userId: targetUser.userId,
          userName: targetUser.userName,
        });

        const roomUsers = [];
        activeRooms.get(interviewId).forEach((user) => {
          if (user.socketId !== targetSocketId) {
            roomUsers.push(user);
          }
        });
        targetSocket.emit('room-users', roomUsers);

        console.log(`[Socket.IO] ${socket.userName} admitted ${targetUser.userName} to room: ${interviewId}`);
      }
    }
  });

  // --- Deny User (Host action) ---
  socket.on('deny-user', ({ targetSocketId }) => {
    const interviewId = socket.currentRoom;
    if (!interviewId || !waitingRooms.has(interviewId)) return;

    const waitingSet = waitingRooms.get(interviewId);
    for (const u of waitingSet) {
      if (u.socketId === targetSocketId) {
        waitingSet.delete(u);
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('admission-denied');
        }
        console.log(`[Socket.IO] ${socket.userName} denied admission for socket: ${targetSocketId}`);
        break;
      }
    }
  });

  // --- WebRTC Signaling: Offer ---
  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', {
      offer,
      from: socket.id,
      userId: socket.userId,
      userName: socket.userName,
    });
  });

  // --- WebRTC Signaling: Answer ---
  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', {
      answer,
      from: socket.id,
    });
  });

  // --- WebRTC Signaling: ICE Candidate ---
  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', {
      candidate,
      from: socket.id,
    });
  });

  // --- Code Editor Sync ---
  socket.on('code-change', ({ roomId, code, language }) => {
    socket.to(roomId).emit('code-change', {
      code,
      language,
      from: socket.userId,
    });
  });

  // --- Language-Only Change Sync ---
  socket.on('language-change', ({ roomId, language }) => {
    socket.to(roomId).emit('language-change', { language, from: socket.userId });
  });

  // --- Editor State Request (for reconnect re-sync) ---
  // One peer asks the room for the current editor state
  socket.on('request-editor-state', ({ roomId }) => {
    socket.to(roomId).emit('provide-editor-state', { requesterId: socket.id });
  });

  // --- Editor State Response (provider sends state back to the requester) ---
  socket.on('editor-state-response', ({ targetSocketId, code, language }) => {
    io.to(targetSocketId).emit('editor-state-sync', { code, language });
  });

  // --- Kick Participant (Recruiter Only) ---
  socket.on('kick-user', ({ targetSocketId }) => {
    if (!targetSocketId) return;
    // Emit directly to the target socket so only that specific user is notified
    io.to(targetSocketId).emit('kicked-from-room');
    console.log(`[Socket.IO] ${socket.userName} kicked socket: ${targetSocketId} from room: ${socket.currentRoom}`);
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.userName} (${socket.userId})`);

    if (socket.currentRoom) {
      // Remove from active tracking
      const roomUsers = activeRooms.get(socket.currentRoom);
      if (roomUsers) {
        roomUsers.forEach((user) => {
          if (user.socketId === socket.id) {
            roomUsers.delete(user);
          }
        });
        if (roomUsers.size === 0) {
          activeRooms.delete(socket.currentRoom);
        }
      }

      // Remove from waiting room if there
      const wUsers = waitingRooms.get(socket.currentRoom);
      if (wUsers) {
        wUsers.forEach((user) => {
          if (user.socketId === socket.id) {
            wUsers.delete(user);
            // Cancel admission request for hosts
            io.to(socket.currentRoom).emit('admission-canceled', { socketId: socket.id });
          }
        });
        if (wUsers.size === 0) {
          waitingRooms.delete(socket.currentRoom);
        }
      }

      // Notify others in the room
      socket.to(socket.currentRoom).emit('user-disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
      });
    }
  });
});

// Connect to DB first, then start server
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT} (HTTP + Socket.IO)`));
}).catch(err => {
  console.error('Database connection failure:', err);
  process.exit(1);
});
