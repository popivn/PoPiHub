import { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from '../firebase';
import { getDeviceFingerprint } from '../components/SecurityTrustChecker';

export interface SubmissionItem {
  docId: string;
  id: number;
  timestamp?: string;
  zalo?: string;
  ingame?: string;
  guestId?: string;
  ip?: string;
  riskScore?: number;
  riskLevel?: string;
  userAgent?: string;
  city?: string;
  region?: string;
  country?: string;
}

export function HomePage() {
  const [zalo, setZalo] = useState('');
  const [ingame, setInGame] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Modal Chi Tiết Guest / Device
  const [viewingGuest, setViewingGuest] = useState<SubmissionItem | null>(null);

  // Modal Sửa state
  const [editingItem, setEditingItem] = useState<SubmissionItem | null>(null);
  const [editZalo, setEditZalo] = useState('');
  const [editInGame, setEditInGame] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const showToast = (message: string, isSuccess: boolean) => {
    setToast({ message, isSuccess });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: SubmissionItem[] = [];
      
      const activeDocs = querySnapshot.docs.filter((docSnap: any) => !docSnap.data().isDeleted);
      const total = activeDocs.length;

      activeDocs.forEach((docSnap: any, idx: number) => {
        const data = docSnap.data();
        let timeStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('vi-VN') : '';
        items.push({
          docId: docSnap.id,
          id: total - idx,
          timestamp: timeStr,
          zalo: data.zalo || '',
          ingame: data.ingame || '',
          guestId: data.guestId || 'Chưa định danh',
          ip: data.ip || 'N/A',
          riskScore: data.riskScore ?? 80,
          riskLevel: data.riskLevel || 'An toàn',
          userAgent: data.userAgent || '',
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
        });
      });

      setSubmissions(items);
    } catch (err) {
      console.error('Lỗi khi tải danh sách từ Firebase:', err);
      showToast('Lỗi khi kết nối Firebase Firestore!', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zalo.trim() || !ingame.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin Zalo và InGame!', false);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Quét Fingerprint tín hiệu Guest thiết bị
      const fp = await getDeviceFingerprint();
      const guestId = localStorage.getItem('__nks5_fp') || 'guest_unknown';

      // 2. Lưu thông tin thành viên + Tín hiệu bảo mật Guest vào Database Firebase
      await addDoc(collection(db, 'submissions'), {
        zalo: zalo.trim(),
        ingame: ingame.trim(),
        createdAt: serverTimestamp(),
        guestId,
        ip: fp.ip,
        city: fp.city || '',
        region: fp.region || '',
        country: fp.country || '',
        lat: fp.lat || 0,
        lon: fp.lon || 0,
        gps: fp.gps || null,
        riskScore: fp.riskScore,
        riskLevel: fp.riskLevel,
        userAgent: fp.userAgent,
        timezone: fp.timezone,
        isDeleted: false,
      });

      showToast('Lưu thông tin thành công!', true);
      setZalo('');
      setInGame('');
      await fetchSubmissions();
    } catch (err) {
      console.error('Lỗi thêm:', err);
      showToast('Lỗi máy chủ khi lưu thông tin!', false);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: SubmissionItem) => {
    setEditingItem(item);
    setEditZalo(item.zalo || '');
    setEditInGame(item.ingame || '');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditZalo('');
    setEditInGame('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editZalo.trim() || !editInGame.trim()) {
      showToast('Vui lòng nhập đầy đủ Zalo và InGame!', false);
      return;
    }

    setUpdating(true);
    try {
      const docRef = doc(db, 'submissions', editingItem.docId);
      await updateDoc(docRef, {
        zalo: editZalo.trim(),
        ingame: editInGame.trim(),
      });
      showToast('Cập nhật thành công!', true);
      cancelEdit();
      fetchSubmissions();
    } catch (err) {
      console.error('Lỗi sửa:', err);
      showToast('Lỗi khi cập nhật dữ liệu!', false);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (item: SubmissionItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên #${item.id} (${item.ingame || item.zalo})?`)) {
      return;
    }

    setDeletingDocId(item.docId);
    try {
      const docRef = doc(db, 'submissions', item.docId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      showToast('Xóa thành công!', true);
      fetchSubmissions();
    } catch (err) {
      console.error('Lỗi xóa:', err);
      showToast('Lỗi khi xóa dữ liệu!', false);
    } finally {
      setDeletingDocId(null);
    }
  };

  const filteredSubmissions = submissions.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.zalo && item.zalo.toLowerCase().includes(q)) ||
      (item.ingame && item.ingame.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-start selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Background Lighting */}
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-red-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="Logo Server Ngọc Kinh S5"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-amber-400/40 shadow-md shadow-orange-500/30 shrink-0 cursor-pointer"
              onClick={() => {
                window.history.pushState({}, '', '/guild');
                window.dispatchEvent(new Event('popstate'));
              }}
            />
            <div 
              className="min-w-0 cursor-pointer" 
              onClick={() => {
                window.history.pushState({}, '', '/guild');
                window.dispatchEvent(new Event('popstate'));
              }}
            >
              <h1 className="text-xs sm:text-base font-black tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent truncate">
                SERVER NGỌC KINH S5
              </h1>
              <p className="text-[9px] sm:text-[11px] text-amber-400/80 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Ta Làm Tông Sư
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Nút Home (Mạng Xã Hội) */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/social');
                window.dispatchEvent(new Event('popstate'));
              }}
              title="Mạng Xã Hội (Feature Pending)"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700/80 hover:border-amber-500/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden xs:inline">Home</span>
            </button>

            {/* Nút Khiên (Quay về Guild / Danh sách Bang Hội) */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/guild');
                window.dispatchEvent(new Event('popstate'));
              }}
              title="Danh Sách Bang Hội"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden xs:inline">Bang Hội</span>
            </button>

            {/* Nút Thêm Thành Viên */}
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              title={isFormOpen ? 'Đóng khung nhập' : 'Thêm thành viên mới'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                isFormOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-amber-400 border-slate-700/80'
              }`}
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Global Toast Notification */}
      {toast && (
        <div className="fixed top-14 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border shadow-2xl backdrop-blur-xl flex items-center gap-2 ${
              toast.isSuccess
                ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20'
                : 'bg-slate-900/95 border-rose-500/60 text-rose-300 shadow-rose-500/20'
            }`}
          >
            {toast.isSuccess ? (
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="max-w-7xl w-full mx-auto px-2.5 sm:px-4 pt-3 pb-6 space-y-3 z-10">
        {/* Collapsible Form Section */}
        <div className="w-full">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-900 hover:bg-slate-800/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                    <span>Thêm Thành Viên Mới</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-medium px-1.5 py-0.2 rounded shrink-0">
                      {isFormOpen ? 'Mở' : 'Chạm để nhập'}
                    </span>
                  </h2>
                </div>
              </div>

              <div className={`p-1 rounded-full bg-slate-800 text-slate-300 transition-transform duration-300 shrink-0 ${isFormOpen ? 'rotate-180 bg-amber-500/20 text-amber-400' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isFormOpen && (
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label htmlFor="zalo" className="block text-[11px] font-semibold text-slate-300 mb-1">
                      1. Tên / Số Zalo <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="zalo"
                      value={zalo}
                      onChange={(e) => setZalo(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A (0987...)"
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label htmlFor="ingame" className="block text-[11px] font-semibold text-slate-300 mb-1">
                      2. Tên InGame (Nhân vật) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="ingame"
                      value={ingame}
                      onChange={(e) => setInGame(e.target.value)}
                      placeholder="Ví dụ: TôngSưBáVương"
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>{submitting ? 'Lưu...' : 'Lưu Ngay'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Modal Form Edit */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Chỉnh Sửa Thành Viên #{editingItem.id}</span>
                </h3>
                <button
                  onClick={cancelEdit}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tên / Số Zalo</label>
                  <input
                    type="text"
                    value={editZalo}
                    onChange={(e) => setEditZalo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tên InGame</label>
                  <input
                    type="text"
                    value={editInGame}
                    onChange={(e) => setEditInGame(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Đang lưu...' : 'Cập Nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xem Thông Tin Thiết Bị / Guest */}
        {viewingGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-sky-500/40 rounded-xl p-4 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Chi Tiết Guest & Bảo Mật #{viewingGuest.id}</span>
                </h3>
                <button
                  onClick={() => setViewingGuest(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Guest ID:</span>
                  <span className="font-mono font-bold text-amber-300">{viewingGuest.guestId}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Địa chỉ IP:</span>
                  <span className="font-mono font-bold text-sky-400">{viewingGuest.ip}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Điểm độ tin cậy:</span>
                  <span className="font-bold text-emerald-400">{viewingGuest.riskScore}/100 ({viewingGuest.riskLevel})</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">User-Agent:</span>
                  <span className="font-mono text-[10px] text-slate-300 block break-all">{viewingGuest.userAgent || 'Không ghi nhận'}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Thời gian Submit:</span>
                  <span className="font-mono text-slate-300">{viewingGuest.timestamp}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingGuest(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ultra-Compact Table */}
        <div className="w-full">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-xl p-2.5 sm:p-4 shadow-xl">
            
            {/* Header Controls */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80">
              <h2 className="text-xs sm:text-base font-extrabold text-white flex items-center gap-1.5 truncate">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Thành Viên ({submissions.length})</span>
              </h2>

              <div className="flex items-center space-x-1.5 min-w-0">
                <div className="relative min-w-[130px] sm:min-w-[220px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-amber-500 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-100 placeholder-slate-500 outline-none"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <button
                  onClick={fetchSubmissions}
                  title="Làm mới"
                  className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 cursor-pointer border border-slate-700/60"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-center text-amber-400 whitespace-nowrap w-10 sm:w-14">STT</th>
                    <th className="px-2 sm:px-3 py-2 text-sky-400 whitespace-nowrap">Tên Zalo</th>
                    <th className="px-2 sm:px-3 py-2 text-emerald-400 whitespace-nowrap">Tên InGame</th>
                    <th className="px-2 sm:px-3 py-2 text-slate-400 text-right whitespace-nowrap hidden sm:table-cell">Thời Gian</th>
                    <th className="px-2 sm:px-3 py-2 text-center text-amber-300 whitespace-nowrap w-20">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Đang tải danh sách...
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        {search ? 'Không tìm thấy.' : 'Chưa có dữ liệu.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((item) => (
                      <tr key={item.docId} className="hover:bg-amber-500/10 transition-colors">
                        <td className="px-2 sm:px-3 py-2 text-center font-mono font-bold text-amber-400 bg-slate-950/40 whitespace-nowrap">
                          #{item.id}
                        </td>
                        <td className="px-2 sm:px-3 py-2 font-bold text-sky-300 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{item.zalo}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 font-extrabold text-emerald-400 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{item.ingame || '-'}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap hidden sm:table-cell">
                          {item.timestamp || '-'}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => startEdit(item)}
                              title="Sửa thông tin"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>

                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingDocId === item.docId}
                              title="Xóa thông tin"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-right text-[10px] text-slate-500">
              Tổng số: <span className="text-amber-400 font-bold">{filteredSubmissions.length}</span> thành viên
            </div>
          </div>
        </div>

        {/* Player Region Distribution Chart */}
        <PlayerRegionChart submissions={submissions} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-2 text-center text-[10px] text-slate-500">
        Server Ngọc Kinh S5 &bull; Game Ta Làm Tông Sư
      </footer>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Component: Biểu đồ phân bổ khu vực người chơi
// ──────────────────────────────────────────────────────────
interface RegionEntry { label: string; count: number; color: string; }

const REGION_COLORS = [
  '#f59e0b', '#fb923c', '#ef4444', '#a78bfa', '#38bdf8',
  '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#4ade80',
];

function PlayerRegionChart({ submissions }: { submissions: SubmissionItem[] }) {
  // Tổng hợp theo city → region → country → fallback
  // Dữ liệu cũ có thể thiếu city/region/country — thử đọc thêm từ ip
  const regionMap: Record<string, number> = {};
  submissions.forEach((s) => {
    const city = s.city?.trim();
    const region = s.region?.trim();
    const country = s.country?.trim();
    // Ưu tiên: thành phố → tỉnh → quốc gia → "Việt Nam" nếu ip có → "Chưa xác định"
    const label =
      city ||
      region ||
      country ||
      (s.ip && s.ip !== 'N/A' ? 'Việt Nam' : 'Chưa xác định');
    regionMap[label] = (regionMap[label] || 0) + 1;
  });

  const total = submissions.length;

  if (total === 0) return null;

  // Sắp xếp giảm dần, lấy top 8, gom phần còn lại vào "Khác"
  const sorted = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 8);
  const others = sorted.slice(8).reduce((acc, [, v]) => acc + v, 0);
  if (others > 0) top.push(['Khác', others]);

  const entries: RegionEntry[] = top.map(([label, count], i) => ({
    label,
    count,
    color: REGION_COLORS[i % REGION_COLORS.length],
  }));

  const maxCount = Math.max(...entries.map((e) => e.count));

  // ── Donut SVG ──
  const cx = 80; const cy = 80; const r = 60; const strokeW = 22;
  let cumulPct = 0;
  const circumference = 2 * Math.PI * r;

  const donutSegments = entries.map((e) => {
    const pct = e.count / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = circumference - cumulPct * circumference;
    cumulPct += pct;
    return { ...e, dash, gap, offset, pct };
  });

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-xl p-3 sm:p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-white">
            Phân Bổ Khu Vực Người Chơi
          </h2>
          <p className="text-[10px] text-slate-400">
            Tổng {total} thành viên · {entries.length} khu vực
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start">

        {/* ── Donut Chart ── */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-xl">
            {/* bg track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeW} />

            {donutSegments.map((seg, i) => (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeW}
                strokeDasharray={`${seg.dash - 1.5} ${seg.gap + 1.5}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 6px ${seg.color}55)` }}
              />
            ))}

            {/* Center label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#f1f5f9" fontSize="22" fontWeight="800">
              {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="9">
              THÀNH VIÊN
            </text>
          </svg>

          {/* Legend pills */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px]">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px] text-slate-300">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="truncate max-w-[70px]">{e.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Horizontal Bar Chart ── */}
        <div className="flex-1 w-full space-y-2.5">
          {entries.map((e, i) => {
            const barPct = (e.count / maxCount) * 100;
            const pctOfTotal = ((e.count / total) * 100).toFixed(1);
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[200px]">
                      {e.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold" style={{ color: e.color }}>
                      {e.count} người
                    </span>
                    <span className="text-[9px] text-slate-500 w-9 text-right">
                      {pctOfTotal}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barPct}%`,
                      background: `linear-gradient(90deg, ${e.color}cc, ${e.color})`,
                      boxShadow: `0 0 8px ${e.color}66`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Summary badges */}
          <div className="pt-2 flex flex-wrap gap-2">
            {entries.slice(0, 3).map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold"
                style={{
                  borderColor: `${e.color}50`,
                  backgroundColor: `${e.color}15`,
                  color: e.color,
                }}
              >
                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span>{e.label}</span>
                <span className="text-slate-400 font-normal">· {e.count}</span>
              </div>
            ))}
          </div>

          {/* Note about legacy data */}
          {submissions.some((s) => !s.city && !s.region && !s.country) && (
            <p className="mt-2 text-[9px] text-slate-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Một số thành viên đăng ký sớm chưa có dữ liệu khu vực chi tiết.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
