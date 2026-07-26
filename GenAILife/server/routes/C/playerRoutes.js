import express from 'express';
import authController from '../../controllers/authController.js';

const router = express.Router();

// [CREATE] Tạo nhân vật mới
router.post('/players', authController.createPlayer);

export default router;
