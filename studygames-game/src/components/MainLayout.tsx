import type { AuthState } from '../auth/authClient';
import type { Player } from '../players/playersClient';
import Navbar from './Navbar';
import './MainLayout.css';

interface Props {
  auth?: AuthState;
  player?: Player | null;
  onLoginClick?: () => void;
  onOpenPlayers?: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export default function MainLayout({ player, children }: Props) {
  return (
    <div className="main-layout flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <Navbar tagline="Social Slime" currentPlayer={player} />
      <div className="flex-1 relative w-full h-full">
        {children}
      </div>
    </div>
  );
}
