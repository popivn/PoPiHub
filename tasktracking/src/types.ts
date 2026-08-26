export type TaskStatus = 'pending' | 'ongoing' | 'completed';

export interface Zone {
  id: string;
  userId: string; // ID của user sở hữu zone
  name: string;
  color: string;
  icon?: string;
}

/** User entity stored in Firestore `users` collection */
export interface User {
  id: string;
  key: string;
  name?: string;
  email?: string;
  createdAt: string;
}

/** 10 tiêu chí đánh giá kỹ năng CNTT (radar chart) */
export interface ITScores {
  problemSolving: number;   // 🧠 Problem Solving
  programming: number;      // 💻 Programming
  systemDesign: number;     // 🏗️ System Design
  codeQuality: number;      // 🧹 Code Quality
  debugging: number;        // 🐛 Debugging
  performance: number;      // ⚡ Performance
  testing: number;          // 🧪 Testing
  security: number;         // 🔐 Security
  engineering: number;      // 🔧 Engineering
  learning: number;         // 📚 Learning
}

/** 8 tiêu chí đánh giá kỹ năng ngôn ngữ (radar chart) */
export interface LanguageScores {
  vocabulary: number;       // 📖 Vocabulary
  grammar: number;          // ✏️ Grammar
  listening: number;        // 👂 Listening
  speaking: number;         // 🗣️ Speaking
  reading: number;          // 📕 Reading
  writing: number;          // ✍️ Writing
  pronunciation: number;    // 🔊 Pronunciation
  fluency: number;          // 💬 Fluency
}

/** Alias giữ tương thích ngược */
export type RadarScores = ITScores;

/** Loại category kỹ năng */
export type SkillCategoryId = 'it' | 'language';

/** Map điểm radar theo category */
export type RadarScoresMap = Partial<Record<SkillCategoryId, Record<string, number>>>;

export interface TaskItem {
  id: string;
  userId: string; // ID của user sở hữu task
  zoneId: string;
  title: string;
  description: string; // Rich HTML text from RichTextEditor
  status: TaskStatus;
  exp: number; // EXP points awarded by AI based on description
  /** ISO timestamp khi task bắt đầu làm (chuyển sang ongoing). Null khi pending. */
  startedAt?: string | null;
  /**
   * ISO datetime (kèm HH:MM:SS) dự kiến làm task, vd: "2026-08-26T14:30:00".
   * Mặc định `<ngày tạo>T00:00:00` nếu không truyền.
   */
  scheduledAt?: string | null;
  /** Giờ dự kiến (0-23) tách riêng từ scheduledAt để dễ lọc theo khung giờ. */
  scheduledHour?: number;
  /** Tổng thời gian thực hiện (ms) khi task completed. Reset về 0 khi về pending. */
  durationMs?: number;
  /** Điểm radar do AI đánh giá, lưu theo category (vd: { it: {...}, language: {...} }) */
  radarScores?: RadarScoresMap | null;
  createdAt: string;
  updatedAt: string;
}
