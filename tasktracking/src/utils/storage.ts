import type { TaskItem, Zone, User } from '../types';
import { CONFIG } from '../config';

// Pub-Sub Event Emitter for Local State Management
let currentTasks: TaskItem[] = [];
let currentZones: Zone[] = [];

const taskListeners = new Set<(tasks: TaskItem[]) => void>();
const zoneListeners = new Set<(zones: Zone[]) => void>();

// Helper to get access key from sessionStorage
const getAccessKey = (): string => {
  return sessionStorage.getItem('popi_access_key') || '';
};

// Generic authenticated API fetch helper
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const key = getAccessKey();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(key ? { 'Authorization': `Bearer ${key}` } : {}),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};

// Helper to sort tasks descending by createdAt
const sortTasks = (list: TaskItem[]) => {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// ================= USERS =================

/**
 * Lấy user theo key từ Serverless API.
 * Trả về User nếu tìm thấy, null nếu không.
 */
export const getUserByKey = async (key: string): Promise<User | null> => {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      if (res.status === 401) return null;
      throw new Error(`Auth API returned status ${res.status}`);
    }

    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error('getUserByKey error:', err);
    // Fallback to localStorage if API fails or when dev server is starting
    const raw = localStorage.getItem('task_tracking_users');
    const users: User[] = raw ? JSON.parse(raw) : [];
    return users.find((u) => u.key === key) || null;
  }
};

/**
 * Seed user đầu tiên (id=1, key=ROOT_KEY) nếu chưa tồn tại.
 */
export const seedDefaultUser = async (): Promise<User | null> => {
  // we just make an auth request with ROOT_KEY to seed it on the server side
  return getUserByKey(CONFIG.ROOT_KEY);
};

// ================= ZONES =================

const fetchZones = async (userId: string) => {
  try {
    const res = await apiFetch(`/api/zones?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Fetch zones failed: ${res.status}`);
    const data = await res.json();
    currentZones = data.zones || [];
  } catch (err) {
    console.error('fetchZones error:', err);
  }
};

/**
 * Subscribe zones theo userId (chỉ lấy zone của user hiện tại).
 */
export const subscribeZones = (userId: string, onUpdate: (zones: Zone[]) => void) => {
  zoneListeners.add(onUpdate);

  // Initial fetch and trigger
  fetchZones(userId).then(() => {
    onUpdate([...currentZones]);
    // Notify all other listeners just in case
    zoneListeners.forEach((listener) => {
      if (listener !== onUpdate) listener([...currentZones]);
    });
  });

  // Return unsubscribe function
  return () => {
    zoneListeners.delete(onUpdate);
  };
};

export const saveZoneToFirestore = async (zone: Zone) => {
  // Update local state first (Optimistic update)
  const index = currentZones.findIndex((z) => z.id === zone.id);
  if (index > -1) {
    currentZones[index] = zone;
  } else {
    currentZones = [...currentZones, zone];
  }
  // Notify listeners immediately
  zoneListeners.forEach((listener) => listener([...currentZones]));

  // Send request to serverless API
  try {
    const res = await apiFetch('/api/zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
    if (!res.ok) throw new Error(`Save zone failed: ${res.status}`);
  } catch (err) {
    console.error('saveZoneToFirestore error:', err);
    // Re-fetch zones to sync with server state in case of failure
    fetchZones(zone.userId).then(() => {
      zoneListeners.forEach((listener) => listener([...currentZones]));
    });
  }
};

export const deleteZoneFromFirestore = async (id: string) => {
  // Find userId to re-fetch if needed
  const zoneToDelete = currentZones.find((z) => z.id === id);
  const userId = zoneToDelete?.userId;

  // Update local state first
  currentZones = currentZones.filter((z) => z.id !== id);
  zoneListeners.forEach((listener) => listener([...currentZones]));

  // Send request to serverless API
  try {
    const res = await apiFetch(`/api/zones?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Delete zone failed: ${res.status}`);
  } catch (err) {
    console.error('deleteZoneFromFirestore error:', err);
    if (userId) {
      fetchZones(userId).then(() => {
        zoneListeners.forEach((listener) => listener([...currentZones]));
      });
    }
  }
};

// ================= TASKS =================

const fetchTasks = async (userId: string) => {
  try {
    const res = await apiFetch(`/api/tasks?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Fetch tasks failed: ${res.status}`);
    const data = await res.json();
    currentTasks = data.tasks || [];
  } catch (err) {
    console.error('fetchTasks error:', err);
  }
};

/**
 * Subscribe tasks theo userId (chỉ lấy task của user hiện tại).
 */
export const subscribeTasks = (userId: string, onUpdate: (tasks: TaskItem[]) => void) => {
  taskListeners.add(onUpdate);

  // Initial fetch and trigger
  fetchTasks(userId).then(() => {
    onUpdate(sortTasks(currentTasks));
    // Notify all other listeners just in case
    taskListeners.forEach((listener) => {
      if (listener !== onUpdate) listener(sortTasks(currentTasks));
    });
  });

  // Return unsubscribe function
  return () => {
    taskListeners.delete(onUpdate);
  };
};

export const saveTaskToFirestore = async (task: TaskItem) => {
  // Update local state first
  const index = currentTasks.findIndex((t) => t.id === task.id);
  if (index > -1) {
    currentTasks[index] = task;
  } else {
    currentTasks = [task, ...currentTasks];
  }
  // Notify listeners immediately
  taskListeners.forEach((listener) => listener(sortTasks(currentTasks)));

  // Send request to serverless API
  try {
    const res = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error(`Save task failed: ${res.status}`);
  } catch (err) {
    console.error('saveTaskToFirestore error:', err);
    // Re-fetch tasks to sync with server state in case of failure
    fetchTasks(task.userId).then(() => {
      taskListeners.forEach((listener) => listener(sortTasks(currentTasks)));
    });
  }
};

export const deleteTaskFromFirestore = async (id: string) => {
  const taskToDelete = currentTasks.find((t) => t.id === id);
  const userId = taskToDelete?.userId;

  // Update local state first
  currentTasks = currentTasks.filter((t) => t.id !== id);
  taskListeners.forEach((listener) => listener(sortTasks(currentTasks)));

  // Send request to serverless API
  try {
    const res = await apiFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Delete task failed: ${res.status}`);
  } catch (err) {
    console.error('deleteTaskFromFirestore error:', err);
    if (userId) {
      fetchTasks(userId).then(() => {
        taskListeners.forEach((listener) => listener(sortTasks(currentTasks)));
      });
    }
  }
};
