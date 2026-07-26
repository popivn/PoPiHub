import { db } from '../../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const rawSubmissionsData = [
  { zalo: 'Trung Hiếu', ingame: 'PoPi', dateStr: '2026-07-26T23:02:46+07:00' },
  { zalo: 'Lệ Mỹ', ingame: 'Phương Hi', dateStr: '2026-07-26T23:05:20+07:00' },
  { zalo: 'Lê Vũ', ingame: 'Rain', dateStr: '2026-07-26T23:05:58+07:00' },
  { zalo: 'Hà Hùng', ingame: 'Tử Tinh', dateStr: '2026-07-26T23:11:18+07:00' },
  { zalo: 'Hà', ingame: 'Thiên Hà', dateStr: '2026-07-26T23:15:52+07:00' },
  { zalo: 'Maglic', ingame: 'Maglic', dateStr: '2026-07-27T01:06:05+07:00' },
  { zalo: 'Phạm Khánh Hưng', ingame: 'Lão quân', dateStr: '2026-07-27T02:03:37+07:00' }
];

export async function runSeeder() {
  console.log('🌱 Đang nạp danh sách dữ liệu mẫu đầy đủ vào Firebase Firestore...');
  try {
    for (let i = 0; i < rawSubmissionsData.length; i++) {
      const item = rawSubmissionsData[i];
      const date = new Date(item.dateStr);
      await addDoc(collection(db, 'submissions'), {
        zalo: item.zalo,
        ingame: item.ingame,
        createdAt: Timestamp.fromDate(date),
        guestId: `guest_seeder_${i + 1}`,
        ip: '113.161.45.88',
        city: 'TP. Hồ Chí Minh',
        region: 'Hồ Chí Minh',
        country: 'Việt Nam',
        lat: 10.8231,
        lon: 106.6297,
        riskScore: 90,
        riskLevel: 'Thấp (An toàn)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        timezone: 'Asia/Ho_Chi_Minh'
      });
    }
    console.log('✅ Nạp dữ liệu mẫu 7 thành viên thành công!');
  } catch (err) {
    console.error('❌ Lỗi Seeder:', err);
  }
}
