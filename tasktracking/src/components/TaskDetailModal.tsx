import React from 'react';
import type { TaskItem, Zone } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faClock, faSpinner, faCircleCheck, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';

interface TaskDetailModalProps {
  task: TaskItem | null;
  zone: Zone | undefined;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  zone,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!task) return null;

  const renderStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FontAwesomeIcon icon={faSpinner} spin /> Ongoing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FontAwesomeIcon icon={faCircleCheck} /> Completed
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full h-full sm:h-[95vh] sm:max-w-none sm:mx-4 bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {zone && (
              <span
                className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider text-white whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: zone.color }}
              >
                {zone.name}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
              {task.title}
            </h2>
            <div className="hidden sm:block flex-shrink-0">
              {renderStatusBadge()}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="sm:hidden">
              {renderStatusBadge()}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Đóng"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {/* Compact Fluid Content Body */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {task.description ? (
            <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-5 text-slate-900 leading-relaxed shadow-sm min-h-[250px]">
              <div
                className="rich-text-content space-y-2 text-sm text-slate-900"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm italic">
              Không có mô tả chi tiết cho công việc này.
            </div>
          )}
        </div>

        {/* Compact Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium text-[11px]">
            Ngày tạo: {new Date(task.createdAt).toLocaleString('vi-VN')}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FontAwesomeIcon icon={faPenToSquare} /> Sửa công việc
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(task.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FontAwesomeIcon icon={faTrashCan} /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
