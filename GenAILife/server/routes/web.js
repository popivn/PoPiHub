import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 📥 Import các Router nhóm theo chuẩn C, R, U, D
import createAuthRoutes from './C/authRoutes.js';
import createPlayerRoutes from './C/playerRoutes.js';
import createSystemRoutes from './C/systemRoutes.js';

import readAuthRoutes from './R/authRoutes.js';
import readPlayerRoutes from './R/playerRoutes.js';
import readSystemRoutes from './R/systemRoutes.js';

import updateRoutes from './U/index.js';
import deleteRoutes from './D/index.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📄 View Routes (Render HTML Frontend Views)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/src/views/login.html'));
});

router.get('/create-character', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/src/views/create_character.html'));
});

// 📌 1. [CREATE Routes] - Các Endpoint Tạo Mới Dữ Liệu
router.use('/api/auth', createAuthRoutes);
router.use('/api', createPlayerRoutes);
router.use('/api', createSystemRoutes);

// 📌 2. [READ Routes] - Các Endpoint Truy Vấn Dữ Liệu
router.use('/api/auth', readAuthRoutes);
router.use('/api', readPlayerRoutes);
router.use('/api', readSystemRoutes);

// 📌 3. [UPDATE Routes] - Các Endpoint Cập Nhật Dữ Liệu
router.use('/api', updateRoutes);

// 📌 4. [DELETE Routes] - Các Endpoint Xóa Dữ Liệu
router.use('/api', deleteRoutes);

export default router;
