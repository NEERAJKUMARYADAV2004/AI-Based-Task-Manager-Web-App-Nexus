const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // Import path

// Explicitly load .env from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Add a check to debug
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- Socket.IO Setup (For Real-time Collab) ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your React Client URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a specific team room
  socket.on('join_team', (teamId) => {
    socket.join(teamId);
  });

  // Listen for new tasks/comments and broadcast to team
  socket.on('send_update', (data) => {
    socket.to(data.teamId).emit('receive_update', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/teams', require('./routes/teams')); // For Collaboration

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));