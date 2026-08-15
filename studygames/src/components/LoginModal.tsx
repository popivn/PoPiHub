import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faUser,
  faUserSecret,
  faDice,
  faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import {
  anonymousSignIn,
  register,
  login,
  loginWithKey,
  getAuthState,
  clearAuth,
  type AuthState,
} from '../auth/authClient';
import './LoginModal.css';

type Mode = 'login' | 'register' | 'key_login';

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthed: (state: AuthState) => void;
}

export default function LoginModal({ open, onClose, onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
      const savedKey = localStorage.getItem('sg_saved_secret_key');
      if (savedKey && !secretKey) {
        setSecretKey(savedKey);
      }
    }
  }, [open, mode]);

  if (!open) return null;

  const refreshAndClose = () => {
    onAuthed(getAuthState());
    onClose();
  };

  const handleGenerateKey = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSecretKey(`KEY-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'key_login') {
        if (!secretKey.trim()) {
          throw new Error('Vui lòng nhập Secret Key');
        }
        await loginWithKey(secretKey.trim());
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp!');
        }
        await register(username.trim(), password, secretKey.trim() || undefined);
      } else {
        await login(username.trim(), password);
      }
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      refreshAndClose();
    } catch (err: any) {
      setError(err?.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setError(null);
    setLoading(true);
    try {
      await anonymousSignIn();
      refreshAndClose();
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập khách thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    onAuthed(getAuthState());
  };

  const current = getAuthState();

  return (
    <div className="lm-backdrop" onClick={onClose}>
      <div className="lm-card" onClick={(e) => e.stopPropagation()}>
        <button className="lm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="lm-title">
          {mode === 'login'
            ? 'Đăng nhập'
            : mode === 'key_login'
              ? 'Đăng nhập bằng Key'
              : 'Tạo tài khoản'}
        </h2>
        <p className="lm-sub">
          {mode === 'login'
            ? 'Nhập tài khoản để đồng bộ dữ liệu.'
            : mode === 'key_login'
              ? 'Nhập mã Key bí mật để đăng nhập nhanh.'
              : 'Tạo tài khoản mới & Key tùy chọn.'}
        </p>

        <form className="lm-form" onSubmit={handleSubmit}>
          {mode === 'key_login' ? (
            <label className="lm-field">
              <span>Secret Key</span>
              <input
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
                disabled={loading}
                placeholder="KEY-89AF2"
              />
            </label>
          ) : (
            <>
              <label className="lm-field">
                <span>Tên đăng nhập</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  required
                  disabled={loading}
                  placeholder="Username"
                />
              </label>

              <label className="lm-field">
                <span>Mật khẩu</span>
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                  required
                  disabled={loading}
                  placeholder="Mật khẩu"
                />
              </label>

              {mode === 'register' && (
                <label className="lm-field">
                  <span>Xác nhận mật khẩu</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={4}
                    required
                    disabled={loading}
                    placeholder="Nhập lại mật khẩu"
                  />
                </label>
              )}

              {mode === 'register' && (
                <label className="lm-field">
                  <div className="flex items-center justify-between">
                    <span>Secret Key (Tùy chọn)</span>
                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="text-[10px] text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faDice} />
                      <span>Tạo ngẫu nhiên</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    disabled={loading}
                    placeholder="Mã Key đăng nhập nhanh"
                  />
                </label>
              )}
            </>
          )}

          {error && <div className="lm-error">{error}</div>}

          <button type="submit" className="lm-primary flex items-center justify-center gap-2" disabled={loading}>
            <FontAwesomeIcon icon={mode === 'key_login' ? faKey : faRightToBracket} className="text-xs" />
            <span>
              {loading
                ? '…'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : mode === 'key_login'
                    ? 'Vào bằng Key'
                    : 'Tạo tài khoản'}
            </span>
          </button>
        </form>

        <div className="lm-divider">
          <span>Hoặc</span>
        </div>

        {/* Dynamic Buttons in Or Section */}
        <div className="flex flex-col gap-2">
          {mode !== 'key_login' && (
            <button
              type="button"
              className="lm-secondary flex items-center justify-center gap-2"
              onClick={() => {
                setError(null);
                setMode('key_login');
              }}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faKey} className="text-teal-400 text-xs" />
              <span>Đăng nhập bằng Key</span>
            </button>
          )}

          {mode === 'key_login' && (
            <button
              type="button"
              className="lm-secondary flex items-center justify-center gap-2"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faUser} className="text-teal-400 text-xs" />
              <span>Tài khoản & Mật khẩu</span>
            </button>
          )}

          <button
            type="button"
            className="lm-secondary flex items-center justify-center gap-2"
            onClick={handleAnonymous}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faUserSecret} className="text-slate-400 text-xs" />
            <span>Đăng nhập Khách</span>
          </button>
        </div>

        <p className="lm-switch">
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Tạo tài khoản mới
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              Đã có tài khoản?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Đăng nhập ngay
              </button>
            </>
          ) : (
            <>
              Quay lại{' '}
              <button type="button" onClick={() => setMode('login')}>
                Đăng nhập thường
              </button>
            </>
          )}
        </p>

        {current.accessToken && (
          <p className="lm-signed">
            Đang đăng nhập dưới tên <strong>{current.username ?? 'guest'}</strong>.{' '}
            <button type="button" onClick={handleSignOut}>
              Đăng xuất
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
