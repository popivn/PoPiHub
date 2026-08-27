import { type FormEvent } from 'react';
import { useTopics } from './topics';
import Loading from '../../components/Loading';

interface TopicsProps {
  token: string;
}

export default function Topics({ token }: TopicsProps) {
  const { topics, loading, error, editing, form, setForm, startAdd, startEdit, save, remove } = useTopics(token);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void save();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Quản lý chủ đề</h1>
        <p className="text-xs text-slate-500 mt-0.5">{topics.length} chủ đề</p>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-3">
        <div className="grid md:grid-cols-4 gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Tên chủ đề</label>
            <input
              type="text"
              placeholder="Tên chủ đề"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Tên tiếng Anh</label>
            <input
              type="text"
              placeholder="Tên tiếng Anh"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <label className="flex items-center gap-2 h-9 text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-teal-500"
            />
            Hoạt động
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-9 px-3 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold"
            >
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={startAdd}
                className="h-9 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium"
              >
                Huỷ
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase">
              <th className="text-left px-3 h-9 font-medium">Tên</th>
              <th className="text-left px-3 h-9 font-medium">Tên EN</th>
              <th className="text-left px-3 h-9 font-medium">Trạng thái</th>
              <th className="text-right px-3 h-9 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id} className="border-b border-slate-800/60 last:border-0 h-11">
                <td className="px-3 text-slate-200 font-medium">{t.name}</td>
                <td className="px-3 text-slate-500 text-xs">{t.nameEn || '—'}</td>
                <td className="px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      t.active ? 'bg-teal-500/15 text-teal-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td className="px-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => startEdit(t)}
                      className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="h-7 px-2 rounded bg-rose-500/15 hover:bg-rose-500/25 text-xs font-medium text-rose-400"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <Loading size="sm" label="Đang tải…" />}
        {!loading && topics.length === 0 && <p className="p-3 text-xs text-slate-500">Chưa có chủ đề.</p>}
      </div>
    </div>
  );
}
