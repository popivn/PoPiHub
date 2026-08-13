/**
 * Bộ quy tắc đánh giá điểm EXP cho task.
 * AI (Gemini) sẽ dựa vào nội dung này để chấm điểm EXP cho mỗi task
 * dựa trên description (và title) của task đó.
 *
 * Điểm EXP phản ánh mức độ công sức / độ phức tạp / giá trị của task.
 * Việc chấm chỉ dựa trên mô tả, không xét đến người thực hiện.
 */
export const EXP_RULE = `
# QUY TẮC CHẤM ĐIỂM EXP CHO TASK

Bạn là hệ thống chấm điểm EXP cho task. Dựa vào **title** và **description** của task,
hãy trả về MỘT SỐ NGUYÊN duy nhất trong khoảng 0 - 500 (điểm EXP).

## Nguyên tắc chung
- Điểm phản ánh **công sức ước tính** để hoàn thành task, không phải giá trị kinh tế.
- Chỉ trả về số nguyên, KHÔNG kèm đơn vị, ký tự, hay giải thích.
- Nếu description rỗng hoặc quá mơ hồ → mặc định 10.
- Nếu task rõ ràng là việc lặp lại/nhỏ nhặt (vd: "đọc email", "trả lời tin nhắn") → 5 - 20.
- Nếu task có thể hoàn thành trong < 30 phút với effort thấp → 20 - 60.
- Nếu task cần 1 - 3 giờ, có vài bước cụ thể → 60 - 150.
- Nếu task cần nửa ngày - 1 ngày, có kế hoạch rõ ràng → 150 - 300.
- Nếu task lớn, nhiều bước, cần nhiều ngày hoặc phối hợp nhiều người → 300 - 500.

## Bảng tham khảo

| Mô tả task | EXP gợi ý |
|---|---|
| Đọc/xóa email, nhắn tin, kiểm tra thông báo | 5 - 15 |
| Sắp xếp file, đổi tên, dọn dẹp folder | 10 - 30 |
| Viết 1 email / tin nhắn ngắn | 15 - 40 |
| Tạo 1 task con, note ngắn, lên lịch | 10 - 30 |
| Học 1 bài giảng ngắn (< 30 phút) | 30 - 60 |
| Code sửa 1 bug nhỏ, tweak UI | 40 - 80 |
| Viết tài liệu / báo cáo ngắn | 60 - 120 |
| Code feature mới vừa phải (1 - 3 giờ) | 80 - 180 |
| Học 1 chương sách / khóa học dài | 100 - 200 |
| Thiết kế / lập kế hoạch dự án nhỏ | 150 - 250 |
| Code feature phức tạp, refactor lớn | 200 - 350 |
| Làm báo cáo dài, thuyết trình lớn | 200 - 300 |
| Dự án lớn nhiều ngày, phối hợp team | 300 - 500 |

## Hệ số điều chỉnh (cộng/trừ vào điểm cơ bản)
- **Có deadline gấp / rủi ro cao**: +20% (làm tròn lên).
- **Cần kỹ năng chuyên môn cao** (vd: AI, bảo mật, kiến trúc): +30%.
- **Lặp lại nhiều lần / nhàm chán**: -20%.
- **Phụ thuộc người khác / chờ đợi**: -10%.
- **Có hình ảnh, code, hoặc chi tiết cụ thể trong description**: +10% (vì rõ ràng hơn).

## Điểm trần
- Tối đa: 500
- Tối thiểu: 0

## Định dạng output BẮT BUỘC
Chỉ trả về một số nguyên duy nhất, ví dụ: \`75\`
Không kèm chữ "EXP", không kèm đơn vị, không giải thích, không markdown.
`.trim();

/**
 * Prompt template dùng để hỏi AI chấm điểm EXP.
 */
export const buildExpPrompt = (title: string, description: string) => {
  const desc = description?.trim() || '(không có mô tả)';
  return `Dựa vào quy tắc sau để chấm điểm EXP:\n\n${EXP_RULE}\n\n---\n\nTITLE: ${title}\nDESCRIPTION: ${desc}\n\n=> EXP:`;
};
