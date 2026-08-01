export type View = 'dashboard' | 'jobs' | 'logs' | 'settings'

type HeaderProps = {
  view: View
  onNavigate: (view: View) => void
}

const NAV_ITEMS: { key: View; label: string }[] = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'jobs', label: 'Cron jobs' },
  { key: 'logs', label: 'Nhật ký' },
  { key: 'settings', label: 'Cài đặt' },
]

export default function Header({ view, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] backdrop-blur supports-[backdrop-filter]:backdrop-saturate-150">
      <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3">
        <a
          className="flex items-center gap-3"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('dashboard')
          }}
        >
          <img
            src="/logo.jpg"
            alt="CronHub logo"
            className="h-10 w-10 flex-none rounded-[10px] object-cover shadow-sm"
          />
          <span className="flex flex-col leading-tight font-bold text-[var(--color-text-h)]">
            CronHub
            <small className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Cron Manager
            </small>
          </span>
        </a>

        <nav className="ml-2 hidden gap-1 sm:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                view === item.key
                  ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-h)]'
              }`}
              href={`#${item.key}`}
              onClick={(e) => {
                e.preventDefault()
                onNavigate(item.key)
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-warn-border)] bg-[var(--color-warn-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-warn)]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-warn)_25%,transparent)]"
              aria-hidden="true"
            />
            Beta
          </span>
        </div>
      </div>
    </header>
  )
}
