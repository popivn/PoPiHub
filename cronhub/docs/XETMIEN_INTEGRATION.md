# Tích hợp CronHub vào Xét Miễn (xetmien)

Tài liệu hướng dẫn team xetmien gọi CronHub để lên lịch tự động trigger endpoint khi đợt xét miễn kết thúc.

---

## 1. Tổng quan luồng

```
xetmien tạo đợt xét miễn
        │
        │  POST /add-scheduled-task?key=XXXXXX
        ▼
    CronHub (lưu scheduled task vào Firestore, zone VTTUXETMIEN)
        │
        │  (đến thời điểm endday)
        ▼
    CronHub runner GET endpoint xetmien
        │
        ▼
    xetmien set isReg=1, isDK=1 cho toàn bộ sinh viên thuộc đợt
        → sinh viên hết lượt đăng ký xét miễn tiếp
```

**Trường `endday`** (= `thoi_gian_ket_thuc` của đợt) là thời điểm CronHub sẽ trigger gọi endpoint.

---

## 2. Endpoint CronHub

| Mục | Giá trị |
|---|---|
| **URL** | `https://<cronhub-domain>/add-scheduled-task` |
| **Method** | `POST` |
| **Auth** | Query `?key=XXXXXX` **hoặc** header `x-xetmien-key: XXXXXX` |
| **Content-Type** | `application/json` |

> ⚠️ `XXXXXX` là giá trị placeholder trong dev. Khi deploy production, team CronHub sẽ cấp key thật — đặt vào `HUBKEY` env của xetmien.

---

## 3. Payload (JSON body)

Gồm **5 trường bắt buộc**:

| Trường | Kiểu | Bắt buộc | Ví dụ | Ý nghĩa |
|---|---|---|---|---|
| `domain` | string URL | ✅ | `https://xmhp.vttu.edu.vn` | Domain gốc của app xetmien (lấy từ `APP_URL`) |
| `endpoint` | string URL | ✅ | `https://xmhp.vttu.edu.vn/runislimit/15?key=13467902` | URL hoàn chỉnh CronHub sẽ GET vào thời điểm `endday`. **Phải include sẵn `?key=CRONAPIKEY`** để auth endpoint xetmien |
| `dot_id` | string \| number | ✅ | `15` | ID của đợt xét miễn vừa tạo |
| `startday` | string ISO 8601 | ✅ | `2026-07-31T08:00:00+00:00` | `thoi_gian_bat_dau` của đợt — tham khảo, CronHub **không dùng** để chạy |
| `endday` | string ISO 8601 | ✅ | `2026-08-15T17:00:00+00:00` | `thoi_gian_ket_thuc` của đợt — **đây là thời điểm CronHub trigger** |

**Trường tùy chọn**:

| Trường | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `zone` | string | `VTTUXETMIEN` | Override zone nếu cần. Mặc định mọi request `?key=XXXXXX` đều vào zone `VTTUXETMIEN` |

---

## 4. Logic chọn endpoint (xetmien tự build trước khi gửi)

Khi tạo đợt xét miễn, xetmien quyết định `endpoint` theo loại đợt:

| Điều kiện đợt | `endpoint` | Có bắn CronHub? |
|---|---|---|
| `isLimit2 = true` | `.../runislimit2/{dot_id}?key={CRONAPIKEY}` | ✅ Có |
| `isLimit = true` (không phải isLimit2) | `.../runislimit/{dot_id}?key={CRONAPIKEY}` | ✅ Có |
| Cả 2 đều `false` (đợt thường) | — | ❌ **Không bắn** (không cần cron) |

---

## 5. Ví dụ request

### cURL

```bash
curl -X POST "https://cronhub.vercel.app/add-scheduled-task?key=XXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "https://xmhp.vttu.edu.vn",
    "endpoint": "https://xmhp.vttu.edu.vn/runislimit/15?key=13467902",
    "dot_id": "15",
    "startday": "2026-07-31T08:00:00+00:00",
    "endday": "2026-08-15T17:00:00+00:00"
  }'
```

### JavaScript (fetch)

```js
const HUBKEY = process.env.HUBKEY // 'XXXXXX' ở dev, key thật ở prod
const CRONAPIKEY = process.env.CRONAPIKEY

const dotId = dot.id // ID đợt xét miễn vừa tạo
const isLimit = dot.isLimit
const isLimit2 = dot.isLimit2

// Bỏ qua nếu đợt thường (không cần cron)
if (!isLimit && !isLimit2) return

const path = isLimit2 ? 'runislimit2' : 'runislimit'
const endpoint = `${process.env.APP_URL}/${path}/${dotId}?key=${CRONAPIKEY}`

await fetch(`https://cronhub.vercel.app/add-scheduled-task?key=${HUBKEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: process.env.APP_URL,
    endpoint,
    dot_id: String(dotId),
    startday: dot.thoi_gian_bat_dau, // ISO 8601
    endday: dot.thoi_gian_ket_thuc, // ISO 8601 — thời điểm trigger
  }),
})
```

### PHP (Guzzle)

```php
$hubKey = env('HUBKEY', 'XXXXXX');
$cronApiKey = env('CRONAPIKEY');
$appUrl = env('APP_URL');

