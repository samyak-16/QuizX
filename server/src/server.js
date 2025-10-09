import { env } from './config/env.js';
import { app } from './app.js';
import { db } from './Config/db.js';

const PORT = env.PORT || 3000;

async function startServer() {
  db(); // connect to MongoDB
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
startServer();
