import pg from 'pg';
const { Client } = pg;

export const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Hh123457a!',
  port: 5432,
};

export const targetDatabase = 'genai_life';

export async function getAppClient() {
  // Ensure target database exists
  const rootClient = new Client(dbConfig);
  try {
    await rootClient.connect();
    const res = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDatabase]);
    if (res.rowCount === 0) {
      await rootClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Created database "${targetDatabase}"`);
    }
  } finally {
    await rootClient.end();
  }

  const appClient = new Client({
    ...dbConfig,
    database: targetDatabase
  });
  await appClient.connect();
  return appClient;
}
