import { CONFIG } from '../config';
import { EXP_RULE, buildExpPrompt } from './expRule';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/** Loại AI provider */
export type AIProvider = 'gemini' | 'openrouter';

/** Danh sách model cho OpenRouter */
export const OPENROUTER_MODELS = [
  // Free models (suffix :free, $0 token) — danh sách live từ OpenRouter 2026-08-14
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 3 Super 120B (Free)', desc: 'Mặc định, mạnh, đa năng' },
  { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Free)', desc: 'Google, ổn định' },
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B (Free)', desc: 'Google, nhanh hơn' },
  { id: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B (Free)', desc: 'OpenAI open-source' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra 550B (Free)', desc: 'Lớn nhất, reasoning mạnh' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nemotron 3 Nano 30B (Free)', desc: 'Nhẹ, nhanh' },
  { id: 'cohere/north-mini-code:free', label: 'North Mini Code (Free)', desc: 'Cohere, tối ưu code' },
  { id: 'poolside/laguna-s-2.1:free', label: 'Laguna S 2.1 (Free)', desc: 'Poolside, coding agent' },
  { id: 'openrouter/free', label: 'Auto Free Router', desc: 'Tự chọn model free phù hợp' },
  // Paid models (cần credit)
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Rẻ, nhanh, ổn định' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', desc: 'Mạnh, đa năng' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', desc: 'Chất lượng cao' },
];

/** Kết quả parse JSON hành động từ câu trả lời của AI */
export interface ParsedAction {
  /** Phần text hiển thị cho user (đã bỏ JSON block) */
  text: string;
  /** Task cần tạo (nếu AI quyết định tạo) */
  createTask?: {
    title: string;
    description: string;
    zoneName?: string;
  };
}

const GEMINI_MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Xây system instruction cho chat agent.
 * Bao gồm danh sách zone hiện có để AI biết zone nào hợp lệ.
 */
const buildChatSystemInstruction = (availableZones: string[]) => {
  const zoneList = availableZones.length > 0 ? availableZones.join(', ') : '(chưa có zone nào)';
  const multipleZones = availableZones.length > 1;
  return `Bạn là trợ lý AI của app "Task Tracker", ứng dụng quản lý công việc.

Vai trò: GIÚP USER TẠO TASK qua hội thoại.

## QUY TRÌNH
1. Chưa rõ user cần gì → hỏi: "Hôm nay bạn cần thêm task gì?"
2. User nói muốn tạo task → thu thập đủ: title, description (HTML), zoneName.
3. zoneName${multipleZones ? ` phải thuộc [${zoneList}]. Nếu user đã chỉ định zone → dùng zone đó, KHÔNG hỏi lại. Nếu user chưa chỉ định → HỎI.` : `: [${zoneList}], tự động chọn.`}
4. Đủ thông tin → viết 1 câu xác nhận ngắn, sau đó JSON cuối cùng:
\`\`\`json
{"action":"create_task","task":{"title":"...","description":"<p>...</p>","zoneName":"..."}}
\`\`\`
5. KHÔNG viết gì sau JSON.
6. Không tạo task → trả lời bình thường, không JSON.

## BẮT BUỘC
- Trả lời NGẮN GỌN, tối đa 1-2 câu + JSON. KHÔNG giải thích, KHÔNG phân tích dài.
- KHÔNG suy nghĩ aloud, KHÔNG lặp lại yêu cầu user, KHÔNG ghi chép quá trình.
- description PHẢI là HTML: <p>, <ul><li>, <strong>, <br>. KHÔNG markdown.
- zoneName phải KHỚP danh sách (không phân biệt hoa thường).
- Nếu user đã chỉ định zone rõ ràng → tạo ngay, KHÔNG hỏi lại.
- Chỉ emit JSON khi muốn tạo task.`;
};

/**
 * Gọi Gemini API để sinh câu trả lời dựa trên lịch sử chat.
 * @param history Tin nhắn trước đó (user/model)
 * @param userMessage Tin nhắn mới của user
 * @param availableZones Danh sách tên zone hiện có để AI chọn
 * @returns Câu trả lời thô từ AI (chưa parse)
 */
export const askGemini = async (
  history: ChatMessage[],
  userMessage: string,
  availableZones: string[] = []
): Promise<string> => {
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const res = await fetch(`${ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      systemInstruction: {
        parts: [{ text: buildChatSystemInstruction(availableZones) }],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return reply?.trim() || 'Xin lỗi, tôi không tạo được câu trả lời lúc này.';
};

/**
 * Gọi Free.ai API (OpenAI-compatible) để sinh câu trả lời.
 * @param history Tin nhắn trước đó
 * @param userMessage Tin nhắn mới
 * @param availableZones Danh sách zone
 * @param model Model ID (vd: qwen7b, openai/gpt-4o)
 */
export const askFreeAI = async (
  history: ChatMessage[],
  userMessage: string,
  availableZones: string[] = [],
  model: string = 'qwen7b'
): Promise<string> => {
  const systemPrompt = buildChatSystemInstruction(availableZones);

  // Convert history sang OpenAI format (role: user/assistant)
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(CONFIG.FREE_AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.FREE_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Free AI lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply?.trim() || 'Xin lỗi, tôi không tạo được câu trả lời lúc này.';
};

/**
 * Gọi Blaze API (OpenAI-compatible).
 * Free plan: 150 requests/day, curated models.
 * @param history Tin nhắn trước đó
 * @param userMessage Tin nhắn mới
 * @param availableZones Danh sách zone
 * @param model Model ID (vd: gpt-4o-mini)
 */
export const askBlaze = async (
  history: ChatMessage[],
  userMessage: string,
  availableZones: string[] = [],
  model: string = 'gpt-4o-mini'
): Promise<string> => {
  const systemPrompt = buildChatSystemInstruction(availableZones);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(CONFIG.BLAZE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.BLAZE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Blaze API lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply?.trim() || 'Xin lỗi, tôi không tạo được câu trả lời lúc này.';
};

/**
 * Gọi OpenRouter API (OpenAI-compatible).
 * @param history Tin nhắn trước đó
 * @param userMessage Tin nhắn mới
 * @param availableZones Danh sách zone
 * @param model Model ID (vd: openai/gpt-4o-mini)
 */
export const askOpenRouter = async (
  history: ChatMessage[],
  userMessage: string,
  availableZones: string[] = [],
  model: string = 'nvidia/nemotron-3-super-120b-a12b:free'
): Promise<string> => {
  const systemPrompt = buildChatSystemInstruction(availableZones);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(CONFIG.OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
      'HTTP-Referer': CONFIG.OPENROUTER_REFERER,
      'X-Title': CONFIG.OPENROUTER_TITLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4096,
      reasoning: { exclude: true },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply?.trim() || 'Xin lỗi, tôi không tạo được câu trả lời lúc này.';
};

/**
 * Parse câu trả lời của AI để tách phần text hiển thị và JSON action (nếu có).
 * Hỗ trợ JSON trong fenced code block ```json ... ``` hoặc JSON raw.
 */
export const parseAction = (raw: string): ParsedAction => {
  // Tìm fenced json block
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  let jsonStr: string | null = null;
  let text = raw;

  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
    text = raw.replace(fenceMatch[0], '').trim();
  } else {
    // Thử tìm JSON raw có "action":"create_task" — greedy match từ { đầu đến } cuối
    const rawMatch = raw.match(/\{[\s\S]*\}/);
    if (rawMatch) {
      jsonStr = rawMatch[0];
      text = raw.replace(rawMatch[0], '').trim();
    }
  }

  if (!jsonStr) return { text };

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed?.action === 'create_task' && parsed?.task?.title) {
      return {
        text: text || `Tôi sẽ tạo task "${parsed.task.title}" cho bạn!`,
        createTask: {
          title: String(parsed.task.title).trim(),
          description: String(parsed.task.description ?? '').trim(),
          zoneName: parsed.task.zoneName ? String(parsed.task.zoneName).trim() : undefined,
        },
      };
    }
  } catch {
    // JSON lỗi → trả về text nguyên bản
    return { text: raw };
  }

  return { text };
};

/**
 * Gọi Gemini để chấm điểm EXP cho một task dựa trên quy tắc EXP_RULE.
 * @param title Tiêu đề task
 * @param description Mô tả task (có thể là HTML)
 * @returns Số EXP nguyên trong khoảng [0, 500]
 */
export const evaluateExp = async (title: string, description: string): Promise<number> => {
  // Strip HTML tags để AI đọc description dạng text thuần
  const plainDesc = description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const prompt = buildExpPrompt(title, plainDesc);

  const res = await fetch(`${ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 64,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini EXP lỗi (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.debug('[evaluateExp] AI raw response:', JSON.stringify(raw));

  // Tìm tất cả số nguyên trong câu trả lời, ưu tiên số trong khoảng [0, 500]
  const allNumbers: string[] = raw.match(/\d+/g) || [];
  const candidates = allNumbers.map((s: string) => parseInt(s, 10)).filter((n: number) => n >= 0 && n <= 500);

  // Ưu tiên số cuối cùng hợp lệ (thường là kết luận), fallback số đầu tiên, fallback 50
  let exp: number;
  if (candidates.length > 0) {
    exp = candidates[candidates.length - 1];
  } else if (allNumbers.length > 0) {
    exp = parseInt(allNumbers[0], 10);
  } else {
    console.warn('[evaluateExp] Không tìm thấy số nào, dùng mặc định 50. Raw:', raw);
    exp = 50;
  }

  return Math.max(0, Math.min(500, exp));
};

// Re-export để các module khác có thể import chung từ gemini.ts
export { EXP_RULE };
