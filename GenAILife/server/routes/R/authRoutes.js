import express from 'express';
import authController from '../../controllers/authController.js';

const router = express.Router();

// [READ] Lấy thông tin tài khoản hiện tại (me)
router.get('/me', authController.getMe);

// [READ] Đăng nhập (Xác thực thông tin người dùng)
router.post('/login', authController.login);

// [READ] Đăng xuất tài khoản
router.post('/logout', authController.logout);

export default router;
