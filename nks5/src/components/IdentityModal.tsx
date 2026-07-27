import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Crown,
  FlaskConical,
  Sparkles,
  Flame,
  Shield,
  Check,
  Zap,
  UserCheck
} from 'lucide-react';
import { UserIdentity, generateIdentityJWT } from '../utils/identityJWT';

export interface IdentityModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentIdentity: UserIdentity | null;
  onIdentityCreated: (identity: UserIdentity) => void;
}

export interface CultivationClass {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGradient: string;
}

export const CULTIVATION_CLASSES: CultivationClass[] = [
  {
    id: 1,
    title: 'Kiếm Tôn',
    subtitle: 'Nhất Kiếm Định Càn Khôn',
    description: 'Trảm đứt hồng trần, tinh thông vô thượng kiếm ý',
    icon: Sword,
    color: '#F59E0B', // amber-500
    borderColor: 'border-amber-500/60',
    bgGradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
  },
  {
    id: 2,
    title: 'Đại Đế',
    subtitle: 'Thống Lĩnh Vạn Cổ Cực Tôn',
    description: 'Đế uy áp đảo cửu châu, chưởng quản ngọc kinh',
    icon: Crown,
    color: '#EAB308', // yellow-500
    borderColor: 'border-yellow-500/60',
    bgGradient: 'from-yellow-500/20 via-orange-600/10 to-transparent',
  },
  {
    id: 3,
    title: 'Luyện Đan Sư',
    subtitle: 'Thần Dược Đoạt Thiên Cơ',
    description: 'Luyện cửu chuyển tiên đan, hồi sinh nghịch thiên',
    icon: FlaskConical,
    color: '#10B981', // emerald-500
    borderColor: 'border-emerald-500/60',
    bgGradient: 'from-emerald-500/20 via-teal-600/10 to-transparent',
  },
  {
    id: 4,
    title: 'Tiên Tôn',
    subtitle: 'Thánh Quang Bất Diệt',
    description: 'Hòa mình cùng vạn vật, thần thông quảng đại',
    icon: Sparkles,
    color: '#3B82F6', // blue-500
    borderColor: 'border-blue-500/60',
    bgGradient: 'from-blue-500/20 via-indigo-600/10 to-transparent',
  },
  {
    id: 5,
    title: 'Ma Tôn',
    subtitle: 'U Cốt Huyết Viêm',
    description: 'Nghịch thiên hạ đồ sát, chưởng khống cửu uyên',
    icon: Flame,
    color: '#EF4444', // red-500
    borderColor: 'border-red-500/60',
    bgGradient: 'from-red-500/20 via-rose-600/10 to-transparent',
  },
  {
    id: 6,
    title: 'Hộ Pháp',
    subtitle: 'Vạn Lăng Kim Cang',
    description: 'Thủ hộ Tông Môn, kim cang bất hoại thân',
    icon: Shield,
    color: '#8B5CF6', // purple-500
    borderColor: 'border-purple-500/60',
    bgGradient: 'from-purple-500/20 via-violet-600/10 to-transparent',
  },
];

