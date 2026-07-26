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
  createdAt: string;
  updatedAt: string;
}
