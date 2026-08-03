import type { SidebarItem } from '../sidebar/sidebar.service.js';

const ICONS: Record<string, string> = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  content: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
};

export function Sidebar({ items }: { items: SidebarItem[] }) {
  return (
    <aside className="w-64 min-h-screen bg-kh-surface-light border-r border-kh-border flex flex-col shrink-0">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5">
        <img src="/imgs/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
        <span className="text-lg font-bold text-white">Xianria</span>
      </div>
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1" id="sidebar-nav">
        {items.length === 0 ? (
          <div className="text-kh-muted text-xs px-3 py-2">Chưa có sidebar items</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              className="sidebar-item flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-kh-text-dim text-sm cursor-pointer transition-colors duration-150 border-none bg-transparent text-left w-full hover:bg-kh-accent/10 hover:text-kh-text"
              data-id={item.id}
              data-label={item.label}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0" dangerouslySetInnerHTML={{ __html: ICONS[item.icon] || ICONS.dashboard }} />
              {item.label}
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}
