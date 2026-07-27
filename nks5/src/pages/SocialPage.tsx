import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Shield, 
  Heart, 
  Send, 
  MessageSquare, 
  ScrollText, 
  Zap, 
  RefreshCw
} from 'lucide-react';
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
import { 
  getStoredIdentity, 
  UserIdentity 
} from '../utils/identityJWT';
import IdentityModal, { CULTIVATION_CLASSES } from '../components/IdentityModal';

export interface SocialPost {
  docId: string;
  authorName: string;
  authorSub: string;
  authorAvatarId: number;
  jwtToken: string;
  content: string;
  likes: number;
  likedBy: string[]; // Danh sách sub sư tôn đã thích
  createdAt?: string;
  createdAtRaw?: any;
}

export function SocialPage() {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);

  // Form bài viết
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Tự động đọc JWT Token đã lưu hoặc tạo mới timestamp JWT ID nếu chưa có
    const stored = getStoredIdentity();
    if (stored) {
      setIdentity(stored);
    } else {
      // Hiện popup danh tính sư tôn AAA
      setIsIdentityModalOpen(true);
    }

    // 2. Tải bài viết từ Firebase
    fetchPosts();
  }, []);

  const handleIdentityCreated = (newIdentity: UserIdentity) => {
    setIdentity(newIdentity);
    setIsIdentityModalOpen(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: SocialPost[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let timeStr = 'Vừa xong';
        if (data.createdAt && data.createdAt.seconds) {
          timeStr = new Date(data.createdAt.seconds * 1000).toLocaleString('vi-VN');
        }

        items.push({
          docId: docSnap.id,
          authorName: data.authorName || 'Sư Tôn Ẩn Danh',
          authorSub: data.authorSub || 'su_ton_anon',
          authorAvatarId: data.authorAvatarId || 1,
          jwtToken: data.jwtToken || '',
          content: data.content || '',
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          createdAt: timeStr,
          createdAtRaw: data.createdAt,
        });
      });

      setPosts(items);
    } catch (err) {
      console.error('Lỗi khi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    // Nếu chưa có danh tính thì yêu cầu nhập
    if (!identity) {
      setIsIdentityModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      // Decode JWT token sub id
      const tokenParts = identity.token.split('.');
      let sub = `su_ton_${Date.now()}`;
      try {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.sub) sub = payload.sub;
      } catch {}

      await addDoc(collection(db, 'social_posts'), {
        authorName: identity.name,
        authorSub: sub,
        authorAvatarId: identity.avatarId,
        jwtToken: identity.token,
        content: postContent.trim(),
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      setPostContent('');
      await fetchPosts();
    } catch (err) {
      console.error('Lỗi khi đăng bài viết:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (post: SocialPost) => {
    if (!identity) {
      setIsIdentityModalOpen(true);
      return;
    }

    let sub = `su_ton_${Date.now()}`;
    try {
      const tokenParts = identity.token.split('.');
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.sub) sub = payload.sub;
    } catch {}

    const isLiked = post.likedBy.includes(sub);
    const newLikedBy = isLiked 
      ? post.likedBy.filter((s) => s !== sub)
      : [...post.likedBy, sub];
    const newLikes = newLikedBy.length;

    // Cập nhật UI ngay lập tức
    setPosts((prev) =>
      prev.map((p) => (p.docId === post.docId ? { ...p, likes: newLikes, likedBy: newLikedBy } : p))
    );

    try {
      const postRef = doc(db, 'social_posts', post.docId);
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: newLikedBy,
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật like:', err);
    }
  };

  const getClassInfo = (avatarId: number) => {
    return CULTIVATION_CLASSES.find((c) => c.id === avatarId) || CULTIVATION_CLASSES[0];
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-start selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Background AAA Fantasy Emblem & Lighting */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-25">
        <img
          src="/nks5dadide.png"
          alt="Guild Emblem Watermark"
          className="w-[450px] sm:w-[750px] max-w-none mix-blend-screen filter brightness-125 contrast-125 rounded-full drop-shadow-[0_0_80px_rgba(245,158,11,0.3)]"
          style={{
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 78%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 78%)'
          }}
        />
      </div>
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* AAA Header / Navbar */}
      <header className="w-full border-b border-amber-500/20 bg-[#0b0f19]/70 backdrop-blur-md sticky top-0 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex justify-between items-center gap-2">
          <div 
            className="flex items-center space-x-3 min-w-0 cursor-pointer group"
            onClick={() => {
              window.history.pushState({}, '', '/guild');
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            <img
              src="/logo.jpg"
              alt="Logo Server Ngọc Kinh S5"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-amber-400/50 shadow-md shadow-orange-500/30 shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black font-cinzel tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent truncate">
                SERVER NGỌC KINH S5
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-400/80 font-medium truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_8px_#10b981]" />
                Mạng Xã Hội Tông Sư
              </p>
            </div>
          </div>

          {/* User Controls & Navigation */}
          <div className="flex items-center space-x-2 shrink-0">
            {identity ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsIdentityModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent hover:from-amber-500/25 border border-amber-500/40 rounded-2xl px-3 py-1.5 text-xs font-bold font-cinzel text-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                title="Thay đổi danh tính Sư Tôn"
              >
                {(() => {
                  const currentClass = getClassInfo(identity.avatarId);
                  const Icon = currentClass.icon;
                  return <Icon className="w-4 h-4 text-amber-400" />;
                })()}
                <span className="max-w-[110px] truncate">{identity.name}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsIdentityModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-cinzel px-3.5 py-1.5 rounded-2xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Nhập Danh Tính</span>
              </motion.button>
            )}

            {/* Nút Khiên (Quay về Guild) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                window.history.pushState({}, '', '/guild');
                window.dispatchEvent(new Event('popstate'));
              }}
              title="Danh Sách Bang Hội"
              className="px-3 py-1.5 rounded-2xl text-xs font-bold font-cinzel flex items-center gap-1.5 transition-all cursor-pointer border bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700/80"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">Bang Hội</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="max-w-2xl w-full mx-auto px-3 sm:px-4 pt-5 pb-16 space-y-4 z-10">
        
        {/* AAA Create Post Box */}
        <div className="bg-[#0b0f19]/50 backdrop-blur-md border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.08)] space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="flex items-center gap-3">
            {identity ? (
              <div 
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0"
                style={{ color: getClassInfo(identity.avatarId).color }}
              >
                {(() => {
                  const Icon = getClassInfo(identity.avatarId).icon;
                  return <Icon className="w-6 h-6 filter drop-shadow-[0_0_6px_currentColor]" />;
                })()}
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold font-cinzel text-amber-300 truncate">
                {identity ? identity.name : 'Sư Tôn Ẩn Danh'}
              </p>
              <p className="text-[10px] text-slate-400 font-inter">Đăng truyền tin công khai tới toàn thể Tông Sư</p>
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Sư Tôn muốn truyền đạt tâm pháp hay kinh nghiệm gì với chư vị Tông Sư hôm nay?..."
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition-all focus:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-inter">
                <ScrollText className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">Ký tự khắc ghi bằng JWT</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || !postContent.trim()}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black font-cinzel px-5 py-2 rounded-2xl text-xs cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{submitting ? 'Đang Đăng...' : 'Đăng Bài'}</span>
              </motion.button>
            </div>
          </form>
        </div>

        {/* AAA Post Feed List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold font-cinzel text-amber-300 tracking-wider flex items-center gap-1.5 uppercase">
              <MessageSquare className="w-4 h-4 text-amber-400" /> Nhật Ký Tu Luyện Tông Sư ({posts.length})
            </h3>
            <button 
              onClick={fetchPosts}
              title="Làm mới bài viết"
              className="text-slate-400 hover:text-amber-300 transition-colors p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && posts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-inter">
              Đang tải truyền tin Tông Sư...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800/60 text-slate-400 text-xs space-y-2 font-inter">
              <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto animate-pulse" />
              <p className="font-cinzel font-bold text-amber-200 text-sm">Chưa có bài truyền tin nào</p>
              <p>Hãy là Sư Tôn đầu tiên khai mở tâm pháp trên Mạng Xã Hội!</p>
            </div>
          ) : (
            posts.map((post) => {
              let currentSub = '';
              if (identity) {
                try {
                  const parts = identity.token.split('.');
                  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                  if (payload.sub) currentSub = payload.sub;
                } catch {}
              }
              const isLiked = post.likedBy.includes(currentSub);
              const authorClass = getClassInfo(post.authorAvatarId);
              const AuthorIcon = authorClass.icon;

              return (
                <motion.div
                  key={post.docId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0b0f19]/50 backdrop-blur-md border border-slate-800/80 hover:border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Author Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/40 flex items-center justify-center shadow-inner shrink-0"
                        style={{ color: authorClass.color }}
                      >
                        <AuthorIcon className="w-5 h-5 filter drop-shadow-[0_0_6px_currentColor]" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-cinzel text-amber-200 flex items-center gap-2">
                          <span>{post.authorName}</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.2 rounded-full font-mono">
                            {authorClass.title}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{post.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs sm:text-sm text-slate-200 font-inter whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-slate-800/70 flex justify-between items-center text-xs">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLikePost(post)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl transition-all font-semibold cursor-pointer ${
                        isLiked
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span className="font-cinzel">{post.likes}</span>
                    </motion.button>

                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <span>Mã JWT:</span>
                      <span className="text-slate-400">{post.authorSub.slice(0, 15)}...</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* AAA Fantasy Identity Modal */}
      <IdentityModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        currentIdentity={identity}
        onIdentityCreated={handleIdentityCreated}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-3 text-center text-[10px] text-slate-500 font-cinzel">
        Server Ngọc Kinh S5 &bull; Game Ta Làm Tông Sư
      </footer>
    </div>
  );
}

export default SocialPage;

