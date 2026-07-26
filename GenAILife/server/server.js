import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import webRoutes from './routes/web.js';
import { GameSocketServer } from './GameSocketServer.js';

const app = express();
const PORT = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Web Routes
app.use('/', webRoutes);

// Serve static assets from client folder
app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);

// Initialize Realtime Multi-player WebSocket Server
new GameSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GenAI Life Web, API & Realtime WebSocket Server running at http://localhost:${PORT}`);
});
