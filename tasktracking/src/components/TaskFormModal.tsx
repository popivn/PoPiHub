import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faWandMagicSparkles,
  faClock,
  faBolt,
  faRotateLeft,
  faPlus,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { RichTextEditor } from './RichTextEditor';
import type { TaskItem, Zone } from '../types';
import { saveTaskToFirestore } from '../utils/storage';
import { evaluateExp } from '../utils/gemini';
import { toast } from '../utils/alert';

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: TaskItem | null;
  zones: Zone[];
  selectedZoneId?: string;
  userId: string;
  onSuccess?: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  editingTask,
  zones,
  selectedZoneId = 'all',
  userId,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskZoneId, setTaskZoneId] = useState('');
  const [scheduledAt, setScheduledAt] = useState(''); // YYYY-MM-DDTHH:MM:SS
  const [evaluatingExp, setEvaluatingExp] = useState(false);

  /** Chuyển datetime-local (YYYY-MM-DDTHH:MM:SS) sang ISO string */
  const parseScheduledInput = (value: string): string | null => {
    const v = value.trim();
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  /** Chuyển ISO datetime sang giá trị datetime-local (có seconds) */
  const toScheduledInputValue = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  /** Lấy giờ từ ISO */
  const hourFromIso = (iso?: string | null): number => {
    if (!iso) return 0;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 0 : d.getHours();
  };

  /** Nút Now: gán thời gian hiện tại chính xác đến giây */
  const handleSetNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const nowLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    setScheduledAt(nowLocal);
  };

  /** Đặt 00:00:00 hôm nay */
  const handleSetTodayStart = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`);
  };

  // Đồng bộ dữ liệu khi modal mở hoặc thay đổi task đang sửa
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setTaskZoneId(editingTask.zoneId);
        setScheduledAt(toScheduledInputValue(editingTask.scheduledAt));
      } else {
        setTitle('');
        setDescription('');
        const defaultZone = selectedZoneId !== 'all' ? selectedZoneId : zones[0]?.id || '';
        setTaskZoneId(defaultZone);
        setScheduledAt('');
      }
    }
  }, [isOpen, editingTask, selectedZoneId, zones]);

  // Đóng modal khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !evaluatingExp) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, evaluatingExp, onClose]);

  if (!isOpen) return null;

  const currentZone = zones.find((z) => z.id === taskZoneId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date();
    const defaultScheduled = new Date(now);
    defaultScheduled.setHours(0, 0, 0, 0);
    const scheduledIso = parseScheduledInput(scheduledAt) ?? defaultScheduled.toISOString();
    const scheduledHour = hourFromIso(scheduledIso);

    setEvaluatingExp(true);
    try {
      if (editingTask) {
        let exp = editingTask.exp ?? 0;
        if (editingTask.title !== title.trim() || editingTask.description !== description) {
          try {
            exp = await evaluateExp(title.trim(), description);
          } catch {
            /* Giữ nguyên exp cũ nếu AI lỗi */
          }
        }

        const updatedTask: TaskItem = {
          ...editingTask,
          title: title.trim(),
          description,
          zoneId: taskZoneId,
          exp,
          scheduledAt: scheduledIso,
          scheduledHour,
          startedAt: editingTask.startedAt ?? null,
          durationMs: editingTask.durationMs ?? 0,
          updatedAt: new Date().toISOString(),
        };

        await saveTaskToFirestore(updatedTask);
        toast.fire({
          icon: 'success',
          title: `Đã cập nhật công việc! (+${exp} EXP)`,
        });
      } else {
        let exp = 10;
        try {
          exp = await evaluateExp(title.trim(), description);
        } catch {
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
          scheduledAt: scheduledIso,
          scheduledHour,
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

      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setEvaluatingExp(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!evaluatingExp) onClose();
      }}
    >
      <div
        className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl bg-slate-900 border border-slate-800 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={editingTask ? faPenToSquare : faPlus} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                {editingTask ? 'Cập nhật Task' : 'Thêm Task Mới'}
              </h2>
              {currentZone && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentZone.color }}
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    {currentZone.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={evaluatingExp}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Đóng modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* MODAL BODY (RESPONSIVE: LG GRID VS MOBILE VERTICAL) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* DESKTOP (lg): 2-COLUMN TOP SECTION | MOBILE: 1-COLUMN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Tên công việc */}
            <div className="lg:col-span-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tên công việc <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                required
                autoFocus
              />
            </div>

            {/* Chọn Zone */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Chọn Zone dự án
              </label>
              <div className="relative">
                <select
                  value={taskZoneId}
                  onChange={(e) => setTaskZoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-medium appearance-none pr-8 cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Ngày & giờ dự kiến làm + Nút NOW */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClock} className="text-amber-400 text-xs" />
                <span>Ngày &amp; giờ dự kiến làm (HH:MM:SS)</span>
              </label>

              {/* Nút Now & Shortcuts */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  title="Chọn thời điểm hiện tại ngay lập tức"
                >
                  <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[10px]" />
                  <span>Now (Hiện tại)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetTodayStart}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  title="Đặt 00:00:00 hôm nay"
                >
                  Hôm nay
                </button>
                {scheduledAt && (
                  <button
                    type="button"
                    onClick={() => setScheduledAt('')}
                    className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                    title="Xóa giờ hẹn"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="datetime-local"
              step={1}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none transition-colors [color-scheme:dark] font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Để trống sẽ mặc định <span className="text-slate-400 font-semibold">00:00:00</span> của ngày tạo task.
            </p>
          </div>

          {/* Mô tả chi tiết & Hình ảnh (Rich Editor) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết &amp; Hình ảnh (Rich Editor)
            </label>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <RichTextEditor
                value={description}
                onChange={(content) => setDescription(content)}
                height={260}
                placeholder="Nhập mô tả chi tiết cho công việc, paste hình ảnh hoặc đính kèm tài liệu..."
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={evaluatingExp}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              {evaluatingExp ? (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} spin />
                  <span>AI đang chấm điểm EXP...</span>
                </>
              ) : (
                <span>{editingTask ? 'Lưu thay đổi' : 'Thêm công việc'}</span>
              )}
            </button>
            <button
              type="button"
              disabled={evaluatingExp}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
              onClick={onClose}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
