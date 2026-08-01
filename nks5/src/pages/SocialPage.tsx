import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  MessageSquare, 
  RefreshCw,
  Video,
  Image as ImageIcon,
  Clapperboard,
  UserCheck,
  Edit,
  Trash2
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
import CreatePostModal from '../components/CreatePostModal';
import PostComments from '../components/PostComments';
import AppLayout from '../components/AppLayout';

export interface SocialPost {
  docId: string;
  authorName: string;
  authorSub: string;
  authorAvatarId: number;
  jwtToken: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  likes: number;
  likedBy: string[]; // Danh sách sub sư tôn đã thích
  createdAt?: string;
  createdAtRaw?: any;
}

export function SocialPage() {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Form bài viết
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);

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
        if (data.isDeleted) return;
        let timeStr = 'Vừa xong';
        if (data.createdAt && data.createdAt.seconds) {
          timeStr = new Date(data.createdAt.seconds * 1000).toLocaleString('vi-VN');
        }

        // Backward compatibility
        let imgs: string[] = [];
        if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
          imgs = data.imageUrls;
        } else if (data.imageUrl) {
          imgs = [data.imageUrl];
        }

        items.push({
          docId: docSnap.id,
          authorName: data.authorName || 'Sư Tôn Ẩn Danh',
          authorSub: data.authorSub || 'su_ton_anon',
          authorAvatarId: data.authorAvatarId || 1,
          jwtToken: data.jwtToken || '',
          content: data.content || '',
          imageUrl: data.imageUrl || undefined,
          imageUrls: imgs.length > 0 ? imgs : undefined,
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

  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  const handleCreateOrUpdatePost = async (content: string, imageUrls?: string[]) => {
    if (!content.trim() && (!imageUrls || imageUrls.length === 0)) return;

    // Nếu chưa có danh tính thì yêu cầu nhập
    if (!identity) {
      setIsIdentityModalOpen(true);
      return;
    }

    try {
      if (editingPost) {
        // Cập nhật bài viết có sẵn
        const postRef = doc(db, 'social_posts', editingPost.docId);
        await updateDoc(postRef, {
          content: content.trim(),
          imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null,
          imageUrls: imageUrls || [],
        });
        setEditingPost(null);
      } else {
        // Tạo mới bài viết
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
          content: content.trim(),
          imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null,
          imageUrls: imageUrls || [],
          likes: 0,
          likedBy: [],
          createdAt: serverTimestamp(),
        });
      }

      await fetchPosts();
    } catch (err) {
      console.error('Lỗi khi lưu bài viết:', err);
    }
  };

  const handleDeletePost = async (postDocId: string) => {
    if (!window.confirm('Sư Tôn có chắc chắn muốn thu hồi bài đăng này?')) return;
    try {
      const postRef = doc(db, 'social_posts', postDocId);
      await updateDoc(postRef, {
        isDeleted: true,
      });
      await fetchPosts();
    } catch (err) {
      console.error('Lỗi xóa bài viết:', err);
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
    <AppLayout
      currentRoute="social"
      identity={identity}
      onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
    >
      {/* Main Feed */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-5 pb-16 space-y-4 z-10">
        
        {/* Facebook Style Post Creation Bar */}
        <div className="bg-[#18191a]/90 border border-slate-800/80 rounded-2xl p-2.5 sm:p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Avatar */}
            <div 
              onClick={() => setIsIdentityModalOpen(true)}
              className="cursor-pointer shrink-0"
              title="Nhấn để đổi danh tính Sư Tôn"
            >
              {identity ? (
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-md"
                  style={{ color: getClassInfo(identity.avatarId).color }}
                >
                  {(() => {
                    const Icon = getClassInfo(identity.avatarId).icon;
                    return <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
                  })()}
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>

            {/* Pill Shaped Input Field -> Triggers Facebook CreatePostModal */}
            <div 
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="w-full bg-[#3a3b3c]/60 hover:bg-[#3a3b3c] border border-transparent hover:border-amber-500/40 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-sm text-slate-400 select-none transition-all truncate">
                {identity
                  ? `${identity.name} ơi, bạn đang nghĩ gì thế?`
                  : 'Sư Tôn ơi, bạn đang nghĩ gì thế?'
                }
              </div>
            </div>

            {/* Quick Action Icons & Submit Button */}
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatePostModalOpen(true)}
                title="Video trực tiếp"
                className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatePostModalOpen(true)}
                title="Ảnh/video"
                className="p-1.5 sm:p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatePostModalOpen(true)}
                title="Thước phim (Reels)"
                className="p-1.5 sm:p-2 text-pink-500 hover:bg-pink-500/10 rounded-full transition-colors cursor-pointer"
              >
                <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsCreatePostModalOpen(true)}
                className="ml-0.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black p-2 sm:px-4 sm:py-2 rounded-full text-xs cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-1.5 uppercase font-cinzel"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Đăng</span>
              </motion.button>
            </div>
          </div>
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

                    {/* Edit & Delete Action Buttons (If owner) */}
                    {(currentSub === post.authorSub || !post.authorSub) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(post);
                            setIsCreatePostModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Chỉnh sửa bài đăng"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.docId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Thu hồi bài đăng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Text Content */}
                  {post.content && (
                    <p className="text-xs sm:text-sm text-slate-200 font-inter whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {/* Fullwidth Image Display (Hỗ trợ Đăng Nhiều Ảnh Xếp 1 Cột) */}
                  {post.imageUrls && post.imageUrls.length > 0 ? (
                    <div className="space-y-3">
                      {post.imageUrls.map((imgSrc, imgIdx) => (
                        <div key={imgIdx} className="w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/60 max-h-[500px] flex items-center justify-center">
                          <img
                            src={imgSrc}
                            alt={`Hình ảnh bài đăng ${imgIdx + 1}`}
                            className="w-full h-full object-contain max-h-[500px] rounded-2xl"
                          />
                        </div>
                      ))}
                    </div>
                  ) : post.imageUrl ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/60 max-h-[500px] flex items-center justify-center">
                      <img
                        src={post.imageUrl}
                        alt="Hình ảnh bài đăng"
                        className="w-full h-full object-contain max-h-[500px] rounded-2xl"
                      />
                    </div>
                  ) : null}

                  {/* Facebook Style Comment System */}
                  <PostComments
                    postId={post.docId}
                    identity={identity}
                    likes={post.likes}
                    isLiked={isLiked}
                    onLikePost={() => handleLikePost(post)}
                    onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
                  />
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

      {/* Facebook Create Post Popup Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => {
          setIsCreatePostModalOpen(false);
          setEditingPost(null);
        }}
        identity={identity}
        onSubmitPost={handleCreateOrUpdatePost}
        editingPost={editingPost}
        onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
      />
    </AppLayout>
  );
}

export default SocialPage;

