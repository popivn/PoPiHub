import type { TaskItem, SkillCategoryId } from '../types';

const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

/** Định nghĩa category kỹ năng */
export interface SkillCategory {
  id: SkillCategoryId;
  label: string;
  icon: string; // FA icon name
  description: string;
  criteria: { key: string; label: string; icon: string; description: string }[];
}

/** 10 tiêu chí CNTT */
export const IT_CRITERIA = [
  { key: 'problemSolving', label: 'Problem Solving', icon: 'faBrain', description: 'Phân tích và giải quyết vấn đề' },
  { key: 'programming', label: 'Programming', icon: 'faCode', description: 'Khả năng viết code và sử dụng ngôn ngữ lập trình' },
  { key: 'systemDesign', label: 'System Design', icon: 'faSitemap', description: 'Thiết kế hệ thống, kiến trúc, module' },
  { key: 'codeQuality', label: 'Code Quality', icon: 'faBroom', description: 'Code sạch, dễ đọc, dễ bảo trì' },
  { key: 'debugging', label: 'Debugging', icon: 'faBug', description: 'Tìm và xử lý lỗi' },
  { key: 'performance', label: 'Performance', icon: 'faBolt', description: 'Tối ưu tốc độ, bộ nhớ, tài nguyên' },
  { key: 'testing', label: 'Testing', icon: 'faVial', description: 'Khả năng kiểm thử và đảm bảo độ tin cậy' },
  { key: 'security', label: 'Security', icon: 'faShieldHalved', description: 'Nhận thức và xử lý vấn đề bảo mật' },
  { key: 'engineering', label: 'Engineering', icon: 'faGears', description: 'Git, tooling, deployment, automation, workflow' },
  { key: 'learning', label: 'Learning', icon: 'faBookOpen', description: 'Khả năng học công nghệ mới và thích nghi' },
];

/** 8 tiêu chí ngôn ngữ */
export const LANGUAGE_CRITERIA = [
  { key: 'vocabulary', label: 'Vocabulary', icon: 'faBook', description: 'Lượng từ vựng và khả năng sử dụng' },
  { key: 'grammar', label: 'Grammar', icon: 'faPenNib', description: 'Ngữ pháp chính xác và tự nhiên' },
  { key: 'listening', label: 'Listening', icon: 'faHeadphones', description: 'Khả năng nghe hiểu' },
  { key: 'speaking', label: 'Speaking', icon: 'faMicrophone', description: 'Khả năng giao tiếp口头' },
  { key: 'reading', label: 'Reading', icon: 'faBookOpenReader', description: 'Khả năng đọc hiểu văn bản' },
  { key: 'writing', label: 'Writing', icon: 'faPenToSquare', description: 'Khả năng viết câu, đoạn, bài' },
  { key: 'pronunciation', label: 'Pronunciation', icon: 'faVolumeHigh', description: 'Phát âm rõ ràng, chuẩn' },
  { key: 'fluency', label: 'Fluency', icon: 'faComments', description: 'Sự trôi chảy, phản xạ ngôn ngữ' },
];

/** Danh sách category */
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'it',
    label: 'Công Nghệ Thông Tin',
    icon: 'faLaptopCode',
    description: 'Kỹ năng lập trình và kỹ thuật',
    criteria: IT_CRITERIA,
  },
  {
    id: 'language',
    label: 'Kỹ Năng Ngôn Ngữ',
    icon: 'faLanguage',
    description: 'Kỹ năng ngôn ngữ và giao tiếp',
    criteria: LANGUAGE_CRITERIA,
  },
];

/** Lấy category theo id */
export const getSkillCategory = (id: SkillCategoryId): SkillCategory =>
  SKILL_CATEGORIES.find((c) => c.id === id) || SKILL_CATEGORIES[0];

/** Alias giữ tương thích ngược */
export const RADAR_CRITERIA = IT_CRITERIA;

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
 * Xây prompt gửi AI để đánh giá radar scores cho danh sách task theo category.
 */
