export async function run(client) {
  const users = [
    {
      username: 'admin',
      email: 'admin@genailife.com',
      password_hash: '$2b$10$e8T.s1WqW6r6JqSgYh9FmO7R9Q/1y/z4l.J7k8q.N0K2M3L4P5O6', // hashed pass
      role: 'admin',
      avatar_json: { helmet: 'tech_visor', shield: 'star_shield', weapon: 'laser_blade', themeColor: 0x00f2fe }
    },
    {
      username: 'cyber_knight',
      email: 'hero@genailife.com',
      password_hash: '$2b$10$e8T.s1WqW6r6JqSgYh9FmO7R9Q/1y/z4l.J7k8q.N0K2M3L4P5O6',
      role: 'player',
      avatar_json: { helmet: 'knight_helm', shield: 'heavy_bulwark', weapon: 'flame_greatsword', themeColor: 0xff007f }
    }
  ];

  for (const user of users) {
    await client.query(`
      INSERT INTO users (username, email, password_hash, role, avatar_json)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING;
    `, [user.username, user.email, user.password_hash, user.role, JSON.stringify(user.avatar_json)]);
  }

  console.log('   🌱 Seeded default users successfully.');
}
