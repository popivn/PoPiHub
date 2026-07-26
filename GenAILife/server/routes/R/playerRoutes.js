import express from 'express';
import authController from '../../controllers/authController.js';

const router = express.Router();

// [READ] Lấy danh sách nhân vật của người dùng
router.get('/players', authController.getPlayers);

export default router;
