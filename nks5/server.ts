import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'submissions.txt');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, '=== NKS5 - DANH SÁCH ZALO VÀ INGAME ===\n\n', 'utf8');
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

  fs.appendFile(FILE_PATH, line, 'utf8', (err) => {
    if (err) {
      console.error('Lỗi khi ghi file:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu thông tin!' });
    }
    return res.json({ success: true, message: 'Lưu thông tin thành công!' });
  });
});

// API: Get submission list
app.get('/api/submissions', (_req: Request, res: Response) => {
  fs.readFile(FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Không thể đọc file dữ liệu' });
    }
    const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('==='));
    const items: SubmissionItem[] = lines.map(line => {
      const parts = line.match(/^\[(.*?)\] Zalo: (.*?) \| InGame: (.*)$/);
      if (parts) {
        return { timestamp: parts[1], zalo: parts[2], ingame: parts[3], raw: line };
      }
      return { raw: line };
    }).reverse();

    return res.json({ success: true, count: items.length, data: items, fullText: data });
  });
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

app.listen(PORT, () => {
  console.log(`🚀 NKS5 Express Server running on http://localhost:${PORT}`);
});
