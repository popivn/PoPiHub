import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authController from '../controllers/authController.js';
import agentController from '../controllers/agentController.js';
import ollamaService from '../../llm/OllamaService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📄 View Routes
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/src/views/login.html'));
});

router.get('/create-character', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/src/views/create_character.html'));
});

// 🔑 Auth & Player API Routes
router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.get('/api/auth/me', authController.getMe);
router.post('/api/auth/logout', authController.logout);

router.get('/api/players', authController.getPlayers);
router.post('/api/players', authController.createPlayer);

// 💬 Chat Histories API Route
router.get('/api/chat/history', authController.getChatHistory);

// 🧠 Agent Brain & Chronicles API Route
router.get('/api/agent/:agentId/chronicles', agentController.getAgentChronicles);

// 🤖 Ollama Service API Routes
router.get('/api/ollama/status', async (req, res) => {
  const status = await ollamaService.checkStatus();
  res.json(status);
});

router.post('/api/ollama/generate', async (req, res) => {
  const { prompt, model, system } = req.body;
  const result = await ollamaService.generateText(prompt, model, system);
  res.json(result);
});

export default router;
