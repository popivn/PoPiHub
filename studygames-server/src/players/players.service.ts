import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { getFirestore } from '../app/firebase-admin';

export interface Player {
  id: string;
  uid: string;
  name: string;
  slimeType: string;
  avatar: string;
  createdAt: number;
}

export interface CreatePlayerDto {
  name: string;
  slimeType: string;
  avatar: string;
}

export interface PlayerListResult {
  players: Player[];
  selectedId: string | null;
}

const PLAYERS_COLLECTION = 'players';
const USERS_COLLECTION = 'users';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  private id(): string {
    return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async list(uid: string): Promise<PlayerListResult> {
    const db = getFirestore();
    const snap = await db
      .collection(PLAYERS_COLLECTION)
      .where('uid', '==', uid)
      .get();
    const players = snap.docs
      .map((d) => d.data() as Player)
      .sort((a, b) => a.createdAt - b.createdAt);

    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    const selectedId = (userDoc.data()?.selectedPlayerId as string) ?? null;

    return { players, selectedId };
  }

  async create(uid: string, dto: CreatePlayerDto): Promise<Player> {
    const db = getFirestore();
    const id = this.id();
    const player: Player = {
      id,
      uid,
      name: dto.name.trim(),
      slimeType: dto.slimeType,
      avatar: dto.avatar || '🦊',
      createdAt: Date.now(),
    };

    await db.collection(PLAYERS_COLLECTION).doc(id).set(player);

    // Auto-select if user has no selectedPlayerId yet
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.data()?.selectedPlayerId) {
      await userRef.set({ selectedPlayerId: id }, { merge: true });
    }

    this.logger.log(`Created player: ${player.name} (${player.slimeType}) for ${uid}`);
    return player;
  }

  async select(uid: string, playerId: string): Promise<Player> {
    const db = getFirestore();
    const playerDoc = await db.collection(PLAYERS_COLLECTION).doc(playerId).get();
    if (!playerDoc.exists) throw new NotFoundException('Player not found');
    const player = playerDoc.data() as Player;
    if (player.uid !== uid) throw new NotFoundException('Player not found');

    await db.collection(USERS_COLLECTION).doc(uid).set({ selectedPlayerId: playerId }, { merge: true });
    this.logger.log(`Selected player: ${player.name} for ${uid}`);
    return player;
  }

  async selectedPlayer(uid: string): Promise<Player | null> {
    const db = getFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    const selectedId = (userDoc.data()?.selectedPlayerId as string) ?? null;
    if (!selectedId) return null;

    const playerDoc = await db.collection(PLAYERS_COLLECTION).doc(selectedId).get();
    if (!playerDoc.exists) return null;
    return playerDoc.data() as Player;
  }

  async remove(uid: string, playerId: string) {
    const db = getFirestore();
    const playerRef = db.collection(PLAYERS_COLLECTION).doc(playerId);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) throw new NotFoundException('Player not found');
    const player = playerDoc.data() as Player;
    if (player.uid !== uid) throw new NotFoundException('Player not found');

    await playerRef.delete();

    // If deleted player was selected, clear or pick first remaining
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.data()?.selectedPlayerId === playerId) {
      const remaining = await db
        .collection(PLAYERS_COLLECTION)
        .where('uid', '==', uid)
        .limit(1)
        .get();
      await userRef.set(
        { selectedPlayerId: remaining.empty ? '' : remaining.docs[0].id },
        { merge: true },
      );
    }
    this.logger.log(`Removed player: ${playerId} for ${uid}`);
  }
}
