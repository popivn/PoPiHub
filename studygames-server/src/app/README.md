# studygames-server — Firebase Auth (Server Proxy)

Kiến trúc **B (Server Proxy)**: client không bao giờ thấy Firebase config.
Server dùng `firebase-admin` (Service Account — secret) thao tác với Firebase thay client.

```
studygames (frontend)        studygames-server (NestJS)        Firebase
   │                              │                               │
   │ POST /auth/anonymous         │                               │
   │  body: { uid? }              │                               │
   ├─────────────────────────────▶│ createUser() / getUser()      │
   │                              ├──────────────────────────────▶│
   │                              │◀──────────────────────────────│ uid
   │  { accessToken, uid, ... }   │                               │
   │◀─────────────────────────────┤                               │
   │                              │                               │
   │ GET /auth/me                 │                               │
   │  Authorization: Bearer <jwt> │                               │
   ├─────────────────────────────▶│ verifyAccessToken(jwt)        │
   │  { uid, provider }           │                               │
   │◀─────────────────────────────┤                               │
```

## Setup

### 1. Tải Service Account Key
- Vào [Firebase Console](https://console.firebase.google.com) → project `xianria-4f68a`
- **Project Settings → Service Accounts → Generate new private key**
- Tải file JSON, đặt vào thư mục gốc `studygames-server/serviceAccountKey.json`
- File này đã có trong `.gitignore` — **KHÔNG commit**.

### 2. Cấu hình env
```bash
cp .env.example .env
# Mở .env, kiểm tra FIREBASE_SERVICE_ACCOUNT_PATH trỏ đúng file
# Đổi JWT_SECRET thành random string >= 32 ký tự
```

### 3. Chạy
```bash
npm run start:dev
```

## API

### `POST /auth/anonymous`
Tạo (hoặc reuse) anonymous user, trả JWT session.

**Request:**
```json
{ "uid": "optional-existing-uid" }
```
- Bỏ `uid` để tạo user mới.
- Gửi `uid` cũ (lưu ở localStorage client) để reuse session.

**Response:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "uid": "abc123...",
  "isNewUser": true
}
```

### `GET /auth/me`
Yêu cầu `Authorization: Bearer <accessToken>`. Trả uid hiện tại.

**Response:**
```json
{ "uid": "abc123...", "provider": "anonymous" }
```

## Bảo mật

| Thứ | Nơi lưu | Lộ cho user? |
|-----|---------|--------------|
| Firebase Web SDK config | ❌ Không dùng ở client | — |
| Service Account Key | `studygames-server/serviceAccountKey.json` | Không (server only) |
| JWT_SECRET | `studygames-server/.env` | Không (server only) |
| JWT access token | Server ký, client lưu (localStorage) | Có (nhưng chỉ của user đó) |

## Firestore collections

| Collection | Document ID | Fields | Mục đích |
|------------|-------------|--------|----------|
| `users` | `usr_xxx` | `uid, username, usernameLower, passwordHash, createdAt, selectedPlayerId?` | Tài khoản đăng nhập bằng username/password |
| `players` | `pl_xxx` | `id, uid, name, slimeType, createdAt` | Player (slime) thuộc về user |

- `passwordHash` = `scrypt` salt:hash (hex) — không lưu plain text.
- `selectedPlayerId` lưu trên doc user để track player đang chọn.
- Xem data: Firebase Console → Firestore Database.
- Cần tạo Firestore Database trước (Firebase Console → Firestore → Create database).

## Files

| File | Vai trò |
|------|---------|
| `src/app/firebase-admin.ts` | Singleton init `firebase-admin` từ env |
| `src/app/firebase.config.ts` | Reference `firebaseConfig` (chỉ projectId) |
| `src/auth/auth.module.ts` | Wire JwtModule + service + guard |
| `src/auth/auth.service.ts` | Tạo anonymous user, ký/verify JWT |
| `src/auth/auth.controller.ts` | Endpoint `/auth/anonymous`, `/auth/me` |
| `src/auth/jwt-auth.guard.ts` | Guard verify Bearer token |
