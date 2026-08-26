import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPenToSquare,
  faCheck,
  faXmark,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import type { User } from '../types';
import { getUserById, saveUserToFirestore } from '../utils/storage';
import { toast } from '../utils/alert';

interface UserInfoPanelProps {
  userId: string;
  /** Bắn user mới ra HomePage khi có thay đổi */
  onUserUpdated?: (user: User) => void;
}

/**
 * Panel hiển thị thông tin cơ bản của user (tên, email).
 * - Nếu chưa có tên/email → hiển thị form nhập inline.
 * - Có nút "Sửa" để chỉnh sửa lại.
 */
export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ userId, onUserUpdated }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getUserById(userId)
      .then((u) => {
        if (!active) return;
        setUser(u);
        setName(u?.name ?? '');
        setEmail(u?.email ?? '');
        // Tự mở form nếu thiếu tên hoặc email
        if (u && (!u.name || !u.email)) setEditing(true);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await saveUserToFirestore({
        name: name.trim(),
        email: email.trim(),
      });
      if (updated) {
        setUser(updated);
        onUserUpdated?.(updated);
        setEditing(false);
        toast.fire({ icon: 'success', title: 'Đã lưu thông tin!' });
      } else {
        toast.fire({ icon: 'error', title: 'Không lưu được, thử lại sau.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-500">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Đang tải thông tin...</span>
      </div>
    );
  }

  // ----- EDIT MODE -----
  if (editing) {
    return (
      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
          <FontAwesomeIcon icon={faUser} />
          <span>{user?.name ? 'Cập nhật thông tin' : 'Nhập thông tin của bạn'}</span>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tên hiển thị
          </label>
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Email
          </label>
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
            <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
          </button>
          {user?.name && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Hủy</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ----- VIEW MODE -----
  const displayName = user?.name?.trim() || 'Chưa đặt tên';
  const displayEmail = user?.email?.trim() || 'Chưa có email';

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(displayName[0] || '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate" title={displayName}>
            {displayName}
          </p>
          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1" title={displayEmail}>
            <FontAwesomeIcon icon={faEnvelope} className="text-[9px]" />
            {displayEmail}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
        title="Sửa thông tin"
      >
        <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
      </button>
    </div>
  );
};
