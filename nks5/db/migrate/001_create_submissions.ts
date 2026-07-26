import { db } from '../../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function runMigration() {
  console.log('🔄 Bắt đầu chạy Migration & tạo Collection "submissions" trên Firebase...');
  try {
    const docRef = await addDoc(collection(db, 'submissions'), {
      zalo: 'Admin Kịch Bản Hệ Thống',
      ingame: 'TôngSưKhởiTạo',
      createdAt: serverTimestamp(),
      isSystemInit: true
    });
    console.log('✅ Khởi tạo Collection "submissions" thành công! Doc ID:', docRef.id);
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo Migration:', err);
  }
}
