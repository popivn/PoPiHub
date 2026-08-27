import { useUsers } from './users';
import Loading from '../../components/Loading';

interface UsersProps {
  token: string;
}

export default function Users({ token }: UsersProps) {
  const { users, loading, error } = useUsers(token);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Users</h1>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} bản ghi</p>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {loading ? (
        <Loading size="md" label="Đang tải danh sách user…" />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase">
                <th className="text-left px-3 h-9 font-medium">Username</th>
                <th className="text-left px-3 h-9 font-medium">UID</th>
                <th className="text-left px-3 h-9 font-medium">Role</th>
                <th className="text-left px-3 h-9 font-medium">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-slate-800/60 last:border-0 h-11">
                  <td className="px-3 text-slate-200 font-medium">{u.username}</td>
                  <td className="px-3 text-slate-500 mono text-xs">{u.uid}</td>
                  <td className="px-3">
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                      {u.role ?? 0}
                    </span>
                  </td>
                  <td className="px-3 text-slate-400 text-xs mono">{u.permissions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!error && users.length === 0 && (
            <p className="p-3 text-xs text-slate-500">Chưa có dữ liệu user.</p>
          )}
        </div>
      )}
    </div>
  );
}
