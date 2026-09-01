/**
 * Features Service — giao tiếp với studygames-server /api/features endpoint.
 */

import { apiUrl, routes } from './routes';

export interface FeatureItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  /** FontAwesome icon name (ví dụ: 'faBook') — dùng khi không có image */
  icon: string;
  /** Ảnh banner nằm ngang (URL). Nếu có sẽ hiển thị thay cho icon */
  image?: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  order: number;
  active: boolean;
}

/** Cache features trong localStorage với TTL (mặc định 5 phút). */
const FEATURES_CACHE_KEY = 'sg_features_cache';
const FEATURES_CACHE_TTL = 5 * 60 * 1000;

interface FeaturesCache {
  data: FeatureItem[];
  ts: number;
}

export function clearFeaturesCache() {
  localStorage.removeItem(FEATURES_CACHE_KEY);
}

export async function fetchFeatures(): Promise<FeatureItem[]> {
  // 1. Kiểm tra cache
  try {
    const cached = localStorage.getItem(FEATURES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as FeaturesCache;
      if (Date.now() - parsed.ts < FEATURES_CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch {
    // Cache hỏng → bỏ qua
  }

  // 2. Fetch mới từ server
  try {
    const url = apiUrl(routes.features.list);
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const features = data as FeatureItem[];
        try {
          localStorage.setItem(
            FEATURES_CACHE_KEY,
            JSON.stringify({ data: features, ts: Date.now() } satisfies FeaturesCache),
          );
        } catch {
          // localStorage đầy → bỏ qua
        }
        return features;
      }
    }
  } catch (error) {
    console.error('[featuresService] Network error:', error);
  }

  return [];
}
