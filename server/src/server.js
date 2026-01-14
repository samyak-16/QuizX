import { env } from './Config/env.js';
import { app } from './app.js';
import { db } from './Config/db.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupGameSocket } from './sockets/gameSocket.js';

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await db(); // connect to MongoDB
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log(' MongoDB connection failed, starting server anyway for development...');
    console.log('Error:', error.message);
  }

  // Create HTTP server and attach Socket.io
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
      credentials: true,
    },
  });

  // Setup game socket namespace
  setupGameSocket(io);

  console.log('Socket.io initialized for multiplayer games');

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`WebSocket available at ws://localhost:${PORT}/game`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      console.log('Process terminated');
    });
  });
}

startServer();
