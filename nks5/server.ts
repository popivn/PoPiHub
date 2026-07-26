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

// Helper to write lines back to file preserving header
const writeSubmissionsToFile = (items: SubmissionItem[]) => {
  const header = '=== SERVER NGỌC KINH S5 - TA LÀM TÔNG SƯ (DANH SÁCH ZALO VÀ INGAME) ===\n\n';
  // items stored newest first in memory for list API, so reverse when saving back to maintain chronological file order
  const lines = [...items].reverse().map(item => {
    if (item.timestamp && item.zalo && item.ingame) {
      return `[${item.timestamp}] Zalo: ${item.zalo} | InGame: ${item.ingame}`;
    }
    return item.raw;
  });
  const content = header + lines.join('\n') + (lines.length ? '\n' : '');
  fs.writeFileSync(FILE_PATH, content, 'utf8');
};

const readSubmissionsFromFile = (): SubmissionItem[] => {
  if (!fs.existsSync(FILE_PATH)) return [];
  const data = fs.readFileSync(FILE_PATH, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('==='));
  return lines.map(line => {
    const parts = line.match(/^\[(.*?)\] Zalo: (.*?) \| InGame: (.*)$/);
    if (parts) {
      return { timestamp: parts[1], zalo: parts[2], ingame: parts[3], raw: line };
    }
    return { raw: line };
  }).reverse();
};

// API: Get submission list
app.get('/api/submissions', (_req: Request, res: Response) => {
  try {
    const items = readSubmissionsFromFile();
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return res.json({ success: true, count: items.length, data: items, fullText: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể đọc file dữ liệu' });
  }
});

// API: Edit submission by index (0-based from latest list)
app.put('/api/submissions/:index', (req: Request, res: Response) => {
  const index = parseInt(req.params.index, 10);
  const { zalo, ingame } = req.body;

  if (!zalo || !ingame) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Zalo và InGame!' });
  }

  try {
    const items = readSubmissionsFromFile();
    if (isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dòng cần sửa!' });
    }

    items[index].zalo = String(zalo).trim();
    items[index].ingame = String(ingame).trim();

    writeSubmissionsToFile(items);
    return res.json({ success: true, message: 'Cập nhật thành công!' });
  } catch (err) {
    console.error('Lỗi khi sửa dữ liệu:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật!' });
  }
});

// API: Delete submission by index
app.delete('/api/submissions/:index', (req: Request, res: Response) => {
  const index = parseInt(req.params.index, 10);

  try {
    const items = readSubmissionsFromFile();
    if (isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dòng cần xóa!' });
    }

    items.splice(index, 1);
    writeSubmissionsToFile(items);
    return res.json({ success: true, message: 'Xóa thành công!' });
  } catch (err) {
    console.error('Lỗi khi xóa dữ liệu:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa!' });
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
