export async function up(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_histories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id VARCHAR(255) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      receiver_id VARCHAR(255),
      receiver_name VARCHAR(255),
      message TEXT NOT NULL,
      channel VARCHAR(50) DEFAULT 'global',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sender_id ON chat_histories(sender_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_histories(created_at DESC);
  `);
}

export async function down(client) {
  await client.query(`DROP TABLE IF EXISTS chat_histories;`);
}
