import { CONFIG } from '../config';
import type { RadarScores, TaskItem } from '../types';

const GEMINI_MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Định nghĩa 10 tiêu chí radar */
export const RADAR_CRITERIA: { key: keyof RadarScores; label: string; emoji: string; description: string }[] = [
  { key: 'problemSolving', label: 'Problem Solving', emoji: '🧠', description: 'Phân tích và giải quyết vấn đề' },
  { key: 'programming', label: 'Programming', emoji: '💻', description: 'Khả năng viết code và sử dụng ngôn ngữ lập trình' },
  { key: 'systemDesign', label: 'System Design', emoji: '🏗️', description: 'Thiết kế hệ thống, kiến trúc, module' },
  { key: 'codeQuality', label: 'Code Quality', emoji: '🧹', description: 'Code sạch, dễ đọc, dễ bảo trì' },
  { key: 'debugging', label: 'Debugging', emoji: '🐛', description: 'Tìm và xử lý lỗi' },
  { key: 'performance', label: 'Performance', emoji: '⚡', description: 'Tối ưu tốc độ, bộ nhớ, tài nguyên' },
  { key: 'testing', label: 'Testing', emoji: '🧪', description: 'Khả năng kiểm thử và đảm bảo độ tin cậy' },
  { key: 'security', label: 'Security', emoji: '🔐', description: 'Nhận thức và xử lý vấn đề bảo mật' },
  { key: 'engineering', label: 'Engineering', emoji: '🔧', description: 'Git, tooling, deployment, automation, workflow' },
  { key: 'learning', label: 'Learning', emoji: '📚', description: 'Khả năng học công nghệ mới và thích nghi' },
];

const DEFAULT_SCORES: RadarScores = {
  problemSolving: 0,
  programming: 0,
  systemDesign: 0,
  codeQuality: 0,
  debugging: 0,
  performance: 0,
  testing: 0,
  security: 0,
  engineering: 0,
  learning: 0,
};

/**
 * Strip HTML tags → plain text
 */
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Xây prompt gửi AI để đánh giá radar scores cho danh sách task.
 * AI sẽ xem từng task (title + description + status + exp + durationMs)
 * và chấm điểm 0-100 cho 10 tiêu chí kỹ năng.
 */
const buildRadarPrompt = (tasks: TaskItem[]): string => {
  const taskSummaries = tasks
    .map((t, i) => {
      const desc = stripHtml(t.description).slice(0, 200);
      const duration = t.durationMs ? `${Math.round(t.durationMs / 60000)}m` : 'N/A';
      return `${i + 1}. [${t.status}] "${t.title}" (EXP: ${t.exp ?? 0}, duration: ${duration})\n   Mô tả: ${desc || '(không có)'}`;
    })
    .join('\n\n');

  const criteriaList = RADAR_CRITERIA.map(
    (c) => `- ${c.key}: ${c.emoji} ${c.label} — ${c.description}`
  ).join('\n');

  return `Bạn là hệ thống đánh giá kỹ năng kỹ thuật. Dựa vào danh sách task đã hoàn thành của một lập trình viên, hãy đánh giá năng lực theo 10 tiêu chí dưới đây.

## 10 tiêu chí (mỗi tiêu chí 0-100):
${criteriaList}

## Danh sách task (${tasks.length} task):
${taskSummaries}

## Quy tắc:
- Chấm điểm 0-100 cho mỗi tiêu chí dựa trên nội dung, độ phức tạp, và kỹ năng thể hiện qua task.
- Task completed mới được tính. Task pending/ongoing chỉ tham khảo nhẹ.
- Task có description chi tiết, code, kiến trúc → điểm cao hơn.
- Task đơn giản (nhắn tin, đọc email) → điểm thấp.
- Nếu không có task nào → tất cả = 0.

## Output BẮT BUỘC: JSON đúng định dạng, KHÔNG kèm giải thích, KHÔNG markdown:
{"problemSolving":75,"programming":80,"systemDesign":50,"codeQuality":65,"debugging":60,"performance":40,"testing":30,"security":35,"engineering":55,"learning":70}`;
};

/**
 * Gọi Gemini để đánh giá radar scores dựa trên danh sách task.
 * @param tasks Danh sách task (chỉ completed mới được tính đáng kể)
 * @returns RadarScores với 10 tiêu chí (0-100)
 */
export const evaluateRadarScores = async (tasks: TaskItem[]): Promise<RadarScores> => {
  if (tasks.length === 0) return { ...DEFAULT_SCORES };

  const prompt = buildRadarPrompt(tasks);

  const res = await fetch(`${ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Radar lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.debug('[evaluateRadarScores] AI raw response:', JSON.stringify(raw));

  // Tìm JSON trong response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('[evaluateRadarScores] Không tìm thấy JSON, dùng mặc định. Raw:', raw);
    return { ...DEFAULT_SCORES };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const scores: RadarScores = { ...DEFAULT_SCORES };
    for (const criteria of RADAR_CRITERIA) {
      const val = parsed[criteria.key];
      if (typeof val === 'number') {
        scores[criteria.key] = Math.max(0, Math.min(100, Math.round(val)));
      }
    }
    return scores;
  } catch (err) {
    console.warn('[evaluateRadarScores] JSON parse lỗi:', err, 'Raw:', raw);
    return { ...DEFAULT_SCORES };
  }
};

/**
 * Tính điểm radar tổng hợp từ tất cả task (lấy trung bình).
 * Dùng khi hiển thị radar từ dữ liệu đã lưu trong từng task.
 */
export const aggregateRadarScores = (tasks: TaskItem[]): RadarScores => {
  const tasksWithScores = tasks.filter((t) => t.radarScores);
  if (tasksWithScores.length === 0) return { ...DEFAULT_SCORES };

  const sum = { ...DEFAULT_SCORES };
  for (const t of tasksWithScores) {
    const s = t.radarScores!;
    for (const criteria of RADAR_CRITERIA) {
      sum[criteria.key] += s[criteria.key] ?? 0;
    }
  }

  const avg = { ...DEFAULT_SCORES };
  for (const criteria of RADAR_CRITERIA) {
    avg[criteria.key] = Math.round(sum[criteria.key] / tasksWithScores.length);
  }
  return avg;
};

/**
 * Chuyển RadarScores → mảng data cho recharts RadarChart.
 */
export const radarScoresToChartData = (scores: RadarScores) => {
  return RADAR_CRITERIA.map((c) => ({
    criteria: `${c.emoji} ${c.label}`,
    shortLabel: c.label,
    value: scores[c.key] ?? 0,
    fullMark: 100,
  }));
};
