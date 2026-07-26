/**
 * Auto NPC Enums & Configuration Settings
 */
export const AutoNpcRoles = Object.freeze({
  HERO: 'hero',
  NPC: 'npc',
  BOSS: 'boss'
});

export const AutoNpcPresets = Object.freeze({
  // 🧍 GenAi1 AI Agent NPC at Spawn (World Pos: 0, 60)
  SPAWN_GUIDE_NPC: {
    id: '00000000-0000-0000-0000-0000000000b1',
    name: 'GenAi1',
    type: AutoNpcRoles.NPC,
    helmet: 'cyber_crown',
    shield: 'star_shield',
    weapon: 'none',
    themeColor: 0x00f2fe, // Cyan Glow
    hp: 500,
    maxHp: 500,
    attack: 0,
    speed: 1.8, // Autonomous movement speed
    isStationary: false, // Enable wandering & exploration
    isAiAgent: true,
    model: 'qwen3:1.7b',
    spawnWorldPos: { wx: 0, wy: 60 }
  }
});