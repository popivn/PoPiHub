import express from 'express';
import authController from '../../controllers/authController.js';
import agentController from '../../controllers/agentController.js';
import ollamaService from '../../../llm/OllamaService.js';

const router = express.Router();

// [READ] Lấy lịch sử chat
router.get('/chat/history', authController.getChatHistory);

// [READ] Lấy ký ức / nhật ký của Agent
router.get('/agent/:agentId/chronicles', agentController.getAgentChronicles);

// [READ] Kiểm tra trạng thái dịch vụ Ollama AI
router.get('/ollama/status', async (req, res) => {
  const status = await ollamaService.checkStatus();
  res.json(status);
});

export default router;
