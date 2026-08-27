import { useEffect, useState } from 'react';

export interface DashboardStats {
  users?: number;
  topics?: number;
  logs?: number;
}

export interface DashboardMetric {
  label: string;
  value: number | string;
  hint?: string;
}

export function useDashboard(token: string) {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.allSettled([
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText),
      ),
      fetch('/api/topics', { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.ok ? r.json() : Promise.reject(r.statusText),
      ),
    ])
      .then(([users, topics]) => {
        const next: DashboardStats = { logs: 0 };
        if (users.status === 'fulfilled') next.users = Array.isArray(users.value) ? users.value.length : 0;
        if (topics.status === 'fulfilled') next.topics = Array.isArray(topics.value) ? topics.value.length : 0;
        setStats(next);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [token]);

  const metrics: DashboardMetric[] = [
    { label: 'Người dùng', value: stats.users ?? '—', hint: stats.users != null ? 'tổng' : undefined },
    { label: 'Chủ đề', value: stats.topics ?? '—', hint: stats.topics != null ? 'tổng' : undefined },
    { label: 'Logs', value: stats.logs ?? '—', hint: 'sắp có' },
  ];

  return { stats, metrics, loading, error };
}
