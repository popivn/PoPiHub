export function DashboardPanel() {
  return (
    <div className="block" id="panel-dashboard">
      <div className="w-full bg-kh-surface border border-kh-border rounded-2xl p-5 mb-5">
        <h2 className="text-base font-semibold text-kh-accent mb-3">Endpoints</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left py-2.5 px-3 border-b border-white/5 text-kh-text-dim font-medium">Name</th>
              <th className="text-left py-2.5 px-3 border-b border-white/5 text-kh-text-dim font-medium">Method</th>
              <th className="text-left py-2.5 px-3 border-b border-white/5 text-kh-text-dim font-medium">Path</th>
              <th className="text-left py-2.5 px-3 border-b border-white/5 text-kh-text-dim font-medium">Mô tả</th>
            </tr>
          </thead>
          <tbody id="routes-body">
            <tr><td colSpan={4} className="text-kh-muted italic py-4 text-center">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
