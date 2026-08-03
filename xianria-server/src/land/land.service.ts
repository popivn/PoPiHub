import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { firestoreGet, firestoreGetDoc, firestoreSet, firestoreWhere } from '../firebase/firebase-admin';

const LAND_COLLECTION = 'lands';
const USERS_COLLECTION = 'users';
const LAND_PRICE = 100;

export interface LandPlot {
  id: string;
  x: number;
  y: number;
  ownerId: string | null;
  ownerName: string | null;
  price: number;
  purchasedAt: number | null;
}

@Injectable()
export class LandService {
  async getAllLand(): Promise<LandPlot[]> {
    const docs = await firestoreGet(LAND_COLLECTION);
    return docs.map((d: any) => this.normalize(d));
  }

  async getLandByOwner(uid: string): Promise<LandPlot[]> {
    const docs = await firestoreWhere(LAND_COLLECTION, 'ownerId', 'EQUAL', uid);
    return docs.map((d: any) => this.normalize(d));
  }

  async buyLand(uid: string, username: string, x: number, y: number): Promise<{ land: LandPlot; coins: number }> {
    if (x < 0 || y < 0 || x > 100 || y > 100) {
      throw new BadRequestException('Tọa độ đất không hợp lệ');
    }

    const landId = `land_${x}_${y}`;
    const existing = await firestoreGetDoc(LAND_COLLECTION, landId);
    if (existing && (existing as any).ownerId) {
      throw new BadRequestException('Đất này đã có chủ');
    }

    const userDoc = await firestoreGetDoc(USERS_COLLECTION, uid);
    if (!userDoc) throw new ForbiddenException('Không tìm thấy user');
    const user = userDoc as any;
    const currentCoins = user.coins ?? 0;
    if (currentCoins < LAND_PRICE) {
      throw new BadRequestException(`Không đủ coins (cần ${LAND_PRICE}, đang có ${currentCoins})`);
    }

    const newCoins = currentCoins - LAND_PRICE;
    await firestoreSet(USERS_COLLECTION, uid, {
      ...user,
      coins: newCoins,
    });

    const land: LandPlot = {
      id: landId,
      x,
      y,
      ownerId: uid,
      ownerName: username,
      price: LAND_PRICE,
      purchasedAt: Date.now(),
    };
    await firestoreSet(LAND_COLLECTION, landId, {
      id: landId,
      x,
      y,
      ownerId: uid,
      ownerName: username,
      price: LAND_PRICE,
      purchasedAt: Date.now(),
    });

    return { land, coins: newCoins };
  }

  async getUserCoins(uid: string): Promise<number> {
    const doc = await firestoreGetDoc(USERS_COLLECTION, uid);
    if (!doc) return 0;
    return (doc as any).coins ?? 0;
  }

  private normalize(d: any): LandPlot {
    return {
      id: d.id ?? d.landId ?? '',
      x: Number(d.x ?? 0),
      y: Number(d.y ?? 0),
      ownerId: d.ownerId ?? null,
      ownerName: d.ownerName ?? null,
      price: Number(d.price ?? LAND_PRICE),
      purchasedAt: d.purchasedAt ? Number(d.purchasedAt) : null,
    };
  }
}
