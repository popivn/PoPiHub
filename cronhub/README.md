# CronHub

Giao diện quản lý cron đơn giản (đang ở giai đoạn bản nháp — các tính năng ở trạng thái _feature pending_).

## Stack

- React 19 + TypeScript
- Vite 8
- Oxlint

## Phát triển

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

Project name trên Vercel: `cronhub`.

```bash
vercel --prod --name cronhub
```

`vercel.json` đã cấu hình sẵn framework Vite + SPA rewrites.
