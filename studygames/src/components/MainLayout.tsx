import type { AuthState } from '../auth/authClient';
import type { Player } from '../players/playersClient';
import './MainLayout.css';

interface Props {
  auth: AuthState;
  player: Player | null;
  children: React.ReactNode;
}

/**
 * MainLayout — khung chính cho mọi trang sau login.
 * Hiển thị avatar + tên player ở góc trên bên trái.
 */
export default function MainLayout({ auth, player, children }: Props) {
  const accountLabel = auth.username
    ? auth.username
    : auth.provider === 'anonymous'
      ? 'Guest'
      : 'Sign in';

  return (
    <div className="main-layout">
      {player && (
        <div className="ml-profile">
          <div className={`ml-profile-avatar type-${player.slimeType}`}>
            <span className="ml-profile-emoji">{player.avatar || '🦊'}</span>
          </div>
          <div className="ml-profile-info">
            <div className="ml-profile-name">{player.name}</div>
            <div className="ml-profile-user">{accountLabel}</div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
