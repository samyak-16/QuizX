import { env } from './Config/env.js';
import { app } from './app.js';
import { db } from './Config/db.js';

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await db(); // connect to MongoDB
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log(' MongoDB connection failed, starting server anyway for development...');
    console.log('Error:', error.message);
  }
  
  const server = app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` API endpoints available at http://localhost:${PORT}/api`);
 
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

startServer();
