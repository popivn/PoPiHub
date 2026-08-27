import { useLogs } from './logs';

interface LogsProps {
  token: string;
}

export default function Logs({ token }: LogsProps) {
  const { hasToken } = useLogs(token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Nhật ký hệ thống</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-md p-3">
        <p className="text-sm text-slate-300">Tính năng logs đang được phát triển.</p>
        <p className="text-xs text-slate-500 mt-1 mono">token: {hasToken ? '••••••••' : 'none'}</p>
      </div>
    </div>
  );
}
