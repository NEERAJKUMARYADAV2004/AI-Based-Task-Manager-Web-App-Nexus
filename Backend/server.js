const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Explicitly load .env from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// --- FIX: Massive Payload Limits for Image Uploads (50MB) ---
// By increasing this to 50mb, we guarantee no image gets rejected at the door.
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Database Connection
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error: ', err));

// --- Socket.IO Setup (Upgraded for Real-time Collab & Notifications) ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your React Client URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Inject Socket.io into Express Request Object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Connection Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] User Connected: ${socket.id}`);

  socket.on('join_team', (teamId) => {
    socket.join(teamId);
  });

  socket.on('send_update', (data) => {
    const enrichedPayload = { ...data, serverTimestamp: new Date().toISOString() };
    console.log(`[Notification] Team ${data.teamId} | ${data.senderName || 'Unknown'} ${data.actionMessage || data.type}`);
    socket.to(data.teamId).emit('receive_update', enrichedPayload);
  });

  socket.on('send_notification', (data) => {
    if(data.targetUserId) {
        socket.to(data.targetUserId).emit('new_notification', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User Disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/teams', require('./routes/teams'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Nexus AI Backend Server running on port ${PORT}`));