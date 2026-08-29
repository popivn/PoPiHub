import { useEffect, useState } from 'react';

export interface Feature {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  image?: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  order: number;
  active: boolean;
}

export interface FeatureForm {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  image: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  order: number;
  active: boolean;
}

const EMPTY_FORM: FeatureForm = {
  title: '',
  titleEn: '',
  description: '',
  descriptionEn: '',
  icon: 'faBolt',
  image: '',
  url: '/learn/chinese',
  colorFrom: '#2dd4bf',
  colorTo: '#06b6d4',
  order: 0,
  active: true,
};

export function useFeatures(token: string) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Feature | null>(null);
  const [form, setForm] = useState<FeatureForm>(EMPTY_FORM);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/features', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFeatures(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải tính năng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchFeatures();
  }, [token]);

  const startAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, order: features.length + 1 });
  };

  const startEdit = (f: Feature) => {
    setEditing(f);
    setForm({
      title: f.title,
      titleEn: f.titleEn ?? '',
      description: f.description,
      descriptionEn: f.descriptionEn ?? '',
      icon: f.icon,
      image: f.image ?? '',
      url: f.url,
      colorFrom: f.colorFrom,
      colorTo: f.colorTo,
      order: f.order,
      active: f.active,
    });
  };

  const save = async () => {
    setError('');
    try {
      const url = editing ? `/api/features/${editing.id}` : '/api/features';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchFeatures();
      startAdd();
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu tính năng');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá tính năng này?')) return;
    try {
      const res = await fetch(`/api/features/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchFeatures();
    } catch (e: any) {
      setError(e.message || 'Lỗi xoá tính năng');
    }
  };

  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.url as string;
    } catch (e: any) {
      setError(e.message || 'Upload ảnh thất bại');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { features, loading, error, editing, form, setForm, startAdd, startEdit, save, remove, uploading, uploadImage };
}
