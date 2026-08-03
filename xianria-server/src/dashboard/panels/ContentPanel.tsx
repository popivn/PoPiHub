export function ContentPanel() {
  return (
    <div className="hidden" id="panel-content">
      <div className="w-full bg-kh-surface border border-kh-border rounded-2xl p-5 mb-5">
        <h2 className="text-base font-semibold text-kh-accent mb-4">Upload Banner Game</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            id="banner-title"
            placeholder="Tiêu đề banner"
            className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-kh-text text-sm outline-none focus:border-kh-accent"
          />
          <input
            type="file"
            id="banner-file"
            accept="image/*"
            className="w-full text-sm text-kh-text-dim file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-kh-accent/15 file:text-kh-accent file:cursor-pointer"
          />
          <button
            id="banner-upload-btn"
            className="self-start px-5 py-2.5 rounded-lg bg-kh-accent text-kh-bg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
          >
            Upload
          </button>
        </div>
      </div>

      <div className="w-full bg-kh-surface border border-kh-border rounded-2xl p-5">
        <h2 className="text-base font-semibold text-kh-accent mb-4">Danh sách banner</h2>
        <div id="banner-list" className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          <div className="text-kh-muted italic text-sm">Đang tải...</div>
        </div>
      </div>
    </div>
  );
}
