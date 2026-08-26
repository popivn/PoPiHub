interface LogsProps {
  token: string;
}

export default function Logs({ token }: LogsProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-100">Logs</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-400 text-sm">Tính năng logs đang được phát triển.</p>
        <p className="text-slate-500 text-xs mt-2 font-mono">token: {token ? '********' : 'none'}</p>
      </div>
    </div>
  );
}
