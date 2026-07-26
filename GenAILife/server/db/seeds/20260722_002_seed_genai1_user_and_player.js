export async function run(client) {
  // 1. Seed GenAi1 AI System User
  const aiUserRes = await client.query(`
    INSERT INTO users (id, username, email, password_hash, role, avatar_json)
    VALUES (
      '00000000-0000-0000-0000-0000000000a1',
      'GenAi1',
      'genai1@agent.genailife.com',
      '$2b$10$e8T.s1WqW6r6JqSgYh9FmO7R9Q/1y/z4l.J7k8q.N0K2M3L4P5O6',
      'npc_agent',
      '{"helmet":"cyber_crown","shield":"star_shield","weapon":"none","themeColor":62206}'
    )
    ON CONFLICT (username) DO UPDATE SET role = 'npc_agent'
    RETURNING id;
  `);

  const genAi1UserId = aiUserRes.rows[0]?.id || '00000000-0000-0000-0000-0000000000a1';

  // 2. Seed GenAi1 Player character in players table
  const genAi1Config = {
    helmet: 'cyber_crown',
    shield: 'star_shield',
    weapon: 'none',
    themeColor: 0x00f2fe,
    hp: 500,
    maxHp: 500,
    attack: 0,
    speed: 0,
    isStationary: true,
    isAiAgent: true,
    model: 'qwen3:1.7b'
  };

  await client.query(`
    INSERT INTO players (id, user_id, name, type, json_path, config_json)
    VALUES (
      '00000000-0000-0000-0000-0000000000b1',
      $1,
      'GenAi1',
      'npc',
      '/assets/characters/custom/genai1.json',
      $2
    )
    ON CONFLICT (id) DO NOTHING;
  `, [genAi1UserId, JSON.stringify(genAi1Config)]);

  console.log('   🤖 Seeded GenAi1 AI User & Player records successfully.');
}
