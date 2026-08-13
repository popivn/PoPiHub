import type { TaskItem, Zone, User } from '../types';
import { CONFIG } from '../config';

// Get db instance initialized in index.html via script CDN
const getDb = () => (window as any).firebaseDb;

// Helper to access Firebase Firestore SDK functions from window.firebaseDb or global script modules
const getFirestoreUtils = () => {
  const win = window as any;
  if (win.FirestoreUtils) return win.FirestoreUtils;
  return null;
};

// ================= USERS =================

/**
 * Lấy user theo key từ Firestore.
 * Trả về User nếu tìm thấy, null nếu không.
 */
export const getUserByKey = async (key: string): Promise<User | null> => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    // Fallback localStorage
    const raw = localStorage.getItem('task_tracking_users');
    const users: User[] = raw ? JSON.parse(raw) : [];
    return users.find((u) => u.key === key) || null;
  }

  try {
    const usersCol = utils.collection(db, 'users');
    const q = utils.query(usersCol, utils.where('key', '==', key));
    const snapshot = await utils.getDocs(q);
    if (snapshot.empty) return null;
    let user: User | null = null;
    snapshot.forEach((docSnap: any) => {
      user = { id: docSnap.id, ...docSnap.data() } as User;
    });
    return user;
  } catch (err) {
    console.error('getUserByKey error:', err);
    return null;
  }
};

/**
 * Seed user đầu tiên (id=1, key=ROOT_KEY) nếu chưa tồn tại.
 */
export const seedDefaultUser = async (): Promise<User | null> => {
  const existing = await getUserByKey(CONFIG.ROOT_KEY);
  if (existing) return existing;

  const utils = getFirestoreUtils();
  const db = getDb();
  const defaultUser: User = {
    id: '1',
    key: CONFIG.ROOT_KEY,
    name: 'Root User',
    createdAt: new Date().toISOString(),
  };

  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_users');
    const users: User[] = raw ? JSON.parse(raw) : [];
    users.push(defaultUser);
    localStorage.setItem('task_tracking_users', JSON.stringify(users));
    return defaultUser;
  }

  await utils.setDoc(utils.doc(db, 'users', '1'), defaultUser);
  return defaultUser;
};

// ================= ZONES =================

/**
 * Subscribe zones theo userId (chỉ lấy zone của user hiện tại).
 * Nếu user chưa có zone nào → seed DEFAULT_ZONES với userId.
 */
export const subscribeZones = (userId: string, onUpdate: (zones: Zone[]) => void) => {
  const checkAndSubscribe = () => {
    const utils = getFirestoreUtils();
    const db = getDb();

    if (!utils || !db) {
      const raw = localStorage.getItem('task_tracking_zones');
      const all: Zone[] = raw ? JSON.parse(raw) : [];
      const userZones = all.filter((z) => z.userId === userId);
      if (userZones.length === 0) {
        const seeded = CONFIG.DEFAULT_ZONES.map((z) => ({ ...z, userId }));
        onUpdate(seeded);
      } else {
        onUpdate(userZones);
      }
      return () => {};
    }

    const zonesCol = utils.collection(db, 'zones');
    let queryRef = zonesCol;
    if (utils.query && utils.where) {
      queryRef = utils.query(zonesCol, utils.where('userId', '==', userId));
    }

    return utils.onSnapshot(queryRef, (snapshot: any) => {
      if (snapshot.empty) {
        // Seed default zones cho user mới
        CONFIG.DEFAULT_ZONES.forEach((z) => {
          utils.setDoc(utils.doc(db, 'zones', `${userId}-${z.id}`), { ...z, userId });
        });
        onUpdate(CONFIG.DEFAULT_ZONES.map((z) => ({ ...z, userId })));
      } else {
        const zonesData: Zone[] = [];
        snapshot.forEach((docSnap: any) => {
          zonesData.push({ id: docSnap.id, ...docSnap.data() } as Zone);
        });
        onUpdate(zonesData);
      }
    }, (err: any) => {
      console.error('Firestore zones snapshot error:', err);
    });
  };

  return checkAndSubscribe();
};

export const saveZoneToFirestore = async (zone: Zone) => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_zones');
    const list: Zone[] = raw ? JSON.parse(raw) : [];
    const updated = [...list.filter((z) => z.id !== zone.id), zone];
    localStorage.setItem('task_tracking_zones', JSON.stringify(updated));
    return;
  }
  // Dùng zone.id làm document id (zone.id đã include userId prefix khi seed)
  await utils.setDoc(utils.doc(db, 'zones', zone.id), zone);
};

export const deleteZoneFromFirestore = async (id: string) => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_zones');
    const list: Zone[] = raw ? JSON.parse(raw) : [];
    const updated = list.filter((z) => z.id !== id);
    localStorage.setItem('task_tracking_zones', JSON.stringify(updated));
    return;
  }
  await utils.deleteDoc(utils.doc(db, 'zones', id));
};

// ================= TASKS =================

/**
 * Subscribe tasks theo userId (chỉ lấy task của user hiện tại).
 */
export const subscribeTasks = (userId: string, onUpdate: (tasks: TaskItem[]) => void) => {
  const utils = getFirestoreUtils();
  const db = getDb();

  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_items');
    const all: TaskItem[] = raw ? JSON.parse(raw) : [];
    onUpdate(all.filter((t) => t.userId === userId));
    return () => {};
  }

  const tasksCol = utils.collection(db, 'tasks');
  // Query theo userId
  let queryRef = tasksCol;
  if (utils.query && utils.where) {
    queryRef = utils.query(tasksCol, utils.where('userId', '==', userId));
  }

  return utils.onSnapshot(queryRef, (snapshot: any) => {
    const tasksData: TaskItem[] = [];
    snapshot.forEach((docSnap: any) => {
      tasksData.push({ id: docSnap.id, ...docSnap.data() } as TaskItem);
    });
    tasksData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(tasksData);
  }, (err: any) => {
    console.error('Firestore tasks snapshot error:', err);
  });
};

export const saveTaskToFirestore = async (task: TaskItem) => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_items');
    const list: TaskItem[] = raw ? JSON.parse(raw) : [];
    const updated = [task, ...list.filter((t) => t.id !== task.id)];
    localStorage.setItem('task_tracking_items', JSON.stringify(updated));
    return;
  }
  await utils.setDoc(utils.doc(db, 'tasks', task.id), task);
};

export const deleteTaskFromFirestore = async (id: string) => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_items');
    const list: TaskItem[] = raw ? JSON.parse(raw) : [];
    const updated = list.filter((t) => t.id !== id);
    localStorage.setItem('task_tracking_items', JSON.stringify(updated));
    return;
  }
  await utils.deleteDoc(utils.doc(db, 'tasks', id));
};
