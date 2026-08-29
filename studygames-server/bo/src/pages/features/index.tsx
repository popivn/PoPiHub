import { useState } from 'react';
import { useFeatures } from './features';
import Loading from '../../components/Loading';
import FeatureFormModal from './FeatureFormModal';

interface FeaturesProps {
  token: string;
}

export default function Features({ token }: FeaturesProps) {
  const { features, loading, error, editing, form, setForm, startAdd, startEdit, save, remove, uploading, uploadImage } = useFeatures(token);
  const [open, setOpen] = useState(false);

  const openAdd = () => {
    startAdd();
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const f = features.find((x) => x.id === id);
    if (!f) return;
    startEdit(f);
    setOpen(true);
  };

  const handleSave = async () => {
    await save();
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    startAdd();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Quản lý tính năng</h1>
          <p className="text-xs text-slate-500 mt-0.5">{features.length} tính năng</p>
        </div>
        <button
          onClick={openAdd}
          className="h-9 px-3 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold"
        >
          + Thêm tính năng
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <FeatureFormModal
        open={open}
        editing={editing}
        form={form}
        setForm={setForm}
        uploading={uploading}
        uploadImage={uploadImage}
        onSave={handleSave}
        onClose={handleClose}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs text-slate-500 font-medium uppercase">
              <th className="text-left px-3 h-9 font-medium">Tên</th>
              <th className="text-left px-3 h-9 font-medium">Banner</th>
              <th className="text-left px-3 h-9 font-medium">URL</th>
              <th className="text-center px-3 h-9 font-medium">Thứ tự</th>
              <th className="text-left px-3 h-9 font-medium">Trạng thái</th>
              <th className="text-right px-3 h-9 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.id} className="border-b border-slate-800/60 last:border-0 h-11">
                <td className="px-3 text-slate-200 font-medium">
                  {f.title}
                  {f.titleEn && <span className="block text-xs text-slate-500">{f.titleEn}</span>}
                </td>
                <td className="px-3">
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.title}
                      className="h-8 w-16 object-cover rounded border border-slate-700"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallback) return;
                        img.dataset.fallback = '1';
                        img.src = `${import.meta.env.BASE_URL}slime/fallback/banner.png`;
                      }}
                    />
                  ) : (
                    <span className="text-slate-600 text-xs mono">{f.icon}</span>
                  )}
                </td>
                <td className="px-3 text-slate-500 text-xs mono">{f.url}</td>
                <td className="px-3 text-center text-slate-400 text-xs tabular-nums">{f.order}</td>
                <td className="px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      f.active ? 'bg-teal-500/15 text-teal-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {f.active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td className="px-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => openEdit(f.id)}
                      className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => remove(f.id)}
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
        {!loading && features.length === 0 && <p className="p-3 text-xs text-slate-500">Chưa có tính năng.</p>}
      </div>
    </div>
  );
}
