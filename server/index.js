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
    socket.userName = decoded.name || 'Unknown User';
    socket.userRole = decoded.role || 'CANDIDATE';
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Track active rooms
const activeRooms = new Map(); // roomId -> Set of { socketId, userId, userName }

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.userName} (${socket.userId})`);

  // --- Join Interview Room ---
  socket.on('join-room', (interviewId) => {
    if (!interviewId) return;

    socket.join(interviewId);
    socket.currentRoom = interviewId;

    // Track user in room
    if (!activeRooms.has(interviewId)) {
      activeRooms.set(interviewId, new Set());
    }
    activeRooms.get(interviewId).add({
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
    });

    // Notify other users in the room
    socket.to(interviewId).emit('user-connected', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
    });

    // Send list of existing users to the joining user
    const roomUsers = [];
    activeRooms.get(interviewId).forEach((user) => {
      if (user.socketId !== socket.id) {
        roomUsers.push(user);
      }
    });
    socket.emit('room-users', roomUsers);

    console.log(`[Socket.IO] ${socket.userName} joined room: ${interviewId}`);
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

  // --- Kick User ---
  socket.on('kick-user', ({ roomId, targetSocketId }) => {
    io.to(targetSocketId).emit('kicked-from-room');
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.userName} (${socket.userId})`);

    if (socket.currentRoom) {
      // Remove from tracking
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
