export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-6 px-6 py-7 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.jpg"
            alt="CronHub logo"
            className="h-11 w-11 rounded-[10px] object-cover shadow-sm"
          />
          <div>
            <p className="font-bold text-[var(--color-text-h)]">CronHub</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Giao diện quản lý cron đơn giản.
            </p>
          </div>
        </div>

        <nav
          className="flex flex-wrap gap-3 text-sm text-[var(--color-text)] sm:gap-5"
          aria-label="Footer"
        >
          <a href="#dashboard" className="hover:text-[var(--color-brand)]">
            Tổng quan
          </a>
          <a href="#jobs" className="hover:text-[var(--color-brand)]">
            Cron jobs
          </a>
          <a href="#logs" className="hover:text-[var(--color-brand)]">
            Nhật ký
          </a>
          <a href="#settings" className="hover:text-[var(--color-brand)]">
            Cài đặt
          </a>
        </nav>

        <p className="col-span-full border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
          © {year} CronHub · vttu-xetmien. Đã đăng ký.
        </p>
      </div>
    </footer>
  )
}
