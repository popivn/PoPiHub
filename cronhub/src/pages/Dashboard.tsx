import { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  fetchZoneGroups,
  type ZoneGroup,
  type CronJob,
  type ScheduledTask,
} from '../lib/zonesService'
import {
  createCronJob,
  createZone,
  updateCronJob,
  deleteCronJob,
  deleteScheduledTask,
  type UpdateCronJobInput,
  type CreateCronJobInput,
} from '../lib/cronMutations'
import { apiFetch, API_LOGS_COLLECTION } from '../lib/apiLogger'
import { getDb } from '../lib/firebase'
import { appConfig } from '../lib/appConfig'

function formatTime(ms: number | null): string {
  if (!ms) return '—'
  try {
    return new Date(ms).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(ms)
  }
}

const TASK_STATUS_CLASS: Record<ScheduledTask['status'], string> = {
  pending:
    'text-[var(--color-warn)] bg-[var(--color-warn-soft)] border-[var(--color-warn-border)]',
  fired:
    'text-[var(--color-ok)] bg-[color-mix(in_srgb,var(--color-ok)_12%,transparent)] border-[color-mix(in_srgb,var(--color-ok)_45%,transparent)]',
  error:
    'text-[var(--color-err)] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.45)]',
}

const TASK_STATUS_LABEL: Record<ScheduledTask['status'], string> = {
  pending: 'Chờ trigger',
  fired: 'Đã fire',
  error: 'Lỗi',
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.host + u.pathname + u.search
  } catch {
    return url
  }
}

type FreqPreset = {
  label: string
  cron: string
}

const INTERVAL_PRESETS: FreqPreset[] = [
  { label: 'Mỗi 5 phút', cron: '*/5 * * * *' },
  { label: 'Mỗi 10 phút', cron: '*/10 * * * *' },
  { label: 'Mỗi 1 giờ', cron: '0 * * * *' },
  { label: 'Mỗi 2 giờ', cron: '0 */2 * * *' },
  { label: 'Mỗi 4 giờ', cron: '0 */4 * * *' },
  { label: 'Mỗi 8 giờ', cron: '0 */8 * * *' },
]

const DAILY_HOURS = Array.from({ length: 24 }, (_, h) => h)

function cronForDailyHour(hour: number): string {
  return `0 ${hour} * * *`
}

function nextRunTime(schedule: string, from: Date = new Date()): Date | null {
  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const [minE, hourE, domE, monthE, dowE] = parts

  function matchField(expr: string, value: number): boolean {
    if (expr === '*') return true
    if (expr.startsWith('*/')) {
      const step = parseInt(expr.slice(2), 10)
      if (isNaN(step) || step <= 0) return false
      return value % step === 0
    }
    if (expr.includes(',')) {
      return expr.split(',').some((v) => matchField(v.trim(), value))
    }
    if (expr.includes('-')) {
      const [start, end] = expr.split('-').map((v) => parseInt(v, 10))
      if (isNaN(start) || isNaN(end)) return false
      return value >= start && value <= end
    }
    const n = parseInt(expr, 10)
    if (isNaN(n)) return false
    return n === value
  }

  // Brute-force: check each minute up to 7 days ahead
  const next = new Date(from)
  next.setSeconds(0, 0)
  next.setMinutes(next.getMinutes() + 1)

  for (let i = 0; i < 7 * 24 * 60; i++) {
    if (
      matchField(minE, next.getMinutes()) &&
      matchField(hourE, next.getHours()) &&
      matchField(domE, next.getDate()) &&
      matchField(monthE, next.getMonth() + 1) &&
      matchField(dowE, next.getDay())
    ) {
      return next
    }
    next.setMinutes(next.getMinutes() + 1)
  }
  return null
}

type EditingJob = {
  id: string
  name: string
  schedule: string
  command: string
  httpMethod: string
  enabled: boolean
  description: string
}

