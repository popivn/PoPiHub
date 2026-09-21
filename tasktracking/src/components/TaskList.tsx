import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faSpinner,
  faCircleCheck,
  faBan,
  faBolt,
  faChevronUp,
  faChevronDown,
  faMaximize,
  faPenToSquare,
  faTrashCan,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import type { TaskItem, TaskStatus, Zone } from '../types';
import { saveTaskToFirestore } from '../utils/storage';
import { toast } from '../utils/alert';

export interface TaskListProps {
  tasks: TaskItem[];
  zones: Zone[];
  selectedZoneId?: string;
  statusFilter?: TaskStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (task: TaskItem) => void;
  onCycleStatus?: (task: TaskItem, e: React.MouseEvent) => void;
  className?: string;
}

interface KanbanColumnDef {
  status: TaskStatus;
  title: string;
  icon: typeof faClock;
  textColor: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    status: 'pending',
    title: 'Pending',
    icon: faClock,
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    headerBg: 'bg-amber-500/10',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    dotColor: 'bg-amber-400',
  },
  {
    status: 'ongoing',
    title: 'Ongoing',
    icon: faSpinner,
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    headerBg: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    dotColor: 'bg-blue-400',
  },
  {
    status: 'completed',
    title: 'Completed',
    icon: faCircleCheck,
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    headerBg: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    dotColor: 'bg-emerald-400',
  },
  {
    status: 'cancel',
    title: 'Cancel',
    icon: faBan,
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    headerBg: 'bg-rose-500/10',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    dotColor: 'bg-rose-400',
  },
];

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  zones,
  selectedZoneId = 'all',
  statusFilter = 'all',
  dateFrom = '',
  dateTo = '',
  onEdit,
  onDelete,
  onOpenDetail,
  onCycleStatus,
  className = 'mt-6 sm:mt-8',
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  // Live tick để timer của task ongoing chạy thời gian thực
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const getZoneById = (id: string) => zones.find((z) => z.id === id);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesZone = selectedZoneId === 'all' || t.zoneId === selectedZoneId;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesZone && matchesStatus;
    });
  }, [tasks, selectedZoneId, statusFilter]);

  /** Tasks lọc riêng cho màn hình lớn (lg - Kanban) theo khoảng ngày/giờ tìm kiếm */
  const kanbanFilteredTasks = useMemo(() => {
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() : null;

    return filteredTasks.filter((t) => {
      const taskTime = new Date(t.scheduledAt ?? t.createdAt).getTime();
      const matchesFrom = fromTime === null || isNaN(fromTime) || taskTime >= fromTime;
      const matchesTo = toTime === null || isNaN(toTime) || taskTime <= toTime;
      return matchesFrom && matchesTo;
    });
  }, [filteredTasks, dateFrom, dateTo]);

  /** Format ISO datetime → chỉ "HH:MM:SS" */
  const formatScheduledTime = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  /** Format milliseconds → "Xh Ym" / "Xm Ys" / "Xs" */
  const formatDuration = (ms: number): string => {
    if (!ms || ms < 0) return '0s';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  /** Group tasks theo ngày: ưu tiên scheduledAt, fallback về createdAt nếu null */
  const groupTasksByDate = (taskList: TaskItem[]) => {
    const groups: { dateKey: string; dateLabel: string; tasks: TaskItem[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, TaskItem[]>();
    for (const t of taskList) {
      const refIso = t.scheduledAt ?? t.createdAt;
      const d = new Date(refIso);
      d.setHours(0, 0, 0, 0);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const key of sortedKeys) {
      const d = new Date(key + 'T00:00:00');
      let label: string;
      if (d.getTime() === today.getTime()) {
        label = 'Hôm nay';
      } else if (d.getTime() === yesterday.getTime()) {
        label = 'Hôm qua';
      } else {
        label = d.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
      groups.push({
        dateKey: key,
        dateLabel: label,
        tasks: map.get(key)!,
      });
    }
    return groups;
  };

  const groupedTasks = useMemo(() => groupTasksByDate(filteredTasks), [filteredTasks]);

  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faSpinner} spin /> Ongoing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faCircleCheck} /> Completed
          </span>
        );
      case 'cancel':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faBan} /> Cancel
          </span>
        );
    }
  };

  const handleCycleStatus = async (task: TaskItem, e: React.MouseEvent) => {
    if (onCycleStatus) {
      onCycleStatus(task, e);
      return;
    }

    e.stopPropagation();
    const statusOrder: TaskStatus[] = ['pending', 'ongoing', 'completed', 'cancel'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    await updateTaskStatus(task, nextStatus);
  };

  /** Cập nhật trạng thái task và tính toán lại thời gian chạy (dùng cho cả Click đổi trạng thái & Kéo thả) */
  const updateTaskStatus = async (task: TaskItem, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) return;

    const now = new Date();
    const nowIso = now.toISOString();

    let startedAt: string | null = task.startedAt ?? null;
    let durationMs: number = task.durationMs ?? 0;

    if (nextStatus === 'ongoing') {
      startedAt = nowIso;
    } else if (nextStatus === 'completed') {
      if (task.status === 'ongoing' && task.startedAt) {
        const start = new Date(task.startedAt).getTime();
        durationMs = now.getTime() - start;
      }
      startedAt = null;
    } else if (nextStatus === 'cancel') {
      if (task.status === 'ongoing' && task.startedAt) {
        const start = new Date(task.startedAt).getTime();
        durationMs = now.getTime() - start;
      }
      startedAt = null;
    } else if (nextStatus === 'pending') {
      startedAt = null;
      durationMs = 0;
    }

    const updatedTask: TaskItem = {
      ...task,
      status: nextStatus,
      startedAt,
      durationMs,
      updatedAt: nowIso,
    };
    await saveTaskToFirestore(updatedTask);

    const statusNames: Record<TaskStatus, string> = {
      pending: '⏳ Chờ xử lý (Pending)',
      ongoing: '⚡ Đang thực hiện (Ongoing)',
      completed: '✅ Hoàn thành (Completed)',
      cancel: '🚫 Đã hủy (Cancel)',
    };

    toast.fire({
      icon: 'success',
      title: `Đã chuyển sang: ${statusNames[nextStatus]}`,
    });
  };

  /** Card render logic dùng chung cho cả Mobile list và Desktop Kanban */
  const renderTaskCard = (task: TaskItem, isKanban = false) => {
    const currentZone = getZoneById(task.zoneId);
    const isExpanded = expandedTaskId === task.id;

    const dateStr = (() => {
      const d = new Date(task.scheduledAt ?? task.createdAt);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    return (
      <div
        key={task.id}
        draggable={isKanban}
        onDragStart={(e) => {
          if (!isKanban) return;
          e.dataTransfer.setData('text/plain', task.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedTaskId(task.id);
        }}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragOverColumn(null);
        }}
        className={`group relative bg-slate-900 border rounded-xl p-3 pt-5 space-y-2.5 shadow-sm transition-all ${
          isKanban ? 'cursor-grab active:cursor-grabbing hover:border-slate-700' : 'hover:border-slate-700'
        } ${
          draggedTaskId === task.id
            ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-500/60 border-indigo-500/50'
            : 'border-slate-800/80'
        } ${
          task.status === 'completed' ? 'opacity-80' : task.status === 'cancel' ? 'opacity-70' : ''
        }`}
      >
        {/* Left accent border line based on status */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
            task.status === 'pending'
              ? 'bg-amber-500'
              : task.status === 'ongoing'
              ? 'bg-blue-500'
              : task.status === 'completed'
              ? 'bg-emerald-500'
              : 'bg-rose-500'
          }`}
        />

        {/* Scheduled time / date chip */}
        {task.scheduledAt ? (
          <span
            className="absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-300 bg-slate-900 bg-amber-500/10 border border-amber-500/40 whitespace-nowrap shadow-sm"
            title={`Giờ dự kiến: ${task.scheduledHour ?? 0}h`}
          >
            {isKanban && <span>{dateStr} •</span>}
            <span>{formatScheduledTime(task.scheduledAt)}</span>
          </span>
        ) : isKanban ? (
          <span className="absolute -top-2.5 left-3 z-10 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 whitespace-nowrap shadow-sm">
            {dateStr}
          </span>
        ) : null}

        {/* Card Header: Zone tag, EXP & Status badge */}
        <div className="flex items-center justify-between gap-2 pl-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {isKanban && (
              <FontAwesomeIcon
                icon={faGripVertical}
                className="text-slate-600 group-hover:text-slate-400 text-xs shrink-0 cursor-grab"
                title="Kéo thả để đổi cột trạng thái"
              />
            )}
            {currentZone && (
              <span
                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                style={{ backgroundColor: currentZone.color }}
              >
                {currentZone.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap"
              style={{
                backgroundColor:
                  (task.exp ?? 0) >= 200
                    ? 'rgba(244,63,94,0.15)'
                    : (task.exp ?? 0) >= 100
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(16,185,129,0.15)',
                color:
                  (task.exp ?? 0) >= 200
                    ? '#fb7185'
                    : (task.exp ?? 0) >= 100
                    ? '#fbbf24'
                    : '#34d399',
                borderColor:
                  (task.exp ?? 0) >= 200
                    ? 'rgba(244,63,94,0.3)'
                    : (task.exp ?? 0) >= 100
                    ? 'rgba(245,158,11,0.3)'
                    : 'rgba(16,185,129,0.3)',
              }}
              title="Điểm EXP do AI đánh giá"
            >
              <FontAwesomeIcon icon={faBolt} />
              {task.exp ?? 0} EXP
            </span>
            <button
              onClick={(e) => handleCycleStatus(task, e)}
              className="focus:outline-none"
              title="Bấm để đổi trạng thái"
            >
              {renderStatusBadge(task.status)}
            </button>
          </div>
        </div>

        {/* Title row */}
        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 pl-1" title={task.title}>
          {task.title}
        </h3>

        {/* Inline Action Bar: Time, Expand Toggle & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 pl-1 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap" title="Thời điểm tạo task">
              {new Date(task.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Timer: ongoing = live, completed/cancel = total duration */}
            {task.status === 'ongoing' && task.startedAt && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 whitespace-nowrap">
                <FontAwesomeIcon icon={faClock} />
                {formatDuration(Date.now() - new Date(task.startedAt).getTime())}
              </span>
            )}
            {task.status === 'completed' && task.durationMs && task.durationMs > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                <FontAwesomeIcon icon={faClock} />
                {formatDuration(task.durationMs)}
              </span>
            ) : null}
            {task.status === 'cancel' && task.durationMs && task.durationMs > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 whitespace-nowrap">
                <FontAwesomeIcon icon={faClock} />
                {formatDuration(task.durationMs)}
              </span>
            ) : null}

            {task.description && (
              <button
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                <span className="hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Mô tả'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenDetail(task)}
              className="px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="Phóng to chi tiết"
            >
              <FontAwesomeIcon icon={faMaximize} />
              <span className="hidden xl:inline">Chi tiết</span>
            </button>
            <button
              onClick={() => onEdit(task)}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Chỉnh sửa task"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              <span className="hidden xl:inline">Sửa</span>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Xóa task"
            >
              <FontAwesomeIcon icon={faTrashCan} />
              <span className="hidden xl:inline">Xóa</span>
            </button>
          </div>
        </div>

        {/* Description Content - Expanded Area */}
        {task.description && isExpanded && (
          <div className="pl-1 pt-1 animate-in fade-in duration-150">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs">
              <div
                className="rich-text-content text-slate-200 leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 1. MÀN HÌNH LỚN (>= lg): 4 CỘT KANBAN BOARD (Pending | Ongoing | Completed | Cancel) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 items-stretch">
        {KANBAN_COLUMNS.map((col) => {
          const columnTasks = kanbanFilteredTasks.filter((t) => t.status === col.status);
          const colExp = columnTasks.reduce((sum, t) => sum + (t.exp ?? 0), 0);
          const isColumnDraggedOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.status) {
                  setDragOverColumn(col.status);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn((cur) => (cur === col.status ? null : cur));
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                setDraggedTaskId(null);

                if (!taskId) return;
                const draggedTask = tasks.find((t) => t.id === taskId);
                if (!draggedTask) return;

                if (draggedTask.status !== col.status) {
                  await updateTaskStatus(draggedTask, col.status);
                }
              }}
              className={`flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-200 ${
                isColumnDraggedOver
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/15 scale-[1.01]'
                  : 'bg-slate-900/40 border-slate-800/80'
              }`}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b ${isColumnDraggedOver ? 'border-indigo-500/40' : 'border-slate-800/80'} ${col.headerBg} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${col.dotColor} shrink-0`} />
                  <FontAwesomeIcon
                    icon={col.icon}
                    spin={col.status === 'ongoing'}
                    className={`${col.textColor} text-xs shrink-0`}
                  />
                  <span className="font-extrabold text-sm text-slate-100 tracking-wide truncate">
                    {col.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg} ${col.badgeText}`}
                  >
                    {columnTasks.length}
                  </span>
                  {colExp > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      title="Tổng EXP trong cột"
                    >
                      ⚡ {colExp}
                    </span>
                  )}
                </div>
              </div>

              {/* Column Tasks Container (Stretches to bottom of longest column) */}
              <div className="p-3 space-y-3 min-h-[500px] flex flex-col flex-1">
                {columnTasks.length === 0 ? (
                  <div className={`flex-1 min-h-[160px] flex flex-col items-center justify-center border border-dashed rounded-xl text-xs transition-colors p-3 text-center ${
                    isColumnDraggedOver
                      ? 'border-indigo-400 bg-indigo-500/15 text-indigo-300 font-bold animate-pulse'
                      : 'border-slate-800/80 text-slate-500'
                  }`}>
                    <span>{isColumnDraggedOver ? `Thả vào đây để chuyển sang ${col.title}` : 'Kéo thả task vào đây'}</span>
                  </div>
                ) : (
                  <>
                    {columnTasks.map((task) => renderTaskCard(task, true))}
                    {isColumnDraggedOver && (
                      <div className="py-2.5 px-3 border-2 border-dashed border-indigo-400 bg-indigo-500/15 rounded-xl text-indigo-300 text-xs font-bold text-center animate-pulse">
                        Thả vào đây ➔ {col.title}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MÀN HÌNH NHỎ (< lg): DANH SÁCH NHÓM THEO NGÀY */}
      <div className="block lg:hidden space-y-5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-sm">
            Chưa có công việc nào trong thư mục này.
          </div>
        ) : (
          groupedTasks.map((group) => {
            const completedCount = group.tasks.filter((t) => t.status === 'completed').length;
            const totalCount = group.tasks.length;
            const dayExp = group.tasks
              .filter((t) => t.status === 'completed')
              .reduce((sum, t) => sum + (t.exp ?? 0), 0);

            return (
              <div key={group.dateKey} className="space-y-2.5">
                {/* Date Legend Header */}
                <div className="flex items-center gap-3 px-1 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm py-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                    <h2 className="text-sm font-extrabold text-slate-200 capitalize">
                      {group.dateLabel}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {totalCount}
                    </span>
                    {completedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ✓ {completedCount}<span className="hidden sm:inline"> hoàn thành</span>
                      </span>
                    )}
                    {dayExp > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        ⚡ {dayExp}<span className="hidden sm:inline"> EXP</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Tasks in this date group */}
                <div className="space-y-3">
                  {group.tasks.map((task) => renderTaskCard(task, false))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
