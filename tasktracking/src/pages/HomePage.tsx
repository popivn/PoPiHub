import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCircleCheck,
  faPlus,
  faChevronDown,
  faChevronUp,
  faFilter,
  faLayerGroup,
  faList,
  faHourglassHalf,
  faBan,
  faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';

import { Layout } from '../components/Layout';
import { TaskList } from '../components/TaskList';
import { TaskFormModal } from '../components/TaskFormModal';
import type { TaskItem, Zone } from '../types';
import {
  subscribeTasks,
  subscribeZones,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveZoneToFirestore,
  deleteZoneFromFirestore
} from '../utils/storage';
import { toast, confirmDelete, showAlert } from '../utils/alert';
import { evaluateExp } from '../utils/gemini';
import { evaluateRadarScores } from '../utils/radar';
import type { SkillCategoryId } from '../types';
import { getStoredUserId, clearAccessKey } from '../utils/auth';
import { ZoneModal } from '../components/ZoneModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ChatPanel, type CreatedTaskInfo } from '../components/ChatPanel';
import { Loading } from '../components/Loading';
import { Dashboard } from './Dashboard';
import { Profile } from './Profile';

const formatLocalIso = (d: Date, timeStr: '00:00' | '23:59'): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${timeStr}`;
};

const getTodayStartLocal = (): string => formatLocalIso(new Date(), '00:00');
const getTodayEndLocal = (): string => formatLocalIso(new Date(), '23:59');

const PRESET_BUTTONS = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'yesterday', label: 'Hôm qua' },
  { id: 'tomorrow', label: 'Ngày mai' },
  { id: 'thisWeek', label: 'Tuần này' },
  { id: 'lastWeek', label: 'Tuần trước' },
  { id: 'nextWeek', label: 'Tuần sau' },
  { id: 'thisMonth', label: 'Tháng này' },
  { id: 'lastMonth', label: 'Tháng trước' },
  { id: 'all', label: 'Tất cả' },
] as const;

export const HomePage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchDateFrom, setSearchDateFrom] = useState<string>(getTodayStartLocal);
  const [searchDateTo, setSearchDateTo] = useState<string>(getTodayEndLocal);
  const [activePreset, setActivePreset] = useState<string | null>('today');

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    const now = new Date();

    if (presetId === 'today') {
      setSearchDateFrom(formatLocalIso(now, '00:00'));
      setSearchDateTo(formatLocalIso(now, '23:59'));
      return;
    }

    if (presetId === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      setSearchDateFrom(formatLocalIso(d, '00:00'));
      setSearchDateTo(formatLocalIso(d, '23:59'));
      return;
    }

    if (presetId === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      setSearchDateFrom(formatLocalIso(d, '00:00'));
      setSearchDateTo(formatLocalIso(d, '23:59'));
      return;
    }

    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + diffToMonday);

    if (presetId === 'thisWeek') {
      const thisSunday = new Date(thisMonday);
      thisSunday.setDate(thisMonday.getDate() + 6);
      setSearchDateFrom(formatLocalIso(thisMonday, '00:00'));
      setSearchDateTo(formatLocalIso(thisSunday, '23:59'));
      return;
    }

    if (presetId === 'lastWeek') {
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      setSearchDateFrom(formatLocalIso(lastMonday, '00:00'));
      setSearchDateTo(formatLocalIso(lastSunday, '23:59'));
      return;
    }

    if (presetId === 'nextWeek') {
      const nextMonday = new Date(thisMonday);
      nextMonday.setDate(thisMonday.getDate() + 7);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      setSearchDateFrom(formatLocalIso(nextMonday, '00:00'));
      setSearchDateTo(formatLocalIso(nextSunday, '23:59'));
      return;
    }

    if (presetId === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setSearchDateFrom(formatLocalIso(firstDay, '00:00'));
      setSearchDateTo(formatLocalIso(lastDay, '23:59'));
      return;
    }

    if (presetId === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setSearchDateFrom(formatLocalIso(firstDay, '00:00'));
      setSearchDateTo(formatLocalIso(lastDay, '23:59'));
      return;
    }

    if (presetId === 'all') {
      setSearchDateFrom('');
      setSearchDateTo('');
      return;
    }
  };

  // UI state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<TaskItem | null>(null);
  // View: 'home' | 'dashboard' | 'profile'
  const [view, setView] = useState<'home' | 'dashboard' | 'profile'>('home');
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // User ID từ sessionStorage (set khi auth thành công)
  const userId = getStoredUserId() || '1';

  const handleLogout = () => {
    clearAccessKey();
    window.location.href = '/';
  };

  // Subscribe to Firestore Real-time Updates
  useEffect(() => {
    let zonesLoaded = false;
    let tasksLoaded = false;

    const unsubscribeZones = subscribeZones(userId, (loadedZones) => {
      setZones(loadedZones);
      zonesLoaded = true;
      if (zonesLoaded && tasksLoaded) {
        setInitialLoading(false);
      }
    });

    const unsubscribeTasks = subscribeTasks(userId, (loadedTasks) => {
      setTasks(loadedTasks);
      tasksLoaded = true;
      if (zonesLoaded && tasksLoaded) {
        setInitialLoading(false);
      }
    });

    return () => {
      unsubscribeZones();
      unsubscribeTasks();
    };
  }, []);



  const handleEditClick = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    const confirmed = await confirmDelete(
      'Xóa công việc?',
      'Hành động này không thể hoàn tác!'
    );
    if (confirmed) {
      await deleteTaskFromFirestore(id);
      toast.fire({
        icon: 'success',
        title: 'Đã xóa công việc!',
      });
    }
  };

  const handleAddZone = async (newZoneData: Omit<Zone, 'id' | 'userId'>) => {
    const newZone: Zone = {
      ...newZoneData,
      id: `${userId}-zone-${Date.now()}`,
      userId,
    };
    await saveZoneToFirestore(newZone);
    toast.fire({
      icon: 'success',
      title: `Đã tạo Zone "${newZone.name}"`,
    });
  };

  /**
   * Handler được gọi khi AI chat quyết định tạo task mới.
   * - Match zoneName (không phân biệt hoa thường) với zones hiện có,
   *   fallback zone đầu tiên.
   * - Đánh giá EXP qua AI.
   * - Lưu vào Firestore.
   * - Trả về thông tin task đã tạo để hiển thị success card trong chat.
   */
  const handleCreateTaskFromChat = async (input: {
    title: string;
    description: string;
    zoneName?: string;
  }): Promise<CreatedTaskInfo> => {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) throw new Error('Title không được rỗng');

    // Match zone theo tên (case-insensitive), fallback zone đầu tiên
    const matchedZone = input.zoneName
      ? zones.find((z) => z.name.toLowerCase() === input.zoneName!.toLowerCase())
      : undefined;
    const zoneId = matchedZone?.id || zones[0]?.id || 'zone-1';
    const zoneName = matchedZone?.name || zones[0]?.name || 'Default';

    // Đánh giá EXP
    let exp = 10;
    try {
      exp = await evaluateExp(trimmedTitle, input.description);
    } catch {
      /* giữ mặc định */
    }

    // Mặc định scheduledAt = 00:00:00 của ngày tạo (hôm nay) khi tạo từ chat
    const chatDefaultScheduled = new Date();
    chatDefaultScheduled.setHours(0, 0, 0, 0);
    const chatScheduledIso = chatDefaultScheduled.toISOString();

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      userId,
      title: trimmedTitle,
      description: input.description,
      zoneId,
      status: 'pending',
      exp,
      scheduledAt: chatScheduledIso,
      scheduledHour: 0,
      startedAt: null,
      durationMs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTaskToFirestore(newTask);

    return { title: trimmedTitle, zoneName, exp };
  };

  /**
   * Handler đánh giá lại radar scores bằng AI.
   * - Filter task completed.
   * - Gọi AI đánh giá toàn bộ.
   * - Lưu radarScores vào từng task trong Firestore.
   */
  const handleReevaluateRadar = async (categoryId: SkillCategoryId = 'it') => {
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    if (completedTasks.length === 0) {
      toast.fire({ icon: 'warning', title: 'Chưa có task hoàn thành để đánh giá' });
      return;
    }

    try {
      const scores = await evaluateRadarScores(completedTasks, categoryId);

      // Lưu radarScores vào từng task completed (merge với category hiện có)
      for (const t of completedTasks) {
        const existingScores = t.radarScores ?? {};
        await saveTaskToFirestore({
          ...t,
          radarScores: { ...existingScores, [categoryId]: scores },
          startedAt: t.startedAt ?? null,
          durationMs: t.durationMs ?? 0,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.fire({ icon: 'success', title: 'Đã đánh giá lại kỹ năng!' });
    } catch (err: any) {
      toast.fire({ icon: 'error', title: 'Lỗi đánh giá radar' });
      console.error('Radar eval error:', err);
    }
  };

  const handleUpdateZone = async (updatedZone: Zone) => {
    await saveZoneToFirestore(updatedZone);
    toast.fire({
      icon: 'success',
      title: `Đã cập nhật Zone "${updatedZone.name}"`,
    });
  };

  const handleDeleteZone = async (id: string) => {
    if (zones.length <= 1) {
      showAlert('Không thể xóa', 'Phải giữ lại ít nhất 1 Zone!', 'warning');
      return;
    }

    const targetZone = zones.find((z) => z.id === id);
    const confirmed = await confirmDelete(
      `Xóa Zone "${targetZone?.name || ''}"?`,
      'Các công việc trong Zone này sẽ được tự động chuyển sang Zone khác.'
    );

    if (confirmed) {
      await deleteZoneFromFirestore(id);

      const fallbackZoneId = zones.find((z) => z.id !== id)?.id || 'zone-1';
      const tasksToReassign = tasks.filter((t) => t.zoneId === id);
      for (const t of tasksToReassign) {
        await saveTaskToFirestore({
          ...t,
          startedAt: t.startedAt ?? null,
          durationMs: t.durationMs ?? 0,
          zoneId: fallbackZoneId,
        });
      }

      if (selectedZoneId === id) setSelectedZoneId('all');

      toast.fire({
        icon: 'success',
        title: 'Đã xóa Zone!',
      });
    }
  };

  const getZoneById = (id: string) => zones.find((z) => z.id === id);

  if (initialLoading) {
    return <Loading message="Đang gom tụ linh khí..." />;
  }

  if (view === 'dashboard') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <Dashboard tasks={tasks} zones={zones} onBack={() => setView('home')} />
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <Profile tasks={tasks} userId={userId} onBack={() => setView('home')} onReevaluateRadar={handleReevaluateRadar} />
      </div>
    );
  }

  return (
    <Layout
      onOpenProfile={() => setView('profile')}
      onOpenDashboard={() => setView('dashboard')}
      onOpenZoneModal={() => setIsZoneModalOpen(true)}
      onLogout={handleLogout}
    >

      {/* 1. Action Bar & Filters (Tạo mới, Dropdown Zone, Dropdown Trạng thái) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 sm:gap-3 w-full">
        <button
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Tạo mới</span>
          {selectedZoneId !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/30 border border-white/15 text-xs font-semibold text-white shadow-inner">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    zones.find((z) => z.id === selectedZoneId)?.color || '#6366f1',
                }}
              />
              <span className="truncate max-w-[120px]">
                {zones.find((z) => z.id === selectedZoneId)?.name || 'Zone'}
              </span>
            </span>
          )}
        </button>

        {/* Zone Selector Dropdown */}
        <div className="relative flex-1 sm:flex-initial">
          <button
            onClick={() => {
              setZoneDropdownOpen((v) => !v);
              setStatusDropdownOpen(false);
            }}
            className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm w-full sm:w-auto"
            title="Lọc theo Zone"
          >
            <span className="flex items-center gap-1.5 truncate">
              <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-400 shrink-0 text-xs" />
              <span className="text-slate-400 font-medium">Zone:</span>
              {selectedZoneId === 'all' ? (
                <>
                  <span className="text-slate-200 font-bold">Tất cả</span>
                  <span className="text-slate-400 text-[11px] font-semibold">({tasks.length})</span>
                </>
              ) : (
                <>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: zones.find((z) => z.id === selectedZoneId)?.color || '#6366f1' }}
                  />
                  <span className="text-slate-200 font-bold truncate max-w-[110px] sm:max-w-[150px]">
                    {zones.find((z) => z.id === selectedZoneId)?.name || 'Zone'}
                  </span>
                  <span className="text-slate-400 text-[11px] font-semibold">
                    ({tasks.filter((t) => t.zoneId === selectedZoneId).length})
                  </span>
                </>
              )}
            </span>
            <FontAwesomeIcon
              icon={zoneDropdownOpen ? faChevronUp : faChevronDown}
              className="text-slate-500 text-[10px] shrink-0 ml-1"
            />
          </button>

          {zoneDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setZoneDropdownOpen(false)} />
              <div className="menu-dropdown absolute left-0 sm:left-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                <div className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-slate-950/60">
                  Lọc theo Zone
                </div>
                <button
                  onClick={() => { setSelectedZoneId('all'); setZoneDropdownOpen(false); }}
                  className={`menu-item w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left ${
                    selectedZoneId === 'all' ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-400 w-4 shrink-0" />
                    <span className="text-sm font-bold truncate">Tất cả</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                      {tasks.length}
                    </span>
                    {selectedZoneId === 'all' && <span className="text-emerald-400 text-xs">✓</span>}
                  </div>
                </button>
                {zones.map((z) => {
                  const count = tasks.filter((t) => t.zoneId === z.id).length;
                  const isSelected = selectedZoneId === z.id;
                  return (
                    <button
                      key={z.id}
                      onClick={() => { setSelectedZoneId(z.id); setZoneDropdownOpen(false); }}
                      className={`menu-item w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left border-t border-slate-800/50 ${
                        isSelected ? 'bg-slate-800' : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                        <span className="text-sm font-bold text-slate-200 truncate">{z.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          {count}
                        </span>
                        {isSelected && <span className="text-emerald-400 text-xs">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Status filter — icon-only on mobile, icon+text on desktop */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setStatusDropdownOpen((v) => !v);
              setZoneDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
            title="Lọc theo trạng thái"
          >
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs" />
            <span className="text-slate-400 font-medium hidden sm:inline">Trạng thái:</span>
            <FontAwesomeIcon
              icon={
                statusFilter === 'all' ? faList :
                statusFilter === 'pending' ? faClock :
                statusFilter === 'ongoing' ? faHourglassHalf :
                statusFilter === 'completed' ? faCircleCheck : faBan
              }
              className={
                statusFilter === 'all' ? 'text-indigo-400' :
                statusFilter === 'pending' ? 'text-slate-400' :
                statusFilter === 'ongoing' ? 'text-blue-400' :
                statusFilter === 'completed' ? 'text-emerald-400' : 'text-rose-400'
              }
            />
            <span className="text-slate-200 font-bold hidden sm:inline">
              {
                statusFilter === 'all' ? 'Tất cả' :
                statusFilter === 'pending' ? 'Pending' :
                statusFilter === 'ongoing' ? 'Ongoing' :
                statusFilter === 'completed' ? 'Completed' : 'Cancel'
              }
            </span>
            <FontAwesomeIcon icon={statusDropdownOpen ? faChevronUp : faChevronDown} className="text-slate-500 text-[10px]" />
          </button>

          {statusDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
              <div className="menu-dropdown absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 bg-slate-950/60">
                  Lọc theo Trạng Thái
                </div>
                {([
                  { value: 'all', icon: faList, label: 'Tất cả', color: 'text-indigo-400' },
                  { value: 'pending', icon: faClock, label: 'Pending', color: 'text-slate-400' },
                  { value: 'ongoing', icon: faHourglassHalf, label: 'Ongoing', color: 'text-blue-400' },
                  { value: 'completed', icon: faCircleCheck, label: 'Completed', color: 'text-emerald-400' },
                  { value: 'cancel', icon: faBan, label: 'Cancel', color: 'text-rose-400' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setStatusDropdownOpen(false); }}
                    className={`menu-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-800/50 last:border-0 ${
                      statusFilter === opt.value ? 'bg-slate-800' : 'hover:bg-slate-800'
                    }`}
                  >
                    <FontAwesomeIcon icon={opt.icon} className={`${opt.color} w-4`} />
                    <span className="text-sm font-bold text-slate-200">{opt.label}</span>
                    {statusFilter === opt.value && <span className="text-emerald-400 ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Cụm tìm kiếm Datetime & Nút bấm nhanh (Quick Search) */}
      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 shadow-sm">
        {/* Left: 2 Datetime inputs */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <FontAwesomeIcon icon={faCalendarDays} className="text-indigo-400 text-xs shrink-0 mr-0.5" />
            <span className="text-[11px] font-bold text-slate-400">Từ:</span>
            <input
              type="datetime-local"
              value={searchDateFrom}
              onChange={(e) => {
                setSearchDateFrom(e.target.value);
                setActivePreset(null);
              }}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors [color-scheme:dark]"
              title="Thời điểm bắt đầu"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span className="text-[11px] font-bold text-slate-400">Đến:</span>
            <input
              type="datetime-local"
              value={searchDateTo}
              onChange={(e) => {
                setSearchDateTo(e.target.value);
                setActivePreset(null);
              }}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors [color-scheme:dark]"
              title="Thời điểm kết thúc"
            />
          </div>
        </div>

        {/* Right: Quick Search Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_BUTTONS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activePreset === p.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
        zones={zones}
        selectedZoneId={selectedZoneId}
        userId={userId}
      />

      {/* TASK LIST - GROUPED BY DATE */}
      <TaskList
        tasks={tasks}
        zones={zones}
        selectedZoneId={selectedZoneId}
        statusFilter={statusFilter}
        dateFrom={searchDateFrom}
        dateTo={searchDateTo}
        onEdit={handleEditClick}
        onDelete={handleDeleteTask}
        onOpenDetail={(task) => setSelectedDetailTask(task)}
      />

      {/* Task Detail Fullscreen Modal */}
      <TaskDetailModal
        task={selectedDetailTask}
        zone={selectedDetailTask ? getZoneById(selectedDetailTask.zoneId) : undefined}
        onClose={() => setSelectedDetailTask(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteTask}
      />

      {/* Zone Manager Modal */}
      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        zones={zones}
        onAddZone={handleAddZone}
        onUpdateZone={handleUpdateZone}
        onDeleteZone={handleDeleteZone}
      />

      {/* AI Chat Assistant (Floating) */}
      <ChatPanel zones={zones} onCreateTask={handleCreateTaskFromChat} />
    </Layout>
  );
};
