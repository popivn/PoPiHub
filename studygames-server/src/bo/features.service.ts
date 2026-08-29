import { Injectable } from '@nestjs/common';
import { getFirestore } from '../app/firebase-admin';

export interface FeatureItem {
  id: string;
  /** Tên hiển thị (VI) */
  title: string;
  /** Tên hiển thị (EN) */
  titleEn?: string;
  /** Mô tả (VI) */
  description: string;
  /** Mô tả (EN) */
  descriptionEn?: string;
  /** FontAwesome icon name (ví dụ: faLayerGroup) — dùng khi không có image */
  icon: string;
  /** Ảnh banner nằm ngang (URL). Nếu có sẽ hiển thị thay cho icon */
  image?: string;
  /** URL trang tính năng (internal route hoặc external) */
  url: string;
  /** Màu gradient from (hex) */
  colorFrom: string;
  /** Màu gradient to (hex) */
  colorTo: string;
  /** Thứ tự hiển thị */
  order: number;
  /** Trạng thái active */
  active: boolean;
}

const FEATURES_DOC = 'features';
const SETTINGS_COLLECTION = 'settings';

@Injectable()
export class FeaturesService {
  /** Default features — dùng khi Firestore chưa có data (auto-seed) */
  private defaultFeatures: FeatureItem[] = [
    {
      id: 'dict_lookup',
      title: 'Tra cứu từ vựng tiếng Trung',
      titleEn: 'Chinese Vocabulary Lookup',
      description: 'Tra cứu nhanh từ vựng tiếng Trung với pinyin, nghĩa tiếng Việt & tiếng Anh, ví dụ minh hoạ.',
      descriptionEn: 'Quickly look up Chinese vocabulary with pinyin, Vietnamese & English meanings, and example sentences.',
      icon: 'faBook',
      image: '/features/dict_lookup_banner.jpg',
      url: '/learn/chinese',
      colorFrom: '#2dd4bf',
      colorTo: '#06b6d4',
      order: 1,
      active: true,
    },
  ];

  async getFeatures(): Promise<FeatureItem[]> {
    let features = this.defaultFeatures;
    try {
      const db = getFirestore();
      const doc = await db.collection(SETTINGS_COLLECTION).doc(FEATURES_DOC).get();
      if (doc.exists && doc.data()?.features) {
        features = doc.data()?.features;
      } else {
        // Auto-seed: nếu chưa có thì ghi default vào DB
        await this.seedFeatures();
      }
    } catch {}

    return features
      .map((f) => ({
        ...f,
        titleEn: f.titleEn || f.title,
        descriptionEn: f.descriptionEn || f.description,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /** Ghi default features vào Firestore (chỉ chạy nếu chưa có) */
  async seedFeatures(): Promise<FeatureItem[]> {
    try {
      const db = getFirestore();
      await db
        .collection(SETTINGS_COLLECTION)
        .doc(FEATURES_DOC)
        .set({ features: this.defaultFeatures, updatedAt: new Date().toISOString() });
    } catch {}
    return this.defaultFeatures;
  }

  async createFeature(feature: Partial<FeatureItem>): Promise<FeatureItem> {
    const features = await this.getFeatures();
    const item: FeatureItem = {
      id: feature.id || `feature_${Date.now()}`,
      title: feature.title ?? 'Tính năng mới',
      titleEn: feature.titleEn,
      description: feature.description ?? '',
      descriptionEn: feature.descriptionEn,
      icon: feature.icon ?? 'faBolt',
      image: feature.image,
      url: feature.url ?? '/learn/chinese',
      colorFrom: feature.colorFrom ?? '#2dd4bf',
      colorTo: feature.colorTo ?? '#06b6d4',
      order: feature.order ?? features.length + 1,
      active: feature.active ?? true,
    };
    features.push(item);
    await this.saveFeatures(features);
    return item;
  }

  async updateFeature(id: string, patch: Partial<FeatureItem>): Promise<FeatureItem> {
    const features = await this.getFeatures();
    const idx = features.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw new Error('Feature not found');
    }
    features[idx] = { ...features[idx], ...patch, id };
    await this.saveFeatures(features);
    return features[idx];
  }

  async removeFeature(id: string): Promise<{ id: string }> {
    const features = await this.getFeatures();
    const filtered = features.filter((f) => f.id !== id);
    await this.saveFeatures(filtered);
    return { id };
  }

  private async saveFeatures(features: FeatureItem[]): Promise<void> {
    try {
      const db = getFirestore();
      await db
        .collection(SETTINGS_COLLECTION)
        .doc(FEATURES_DOC)
        .set({ features, updatedAt: new Date().toISOString() });
    } catch {}
    this.defaultFeatures = features;
  }
}
