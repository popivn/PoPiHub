import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Heart,
  Send,
  ChevronDown,
  ChevronUp,
  UserCheck
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
import { UserIdentity } from '../utils/identityJWT';
import { CULTIVATION_CLASSES } from './IdentityModal';

export interface CommentItem {
  docId: string;
  postId: string;
  authorName: string;
  authorSub: string;
  authorAvatarId: number;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt?: string;
}

export interface PostCommentsProps {
  postId: string;
  identity: UserIdentity | null;
  likes: number;
  isLiked: boolean;
  onLikePost: () => void;
  onOpenIdentityModal: () => void;
}

export function PostComments({
  postId,
  identity,
  likes,
  isLiked,
  onLikePost,
  onOpenIdentityModal,
}: PostCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const q = query(
        collection(db, 'social_posts', postId, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const items: CommentItem[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let timeStr = 'Vừa xong';
        if (data.createdAt && data.createdAt.seconds) {
          const diffHours = Math.floor(
            (Date.now() - data.createdAt.seconds * 1000) / (1000 * 60 * 60)
          );
          timeStr = diffHours > 0 ? `${diffHours} giờ` : 'Vừa xong';
        }

        items.push({
          docId: docSnap.id,
          postId,
          authorName: data.authorName || 'Tông Sư Ẩn Danh',
          authorSub: data.authorSub || 'su_ton_anon',
          authorAvatarId: data.authorAvatarId || 1,
          content: data.content || '',
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          createdAt: timeStr,
        });
      });

      setComments(items);
    } catch (err) {
      console.error('Lỗi khi tải bình luận:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!identity) {
      onOpenIdentityModal();
      return;
    }

    setSubmitting(true);
    try {
      let sub = `su_ton_${Date.now()}`;
      try {
        const parts = identity.token.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.sub) sub = payload.sub;
      } catch {}

      await addDoc(collection(db, 'social_posts', postId, 'comments'), {
        authorName: identity.name,
        authorSub: sub,
        authorAvatarId: identity.avatarId,
        content: commentText.trim(),
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      setCommentText('');
      setIsExpanded(true);
      await fetchComments();
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    } finally {
      setSubmitting(false);
    }
  };
  const getClassInfo = (avatarId: number) => {
    return CULTIVATION_CLASSES.find((c) => c.id === avatarId) || CULTIVATION_CLASSES[0];
  };

  const commentInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLikeComment = async (comment: CommentItem) => {
    if (!identity) {
      onOpenIdentityModal();
      return;
    }

    let sub = `su_ton_${Date.now()}`;
    try {
      const tokenParts = identity.token.split('.');
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.sub) sub = payload.sub;
    } catch {}

    const isLiked = comment.likedBy.includes(sub);
    const newLikes = isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1;
    const newLikedBy = isLiked
      ? comment.likedBy.filter((s) => s !== sub)
      : [...comment.likedBy, sub];

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) =>
        c.docId === comment.docId ? { ...c, likes: newLikes, likedBy: newLikedBy } : c
      )
    );

    try {
      const commentRef = doc(db, 'social_posts', postId, 'comments', comment.docId);
      await updateDoc(commentRef, {
        likes: newLikes,
        likedBy: newLikedBy,
      });
    } catch (err) {
      console.error('Lỗi khi thích bình luận:', err);
    }
  };

  const handleReplyClick = (authorName: string) => {
    setCommentText(`@${authorName} `);
    setIsExpanded(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-800/80">
      {/* 1 Single Horizontal Row: Like Button + Comment Count */}
      <div className="flex justify-between items-center text-xs text-slate-400 font-inter">
        {/* Nút Tim / Thích */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLikePost}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl transition-all font-semibold cursor-pointer ${
            isLiked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="font-cinzel">{likes}</span>
        </motion.button>

        {/* Số lượt Bình Luận & Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">{comments.length} bình luận</span>
          {comments.length > 0 && (
            isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Comment List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden pt-1"
          >
            {comments.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic pl-2">
                Chưa có bình luận nào. Hãy là Tông Sư đầu tiên để lại ý kiến!
              </p>
            ) : (
              comments.map((comment) => {
                const commentClass = getClassInfo(comment.authorAvatarId);
                const CommentAuthorIcon = commentClass.icon;

                let currentSub = '';
                if (identity) {
                  try {
                    const parts = identity.token.split('.');
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (payload.sub) currentSub = payload.sub;
                  } catch {}
                }
                const isCommentLiked = comment.likedBy.includes(currentSub);

                return (
                  <div key={comment.docId} className="flex gap-2.5 items-start">
                    {/* Avatar */}
                    <div 
                      className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ color: commentClass.color }}
                    >
                      <CommentAuthorIcon className="w-4 h-4" />
                    </div>

                    {/* Bubble Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-[#242526] border border-slate-700/60 rounded-2xl px-3.5 py-2 inline-block max-w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 hover:underline cursor-pointer">
                            {comment.authorName}
                          </span>
                          <span className="text-[9px] text-slate-400">· {comment.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>
                      </div>

                      {/* Comment Action Links */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold pl-2 pt-1">
                        <button 
                          type="button"
                          onClick={() => handleLikeComment(comment)}
                          className={`hover:underline cursor-pointer flex items-center gap-1 transition-colors ${
                            isCommentLiked ? 'text-rose-400 font-bold' : 'hover:text-slate-200'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{isCommentLiked ? 'Đã thích' : 'Thích'}</span>
                          {comment.likes > 0 && (
                            <span className="text-rose-400 text-[10px] ml-0.5 font-bold">({comment.likes})</span>
                          )}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleReplyClick(comment.authorName)}
                          className="hover:text-amber-300 hover:underline cursor-pointer transition-colors"
                        >
                          Trả lời
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Comment Box (Chuẩn Facebook) */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
        <div 
          onClick={onOpenIdentityModal}
          className="cursor-pointer shrink-0"
          title="Nhấn để đổi danh tính Sư Tôn"
        >
          {identity ? (
            <div 
              className="w-8 h-8 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0"
              style={{ color: getClassInfo(identity.avatarId).color }}
            >
              {(() => {
                const Icon = getClassInfo(identity.avatarId).icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <UserCheck className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              identity
                ? `Viết bình luận với danh nghĩa ${identity.name}...`
                : 'Viết bình luận...'
            }
            className="w-full bg-[#3a3b3c]/60 hover:bg-[#3a3b3c] focus:bg-[#3a3b3c] border border-transparent focus:border-amber-500/40 rounded-full pl-3.5 pr-9 py-1.5 text-xs text-slate-100 placeholder-slate-400 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 disabled:opacity-40 p-1 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostComments;
