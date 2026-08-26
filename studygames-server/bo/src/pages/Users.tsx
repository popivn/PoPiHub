import { useEffect, useState } from 'react';

interface UsersProps {
  token: string;
}

export default function Users({ token }: UsersProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-100">Users</h1>
      {loading && <p className="text-slate-400 text-sm">Đang tải...</p>}
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      {!loading && !error && users.length === 0 && <p className="text-slate-500 text-sm">Chưa có dữ liệu user.</p>}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {users.map((u) => (
          <div key={u.uid} className="px-5 py-4 border-b border-slate-800 last:border-0 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200">{u.username}</p>
              <p className="text-xs text-slate-500 font-mono">{u.uid}</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-300">role: {u.role ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
