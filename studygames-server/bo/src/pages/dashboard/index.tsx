import { useDashboard } from './dashboard';
import Loading from '../../components/Loading';

interface DashboardProps {
  token: string;
}

export default function Dashboard({ token }: DashboardProps) {
  const { metrics, loading, error } = useDashboard(token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Tổng quan hệ thống</p>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {loading ? (
        <Loading size="md" label="Đang tải dữ liệu…" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-md p-3">
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-semibold text-slate-100 tabular-nums">{m.value}</p>
                  {m.hint && <p className="text-xs text-slate-500">{m.hint}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md p-3">
            <p className="text-xs text-slate-500 font-medium mb-1">Trạng thái phiên</p>
            <p className="text-sm text-slate-300">
              Token: <span className="text-teal-400 mono">{token ? 'đã xác thực' : 'chưa có token'}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
