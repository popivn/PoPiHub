import { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '../firebase';
import { SecurityTrustChecker } from '../components/SecurityTrustChecker';

interface SubmissionRecord {
  docId: string;
  zalo: string;
  ingame: string;
  guestId: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
  riskScore: number;
  riskLevel: string;
  userAgent: string;
  timestamp: string;
  isDeleted: boolean;
}

export function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'active' | 'trash'>('active');
  
  // Modal soi chi tiết từng Guest
  const [inspectingGuest, setInspectingGuest] = useState<SubmissionRecord | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: SubmissionRecord[] = [];

      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let timeStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Mới tạo';
        items.push({
          docId: docSnap.id,
          zalo: data.zalo || '-',
          ingame: data.ingame || '-',
          guestId: data.guestId || 'Chưa định danh',
          ip: data.ip || '127.0.0.1',
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
          lat: data.lat || 0,
          lon: data.lon || 0,
          riskScore: data.riskScore ?? 80,
          riskLevel: data.riskLevel || 'An toàn',
          userAgent: data.userAgent || 'N/A',
          timestamp: timeStr,
          isDeleted: !!data.isDeleted,
        });
      });

      setSubmissions(items);
    } catch (err) {
      console.error('Lỗi khi đọc dữ liệu Admin Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Soft delete (Chuyển vào thùng rác)
  const handleSoftDelete = async (docId: string) => {
    if (!window.confirm('Chuyển bản ghi này vào thùng rác?')) return;
    setActionId(docId);
    try {
      const docRef = doc(db, 'submissions', docId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Lỗi khi xóa tạm:', err);
    } finally {
      setActionId(null);
    }
  };

  // Restore (Khôi phục bản ghi từ thùng rác)
  const handleRestore = async (docId: string) => {
    setActionId(docId);
    try {
      const docRef = doc(db, 'submissions', docId);
      await updateDoc(docRef, {
        isDeleted: false,
        restoredAt: serverTimestamp(),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Lỗi khi khôi phục:', err);
    } finally {
      setActionId(null);
    }
  };

  // Hard delete (Xóa vĩnh viễn khỏi DB)
  const handleHardDelete = async (docId: string) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN bản ghi này khỏi Firestore? Không thể khôi phục lại!')) return;
    setActionId(docId);
    try {
      await deleteDoc(doc(db, 'submissions', docId));
      fetchAdminData();
    } catch (err) {
      console.error('Lỗi khi xóa vĩnh viễn:', err);
    } finally {
      setActionId(null);
    }
  };

  const activeSubmissions = submissions.filter((s) => !s.isDeleted);
  const deletedSubmissions = submissions.filter((s) => s.isDeleted);

  const uniqueIps = new Set(activeSubmissions.map((s) => s.ip)).size;
  const uniqueGuests = new Set(activeSubmissions.map((s) => s.guestId)).size;
  const highRiskCount = activeSubmissions.filter((s) => s.riskScore < 50 || s.riskLevel.includes('Rủi ro')).length;

  const currentList = viewTab === 'active' ? activeSubmissions : deletedSubmissions;

  const filtered = currentList.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.zalo.toLowerCase().includes(q) ||
      s.ingame.toLowerCase().includes(q) ||
      s.ip.toLowerCase().includes(q) ||
      s.guestId.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-3 sm:p-6 space-y-4 font-sans relative">
      {/* Top Header Secret Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-500/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h1 className="text-base sm:text-xl font-black tracking-wider text-rose-400 uppercase">
              SECRET DASHBOARD MONITORING & RISK ANALYSIS
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            URL: /topsecret/134679002/dashboard &bull; Quyền Quản Trị Hệ Thống NKS5
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          title="Làm mới dữ liệu"
          className="w-9 h-9 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl flex items-center justify-center cursor-pointer transition-all"
        >
          <i className="fa-solid fa-arrows-rotate text-sm"></i>
        </button>
      </div>

      {/* Widget Checker An Ninh */}
      <SecurityTrustChecker />

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold block">TỔNG BẢN GHI KÍCH HOẠT</span>
          <span className="text-xl font-black text-amber-400 font-mono">{activeSubmissions.length}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold block">SỐ IP ĐỘC NHẤT</span>
          <span className="text-xl font-black text-sky-400 font-mono">{uniqueIps}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold block">SỐ GUEST / THIẾT BỊ</span>
          <span className="text-xl font-black text-emerald-400 font-mono">{uniqueGuests}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold block">CẢNH BÁO RỦI RO (HIGH RISK)</span>
          <span className="text-xl font-black text-orange-400 font-mono">{highRiskCount}</span>
        </div>
      </div>

      {/* Modal Soi Chi Tiết Guest & Vị trí Bản Đồ Google Maps */}
      {inspectingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-sky-500/50 rounded-2xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-sky-400 flex items-center gap-2">
                <i className="fa-solid fa-earth-americas text-sky-400 text-lg"></i>
                <span>Chi Tiết Guest ID & Tín Hiệu Vị Trí Bản Đồ</span>
              </h3>
              <button
                onClick={() => setInspectingGuest(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer transition-all"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Grid 2 Cột: Thông Tin Chi Tiết & Google Maps */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Cột Trái: Các Tín Hiệu Định Danh */}
              <div className="md:col-span-6 space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Thành viên Submit:</span>
                  <span className="font-bold text-amber-300 text-sm">{inspectingGuest.zalo} ({inspectingGuest.ingame})</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Mã Guest ID:</span>
                  <span className="font-mono font-bold text-amber-300 text-[11px] truncate max-w-[160px]">{inspectingGuest.guestId}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Địa chỉ IP:</span>
                  <span className="font-mono font-bold text-sky-400 text-xs">{inspectingGuest.ip}</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Vị trí địa lý từ IP / GPS:</span>
                  <span className="font-bold text-emerald-300 text-xs block">
                    {inspectingGuest.city ? `${inspectingGuest.city}, ${inspectingGuest.region}, ${inspectingGuest.country}` : 'Việt Nam (Ước tính từ IP)'}
                  </span>
                  {inspectingGuest.lat !== 0 && inspectingGuest.lon !== 0 && (
                    <span className="font-mono text-[10px] text-slate-400 block">
                      Tọa độ: {inspectingGuest.lat}, {inspectingGuest.lon}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Điểm độ tin cậy:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    inspectingGuest.riskScore >= 70 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {inspectingGuest.riskScore}/100 - {inspectingGuest.riskLevel}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">User-Agent (Trình duyệt):</span>
                  <span className="font-mono text-[10px] text-slate-300 block break-all leading-tight max-h-16 overflow-y-auto">{inspectingGuest.userAgent}</span>
                </div>
              </div>

              {/* Cột Phải: Bản Đồ Google Maps Trực Quan */}
              <div className="md:col-span-6 flex flex-col space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-map-location-dot text-amber-400"></i>
                  <span>Vị Trí Bản Đồ (Google Maps View)</span>
                </span>

                <div className="w-full h-64 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 relative">
                  {inspectingGuest.lat && inspectingGuest.lon ? (
                    <iframe
                      title="Google Maps Location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${inspectingGuest.lat},${inspectingGuest.lon}&z=12&output=embed`}
                    ></iframe>
                  ) : inspectingGuest.city ? (
                    <iframe
                      title="Google Maps Location Search"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(inspectingGuest.city + ', Vietnam')}&z=11&output=embed`}
                    ></iframe>
                  ) : (
                    <iframe
                      title="Google Maps Vietnam Focus"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src="https://maps.google.com/maps?q=Vietnam&z=6&output=embed"
                    ></iframe>
                  )}
                </div>

                <div className="text-right">
                  <a
                    href={
                      inspectingGuest.lat && inspectingGuest.lon
                        ? `https://www.google.com/maps/search/?api=1&query=${inspectingGuest.lat},${inspectingGuest.lon}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inspectingGuest.ip)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:underline font-bold flex items-center justify-end gap-1"
                  >
                    <span>Mở trên Google Maps tab mới</span>
                    <i className="fa-solid fa-up-right-from-square text-[10px]"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectingGuest(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer transition-all"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table analysis */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800">
          {/* Tabs: Danh Sách Hoạt Động vs Thùng Rác */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all ${
                viewTab === 'active'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Danh Sách Hoạt Động ({activeSubmissions.length})</span>
            </button>

            <button
              onClick={() => setViewTab('trash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all ${
                viewTab === 'trash'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Thùng Rác ({deletedSubmissions.length})</span>
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lọc theo IP, Guest ID, Zalo, InGame..."
            className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-rose-500"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5">Thời Gian</th>
                <th className="p-2.5">Tên Zalo</th>
                <th className="p-2.5">Tên InGame</th>
                <th className="p-2.5">Địa Chỉ IP</th>
                <th className="p-2.5">Vị Trí Địa Lý</th>
                <th className="p-2.5">Guest ID</th>
                <th className="p-2.5 text-center">Risk Score</th>
                <th className="p-2.5 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Đang quét dữ liệu từ Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {viewTab === 'trash' ? 'Thùng rác trống.' : 'Chưa có bản ghi dữ liệu nào.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.docId} className="hover:bg-rose-500/10 transition-colors">
                    <td className="p-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="p-2.5 font-bold text-sky-300 whitespace-nowrap">
                      {item.zalo}
                    </td>
                    <td className="p-2.5 font-extrabold text-emerald-400 whitespace-nowrap">
                      {item.ingame}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {item.ip}
                    </td>
                    <td className="p-2.5 font-semibold text-emerald-300 text-[10px] whitespace-nowrap">
                      {item.city ? `${item.city}, ${item.country}` : 'Việt Nam'}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={item.guestId}>
                      {item.guestId}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        item.riskScore >= 70 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : item.riskScore >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {item.riskScore}/100
                      </span>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setInspectingGuest(item)}
                          title="Xem bản đồ vị trí & thông tin chi tiết Guest"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-map-location-dot text-xs"></i>
                        </button>

                        {viewTab === 'active' ? (
                          <button
                            onClick={() => handleSoftDelete(item.docId)}
                            disabled={actionId === item.docId}
                            title="Xóa tạm (Chuyển vào thùng rác)"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(item.docId)}
                              disabled={actionId === item.docId}
                              title="Khôi phục bản ghi"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <i className="fa-solid fa-rotate-left text-xs"></i>
                            </button>

                            <button
                              onClick={() => handleHardDelete(item.docId)}
                              disabled={actionId === item.docId}
                              title="Xóa vĩnh viễn khỏi Database"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white border border-rose-400 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
