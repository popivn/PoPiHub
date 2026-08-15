import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faSpinner,
  faCircleCheck,
  faPlus,
  faFolderPlus,
  faTrashCan,
  faPenToSquare,
  faChevronDown,
  faChevronUp,
  faFilter,
  faLayerGroup,
  faMaximize,
  faBolt,
  faWandMagicSparkles,
  faChartLine,
  faUserAstronaut,
  faBars,
  faXmark,
  faList,
  faHourglassHalf
} from '@fortawesome/free-solid-svg-icons';

import { CONFIG } from '../config';
import type { TaskItem, TaskStatus, Zone } from '../types';
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
import { getStoredUserId } from '../utils/auth';
import { ZoneModal } from '../components/ZoneModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ChatPanel, type CreatedTaskInfo } from '../components/ChatPanel';
import { Dashboard } from './Dashboard';
import { Profile } from './Profile';

export const HomePage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskZoneId, setTaskZoneId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // UI state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<TaskItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [evaluatingExp, setEvaluatingExp] = useState(false);
  // View: 'home' | 'dashboard' | 'profile'
  const [view, setView] = useState<'home' | 'dashboard' | 'profile'>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  // Tick mỗi giây để cập nhật live timer cho task ongoing
  const [, setTick] = useState(0);
  // Đồng hồ live HH:MM:SS
  const [clockTime, setClockTime] = useState(() => new Date());

  // User ID từ sessionStorage (set khi auth thành công)
  const userId = getStoredUserId() || '1';

  // Subscribe to Firestore Real-time Updates
  useEffect(() => {
    const unsubscribeZones = subscribeZones(userId, (loadedZones) => {
      setZones(loadedZones);
      if (loadedZones.length > 0 && !taskZoneId) {
        setTaskZoneId(loadedZones[0].id);
      }
    });

    const unsubscribeTasks = subscribeTasks(userId, (loadedTasks) => {
      setTasks(loadedTasks);
    });

    return () => {
      unsubscribeZones();
      unsubscribeTasks();
    };
  }, []);

  // Live tick mỗi giây khi có task ongoing để cập nhật timer
  useEffect(() => {
    const hasOngoing = tasks.some((t) => t.status === 'ongoing' && t.startedAt);
    if (!hasOngoing) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [tasks]);

  // Đồng hồ live cập nhật mỗi giây
  useEffect(() => {
    const id = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setEvaluatingExp(true);
    try {
      if (editingTaskId) {
        const existing = tasks.find((t) => t.id === editingTaskId);
        if (existing) {
          // Re-evaluate EXP nếu description thay đổi
          let exp = existing.exp ?? 0;
          if (existing.title !== title.trim() || existing.description !== description) {
            try {
              exp = await evaluateExp(title.trim(), description);
            } catch {
              /* giữ exp cũ nếu lỗi */
            }
          }
          const updatedTask: TaskItem = {
            ...existing,
            title: title.trim(),
            description,
            zoneId: taskZoneId,
            exp,
            startedAt: existing.startedAt ?? null,
            durationMs: existing.durationMs ?? 0,
            updatedAt: new Date().toISOString(),
          };
          await saveTaskToFirestore(updatedTask);
          toast.fire({
            icon: 'success',
            title: `Đã cập nhật công việc! (+${exp} EXP)`,
          });
        }
        setEditingTaskId(null);
      } else {
        let exp = 10;
        try {
          exp = await evaluateExp(title.trim(), description);
        } catch (err: any) {
          toast.fire({ icon: 'warning', title: 'Không đánh giá được EXP, dùng mặc định 10' });
        }
        const newTask: TaskItem = {
          id: 'task-' + Date.now(),
          userId,
          title: title.trim(),
          description,
          zoneId: taskZoneId || (zones[0]?.id ?? 'zone-1'),
          status: 'pending',
          exp,
          startedAt: null,
          durationMs: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveTaskToFirestore(newTask);
        toast.fire({
          icon: 'success',
          title: `Đã thêm công việc! (+${exp} EXP)`,
        });
      }

      setTitle('');
      setDescription('');
      setIsFormOpen(false);
    } finally {
      setEvaluatingExp(false);
    }
  };

  const handleEditClick = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setTaskZoneId(task.zoneId);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCycleStatus = async (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const statusOrder: TaskStatus[] = ['pending', 'ongoing', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    const now = new Date();
    const nowIso = now.toISOString();

    // Logic timer theo status:
    // - pending → ongoing: bắt đầu đếm (set startedAt = now)
    // - ongoing → completed: dừng đếm, tính durationMs = now - startedAt
    // - completed → pending: reset (startedAt = null, durationMs = 0)
    // - ongoing → pending (nếu có): reset (startedAt = null, durationMs = 0)
    // - completed → ongoing (nếu có): bắt đầu đếm lại (set startedAt = now)
    // - pending → completed (nhảy cóc): durationMs = 0
    // Lưu ý: Firestore không chấp nhận undefined → luôn dùng null/0 thay thế
    let startedAt: string | null = task.startedAt ?? null;
    let durationMs: number = task.durationMs ?? 0;

    if (nextStatus === 'ongoing') {
      startedAt = nowIso;
    } else if (nextStatus === 'completed') {
      if (task.status === 'ongoing' && task.startedAt) {
        const start = new Date(task.startedAt).getTime();
        durationMs = now.getTime() - start;
      } else {
        // pending → completed (nhảy cóc): không có thời gian thực hiện
        durationMs = 0;
      }
      startedAt = null;
    } else if (nextStatus === 'pending') {
      // reset về pending: clear timer
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

    const statusNames = {
      pending: '⏳ Chờ xử lý (Pending)',
      ongoing: '⚡ Đang thực hiện (Ongoing)',
      completed: '✅ Hoàn thành (Completed)',
    };

    toast.fire({
      icon: 'info',
      title: `Đã đổi sang: ${statusNames[nextStatus]}`,
    });
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
    if (!taskZoneId) setTaskZoneId(newZone.id);
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

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      userId,
      title: trimmedTitle,
      description: input.description,
      zoneId,
      status: 'pending',
      exp,
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
      if (taskZoneId === id) setTaskZoneId(fallbackZoneId);

      toast.fire({
        icon: 'success',
        title: 'Đã xóa Zone!',
      });
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesZone = selectedZoneId === 'all' || t.zoneId === selectedZoneId;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesZone && matchesStatus;
  });

  const getZoneById = (id: string) => zones.find((z) => z.id === id);

  // Format milliseconds → "Xh Ym" / "Xm Ys" / "Xs"
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

  // Group tasks theo ngày (dựa trên createdAt), trả về mảng {dateKey, dateLabel, tasks}
  const groupTasksByDate = (taskList: TaskItem[]) => {
    const groups: { dateKey: string; dateLabel: string; tasks: TaskItem[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, TaskItem[]>();
    for (const t of taskList) {
      const d = new Date(t.createdAt);
      d.setHours(0, 0, 0, 0);
      // Dùng local date (không toISOString để tránh lệch timezone UTC)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    // Sort theo ngày giảm dần (mới nhất trước)
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

  const groupedTasks = groupTasksByDate(filteredTasks);

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
    }
  };

  if (view === 'dashboard') {
    return <Dashboard tasks={tasks} zones={zones} onBack={() => setView('home')} />;
  }

  if (view === 'profile') {
    return <Profile tasks={tasks} onBack={() => setView('home')} onReevaluateRadar={handleReevaluateRadar} />;
  }

  return (
    <div className="w-full max-w-none px-4 sm:px-8 py-4 space-y-4">
      {/* Header Mobile & Desktop */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider uppercase" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>
              {CONFIG.APP_NAME}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest tabular-nums" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {clockTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hamburger menu — mobile only */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`hamburger-btn ${menuOpen ? 'active' : ''} flex items-center justify-center w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-slate-200 transition-all active:scale-90 shadow-sm`}
              title="Menu"
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-base" />
            </button>

            {menuOpen && (
              <>
                {/* Click-outside overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Dropdown menu */}
                <div className="menu-dropdown absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setView('profile'); setMenuOpen(false); }}
                    className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faUserAstronaut} className="text-purple-400 w-5" />
                    <span className="text-sm font-bold text-slate-200">Hồ Sơ</span>
                  </button>
                  <button
                    onClick={() => { setView('dashboard'); setMenuOpen(false); }}
                    className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-t border-slate-800/50"
                  >
                    <FontAwesomeIcon icon={faChartLine} className="text-emerald-400 w-5" />
                    <span className="text-sm font-bold text-slate-200">Dashboard</span>
                  </button>
                  <button
                    onClick={() => { setIsZoneModalOpen(true); setMenuOpen(false); }}
                    className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-t border-slate-800/50"
                  >
                    <FontAwesomeIcon icon={faFolderPlus} className="text-indigo-400 w-5" />
                    <span className="text-sm font-bold text-slate-200">Zone Manager</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop buttons — lg and up */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setView('profile')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <FontAwesomeIcon icon={faUserAstronaut} className="text-purple-400" />
              <span>Hồ Sơ</span>
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <FontAwesomeIcon icon={faChartLine} className="text-emerald-400" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setIsZoneModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <FontAwesomeIcon icon={faFolderPlus} className="text-indigo-400" />
              <span>Zone Manager</span>
            </button>
          </div>
        </div>
      </header>

      {/* Zone Selector — Mobile: dropdown, Desktop: horizontal pills */}
      {/* Mobile dropdown */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setZoneDropdownOpen((v) => !v)}
          className="flex items-center justify-between w-full gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all"
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-400" />
            {selectedZoneId === 'all'
              ? `Tất cả (${tasks.length})`
              : `${zones.find((z) => z.id === selectedZoneId)?.name || 'Zone'} (${tasks.filter((t) => t.zoneId === selectedZoneId).length})`}
          </span>
          <FontAwesomeIcon icon={zoneDropdownOpen ? faChevronUp : faChevronDown} className="text-slate-500 text-[10px]" />
        </button>

        {zoneDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setZoneDropdownOpen(false)} />
            <div className="menu-dropdown absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <button
                onClick={() => { setSelectedZoneId('all'); setZoneDropdownOpen(false); }}
                className={`menu-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                  selectedZoneId === 'all' ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-400 w-4" />
                <span className="text-sm font-bold">Tất cả ({tasks.length})</span>
              </button>
              {zones.map((z) => {
                const count = tasks.filter((t) => t.zoneId === z.id).length;
                const isSelected = selectedZoneId === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => { setSelectedZoneId(z.id); setZoneDropdownOpen(false); }}
                    className={`menu-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-t border-slate-800/50 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                    <span className="text-sm font-bold text-slate-200">{z.name} ({count})</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Desktop horizontal pills */}
      <div className="hidden sm:flex gap-2.5 overflow-x-auto py-1 no-scrollbar">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            selectedZoneId === 'all'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setSelectedZoneId('all')}
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Tất cả ({tasks.length})</span>
        </button>

        {zones.map((z) => {
          const count = tasks.filter((t) => t.zoneId === z.id).length;
          const isSelected = selectedZoneId === z.id;
          return (
            <button
              key={z.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              style={{
                borderColor: z.color,
                backgroundColor: isSelected ? z.color : undefined,
              }}
              onClick={() => setSelectedZoneId(z.id)}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isSelected ? '#ffffff' : z.color }}
              />
              <span>
                {z.name} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (isFormOpen && editingTaskId) {
              setEditingTaskId(null);
              setTitle('');
              setDescription('');
            }
            setIsFormOpen(!isFormOpen);
          }}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={isFormOpen ? faChevronUp : faPlus} />
          <span>{editingTaskId ? 'Sửa công việc' : isFormOpen ? 'Đóng khung nhập' : <><span className="sm:hidden">Tạo mới</span><span className="hidden sm:inline">Tạo công việc mới</span></>}</span>
        </button>

        {/* Status filter — icon-only on mobile, icon+text on desktop */}
        <div className="relative">
          <button
            onClick={() => setStatusDropdownOpen((v) => !v)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-200 transition-all active:scale-95"
            title="Lọc trạng thái"
          >
            <FontAwesomeIcon icon={faFilter} className="text-slate-400" />
            <FontAwesomeIcon
              icon={statusFilter === 'all' ? faList : statusFilter === 'pending' ? faClock : statusFilter === 'ongoing' ? faHourglassHalf : faCircleCheck}
              className={
                statusFilter === 'all' ? 'text-indigo-400' :
                statusFilter === 'pending' ? 'text-slate-400' :
                statusFilter === 'ongoing' ? 'text-blue-400' : 'text-emerald-400'
              }
            />
            <span className="hidden sm:inline">
              {statusFilter === 'all' ? 'Tất cả' : statusFilter === 'pending' ? 'Pending' : statusFilter === 'ongoing' ? 'Ongoing' : 'Completed'}
            </span>
            <FontAwesomeIcon icon={statusDropdownOpen ? faChevronUp : faChevronDown} className="text-slate-500 text-[10px]" />
          </button>

          {statusDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
              <div className="menu-dropdown absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                {([
                  { value: 'all', icon: faList, label: 'Tất cả', color: 'text-indigo-400' },
                  { value: 'pending', icon: faClock, label: 'Pending', color: 'text-slate-400' },
                  { value: 'ongoing', icon: faHourglassHalf, label: 'Ongoing', color: 'text-blue-400' },
                  { value: 'completed', icon: faCircleCheck, label: 'Completed', color: 'text-emerald-400' },
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

      {/* Task Form Card */}
      {isFormOpen && (
        <form onSubmit={handleTaskSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <h3 className="text-base font-bold text-slate-100">
            {editingTaskId ? 'Cập nhật Task' : 'Thêm Task Mới'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Tên công việc *
            </label>
            <input
              type="text"
              placeholder="Nhập tên task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Chọn Zone dự án
            </label>
            <select
              value={taskZoneId}
              onChange={(e) => setTaskZoneId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết & Hình ảnh (TinyMCE Rich Editor)
            </label>
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <Editor
                apiKey={CONFIG.TINYMCE_API_KEY}
                value={description}
                onEditorChange={(content) => setDescription(content)}
                init={{
                  height: 260,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar:
                    'undo redo | bold italic underline | alignleft aligncenter alignright | image link | bullist numlist removeformat',
                  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size:14px; background-color: #ffffff; color: #0f172a; }',
                  mobile: {
                    theme: 'mobile',
                    toolbar: 'undo bold italic image bullist'
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={evaluatingExp}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {evaluatingExp ? (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} spin />
                  <span>AI đang chấm EXP...</span>
                </>
              ) : (
                <span>{editingTaskId ? 'Lưu thay đổi' : 'Thêm công việc'}</span>
              )}
            </button>
            <button
              type="button"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl"
              onClick={() => {
                setIsFormOpen(false);
                setEditingTaskId(null);
                setTitle('');
                setDescription('');
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* TASK LIST - GROUPED BY DATE */}
      <main className="space-y-5">
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
                  {group.tasks.map((task) => {
                    const currentZone = getZoneById(task.zoneId);
                    const isExpanded = expandedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`group relative bg-slate-900 border border-slate-800/80 rounded-xl p-3 space-y-2 shadow-sm hover:border-slate-700 transition-all ${
                          task.status === 'completed' ? 'opacity-80' : ''
                        }`}
                      >
                        {/* Left accent border line based on status */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                            task.status === 'pending'
                              ? 'bg-amber-500'
                              : task.status === 'ongoing'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                        />

                        {/* Card Header: Zone tag, EXP & Status badge */}
                        <div className="flex items-center justify-between gap-2 pl-1">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap"
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
                        <h3 className="text-sm font-bold text-slate-100 truncate pl-1">
                          {task.title}
                        </h3>

                        {/* Inline Action Bar: Time, Expand Toggle & Action Buttons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 pl-1 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                              {new Date(task.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Timer: ongoing = live, completed = total duration, pending = hidden */}
                            {task.status === 'ongoing' && task.startedAt && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 whitespace-nowrap">
                                <FontAwesomeIcon icon={faClock} />
                                {formatDuration(Date.now() - new Date(task.startedAt).getTime())}
                              </span>
                            )}
                            {task.status === 'completed' && task.durationMs && task.durationMs > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                                <FontAwesomeIcon icon={faClock} />
                                {formatDuration(task.durationMs)}
                              </span>
                            )}

                            {task.description && (
                              <button
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                <span>{isExpanded ? 'Thu gọn' : 'Xem mô tả'}</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedDetailTask(task)}
                              className="px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Phóng to full màn hình"
                            >
                              <FontAwesomeIcon icon={faMaximize} /><span className="hidden sm:inline">Chi tiết</span>
                            </button>
                            <button
                              onClick={() => handleEditClick(task)}
                              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} /><span className="hidden sm:inline">Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrashCan} /><span className="hidden sm:inline">Xóa</span>
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
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

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
    </div>
  );
};
