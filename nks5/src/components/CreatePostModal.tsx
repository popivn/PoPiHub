import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  Users,
  Globe,
  Smile,
  Edit2,
  MapPin,
  Tag,
  MoreHorizontal
} from 'lucide-react';
import { UserIdentity } from '../utils/identityJWT';
import { CULTIVATION_CLASSES } from './IdentityModal';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
  onSubmitPost: (content: string, imageUrl?: string) => Promise<void>;
  onOpenIdentityModal: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  identity,
  onSubmitPost,
  onOpenIdentityModal,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    setIsSubmitting(true);
    try {
      await onSubmitPost(content, selectedImage || undefined);
      setContent('');
      setSelectedImage(null);
      onClose();
    } catch (err) {
      console.error('Lỗi đăng bài:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClass = identity
    ? CULTIVATION_CLASSES.find((c) => c.id === identity.avatarId) || CULTIVATION_CLASSES[0]
    : CULTIVATION_CLASSES[0];
  const AuthorIcon = currentClass.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-lg bg-[#242526] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-slate-100"
          >
            {/* Modal Header */}
            <div className="relative border-b border-slate-700/80 px-4 py-3 text-center">
              <h3 className="text-base font-bold font-cinzel text-slate-100">
                Tạo bài viết
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-2.5 w-8 h-8 rounded-full bg-[#3a3b3c] hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  onClick={onOpenIdentityModal}
                  className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 cursor-pointer"
                  style={{ color: currentClass.color }}
                  title="Nhấn để đổi danh tính Sư Tôn"
                >
                  <AuthorIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 
                    onClick={onOpenIdentityModal}
                    className="text-sm font-bold text-slate-100 cursor-pointer flex items-center gap-1.5 hover:underline"
                  >
                    <span>{identity ? identity.name : 'Sư Tôn Ẩn Danh'}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded-md border border-amber-500/30 font-normal">
                      Khế Ước
                    </span>
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3a3b3c] text-[11px] font-medium text-slate-300 cursor-pointer">
                      <Users className="w-3 h-3" />
                      <span>Bạn bè</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3a3b3c] text-[11px] font-medium text-slate-300 cursor-pointer">
                      <Globe className="w-3 h-3" />
                      <span>Nhãn AI đang tắt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  rows={selectedImage ? 2 : 4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    identity
                      ? `${identity.name} ơi, bạn đang nghĩ gì thế?`
                      : 'Sư Tôn ơi, bạn đang nghĩ gì thế?'
                  }
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none resize-none"
                />
                <button
                  type="button"
                  className="absolute right-1 bottom-1 text-slate-400 hover:text-amber-400 transition-colors p-1"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview Area */}
              {selectedImage && (
                <div className="relative rounded-xl border border-slate-700 bg-slate-900/60 p-2 overflow-hidden group">
                  {/* Image Edit & Remove Overlay Buttons */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-950 text-slate-100 text-xs font-semibold backdrop-blur-md shadow-md cursor-pointer border border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-950 text-slate-200 flex items-center justify-center backdrop-blur-md shadow-md cursor-pointer border border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Fullwidth Image 1 Column Stacked */}
                  <div className="w-full max-h-[380px] rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
                    <img
                      src={selectedImage}
                      alt="Preview đăng bài"
                      className="w-full h-full object-contain max-h-[380px] rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Add to Post Options Bar */}
              <div className="flex justify-between items-center px-3 py-2 rounded-xl border border-slate-700/80 bg-[#18191a]">
                <span className="text-xs font-semibold text-slate-200">
                  Thêm vào bài viết của bạn
                </span>
                <div className="flex items-center gap-1 text-slate-300">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Ảnh/video"
                    className="p-1.5 text-emerald-500 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    title="Gắn thẻ người khác"
                    className="p-1.5 text-sky-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <Tag className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    title="Cảm xúc/hoạt động"
                    className="p-1.5 text-amber-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    title="Check in"
                    className="p-1.5 text-rose-500 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    title="Khác"
                    className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !selectedImage)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-sm cursor-pointer shadow-lg shadow-blue-600/20 transition-all"
              >
                {isSubmitting ? 'Đang Đăng...' : 'Đăng'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CreatePostModal;
