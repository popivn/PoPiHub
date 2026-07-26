# NKS5 - Quản Lý Zalo & InGame (Vite + React + TypeScript)

Ứng dụng web hiện đại dùng **Vite**, **React**, **TypeScript**, **Tailwind CSS v4** & **Express**, hỗ trợ lưu thông tin Zalo & InGame vào file `.txt` trên server và tải về.

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

### 1. Chạy chế độ Development (`npm run dev`)
```bash
cd nks5
npm install
npm run dev
```
- Lệnh trên sẽ tự động chạy song song **Express Server** (`http://localhost:3000`) và **Vite Dev Server** (`http://localhost:5173`).
- Mở trình duyệt truy cập: **`http://localhost:5173`**

---

### 2. Chạy Build / Production local
```bash
npm run build
npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 🌐 Deploy Đơn Lẻ Lên Render.com (Docker)

1. Push mã nguồn dự án lên GitHub.
2. Trên [Render Dashboard](https://dashboard.render.com/):
   - Bấm **New +** -> **Web Service**.
   - Chọn repository `PoPiHub` (Root directory: `nks5`).
   - **Environment / Runtime**: Chọn **Docker**.
3. Render sẽ tự động đọc `Dockerfile` xây dựng và kích hoạt ứng dụng live!