const buildRadarPrompt = (tasks: TaskItem[], category: SkillCategory): string => {
  const taskSummaries = tasks
    .map((t, i) => {
      const desc = stripHtml(t.description).slice(0, 200);
      const duration = t.durationMs ? `${Math.round(t.durationMs / 60000)}m` : 'N/A';
      return `${i + 1}. [${t.status}] "${t.title}" (EXP: ${t.exp ?? 0}, duration: ${duration})\n   Mô tả: ${desc || '(không có)'}`;
    })
    .join('\n\n');

  const criteriaList = category.criteria
    .map((c) => `- ${c.key}: ${c.label} — ${c.description}`)
    .join('\n');

  const keys = category.criteria.map((c) => `"${c.key}":0`).join(',');
  const exampleJson = `{${keys}}`;

  const contextLine =
    category.id === 'it'
      ? 'hệ thống đánh giá kỹ năng kỹ thuật (lập trình, kiến trúc, tooling)'
      : 'hệ thống đánh giá kỹ năng ngôn ngữ (từ vựng, ngữ pháp, giao tiếp)';

  return `Bạn là ${contextLine}, một giám khảo KHẮT KHE và đòi hỏi cao. Dựa vào danh sách task đã hoàn thành, hãy đánh giá năng lực thực tế theo ${category.criteria.length} tiêu chí dưới đây.

## ${category.criteria.length} tiêu chí (mỗi tiêu chí 0-100):
${criteriaList}

## Danh sách task (${tasks.length} task):
${taskSummaries}

## Quy tắc đánh giá KHẮT KHE:
- Chỉ chấm điểm khi có BẰNG CHỨNG rõ ràng trong task thể hiện kỹ năng đó.
- KHÔNG cho điểm lót tay, KHÔNG suy đoán, KHÔNG tặng điểm.
- Nếu KHÔNG có task nào liên quan đến tiêu chí → 0 điểm. Mạnh dạn cho 0.
- Điểm 0-30: chưa thể hiện hoặc chỉ chạm nhẹ.
- Điểm 31-50: có làm nhưng hời hợt, thiếu chiều sâu.
- Điểm 51-70: có thể hiện rõ, có chiều sâu vừa phải.
- Điểm 71-85: thể hiện tốt, có tư duy và thực hành bài bản.
- Điểm 86-100: xuất sắc, mastery, chỉ cho khi thực sự ấn tượng.
- Task completed mới được tính. Task pending/ongoing KHÔNG tính.
- Đánh giá dựa trên CHẤT LƯỢNG và ĐỘ PHỨC TẠP thực tế, KHÔNG dựa trên số lượng task.
- Nếu không có task nào → tất cả = 0.

## Output BẮT BUỘC: JSON đúng định dạng, KHÔNG kèm giải thích, KHÔNG markdown:
${exampleJson}`;
};

/**
 * Gọi OpenRouter (model free) để đánh giá radar scores theo category.
 * @param tasks Danh sách task (chỉ completed mới được tính đáng kể)
 * @param categoryId Loại kỹ năng cần đánh giá
 * @returns Record<string, number> với các tiêu chí (0-100)
 */
export const evaluateRadarScores = async (
  tasks: TaskItem[],
  categoryId: SkillCategoryId = 'it'
): Promise<Record<string, number>> => {
  const category = getSkillCategory(categoryId);
  if (tasks.length === 0) {
    const empty: Record<string, number> = {};
    for (const c of category.criteria) empty[c.key] = 0;
    return empty;
  }

  const prompt = buildRadarPrompt(tasks, category);

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    top_p: 1,
    max_tokens: 2048,
    seed: 42,
  };

  const key = sessionStorage.getItem('popi_access_key') || '';
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'Authorization': `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ provider: 'openrouter', payload }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter Radar lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  console.debug(`[evaluateRadarScores:${categoryId}] AI raw response:`, JSON.stringify(raw));

  // Tìm JSON trong response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`[evaluateRadarScores:${categoryId}] Không tìm thấy JSON. Raw:`, raw);
    const empty: Record<string, number> = {};
    for (const c of category.criteria) empty[c.key] = 0;
    return empty;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const scores: Record<string, number> = {};
    for (const c of category.criteria) {
      const val = parsed[c.key];
      scores[c.key] = typeof val === 'number' ? Math.max(0, Math.min(100, Math.round(val))) : 0;
    }
    return scores;
  } catch (err) {
    console.warn(`[evaluateRadarScores:${categoryId}] JSON parse lỗi:`, err, 'Raw:', raw);
    const empty: Record<string, number> = {};
    for (const c of category.criteria) empty[c.key] = 0;
    return empty;
  }
};

/**
 * Tính điểm radar tổng hợp từ tất cả task (lấy trung bình) theo category.
 */
export const aggregateRadarScores = (
  tasks: TaskItem[],
  categoryId: SkillCategoryId = 'it'
): Record<string, number> => {
  const category = getSkillCategory(categoryId);
  const empty: Record<string, number> = {};
  for (const c of category.criteria) empty[c.key] = 0;

  const tasksWithScores = tasks.filter((t) => t.radarScores?.[categoryId]);
  if (tasksWithScores.length === 0) return empty;

  const sum: Record<string, number> = { ...empty };
  for (const t of tasksWithScores) {
    const s = t.radarScores![categoryId]!;
    for (const c of category.criteria) {
      sum[c.key] += s[c.key] ?? 0;
    }
  }

  const avg: Record<string, number> = { ...empty };
  for (const c of category.criteria) {
    avg[c.key] = Math.round(sum[c.key] / tasksWithScores.length);
  }
  return avg;
};

/**
 * Chuyển scores → mảng data cho recharts RadarChart theo category.
 */
export const radarScoresToChartData = (
  scores: Record<string, number>,
  categoryId: SkillCategoryId = 'it'
) => {
  const category = getSkillCategory(categoryId);
  return category.criteria.map((c) => ({
    criteria: c.label,
    shortLabel: c.label,
    value: scores[c.key] ?? 0,
    fullMark: 100,
  }));
};

/**
 * Kiểm tra task có radarScores cho category nào đó không.
 */
export const hasRadarDataForCategory = (
  tasks: TaskItem[],
  categoryId: SkillCategoryId
): boolean => tasks.some((t) => t.radarScores?.[categoryId]);
