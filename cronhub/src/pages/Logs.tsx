import { useCallback, useEffect, useState } from 'react'
import { fetchApiLogs, type ApiLogRow } from '../lib/apiLogsService'

function formatTime(ms: number | null): string {
  if (!ms) return '—'
  try {
    return new Date(ms).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(ms)
  }
}

function statusClass(row: ApiLogRow): string {
  if (row.error)
    return 'text-[var(--color-err)] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.45)]'
  if (row.status == null)
    return 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border-[var(--color-border-strong)]'
  if (row.status >= 200 && row.status < 300)
    return 'text-[var(--color-ok)] bg-[color-mix(in_srgb,var(--color-ok)_12%,transparent)] border-[color-mix(in_srgb,var(--color-ok)_45%,transparent)]'
  if (row.status >= 400 && row.status < 500)
    return 'text-[var(--color-warn)] bg-[var(--color-warn-soft)] border-[var(--color-warn-border)]'
  return 'text-[var(--color-err)] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.45)]'
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export default function Logs() {
  const [rows, setRows] = useState<ApiLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ApiLogRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApiLogs(100)
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-h)]">
            Nhật ký API
          </h1>
          <p className="mt-1.5 max-w-prose text-sm text-[var(--color-text-muted)]">
            Mọi request/response đi qua{' '}
            <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
              apiFetch()
            </code>{' '}
            được ghi vào Firestore collection{' '}
            <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
              api_logs
            </code>
            .
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Đang tải…' : 'Tải lại'}
        </button>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text-h)]">
            api_logs
          </h2>
          <span className="inline-flex items-center rounded-full border border-[var(--color-warn-border)] bg-[var(--color-warn-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-warn)]">
            {rows.length} bản ghi
          </span>
        </div>

        {error && (
          <p
            className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3.5 text-[13px]"
            style={{ color: 'var(--color-warn)' }}
          >
            Lỗi đọc log: {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Thời gian', 'Phương thức', 'URL', 'Trạng thái', 'Thời lượng'].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-[var(--color-text-muted)]"
                  >
                    Chưa có log nào. Gọi{' '}
                    <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
                      apiFetch()
                    </code>{' '}
                    để tạo bản ghi.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-5 py-3.5 text-[var(--color-text-muted)]">
                    {formatTime(row.createdAtClient)}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
                      {row.method}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[var(--color-text-h)]">
                    {shortUrl(row.url)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${statusClass(row)}`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-current"
                        aria-hidden="true"
                      />
                      {row.error
                        ? 'Lỗi'
                        : row.status == null
                          ? '—'
                          : `${row.status} ${row.statusText}`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-text-muted)]">
                    {row.durationMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Chi tiết log"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-[var(--color-text-h)]">
                Chi tiết log
              </h2>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-h)]"
                onClick={() => setSelected(null)}
              >
                Đóng
              </button>
            </div>
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5">
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                URL
              </dt>
              <dd className="break-words text-sm text-[var(--color-text-h)]">
                <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
                  {selected.method}
                </code>{' '}
                {selected.url}
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Trạng thái
              </dt>
              <dd className="break-words text-sm text-[var(--color-text-h)]">
                {selected.status ?? '—'} {selected.statusText}{' '}
                {selected.error && (
                  <span style={{ color: 'var(--color-warn)' }}>
                    ({selected.error})
                  </span>
                )}
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Thời lượng
              </dt>
              <dd className="text-sm text-[var(--color-text-h)]">
                {selected.durationMs} ms
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Thời gian (client)
              </dt>
              <dd className="text-sm text-[var(--color-text-h)]">
                {formatTime(selected.createdAtClient)}
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Thời gian (server)
              </dt>
              <dd className="text-sm text-[var(--color-text-h)]">
                {formatTime(selected.createdAtServer)}
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Request body
              </dt>
              <dd>
                <pre className="m-0 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-mono text-xs text-[var(--color-text-h)]">
                  {selected.requestBody == null
                    ? '—'
                    : JSON.stringify(selected.requestBody, null, 2)}
                </pre>
              </dd>
              <dt className="self-start pt-0.5 text-[13px] text-[var(--color-text-muted)]">
                Response body
              </dt>
              <dd>
                <pre className="m-0 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-mono text-xs text-[var(--color-text-h)]">
                  {selected.responseBody == null
                    ? '—'
                    : JSON.stringify(selected.responseBody, null, 2)}
                </pre>
              </dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
