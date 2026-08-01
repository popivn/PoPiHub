type PlaceholderProps = {
  title: string
  description: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-h)]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-prose text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text-h)]">
            {title}
          </h2>
          <span className="inline-flex items-center rounded-full border border-[var(--color-warn-border)] bg-[var(--color-warn-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-warn)]">
            Feature pending
          </span>
        </div>
        <p className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3.5 text-[13px] text-[var(--color-text-muted)]">
          Tính năng này đang trong trạng thái sắp ra mắt. Vui lòng quay lại sau.
        </p>
      </section>
    </div>
  )
}
