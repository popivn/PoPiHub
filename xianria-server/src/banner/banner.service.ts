import { Injectable, Logger } from '@nestjs/common';
import { firestoreGet, firestoreSet } from '../firebase/firebase-admin';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

export interface Banner {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

const COLLECTION = 'banners';

function getBannersDir(): string {
  const dir = join(process.cwd(), 'src', 'assets', 'banners');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  async getAll(): Promise<Banner[]> {
    const items = await firestoreGet(COLLECTION);
    return items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)) as Banner[];
  }

  async getLatest(): Promise<Banner | null> {
    const items = await this.getAll();
    return items.length > 0 ? items[0] : null;
  }

  async upload(title: string, base64Data: string, mimeType: string): Promise<Banner> {
    const id = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ext = mimeType.split('/')[1] || 'png';
    const filename = `${id}.${ext}`;
    const filePath = join(getBannersDir(), filename);
    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(filePath, buffer);

    const url = `/banners/${filename}`;
    const banner = { id, title, url, createdAt: Date.now() };
    await firestoreSet(COLLECTION, id, banner);
    this.logger.log(`Banner uploaded: ${id} → ${url}`);
    return banner;
  }
}
