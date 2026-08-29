import { useEffect, type FormEvent } from 'react';
import type { Feature, FeatureForm } from './features';
import Loading from '../../components/Loading';

interface FeatureFormModalProps {
  open: boolean;
  editing: Feature | null;
  form: FeatureForm;
  setForm: (f: FeatureForm) => void;
  uploading: boolean;
  uploadImage: (file: File) => Promise<string | null>;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export default function FeatureFormModal({
  open,
  editing,
  form,
  setForm,
  uploading,
  uploadImage,
  onSave,
  onClose,
}: FeatureFormModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSave();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      setForm({ ...form, image: url });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-md shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">
            {editing ? 'Sửa tính năng' : 'Thêm tính năng'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Tên (VI)</label>
              <input
                type="text"
                placeholder="Tên tính năng"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Tên (EN)</label>
              <input
                type="text"
                placeholder="Name (EN)"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Ảnh banner (upload)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                disabled={uploading}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-teal-500 file:text-slate-950 file:font-semibold file:cursor-pointer hover:file:bg-teal-400 disabled:opacity-50"
              />
              {uploading && <Loading size="sm" variant="inline" label="Đang upload…" />}
            </div>
            {form.image && (
              <div className="mt-2">
                <img
                  src={form.image}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border border-slate-700"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallback) return;
                    img.dataset.fallback = '1';
                    img.src = `${import.meta.env.BASE_URL}slime/fallback/banner.png`;
                  }}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="mt-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  Xoá ảnh
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">URL</label>
            <input
              type="text"
              placeholder="/learn/chinese"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500 mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Mô tả (VI)</label>
            <textarea
              placeholder="Mô tả tính năng"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-teal-500 min-h-[60px]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Mô tả (EN)</label>
            <textarea
              placeholder="Description (EN)"
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-teal-500 min-h-[60px]"
            />
          </div>

          <details className="group rounded-md border border-slate-800 bg-slate-950/40">
            <summary className="cursor-pointer select-none px-3 h-10 flex items-center text-sm text-slate-300 font-medium list-none">
              <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
              Nâng cao
            </summary>
            <div className="p-3 pt-2 space-y-2">
              <div className="grid md:grid-cols-3 gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Màu from</label>
                  <input
                    type="color"
                    value={form.colorFrom}
                    onChange={(e) => setForm({ ...form, colorFrom: e.target.value })}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-2 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Màu to</label>
                  <input
                    type="color"
                    value={form.colorTo}
                    onChange={(e) => setForm({ ...form, colorTo: e.target.value })}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-2 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Thứ tự</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-teal-500"
                />
                Hoạt động
              </label>
            </div>
          </details>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="h-9 px-3 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold"
            >
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
