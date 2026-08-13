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
  createdAt: string;
}

/** 10 tiêu chí đánh giá kỹ năng (radar chart) */
export interface RadarScores {
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

export interface TaskItem {
  id: string;
  userId: string; // ID của user sở hữu task
  zoneId: string;
  title: string;
  description: string; // Rich HTML text from TinyMCE
  status: TaskStatus;
  exp: number; // EXP points awarded by AI based on description
  /** ISO timestamp khi task bắt đầu làm (chuyển sang ongoing). Null khi pending. */
  startedAt?: string | null;
  /** Tổng thời gian thực hiện (ms) khi task completed. Reset về 0 khi về pending. */
  durationMs?: number;
  /** Điểm radar do AI đánh giá cho từng task (0-100 mỗi tiêu chí) */
  radarScores?: RadarScores | null;
  createdAt: string;
  updatedAt: string;
}
