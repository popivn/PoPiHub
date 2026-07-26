import React, { useState } from 'react';
import type { Zone } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faXmark, faPlus, faPenToSquare, faCheck } from '@fortawesome/free-solid-svg-icons';

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  onAddZone: (zone: Omit<Zone, 'id'>) => void;
  onUpdateZone: (zone: Zone) => void;
  onDeleteZone: (id: string) => void;
}

const PRESET_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

export const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  zones,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Edit mode state
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddZone({ name: name.trim(), color });
    setName('');
  };

  const handleStartEdit = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setEditName(zone.name);
    setEditColor(zone.color);
  };

  const handleSaveEdit = (zoneId: string) => {
    if (!editName.trim()) return;
    onUpdateZone({
      id: zoneId,
      name: editName.trim(),
      color: editColor,
    });
    setEditingZoneId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-extrabold text-slate-100">Quản lý Zone (Dự án)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tạo mới hoặc chỉnh sửa các thư mục dự án</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950/50 border border-slate-800/80 p-4 sm:p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Thêm Zone Mới</h4>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Tên Zone
            </label>
            <input
              type="text"
              placeholder="VD: Dự án Marketing, Việc nhà..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Màu đại diện
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} /> Tạo Zone Mới
          </button>
        </form>

        {/* Zone List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Danh sách Zone hiện tại ({zones.length})
          </h4>
          
          <div className="space-y-2.5">
            {zones.map((z) => {
              const isEditing = editingZoneId === z.id;

              return (
                <div
                  key={z.id}
                  className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Tên:</span>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-slate-900 border border-indigo-500/60 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">Màu:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                  editColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-75'
                                }`}
                                style={{ backgroundColor: c }}
                                onClick={() => setEditColor(c)}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingZoneId(null)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(z.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                          >
                            <FontAwesomeIcon icon={faCheck} /> Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-md"
                          style={{ backgroundColor: z.color }}
                        />
                        <span className="text-sm font-bold text-slate-200">{z.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          onClick={() => handleStartEdit(z)}
                          title="Sửa Zone"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                        </button>
                        {zones.length > 1 && (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            onClick={() => onDeleteZone(z.id)}
                            title="Xóa Zone"
                          >
                            <FontAwesomeIcon icon={faTrashCan} /> Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