$path = $dot->isLimit2 ? 'runislimit2' : 'runislimit';
$endpoint = "{$appUrl}/{$path}/{$dot->id}?key={$cronApiKey}";

$client->post("https://cronhub.vercel.app/add-scheduled-task?key={$hubKey}", [
    'json' => [
        'domain'    => $appUrl,
        'endpoint'  => $endpoint,
        'dot_id'    => (string) $dot->id,
        'startday'  => $dot->thoi_gian_bat_dau, // ISO 8601
        'endday'    => $dot->thoi_gian_ket_thuc, // ISO 8601
    ],
]);
```

---

## 6. Response

### Thành công — `201 Created`

```json
{
  "ok": true,
  "id": "abc123xyz",
  "zoneId": "zoneDocId",
  "zoneName": "VTTUXETMIEN",
  "triggerAt": "2026-08-15T17:00:00.000Z",
  "message": "Scheduled task đã được tạo trong zone \"VTTUXETMIEN\", sẽ trigger lúc 2026-08-15T17:00:00.000Z."
}
```

### Lỗi — `400 Bad Request` (thiếu trường / sai format)

```json
{
  "error": "Trường \"endday\" là bắt buộc và phải là ISO 8601."
}
```

### Lỗi — `401 Unauthorized` (sai key)

```json
{
  "error": "Unauthorized: invalid XETMIENKEY."
}
```

### Lỗi — `405 Method Not Allowed`

```json
{
  "error": "Method not allowed. Use POST."
}
```

### Lỗi — `500 Internal Server Error`

```json
{
  "ok": false,
  "error": "<chi tiết lỗi server>"
}
```

---

## 7. Quy ước dữ liệu trên Firestore

CronHub lưu scheduled task vào collection **`scheduled_tasks`** với schema:

```ts
{
  domain: string,           // 'https://xmhp.vttu.edu.vn'
  endpoint: string,         // URL CronHub sẽ GET khi tới endday
  dot_id: string,           // ID đợt xét miễn
  startday: Timestamp,      // thời gian bắt đầu (tham khảo)
  endday: Timestamp,        // thời điểm trigger
  zoneId: string,           // ID doc trong cron_zones
  zoneName: string,         // 'VTTUXETMIEN'
  status: 'pending',        // pending | fired | error
  fired: false,             // true sau khi runner đã GET endpoint
  firedAt: null,            // Timestamp khi fire
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

Zone lưu trong collection **`cron_zones`** (dùng chung với cron recurring):

```ts
{
  name: string,             // 'VTTUXETMIEN'
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## 8. Trạng thái scheduled task

| `status` | Ý nghĩa |
|---|---|
| `pending` | Đã tạo, chờ đến `endday` để runner trigger |
| `fired` | Runner đã GET endpoint thành công |
| `error` | Runner GET endpoint nhưng lỗi (sẽ retry) |

> **Lưu ý**: Runner (phần quét DB đến `endday` rồi GET `endpoint`) sẽ được triển khai ở phase kế tiếp. Hiện tại `add-scheduled-task` chỉ lưu task vào DB.

---

## 9. Checklist tích hợp cho team xetmien

- [ ] Thêm env var `HUBKEY` (key thật do team CronHub cấp)
- [ ] Đảm bảo `CRONAPIKEY` đã set (dùng cho `?key=` trong `endpoint`)
- [ ] Đảm bảo `APP_URL` đã set (vd: `https://xmhp.vttu.edu.vn`)
- [ ] Sau khi tạo đợt xét miễn có `isLimit`/`isLimit2 = true`, gọi `POST /add-scheduled-task`
- [ ] Bỏ qua gọi CronHub nếu đợt thường (cả 2 đều `false`)
- [ ] Log `id` trả về từ CronHub để tra cứu sau (nếu cần)
- [ ] Test với `endday` gần hiện tại để verify trigger (sau khi runner ready)

---

## 10. Câu hỏi thường gặp

**Q: CronHub có dùng `startday` để chạy không?**
A: Không. `startday` chỉ lưu làm tham khảo. CronHub chỉ trigger tại `endday`.

**Q: Nếu `endday` đã qua khi gọi `add-scheduled-task` thì sao?**
A: CronHub vẫn lưu task. Runner sẽ xử lý các task quá hạn (fire ngay hoặc bỏ qua tùy cấu hình — sẽ quyết định ở phase runner).

**Q: Có thể gọi nhiều lần cho cùng `dot_id` không?**
A: Có — CronHub không dedup theo `dot_id`. Mỗi lần gọi tạo 1 doc mới. Nếu cần idempotent, team xetmien tự kiểm tra trước khi gọi (hoặc dùng `dot_id` + `endpoint` để query Firestore).

**Q: Endpoint xetmien trả về gì khi CronHub GET?**
A: CronHub chỉ quan tâm HTTP status (2xx = thành công, 4xx/5xx = lỗi → retry). Body response không bắt buộc theo contract nào.

**Q: Có thể cancel 1 scheduled task đã tạo không?**
A: Hiện chưa có endpoint cancel. Sẽ thêm `/cancel-scheduled-task/:id` ở phase sau nếu cần.
