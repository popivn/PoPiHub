import express from 'express';
import ollamaService from '../../../llm/OllamaService.js';

const router = express.Router();

// [CREATE] Tạo văn bản / suy nghĩ từ Ollama AI
router.post('/ollama/generate', async (req, res) => {
  const { prompt, model, system } = req.body;
  const result = await ollamaService.generateText(prompt, model, system);
  res.json(result);
});

export default router;
