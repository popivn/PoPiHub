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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FontAwesomeIcon icon={faSpinner} spin /> Ongoing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FontAwesomeIcon icon={faCircleCheck} /> Completed
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full h-full sm:max-w-5xl sm:h-[94vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {zone && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: zone.color }}
                >
                  {zone.name}
                </span>
              )}
              {renderStatusBadge()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-snug">
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            title="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>
        </div>

        {/* Content Body - White canvas preview area for TinyMCE HTML */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Nội dung chi tiết & Hình ảnh
          </h4>

          {task.description ? (
            <div className="bg-white border border-slate-300 rounded-2xl p-6 text-slate-900 leading-relaxed min-h-[350px] shadow-inner">
              <div
                className="rich-text-content space-y-3 text-sm sm:text-base text-slate-900"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-sm italic">
              Không có mô tả chi tiết cho công việc này.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500 font-medium">
            Ngày tạo: {new Date(task.createdAt).toLocaleString('vi-VN')}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faPenToSquare} /> Sửa công việc
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(task.id);
              }}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <FontAwesomeIcon icon={faTrashCan} /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
