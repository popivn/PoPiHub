import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAppClient } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrate() {
  const client = await getAppClient();

  try {
    // 1. Ensure system migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL,
        batch INT NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch ran migrations list
    const res = await client.query('SELECT migration FROM migrations');
    const ranMigrations = new Set(res.rows.map(row => row.migration));

    // Calculate current batch number
    const batchRes = await client.query('SELECT MAX(batch) as max_batch FROM migrations');
    const nextBatch = (batchRes.rows[0].max_batch || 0) + 1;

    // 3. Read migration files directory
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      if (ranMigrations.has(file)) {
        console.log(`⏩ [SKIP] Migration already ran: ${file}`);
        continue;
      }

      console.log(`🚀 [RUNNING] Migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const migrationModule = await import(pathToFileURL(filePath).href);

      // Run migration inside transaction
      await client.query('BEGIN');
      try {
        await migrationModule.up(client);
        await client.query(
          'INSERT INTO migrations (migration, batch) VALUES ($1, $2)',
          [file, nextBatch]
        );
        await client.query('COMMIT');
        console.log(`✅ [DONE] Migration completed: ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [FAILED] Migration ${file}:`, err.message);
        throw err;
      }
    }

    if (ranCount === 0) {
      console.log('✨ Nothing to migrate. Everything is up to date!');
    } else {
      console.log(`🎉 Migrated ${ranCount} file(s) successfully!`);
    }

  } finally {
    await client.end();
  }
}

runMigrate().catch(console.error);
