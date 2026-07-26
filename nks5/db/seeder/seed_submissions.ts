import { db } from '../../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const initialData = [
  { zalo: 'Nguyễn Văn A (0987123456)', ingame: 'TôngSưBáVương' },
  { zalo: 'Trần Thị B (0912345678)', ingame: 'NgọcKinhChủ' }
];

export async function runSeeder() {
  console.log('🌱 Đang nạp dữ liệu mẫu (Seeder) vào Firebase...');
  try {
    for (const item of initialData) {
      await addDoc(collection(db, 'submissions'), {
        ...item,
        createdAt: serverTimestamp()
      });
    }
    console.log('✅ Nạp dữ liệu mẫu thành công!');
  } catch (err) {
    console.error('❌ Lỗi Seeder:', err);
  }
}
