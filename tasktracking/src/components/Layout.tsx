import React from 'react';
import { Header, type HeaderProps } from './Header';

export interface LayoutProps extends HeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className = '',
  onOpenProfile,
  onOpenDashboard,
  onOpenZoneModal,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className={`w-full max-w-none px-4 sm:px-8 py-4 space-y-4 flex-1 ${className}`}>
        <Header
          onOpenProfile={onOpenProfile}
          onOpenDashboard={onOpenDashboard}
          onOpenZoneModal={onOpenZoneModal}
          onLogout={onLogout}
        />
        <main>{children}</main>
      </div>
    </div>
  );
};
