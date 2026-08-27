import { useEffect, useState } from 'react';

export interface Topic {
  id: string;
  name: string;
  nameEn?: string;
  active: boolean;
  courses: any[];
}

export interface TopicForm {
  name: string;
  nameEn: string;
  active: boolean;
}

const EMPTY_FORM: TopicForm = { name: '', nameEn: '', active: true };

export function useTopics(token: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Topic | null>(null);
  const [form, setForm] = useState<TopicForm>(EMPTY_FORM);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/topics', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải chủ đề');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchTopics();
  }, [token]);

  const startAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (t: Topic) => {
    setEditing(t);
    setForm({ name: t.name, nameEn: t.nameEn ?? '', active: t.active });
  };

  const save = async () => {
    setError('');
    try {
      const url = editing ? `/api/topics/${editing.id}` : '/api/topics';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTopics();
      startAdd();
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu chủ đề');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá chủ đề này?')) return;
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTopics();
    } catch (e: any) {
      setError(e.message || 'Lỗi xoá chủ đề');
    }
  };

  return { topics, loading, error, editing, form, setForm, startAdd, startEdit, save, remove };
}
