export async function up(client) {
  // Create players table linked to users table (Max 3 players per user)
  await client.query(`
    CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      type VARCHAR(20) DEFAULT 'hero',
      json_path VARCHAR(255) NOT NULL,
      config_json JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function down(client) {
  await client.query('DROP TABLE IF EXISTS players CASCADE;');
}
