import express from 'express';
import authController from '../../controllers/authController.js';

const router = express.Router();

// [CREATE] Đăng ký tài khoản mới
router.post('/register', authController.register);

export default router;
