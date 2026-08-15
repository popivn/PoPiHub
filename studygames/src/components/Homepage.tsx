import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/Game';
import { HAT_FACTORIES } from '../game/character/hats';
import { getAuthState, clearAuth, type AuthState } from '../auth/authClient';
import { type Player } from '../players/playersClient';
import LoginModal from './LoginModal';
import PlayerManager from './PlayerManager';
import MainLayout from './MainLayout';
import './Homepage.css';

function HatButton({
  id,
  label,
  active,
  onPick,
}: {
  id: string;
  label: string;
  active: boolean;
  onPick: (id: string) => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const factory = HAT_FACTORIES.find((f) => f.id === id);
    if (!factory) return;
    const hat = factory.create();
    if (id !== 'none') {
      hat.el.style.position = 'absolute';
      hat.el.style.bottom = '4px';
      hat.el.style.left = '50%';
      hat.el.style.transform = 'translateX(-50%)';
      hat.el.style.filter = 'none';
      el.appendChild(hat.el);
    }
    return () => {
      if (hat.el.parentElement) hat.el.parentElement.removeChild(hat.el);
    };
  }, [id]);

  return (
    <button
      type="button"
      className={`hat-btn${active ? ' active' : ''}`}
      onClick={() => onPick(id)}
    >
      <div className="hat-btn-preview" ref={previewRef} />
      <span className="hat-btn-label">{label}</span>
    </button>
  );
}

export default function Homepage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [equipped, setEquipped] = useState('none');
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());
  const [loginOpen, setLoginOpen] = useState(!auth.accessToken);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);

  // Tạo game một lần.
  useEffect(() => {
    if (!viewportRef.current) return;
    const game = new Game(viewportRef.current);
    gameRef.current = game;
    game.start();

    const onResize = () => game.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      game.stop();
      gameRef.current = null;
    };
  }, []);

  // Bật/tắt điều khiển theo auth + player.
  useEffect(() => {
    const canPlay = !!auth.accessToken && !!player;
    gameRef.current?.setInputEnabled(canPlay);
  }, [auth.accessToken, player]);

  // Khi login/logout đổi: mở login hoặc auto mở player manager lần đầu.
  useEffect(() => {
    if (!auth.accessToken) {
      setLoginOpen(true);
      setPlayersOpen(false);
    } else {
      setLoginOpen(false);
      if (!player) setPlayersOpen(true);
    }
  }, [auth.accessToken]);

  // Áp dụng slime type khi player đổi.
  useEffect(() => {
    if (player?.slimeType) {
      gameRef.current?.setSlimeType(player.slimeType);
    }
  }, [player?.slimeType]);

  const pickHat = (id: string) => {
    if (!auth.accessToken || !player) return;
    if (!gameRef.current) return;
    if (gameRef.current.equipHat(id)) setEquipped(id);
  };

  const handleJump = () => {
    gameRef.current?.requestJump();
  };

  const accountLabel = auth.username
    ? auth.username
    : auth.provider === 'anonymous'
      ? 'Guest'
      : 'Sign in';

  const onSelectPlayer = (p: Player) => {
    setPlayer(p);
    setPlayersOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    setPlayer(null);
    setMenuOpen(false);
    setAuth(getAuthState());
  };

  return (
    <MainLayout auth={auth} player={player}>
      <main className="homepage">
        <div className="homepage-stage" ref={viewportRef} />
        <div className="account-wrap">
        <button
          type="button"
          className="account-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account"
        >
          <span className="account-btn-dot" data-on={auth.accessToken ? 'true' : 'false'} />
          {accountLabel}
        </button>
        {menuOpen && (
          <div className="account-menu">
            <div className="account-menu-hd">{accountLabel}</div>
            {auth.accessToken ? (
              <>
                <button type="button" onClick={() => { setMenuOpen(false); setPlayersOpen(true); }}>
                  Players
                </button>
                <button type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setMenuOpen(false); setLoginOpen(true); }}>
                Sign in
              </button>
            )}
          </div>
        )}
      </div>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onAuthed={(s) => setAuth(s)}
      />
      <PlayerManager
        open={playersOpen}
        onClose={() => setPlayersOpen(false)}
        onSelected={onSelectPlayer}
      />
      {auth.accessToken && player && (
        <>
          <div className="hat-selector">
            {HAT_FACTORIES.map((f) => (
              <HatButton
                key={f.id}
                id={f.id}
                label={f.label}
                active={equipped === f.id}
                onPick={pickHat}
              />
            ))}
          </div>
          <button
            type="button"
            className="jump-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handleJump();
            }}
            aria-label="Jump"
          >
            Jump
          </button>
        </>
      )}
      </main>
    </MainLayout>
  );
}
