/**
 * Shared Type Definitions & Schemas for Client, Server, and Brain
 */
export const CharacterTypes = Object.freeze({
  HERO: 'hero',
  ENEMY: 'enemy',
  NPC: 'npc',
  BOSS: 'boss'
});

export const ActionTypes = Object.freeze({
  IDLE: 'IDLE',
  MOVE: 'MOVE',
  ATTACK: 'ATTACK',
  GUARD: 'GUARD',
  CHAT: 'CHAT'
});

export const UserRoles = Object.freeze({
  ADMIN: 'admin',
  PLAYER: 'player',
  GUEST: 'guest'
});
