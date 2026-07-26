import { getAppClient } from '../client.js';

export async function up(client) {
  // Create UUID extension
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Create migrations log table (Laravel style)
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      migration VARCHAR(255) NOT NULL,
      batch INT NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create seeds log table (Laravel style)
  await client.query(`
    CREATE TABLE IF NOT EXISTS seeds (
      id SERIAL PRIMARY KEY,
      seed VARCHAR(255) NOT NULL,
      batch INT NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create users table
  await client.query(`
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
  `);
}

export async function down(client) {
  await client.query('DROP TABLE IF EXISTS users CASCADE;');
}
