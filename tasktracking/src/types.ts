export type TaskStatus = 'pending' | 'ongoing' | 'completed';

export interface Zone {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TaskItem {
  id: string;
  zoneId: string;
  title: string;
  description: string; // Rich HTML text from TinyMCE
  status: TaskStatus;
  exp: number; // EXP points awarded by AI based on description
  /** ISO timestamp khi task bắt đầu làm (chuyển sang ongoing). Null khi pending. */
  startedAt?: string | null;
  /** Tổng thời gian thực hiện (ms) khi task completed. Reset về 0 khi về pending. */
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}
