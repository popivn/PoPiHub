import type { TaskItem, Zone } from '../types';
import { CONFIG } from '../config';

// Get db instance initialized in index.html via script CDN
const getDb = () => (window as any).firebaseDb;

// Helper to access Firebase Firestore SDK functions from window.firebaseDb or global script modules
const getFirestoreUtils = () => {
  const win = window as any;
  if (win.FirestoreUtils) return win.FirestoreUtils;
  return null;
};

// ================= ZONES =================
export const subscribeZones = (onUpdate: (zones: Zone[]) => void) => {
  const checkAndSubscribe = () => {
    const utils = getFirestoreUtils();
    const db = getDb();

    if (!utils || !db) {
      const raw = localStorage.getItem('task_tracking_zones');
      onUpdate(raw ? JSON.parse(raw) : CONFIG.DEFAULT_ZONES);
      return () => {};
    }

    const zonesCol = utils.collection(db, 'zones');
    return utils.onSnapshot(zonesCol, (snapshot: any) => {
      if (snapshot.empty) {
        CONFIG.DEFAULT_ZONES.forEach((z) => {
          utils.setDoc(utils.doc(db, 'zones', z.id), z);
        });
        onUpdate(CONFIG.DEFAULT_ZONES);
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
    const list: Zone[] = raw ? JSON.parse(raw) : CONFIG.DEFAULT_ZONES;
    const updated = [...list.filter((z) => z.id !== zone.id), zone];
    localStorage.setItem('task_tracking_zones', JSON.stringify(updated));
    return;
  }
  await utils.setDoc(utils.doc(db, 'zones', zone.id), zone);
};

export const deleteZoneFromFirestore = async (id: string) => {
  const utils = getFirestoreUtils();
  const db = getDb();
  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_zones');
    const list: Zone[] = raw ? JSON.parse(raw) : CONFIG.DEFAULT_ZONES;
    const updated = list.filter((z) => z.id !== id);
    localStorage.setItem('task_tracking_zones', JSON.stringify(updated));
    return;
  }
  await utils.deleteDoc(utils.doc(db, 'zones', id));
};

// ================= TASKS =================
export const subscribeTasks = (onUpdate: (tasks: TaskItem[]) => void) => {
  const utils = getFirestoreUtils();
  const db = getDb();

  if (!utils || !db) {
    const raw = localStorage.getItem('task_tracking_items');
    onUpdate(raw ? JSON.parse(raw) : []);
    return () => {};
  }

  const tasksCol = utils.collection(db, 'tasks');
  return utils.onSnapshot(tasksCol, (snapshot: any) => {
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
