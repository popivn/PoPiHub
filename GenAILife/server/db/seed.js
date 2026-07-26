import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAppClient } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const client = await getAppClient();

  try {
    // 1. Ensure system seeds table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        seed VARCHAR(255) NOT NULL,
        batch INT NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch ran seeds list
    const res = await client.query('SELECT seed FROM seeds');
    const ranSeeds = new Set(res.rows.map(row => row.seed));

    // Calculate current batch number
    const batchRes = await client.query('SELECT MAX(batch) as max_batch FROM seeds');
    const nextBatch = (batchRes.rows[0].max_batch || 0) + 1;

    // 3. Read seeds files directory
    const seedsDir = path.join(__dirname, 'seeds');
    const files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      if (ranSeeds.has(file)) {
        console.log(`⏩ [SKIP] Seed file already executed: ${file}`);
        continue;
      }

      console.log(`🌱 [SEEDING] File: ${file}`);
      const filePath = path.join(seedsDir, file);
      const seedModule = await import(pathToFileURL(filePath).href);

      // Run seed inside transaction
      await client.query('BEGIN');
      try {
        await seedModule.run(client);
        await client.query(
          'INSERT INTO seeds (seed, batch) VALUES ($1, $2)',
          [file, nextBatch]
        );
        await client.query('COMMIT');
        console.log(`✅ [DONE] Seed completed: ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [FAILED] Seed ${file}:`, err.message);
        throw err;
      }
    }

    if (ranCount === 0) {
      console.log('✨ Nothing to seed. All seed files have already been executed!');
    } else {
      console.log(`🌱 Executed ${ranCount} seed file(s) successfully!`);
    }

  } finally {
    await client.end();
  }
}

runSeed().catch(console.error);
