import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'submissions.txt');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, '=== SERVER NGỌC KINH S5 - TA LÀM TÔNG SƯ (DANH SÁCH ZALO VÀ INGAME) ===\n\n', 'utf8');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export interface SubmissionItem {
  timestamp?: string;
  zalo?: string;
  ingame?: string;
  raw: string;
}

// API: Save Zalo & InGame entry
app.post('/api/save', (req: Request, res: Response) => {
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

// API: Get submission list
app.get('/api/submissions', (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('==='));
    const items: SubmissionItem[] = lines.map(line => {
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

// API: Download file txt
app.get('/api/download', (_req: Request, res: Response) => {
  if (!fs.existsSync(FILE_PATH)) {
    return res.status(404).send('File dữ liệu chưa tồn tại!');
  }
  return res.download(FILE_PATH, 'nks5_danh_sach.txt');
});

// Serve dist static files in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 NKS5 Express Server đang chạy tại http://127.0.0.1:${PORT}`);
});
