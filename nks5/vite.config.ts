import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import express from 'express'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'submissions.txt');

// Ensure data dir & file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, '=== SERVER NGỌC KINH S5 - TA LÀM TÔNG SƯ (DANH SÁCH ZALO VÀ INGAME) ===\n\n', 'utf8');
}

// Custom Vite Plugin for Express API (Zero Proxy / Zero Socket Hang Up)
function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server: any) {
      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // API: Save
      app.post('/api/save', (req, res) => {
        const { zalo, ingame } = req.body;
        if (!zalo || !ingame) {
          return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Zalo và InGame!' });
        }
        const cleanZalo = String(zalo).trim();
        const cleanInGame = String(ingame).trim();
        const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const line = `[${timestamp}] Zalo: ${cleanZalo} | InGame: ${cleanInGame}\n`;

        try {
          fs.appendFileSync(FILE_PATH, line, 'utf8');
          return res.json({ success: true, message: 'Lưu thông tin thành công!' });
        } catch (err) {
          console.error('Lỗi khi ghi file:', err);
          return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu thông tin!' });
        }
      });

      // API: Submissions list
      app.get('/api/submissions', (_req, res) => {
        try {
          const data = fs.readFileSync(FILE_PATH, 'utf8');
          const lines = data.split('\n').filter(l => l.trim() && !l.startsWith('==='));
          const items = lines.map(line => {
            const parts = line.match(/^\[(.*?)\] Zalo: (.*?) \| InGame: (.*)$/);
            if (parts) {
              return { timestamp: parts[1], zalo: parts[2], ingame: parts[3], raw: line };
            }
            return { raw: line };
          }).reverse();
          return res.json({ success: true, count: items.length, data: items, fullText: data });
        } catch (err) {
          return res.status(500).json({ success: false, message: 'Không thể đọc file dữ liệu' });
        }
      });

      // API: Download txt
      app.get('/api/download', (_req, res) => {
        if (!fs.existsSync(FILE_PATH)) {
          return res.status(404).send('File dữ liệu chưa tồn tại!');
        }
        return res.download(FILE_PATH, 'nks5_danh_sach.txt');
      });

      server.middlewares.use(app);
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), expressApiPlugin()],
  server: {
    port: 5173,
  },
})
