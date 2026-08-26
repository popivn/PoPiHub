interface DashboardProps {
  token: string;
}

export default function Dashboard({ token }: DashboardProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-100">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase">Người dùng</p>
          <p className="text-3xl font-black text-teal-400 mt-2">—</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase">Khóa học</p>
          <p className="text-3xl font-black text-teal-400 mt-2">—</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase">Logs</p>
          <p className="text-3xl font-black text-teal-400 mt-2">—</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-sm text-slate-400">Token: <span className="text-teal-400 font-mono break-all">{token ? '✓ đã xác thực' : '✗ chưa có token'}</span></p>
      </div>
    </div>
  );
}
