import { useEffect, useState } from 'react';
import { SLIME_TYPES, SLIME_AVATARS, type Player } from '../players/playersClient';
import {
  listPlayers,
  createPlayer,
  selectPlayer,
} from '../players/playersClient';
import './PlayerManager.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelected: (player: Player) => void;
}

export default function PlayerManager({ open, onClose, onSelected }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('nature');
  const [avatar, setAvatar] = useState(SLIME_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const load = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { players, selectedId: sid } = await listPlayers();
      setPlayers(players);
      setSelectedId(sid);
    } catch (err: any) {
      setError(err?.message ?? 'Load failed');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const p = await createPlayer(name.trim(), type, avatar);
      setPlayers((prev) => [...prev, p]);
      setSelectedId(p.id);
      onSelected(p);
      setName('');
    } catch (err: any) {
      setError(err?.message ?? 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const p = await selectPlayer(id);
      setSelectedId(p.id);
      onSelected(p);
    } catch (err: any) {
      setError(err?.message ?? 'Select failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-card" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="pm-title">Your Players</h2>
        <p className="pm-sub">Pick or create a slime to play.</p>

        {loadingList && <div className="pm-loading">Loading…</div>}

        <div className="pm-list">
          {players.map((p) => (
            <div
              key={p.id}
              className={`pm-item${selectedId === p.id ? ' active' : ''}`}
              onClick={() => handleSelect(p.id)}
            >
              <div className="pm-avatar">{p.avatar || '🦊'}</div>
              <div className="pm-info">
                <div className="pm-name">{p.name}</div>
                <div className="pm-type">{SLIME_TYPES.find((t) => t.id === p.slimeType)?.label ?? p.slimeType}</div>
              </div>
              {selectedId === p.id && <div className="pm-check">✓</div>}
            </div>
          ))}
          {!loadingList && players.length === 0 && (
            <div className="pm-empty">No players yet. Create one below.</div>
          )}
        </div>

        <form className="pm-form" onSubmit={handleCreate}>
          <label className="pm-field">
            <span>Player name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              placeholder="18 chars"
              disabled={loading}
            />
          </label>

          <div className="pm-section-label">Avatar</div>
          <div className="pm-avatar-grid">
            {SLIME_AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                className={`pm-avatar-btn${avatar === a ? ' active' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="pm-section-label">Slime type</div>
          <div className="pm-type-grid">
            {SLIME_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pm-type-btn${type === t.id ? ' active' : ''}`}
                onClick={() => setType(t.id)}
              >
                <div className={`pm-preview type-${t.id}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {error && <div className="pm-error">{error}</div>}

          <button type="submit" className="pm-primary" disabled={loading || !name.trim()}>
            {loading ? '…' : 'Create player'}
          </button>
        </form>
      </div>
    </div>
  );
}
