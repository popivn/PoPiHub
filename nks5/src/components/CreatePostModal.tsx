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
  onSubmitPost: (content: string, imageUrls?: string[]) => Promise<void>;
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSelectedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitPost(content, selectedImages.length > 0 ? selectedImages : undefined);
      setContent('');
      setSelectedImages([]);
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
            className="relative w-full max-w-lg bg-[#242526] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-slate-100 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="relative border-b border-slate-700/80 px-4 py-3 text-center shrink-0">
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

            {/* Scrollable Content */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
                  rows={selectedImages.length > 0 ? 2 : 4}
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

              {/* Multiple Image Preview Stack Grid */}
              {selectedImages.length > 0 && (
                <div className="relative rounded-xl border border-slate-700 bg-slate-900/60 p-2 overflow-hidden space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-slate-300">
                      Đã chọn {selectedImages.length} hình ảnh
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline cursor-pointer font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Thêm ảnh</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedImages.map((imgSrc, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/40 group">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-slate-200 flex items-center justify-center backdrop-blur-md cursor-pointer border border-slate-700 transition-colors"
                          title="Xóa ảnh này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <img
                          src={imgSrc}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-auto max-h-[320px] object-contain rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden File Input (Multiple files) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
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
                    title="Thêm nhiều ảnh"
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
                disabled={isSubmitting || (!content.trim() && selectedImages.length === 0)}
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
