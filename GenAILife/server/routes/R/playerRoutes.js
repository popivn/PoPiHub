import express from 'express';
import authController from '../../controllers/authController.js';

const router = express.Router();

// [READ] Lấy danh sách nhân vật của người dùng
router.get('/players', authController.getPlayers);

// [READ] Lấy sprite nhân vật mẫu hiện tại
router.get('/players/sample-sprite', authController.getSampleSprite);

export default router;