export function IdentityModal({
  isOpen,
  onClose,
  currentIdentity,
  onIdentityCreated,
}: IdentityModalProps) {
  const [name, setName] = useState(currentIdentity ? currentIdentity.name : '');
  const [selectedClassId, setSelectedClassId] = useState<number>(
    currentIdentity ? currentIdentity.avatarId : 1
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClass = CULTIVATION_CLASSES.find((c) => c.id === selectedClassId) || CULTIVATION_CLASSES[0];
  const IconComponent = selectedClass.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newIdentity = generateIdentityJWT(name.trim(), selectedClassId);
      onIdentityCreated(newIdentity);
      setIsSubmitting(false);
      if (onClose) onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (currentIdentity && onClose) onClose();
            }}
            className="fixed inset-0 bg-[#05070d]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-[#0b0f19] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.15)] z-10 overflow-hidden my-auto"
          >
            {/* Background AAA Lighting & Glowing Aura */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f59e0b08,transparent_70%)] pointer-events-none" />

            {/* Glowing Border Line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            {/* Header Content */}
            <div className="text-center space-y-3 relative z-10">
              {/* Circular Magical Glowing Avatar Ring */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                />
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-400/60 flex items-center justify-center shadow-inner relative z-10"
                  style={{ color: selectedClass.color }}
                >
                  <IconComponent className="w-8 h-8 filter drop-shadow-[0_0_8px_currentColor]" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-1">
                  <Zap className="w-3 h-3 animate-pulse" /> Tuyên Bố Khế Ước
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-cinzel tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-sm">
                  Xin Hỏi Danh Tính Sư Tôn
                </h2>
                <p className="text-xs text-slate-400 font-inter mt-1 max-w-sm mx-auto leading-relaxed">
                  Thiết lập danh xưng và Thiên Mệnh để tự động khắc ghi <strong className="text-amber-300">JWT Token ID</strong> huyền bí.
                </p>
              </div>
            </div>

            {/* Form & Class Selection */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5 relative z-10">
              {/* Input Sư Tôn */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-cinzel text-amber-200 tracking-wide flex items-center justify-between">
                  <span>1. Xưng Hiệu / Danh Xưng Sư Tôn</span>
                  <span className="text-[10px] text-slate-400 font-inter font-normal">Tự do 03-30 ký tự</span>
                </label>

                <div className="relative group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Tiêu Phong Tông Sư, Thanh Vân Đô Trưởng..."
                    required
                    maxLength={35}
                    className="w-full bg-slate-950/80 border border-slate-700/80 group-hover:border-amber-500/50 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:bg-slate-950"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Class Selection Title */}
              <div className="space-y-2">
                <label className="block text-xs font-bold font-cinzel text-amber-200 tracking-wide">
                  2. Chọn Con Đường Thiên Mệnh Tu Luyện
                </label>

                {/* Responsive Grid Class Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CULTIVATION_CLASSES.map((cls) => {
                    const ClassIcon = cls.icon;
                    const isSelected = selectedClassId === cls.id;

                    return (
                      <motion.button
                        key={cls.id}
                        type="button"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`relative p-3 rounded-2xl text-left border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? `bg-gradient-to-br ${cls.bgGradient} ${cls.borderColor} shadow-[0_0_20px_rgba(245,158,11,0.25)] border-2`
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-amber-500/40 text-slate-400'
                        }`}
                      >
                        {/* Selected Active Shine */}
                        {isSelected && (
                          <div className="absolute inset-0 w-1/2 bg-white/10 skew-x-12 animate-gold-shine pointer-events-none" />
                        )}

                        <div className="flex justify-between items-start">
                          <div
                            className={`p-2 rounded-xl border ${
                              isSelected
                                ? 'bg-slate-900/80 border-amber-400/60'
                                : 'bg-slate-900/50 border-slate-800'
                            }`}
                            style={{ color: cls.color }}
                          >
                            <ClassIcon className="w-5 h-5" />
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <h4
                            className={`text-xs font-bold font-cinzel ${
                              isSelected ? 'text-amber-200' : 'text-slate-200'
                            }`}
                          >
                            {cls.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-inter line-clamp-1 mt-0.5">
                            {cls.subtitle}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Large CTA Button */}
              <div className="pt-3">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-cinzel text-sm sm:text-base tracking-wider uppercase shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50 transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/20 skew-x-12 animate-gold-shine pointer-events-none" />
                  
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Đang Khắc Ghi Khế Ước...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 stroke-[2.5]" />
                      <span>Xác Nhận Khắc Ghi Khế Ước</span>
                    </>
                  )}
                </motion.button>

                {currentIdentity && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full text-center text-xs text-slate-400 hover:text-amber-300 mt-2.5 font-inter cursor-pointer transition-colors"
                  >
                    Hủy bỏ & Giữ danh tính hiện tại
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default IdentityModal;
