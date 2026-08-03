import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { firestoreGet, firestoreSet } from '../firebase/firebase-admin';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  order: number;
}

const COLLECTION = 'sidebar';

const DEFAULT_SIDEBAR: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', order: 1 },
  { id: 'content', label: 'Quản Lý Nội Dung', icon: 'content', order: 2 },
];

@Injectable()
export class SidebarService implements OnModuleInit {
  private readonly logger = new Logger(SidebarService.name);

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  private async seedIfEmpty(): Promise<void> {
    try {
      const items = await firestoreGet(COLLECTION);
      if (items.length > 0) return;
      for (const item of DEFAULT_SIDEBAR) {
        await firestoreSet(COLLECTION, item.id, {
          id: item.id,
          label: item.label,
          icon: item.icon,
          order: item.order,
        });
      }
      this.logger.log('Seeded default sidebar items');
    } catch (err) {
      this.logger.warn('Could not seed sidebar: ' + (err as Error).message);
    }
  }

  async getAll(): Promise<SidebarItem[]> {
    const items = await firestoreGet(COLLECTION);
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as SidebarItem[];
  }
}
