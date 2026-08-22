import { authedFetch } from '../auth/authClient';

export interface Player {
  id: string;
  name: string;
  slimeType: string;
  avatar: string;
  createdAt: number;
}

export interface PlayerList {
  players: Player[];
  selectedId: string | null;
}

export const SLIME_TYPES: { id: string; label: string }[] = [
  { id: 'nature', label: 'Nature' },
  { id: 'frost', label: 'Frost' },
  { id: 'ember', label: 'Ember' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'royal', label: 'Royal' },
];

export const SLIME_AVATARS: string[] = [
  '🦊', '🐱', '🐼', '🐸', '🦄', '🐯', '🐰', '🐲',
  '👾', '🤖', '👻', '🦖', '🐧', '🦉', '🐙', '🦋',
];

export async function listPlayers(): Promise<PlayerList> {
  const res = await authedFetch('/players');
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed to load players');
  return res.json();
}

export async function createPlayer(name: string, slimeType: string, avatar: string): Promise<Player> {
  const res = await authedFetch('/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, slimeType, avatar }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed to create player');
  return res.json();
}

export async function selectPlayer(id: string): Promise<Player> {
  const res = await authedFetch(`/players/${id}/select`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed to select player');
  return res.json();
}
