import { runMigration } from '../db/migrate/001_create_submissions';
import { runSeeder } from '../db/seeder/seed_submissions';

async function main() {
  console.log('🚀 Bắt đầu thực thi Migrate & Seeder cho Firebase Firestore...');
  await runMigration();
  await runSeeder();
  console.log('🎉 Hoàn tất quá trình Migrate & Seeder!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
