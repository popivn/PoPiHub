import { useEffect, useState } from 'react';
import {
  anonymousSignIn,
  register,
  login,
  getAuthState,
  clearAuth,
  type AuthState,
} from '../auth/authClient';
import './LoginModal.css';

type Mode = 'login' | 'register';

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthed: (state: AuthState) => void;
}

export default function LoginModal({ open, onClose, onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
    }
  }, [open, mode]);

  if (!open) return null;

  const refreshAndClose = () => {
    onAuthed(getAuthState());
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      setUsername('');
      setPassword('');
      refreshAndClose();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
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
      setError(err?.message ?? 'Anonymous sign-in failed');
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
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="lm-sub">
          {mode === 'login'
            ? 'Sign in to sync your progress.'
            : 'Pick a username and password.'}
        </p>

        <form className="lm-form" onSubmit={handleSubmit}>
          <label className="lm-field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
              disabled={loading}
              placeholder="3+ chars"
            />
          </label>

          <label className="lm-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              required
              disabled={loading}
              placeholder="4+ chars"
            />
          </label>

          {error && <div className="lm-error">{error}</div>}

          <button type="submit" className="lm-primary" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        <div className="lm-divider"><span>or</span></div>

        <button
          type="button"
          className="lm-secondary"
          onClick={handleAnonymous}
          disabled={loading}
        >
          Continue as guest
        </button>

        <p className="lm-switch">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have one?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Log in
              </button>
            </>
          )}
        </p>

        {current.accessToken && (
          <p className="lm-signed">
            Signed in as <strong>{current.username ?? 'guest'}</strong>.{' '}
            <button type="button" onClick={handleSignOut}>Sign out</button>
          </p>
        )}
      </div>
    </div>
  );
}
