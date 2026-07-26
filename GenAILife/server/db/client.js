import pg from 'pg';
const { Client } = pg;

export const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

export const targetDatabase = process.env.DB_NAME || 'popihub_db';

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
