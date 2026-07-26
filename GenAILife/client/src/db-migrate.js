import pg from 'pg';
const { Client } = pg;

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Hh123457a!',
  port: 5432,
};

async function setupDatabase() {
  // 1. Connect to default 'postgres' database to create 'genai_life' DB if not exists
  const rootClient = new Client(dbConfig);
  try {
    await rootClient.connect();
    console.log('🔌 Connected to PostgreSQL server...');

    const res = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'genai_life'");
    if (res.rowCount === 0) {
      await rootClient.query('CREATE DATABASE genai_life');
      console.log('✅ Created database "genai_life" successfully!');
    } else {
      console.log('ℹ️ Database "genai_life" already exists.');
    }
  } catch (err) {
    console.error('❌ Root DB connection error:', err.message);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // 2. Connect to 'genai_life' DB and run migrations (Create users table)
  const appClient = new Client({
    ...dbConfig,
    database: 'genai_life',
  });

  try {
    await appClient.connect();
    console.log('🔌 Connected to "genai_life" database...');

    // Create UUID extension if needed
    await appClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create users table
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'player',
        avatar_json JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await appClient.query(createUsersTableQuery);
    console.log('✅ Table "users" migrated successfully!');

    // Check table info
    const tableInfo = await appClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

    console.log('\n📊 "users" Table Structure:');
    console.table(tableInfo.rows);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await appClient.end();
    console.log('\n🎉 Setup & Migration completed!');
  }
}

setupDatabase();