function ZoneCard({
  group,
  onEditJob,
  onDeleted,
}: {
  group: ZoneGroup
  onEditJob: (job: CronJob) => void
  onDeleted: () => void
}) {
  const { zone, jobs, tasks } = group
  const total = jobs.length + tasks.length
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleDeleteJob(job: CronJob) {
    const result = await Swal.fire({
      title: 'Xóa cron job?',
      text: `Bạn có chắc muốn xóa "${job.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    setBusyId(job.id)
    try {
      await deleteCronJob(job.id)
      Swal.fire({ title: 'Đã xóa!', icon: 'success', timer: 1500, showConfirmButton: false })
      onDeleted()
    } catch (err) {
      Swal.fire({ title: 'Xóa thất bại', text: err instanceof Error ? err.message : String(err), icon: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteTask(task: ScheduledTask) {
    const result = await Swal.fire({
      title: 'Xóa scheduled task?',
      text: `Bạn có chắc muốn xóa task dot_id="${task.dot_id}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    setBusyId(task.id)
    try {
      await deleteScheduledTask(task.id)
      Swal.fire({ title: 'Đã xóa!', icon: 'success', timer: 1500, showConfirmButton: false })
      onDeleted()
    } catch (err) {
      Swal.fire({ title: 'Xóa thất bại', text: err instanceof Error ? err.message : String(err), icon: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleJob(job: CronJob) {
    setBusyId(job.id)
    try {
      await updateCronJob(job.id, { enabled: !job.enabled })
      onDeleted()
    } catch (err) {
      Swal.fire({ title: 'Cập nhật thất bại', text: err instanceof Error ? err.message : String(err), icon: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRunJob(job: CronJob) {
    if (!job.command) {
      Swal.fire({ title: 'Không thể chạy', text: 'Cron job này không có URL (command).', icon: 'warning' })
      return
    }
    setBusyId(job.id)
    try {
      const res = await apiFetch('/api/run-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-xetmien-key': appConfig.XETMIENKEY,
        },
        body: JSON.stringify({ url: job.command, method: job.httpMethod || 'GET' }),
      })
      const rawText = await res.text()
      let data: {
        ok: boolean
        status: number | null
        statusText: string
        durationMs: number
        body: unknown
        error?: string
      }
      if (rawText) {
        try {
          data = JSON.parse(rawText)
        } catch {
          data = {
            ok: false,
            status: res.status,
            statusText: res.statusText,
            durationMs: 0,
            body: rawText.slice(0, 2000),
            error: 'Proxy trả về non-JSON response',
          }
        }
      } else {
        data = {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText || (res.ok ? 'OK' : 'EMPTY'),
          durationMs: 0,
          body: null,
          error: res.ok ? undefined : 'Proxy trả về response rỗng',
        }
      }
      const ok = data.ok && data.status != null && data.status >= 200 && data.status < 300
      let bodyText = ''
      if (data.body != null) {
        if (typeof data.body === 'string') {
          bodyText = data.body.slice(0, 2000)
        } else {
          try {
            bodyText = JSON.stringify(data.body, null, 2)
          } catch {
            bodyText = String(data.body)
          }
        }
      }
      if (data.error) {
        bodyText = data.error + (bodyText ? '\n\n' + bodyText : '')
      }

      // Ghi log trực tiếp vào Firestore api_logs
      try {
        await addDoc(collection(getDb(), API_LOGS_COLLECTION), {
          method: job.httpMethod || 'GET',
          url: job.command,
          status: data.status,
          statusText: data.statusText,
          ok,
          durationMs: data.durationMs,
          responseBody: data.body ?? null,
          error: data.error ?? null,
          jobName: job.name,
          jobId: job.id,
          createdAt: serverTimestamp(),
          createdAtClient: Date.now(),
        } as never)
      } catch (logErr) {
        console.error('[run-cron] Failed to write log:', logErr)
      }

      Swal.fire({
        title: ok ? 'Chạy thành công!' : 'Cron trả về lỗi',
        html:
          '<div style="text-align:left">' +
          '<p><b>Status:</b> ' + (data.status ?? '—') + ' ' + data.statusText + '</p>' +
          '<p><b>URL:</b> ' + job.command + '</p>' +
          '<p><b>Thời lượng:</b> ' + data.durationMs + ' ms</p>' +
          '<pre style="max-height:300px;overflow:auto;white-space:pre-wrap;word-break:break-all;font-size:12px;text-align:left;margin-top:8px">' +
          bodyText.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</pre></div>',
        icon: ok ? 'success' : 'error',
        width: 600,
        confirmButtonText: 'Đóng',
      })
    } catch (err) {
      Swal.fire({
        title: 'Chạy thất bại',
        text: err instanceof Error ? err.message : String(err),
        icon: 'error',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand)]">
            {zone.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--color-text-h)]">
              {zone.name}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {total} mục · {jobs.length} cron · {tasks.length} scheduled task
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
          zone
        </span>
      </div>

      {total === 0 && (
        <p className="px-5 py-6 text-center text-sm text-[var(--color-text-muted)]">
          Zone chưa có cron job hay scheduled task nào.
        </p>
      )}

      {jobs.length > 0 && (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
          <h3 className="bg-[var(--color-surface-2)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Cron jobs · {jobs.length}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Tên', 'Method', 'Lịch trình', 'Lần chạy tiếp', 'Trạng thái', 'Cập nhật', 'Hành động'].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-b border-[var(--color-border)] px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="px-5 py-3 font-semibold text-[var(--color-text-h)]">
                      {job.name}
                    </td>
                    <td className="px-5 py-3">
                      <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
                        {job.httpMethod || 'GET'}
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">
                        {job.schedule}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {(() => {
                        const next = nextRunTime(job.schedule)
                        return next ? formatTime(next.getTime()) : '—'
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleJob(job)}
                        disabled={busyId === job.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-55 ${
                          job.enabled
                            ? 'text-[var(--color-ok)] bg-[color-mix(in_srgb,var(--color-ok)_12%,transparent)] border-[color-mix(in_srgb,var(--color-ok)_45%,transparent)]'
                            : 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border-[var(--color-border-strong)]'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {job.enabled ? 'Bật' : 'Tắt'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {formatTime(job.updatedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleRunJob(job)}
                        disabled={busyId === job.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand-soft)] px-2.5 py-1.5 text-[var(--color-brand)] transition-colors hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-55"
                      >
                        {busyId === job.id ? 'Đang chạy…' : 'Chạy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditJob(job)}
                        disabled={busyId === job.id}
                        className="rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-h)] disabled:opacity-55"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job)}
                        disabled={busyId === job.id}
                        className="rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1.5 text-[var(--color-err)] transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-55"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="last:border-b-0">
          <h3 className="bg-[var(--color-surface-2)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Scheduled tasks · {tasks.length}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['dot_id', 'Endpoint', 'Trigger lúc', 'Trạng thái', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-b border-[var(--color-border)] px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="px-5 py-3 font-semibold text-[var(--color-text-h)]">
                      {task.dot_id}
                    </td>
                    <td
                      className="max-w-[280px] truncate px-5 py-3 text-[var(--color-text)]"
                      title={task.endpoint}
                    >
                      {shortUrl(task.endpoint)}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {formatTime(task.endday)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TASK_STATUS_CLASS[task.status]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {TASK_STATUS_LABEL[task.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task)}
                        disabled={busyId === task.id}
                        className="rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1.5 text-[var(--color-err)] transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-55"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function EditJobModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: EditingJob
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<EditingJob>(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setForm(editing), [editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.schedule.trim()) {
      setError('Tên và lịch trình là bắt buộc.')
      return
    }
    setSaving(true)
    setError(null)
    const patch: UpdateCronJobInput = {
      name: form.name.trim(),
      schedule: form.schedule.trim(),
      command: form.command.trim() || null,
      httpMethod: form.httpMethod,
      enabled: form.enabled,
      description: form.description.trim() || null,
    }
    try {
      await updateCronJob(form.id, patch)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="presentation"
    >
      <form
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-h)]">
          Sửa cron job
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Tên</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Lịch trình (cron)
            </span>
            <input
              type="text"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="*/15 * * * *"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Command</span>
            <input
              type="text"
              value={form.command}
              onChange={(e) => setForm({ ...form, command: e.target.value })}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">HTTP Method</span>
            <select
              value={form.httpMethod}
              onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Mô tả</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-[var(--color-text)]">Bật</span>
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[var(--color-err)]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-strong)] disabled:opacity-55"
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}

type AddCronForm = {
  name: string
  url: string
  httpMethod: string
  zoneName: string
  mode: 'interval' | 'daily'
  intervalCron: string
  dailyHour: number
  description: string
}

function AddCronModal({
  zones,
  defaultZone,
  onClose,
  onCreated,
}: {
  zones: { id: string; name: string }[]
  defaultZone: string
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<AddCronForm>({
    name: '',
    url: '',
    httpMethod: 'GET',
    zoneName: defaultZone,
    mode: 'interval',
    intervalCron: INTERVAL_PRESETS[0].cron,
    dailyHour: 7,
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schedule =
    form.mode === 'interval'
      ? form.intervalCron
      : cronForDailyHour(form.dailyHour)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Tên cron là bắt buộc.')
      return
    }
    if (!form.url.trim()) {
      setError('URL là bắt buộc.')
      return
    }
    try {
      new URL(form.url.trim())
    } catch {
      setError('URL không hợp lệ.')
      return
    }
    setSaving(true)
    setError(null)
    const input: CreateCronJobInput = {
      name: form.name.trim(),
      schedule,
      command: form.url.trim(),
      httpMethod: form.httpMethod,
      enabled: true,
      description: form.description.trim() || null,
      zoneName: form.zoneName.trim() || defaultZone,
    }
    try {
      await createCronJob(input)
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="presentation"
    >
      <form
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-h)]">
          Thêm cron job
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Tên cron</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Kiểm tra server"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">URL</span>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/api/health"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">HTTP Method</span>
            <select
              value={form.httpMethod}
              onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Zone</span>
            <input
              type="text"
              value={form.zoneName}
              onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
              placeholder="VTTUXETMIEN"
              list="zone-list"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            />
            <datalist id="zone-list">
              {zones.map((z) => (
                <option key={z.id} value={z.name} />
              ))}
            </datalist>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Tần suất chạy</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'interval' })}
                className={
                  'flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ' +
                  (form.mode === 'interval'
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]')
                }
              >
                Theo khoảng
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'daily' })}
                className={
                  'flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ' +
                  (form.mode === 'daily'
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]')
                }
              >
                Mỗi ngày lúc
              </button>
            </div>
          </div>

          {form.mode === 'interval' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Khoảng thời gian</span>
              <select
                value={form.intervalCron}
                onChange={(e) => setForm({ ...form, intervalCron: e.target.value })}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              >
                {INTERVAL_PRESETS.map((p) => (
                  <option key={p.cron} value={p.cron}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Giờ trong ngày</span>
              <select
                value={form.dailyHour}
                onChange={(e) => setForm({ ...form, dailyHour: Number(e.target.value) })}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
              >
                {DAILY_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
            <span className="text-xs text-[var(--color-text-muted)]">Cron expression: </span>
            <code className="font-mono text-[13px] text-[var(--color-text-h)]">{schedule}</code>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Mô tả (tùy chọn)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[var(--color-err)]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-strong)] disabled:opacity-55"
          >
            {saving ? 'Đang tạo…' : 'Tạo cron'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AddZoneModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Tên zone là bắt buộc.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createZone(name.trim())
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="presentation"
    >
      <form
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-h)]">
          Tạo zone
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text)]">Tên zone</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: VTTUXETMIEN"
            className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-h)] outline-none focus:border-[var(--color-brand)]"
            autoFocus
            required
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-[var(--color-err)]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-strong)] disabled:opacity-55"
          >
            {saving ? 'Đang tạo…' : 'Tạo zone'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Dashboard() {
  const [groups, setGroups] = useState<ZoneGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditingJob | null>(null)
  const [showAddCron, setShowAddCron] = useState(false)
  const [showAddZone, setShowAddZone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchZoneGroups()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totalJobs = groups.reduce((s, g) => s + g.jobs.length, 0)
  const totalTasks = groups.reduce((s, g) => s + g.tasks.length, 0)

  function handleEditJob(job: CronJob) {
    setEditing({
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      command: job.command ?? '',
      httpMethod: job.httpMethod ?? 'GET',
      enabled: job.enabled,
      description: job.description ?? '',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-h)]">
            Tổng quan
          </h1>
          <p className="mt-1.5 max-w-prose text-sm text-[var(--color-text-muted)]">
            Quản lý cron theo zone — mỗi zone chứa các cron job (recurring) và
            scheduled task (one-shot) bên trong.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-strong)]"
            onClick={() => setShowAddCron(true)}
          >
            + Thêm cron
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
            onClick={() => setShowAddZone(true)}
          >
            + Tạo zone
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-55"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? 'Đang tải…' : 'Tải lại'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Thống kê">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4.5 shadow-sm">
          <p className="text-[13px] text-[var(--color-text-muted)]">Zones</p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums text-[var(--color-text-h)]">
            {groups.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4.5 shadow-sm">
          <p className="text-[13px] text-[var(--color-text-muted)]">Cron jobs</p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums text-[var(--color-text-h)]">
            {totalJobs}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4.5 shadow-sm">
          <p className="text-[13px] text-[var(--color-text-muted)]">Scheduled tasks</p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums text-[var(--color-text-h)]">
            {totalTasks}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4.5 shadow-sm">
          <p className="text-[13px] text-[var(--color-text-muted)]">Tổng mục</p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums text-[var(--color-text-h)]">
            {totalJobs + totalTasks}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-warn-border)] bg-[var(--color-warn-soft)] px-5 py-4 text-sm text-[var(--color-warn)]">
          Lỗi đọc dữ liệu: {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading && groups.length === 0 && (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Đang tải zones…
          </p>
        )}

        {!loading && groups.length === 0 && !error && (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Chưa có zone nào. Gọi <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">/add-cron</code> hoặc <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[13px] text-[var(--color-text-h)]">/add-scheduled-task</code> để tạo.
          </p>
        )}

        {groups.map((group) => (
          <ZoneCard
            key={group.zone.id}
            group={group}
            onEditJob={handleEditJob}
            onDeleted={() => void load()}
          />
        ))}
      </div>

      {editing && editing.id && (
        <EditJobModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}

      {showAddCron && (
        <AddCronModal
          zones={groups.map((g) => ({ id: g.zone.id, name: g.zone.name }))}
          defaultZone="VTTUXETMIEN"
          onClose={() => setShowAddCron(false)}
          onCreated={() => void load()}
        />
      )}

      {showAddZone && (
        <AddZoneModal
          onClose={() => setShowAddZone(false)}
          onCreated={() => void load()}
        />
      )}
    </div>
  )
}
