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
  faMaximize
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
import { ZoneModal } from '../components/ZoneModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

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

  // Subscribe to Firestore Real-time Updates
  useEffect(() => {
    const unsubscribeZones = subscribeZones((loadedZones) => {
      setZones(loadedZones);
      if (loadedZones.length > 0 && !taskZoneId) {
        setTaskZoneId(loadedZones[0].id);
      }
    });

    const unsubscribeTasks = subscribeTasks((loadedTasks) => {
      setTasks(loadedTasks);
    });

    return () => {
      unsubscribeZones();
      unsubscribeTasks();
    };
  }, []);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        const updatedTask: TaskItem = {
          ...existing,
          title: title.trim(),
          description,
          zoneId: taskZoneId,
          updatedAt: new Date().toISOString(),
        };
        await saveTaskToFirestore(updatedTask);
        toast.fire({
          icon: 'success',
          title: 'Đã cập nhật công việc!',
        });
      }
      setEditingTaskId(null);
    } else {
      const newTask: TaskItem = {
        id: 'task-' + Date.now(),
        title: title.trim(),
        description,
        zoneId: taskZoneId || (zones[0]?.id ?? 'zone-1'),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveTaskToFirestore(newTask);
      toast.fire({
        icon: 'success',
        title: 'Đã thêm công việc mới thành công!',
      });
    }

    setTitle('');
    setDescription('');
    setIsFormOpen(false);
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

    const updatedTask: TaskItem = {
      ...task,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
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

  const handleAddZone = async (newZoneData: Omit<Zone, 'id'>) => {
    const newZone: Zone = {
      ...newZoneData,
      id: 'zone-' + Date.now(),
    };
    await saveZoneToFirestore(newZone);
    toast.fire({
      icon: 'success',
      title: `Đã tạo Zone "${newZone.name}"`,
    });
    if (!taskZoneId) setTaskZoneId(newZone.id);
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
        await saveTaskToFirestore({ ...t, zoneId: fallbackZoneId });
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

  return (
    <div className="w-full max-w-none px-4 sm:px-8 py-4 space-y-4">
      {/* Header Mobile & Desktop */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              {CONFIG.APP_NAME}
            </h1>
            <p className="text-xs text-slate-400 font-medium">Firebase Realtime Sync Active</p>
          </div>
        </div>

        <button
          onClick={() => setIsZoneModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <FontAwesomeIcon icon={faFolderPlus} className="text-indigo-400" />
          <span>Zone Manager</span>
        </button>
      </header>

      {/* Horizontal Zone List */}
      <div className="flex gap-2.5 overflow-x-auto py-1 no-scrollbar">
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
          <span>{editingTaskId ? 'Sửa công việc' : isFormOpen ? 'Đóng khung nhập' : 'Tạo công việc mới'}</span>
        </button>

        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
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
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
            >
              {editingTaskId ? 'Lưu thay đổi' : 'Thêm công việc'}
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

      {/* SINGLE COLUMN TASK LIST */}
      <main className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-sm">
            Chưa có công việc nào trong thư mục này.
          </div>
        ) : (
          filteredTasks.map((task) => {
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

                {/* Card Header: Zone tag, Title & Status badge */}
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
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      {task.title}
                    </h3>
                  </div>

                  <button
                    onClick={(e) => handleCycleStatus(task, e)}
                    className="focus:outline-none flex-shrink-0"
                    title="Bấm để đổi trạng thái"
                  >
                    {renderStatusBadge(task.status)}
                  </button>
                </div>

                {/* Inline Action Bar: Date, Expand Toggle & Action Buttons */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 pl-1 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(task.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

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
                      <FontAwesomeIcon icon={faMaximize} /> Chi tiết
                    </button>
                    <button
                      onClick={() => handleEditClick(task)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> Xóa
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
    </div>
  );
};
