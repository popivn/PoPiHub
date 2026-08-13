import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarWeek,
  faCalendarDays,
  faCalendar,
  faListCheck,
  faCircleCheck,
  faBolt,
  faClock,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import type { TaskItem, Zone } from '../types';

type Period = 'week' | 'month' | 'year';

interface DashboardProps {
  tasks: TaskItem[];
  zones: Zone[];
  onBack: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks, zones, onBack }) => {
  const [period, setPeriod] = useState<Period>('week');

  // Helper: lấy key nhóm theo period
  const getGroupKey = (date: Date, p: Period): string => {
    if (p === 'week') {
      // Lấy thứ 2 của tuần đó
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);
      return monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    if (p === 'month') {
      return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    }
    return `Năm ${date.getFullYear()}`;
  };

  // Lọc tasks theo period (so với hiện tại)
  const filteredTasks = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7 * 4); // 4 tuần gần nhất
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 tháng
    } else {
      startDate = new Date(now.getFullYear() - 2, 0, 1); // 3 năm
    }
    return tasks.filter((t) => new Date(t.createdAt) >= startDate);
  }, [tasks, period]);

  // Dữ liệu biểu đồ: tasks tạo vs hoàn thành theo thời gian
  const timelineData = useMemo(() => {
    const groups: Record<string, { label: string; created: number; completed: number; exp: number; durationMs: number }> = {};

    // Khởi tạo các nhóm rỗng theo period
    const now = new Date();
    const labels: string[] = [];
    if (period === 'week') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        labels.push(getGroupKey(d, 'week'));
      }
    } else if (period === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(getGroupKey(d, 'month'));
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        labels.push(`Năm ${now.getFullYear() - i}`);
      }
    }
    labels.forEach((l) => {
      groups[l] = { label: l, created: 0, completed: 0, exp: 0, durationMs: 0 };
    });

    // Phân loại tasks
    filteredTasks.forEach((t) => {
      const createdDate = new Date(t.createdAt);
      const createdKey = getGroupKey(createdDate, period);
      if (groups[createdKey]) groups[createdKey].created++;

      if (t.status === 'completed' && t.updatedAt) {
        const completedDate = new Date(t.updatedAt);
        const completedKey = getGroupKey(completedDate, period);
        if (groups[completedKey]) {
          groups[completedKey].completed++;
          groups[completedKey].exp += t.exp ?? 0;
          groups[completedKey].durationMs += t.durationMs ?? 0;
        }
      }
    });

    return Object.values(groups);
  }, [filteredTasks, period]);

  // Phân bố theo status
  const statusData = useMemo(() => {
    const counts = { pending: 0, ongoing: 0, completed: 0 };
    filteredTasks.forEach((t) => {
      counts[t.status]++;
    });
    return [
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Ongoing', value: counts.ongoing, color: '#3b82f6' },
      { name: 'Completed', value: counts.completed, color: '#10b981' },
    ].filter((d) => d.value > 0);
  }, [filteredTasks]);

  // Phân bố theo zone
  const zoneData = useMemo(() => {
    return zones.map((z, i) => ({
      name: z.name,
      value: filteredTasks.filter((t) => t.zoneId === z.id).length,
      color: COLORS[i % COLORS.length],
    })).filter((d) => d.value > 0);
  }, [filteredTasks, zones]);

  // Tổng quan
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === 'completed').length;
    const ongoing = filteredTasks.filter((t) => t.status === 'ongoing').length;
    const totalExp = filteredTasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.exp ?? 0), 0);
    const totalDurationMs = filteredTasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Format duration
    const fmtDur = (ms: number) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m`;
      return '< 1m';
    };

    return { total, completed, ongoing, totalExp, totalDurationMs, completionRate, fmtDur };
  }, [filteredTasks]);

  const periodButtons: { key: Period; label: string; icon: any }[] = [
    { key: 'week', label: 'Tuần', icon: faCalendarWeek },
    { key: 'month', label: 'Tháng', icon: faCalendarDays },
    { key: 'year', label: 'Năm', icon: faCalendar },
  ];

  return (
    <div className="w-full max-w-none px-4 sm:px-8 py-4 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-all"
            title="Quay lại"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Dashboard Báo Cáo
            </h1>
            <p className="text-xs text-slate-400 font-medium">Tiến độ task theo thời gian</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {periodButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === btn.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={btn.icon} />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={faListCheck}
          label="Tổng task"
          value={stats.total}
          color="indigo"
        />
        <StatCard
          icon={faCircleCheck}
          label="Đã hoàn thành"
          value={stats.completed}
          subValue={`${stats.completionRate}% hoàn thành`}
          color="emerald"
        />
        <StatCard
          icon={faBolt}
          label="EXP kiếm được"
          value={stats.totalExp}
          color="amber"
        />
        <StatCard
          icon={faClock}
          label="Thời gian làm"
          value={stats.fmtDur(stats.totalDurationMs)}
          color="blue"
        />
      </div>

      {/* Timeline chart: created vs completed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-4">
          Task tạo vs Hoàn thành ({period === 'week' ? 'theo tuần' : period === 'month' ? 'theo tháng' : 'theo năm'})
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="created" name="Tạo mới" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completed" name="Hoàn thành" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* EXP & Duration trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-4">Xu hướng EXP kiếm được</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="exp"
              name="EXP"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#expGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two columns: status pie + zone pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Phân bố trạng thái</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Zone distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Phân bố theo Zone</h3>
          {zoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={zoneData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {zoneData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  );
};

// ===== Stat Card =====
const StatCard: React.FC<{
  icon: any;
  label: string;
  value: number | string;
  subValue?: string;
  color: 'indigo' | 'emerald' | 'amber' | 'blue';
}> = ({ icon, label, value, subValue, color }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  };
  const c = colorMap[color];
  return (
    <div className={`bg-slate-900 border ${c.border} rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
        <FontAwesomeIcon icon={icon} className="text-lg" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-extrabold ${c.text} truncate`}>{value}</p>
        {subValue && <p className="text-[10px] text-slate-500 truncate">{subValue}</p>}
      </div>
    </div>
  );
};

const EmptyChart: React.FC = () => (
  <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">
    Chưa có dữ liệu
  </div>
);
