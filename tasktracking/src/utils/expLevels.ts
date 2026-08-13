/**
 * Hệ thống cấp bậc tu tiên cho PoPi Hub.
 * Mỗi cấp bậc (cảnh giới) có 10 bậc nhỏ (sub-level).
 * Phải đạt bậc 10 của cảnh giới hiện tại mới lên cảnh giới tiếp theo.
 * EXP tổng (từ tất cả task completed) quyết định cấp bậc hiện tại.
 */

/** Số bậc nhỏ trong mỗi cảnh giới */
export const SUB_LEVELS_PER_REALM = 10;

export interface ExpLevel {
  /** Tên cảnh giới */
  name: string;
  /** Tương đương level kỹ thuật */
  rank: string;
  /** Mô tả năng lực */
  description: string;
  /** EXP tối thiểu để đạt cảnh giới này (bậc 1) */
  minExp: number;
  /** Màu đại diện */
  color: string;
  /** Icon emoji đại diện */
  emoji: string;
}

export const EXP_LEVELS: ExpLevel[] = [
  {
    name: 'Ngưng Khí',
    rank: 'Intern',
    description: 'Biết syntax, framework cơ bản, làm task nhỏ dưới hướng dẫn.',
    minExp: 0,
    color: '#94a3b8',
    emoji: '🌱',
  },
  {
    name: 'Trúc Cơ',
    rank: 'Junior',
    description: 'Tự code feature đơn giản, biết Git, DB, API cơ bản.',
    minExp: 1000,
    color: '#22c55e',
    emoji: '🌿',
  },
  {
    name: 'Kết Đan',
    rank: 'Junior+ / Mid thấp',
    description: 'Bắt đầu tự giải quyết vấn đề, debug tốt, ít cần hỗ trợ.',
    minExp: 5000,
    color: '#14b8a6',
    emoji: '💊',
  },
  {
    name: 'Nguyên Anh',
    rank: 'Mid-level',
    description: 'Tự thiết kế feature, API, DB, xử lý production issue.',
    minExp: 15000,
    color: '#06b6d4',
    emoji: '🔮',
  },
  {
    name: 'Hóa Thần',
    rank: 'Senior',
    description: 'Hiểu sâu hệ thống, architecture, performance, security.',
    minExp: 40000,
    color: '#3b82f6',
    emoji: '⚡',
  },
  {
    name: 'Anh Biến',
    rank: 'Senior+ / Tech Lead',
    description: 'Thiết kế hệ thống lớn, dẫn dắt kỹ thuật cho team.',
    minExp: 80000,
    color: '#6366f1',
    emoji: '🌌',
  },
  {
    name: 'Vấn Đỉnh',
    rank: 'Tech Lead / Staff Engineer',
    description: 'Giải quyết vấn đề cấp hệ thống, ảnh hưởng nhiều team.',
    minExp: 150000,
    color: '#8b5cf6',
    emoji: '🏔️',
  },
  {
    name: 'Âm Hư',
    rank: 'Staff Engineer',
    description: 'Kiến trúc liên hệ thống, technical direction.',
    minExp: 250000,
    color: '#a855f7',
    emoji: '🌑',
  },
  {
    name: 'Dương Thực',
    rank: 'Senior Staff',
    description: 'Dẫn dắt kỹ thuật ở quy mô lớn, định hướng chiến lược.',
    minExp: 400000,
    color: '#d946ef',
    emoji: '☀️',
  },
  {
    name: 'Niết Bàn',
    rank: 'Principal Engineer',
    description: 'Quyết định architecture/technology ở cấp công ty.',
    minExp: 600000,
    color: '#ec4899',
    emoji: '🔥',
  },
  {
    name: 'Thiên Nhân Ngũ Suy',
    rank: 'Distinguished Engineer',
    description: 'Chuyên gia cực sâu, ảnh hưởng toàn tổ chức.',
    minExp: 900000,
    color: '#f43f5e',
    emoji: '⭐',
  },
  {
    name: 'Không Linh',
    rank: 'Fellow Engineer',
    description: 'Tầm ảnh hưởng ngành/công ty rất lớn.',
    minExp: 1300000,
    color: '#fbbf24',
    emoji: '👑',
  },
  {
    name: 'Đạp Thiên',
    rank: 'Legendary / CTO-level',
    description: 'Không còn đơn thuần là "code", định hướng toàn bộ công nghệ.',
    minExp: 2000000,
    color: '#f59e0b',
    emoji: '🐉',
  },
];

/**
 * Kết quả tính toán cấp bậc đầy đủ: cảnh giới + bậc nhỏ.
 */
export interface LevelInfo {
  level: ExpLevel;
  /** Bậc nhỏ hiện tại (1-10) */
  subLevel: number;
  /** Cảnh giới tiếp theo (null nếu đã max) */
  nextLevel: ExpLevel | null;
  /** Bậc nhỏ tiếp theo (1-10, hoặc null nếu max) */
  nextSubLevel: number | null;
  /** % tiến độ trong bậc nhỏ hiện tại (0-100) */
  progressPercent: number;
  /** EXP cần thêm để lên bậc nhỏ tiếp theo */
  expToNextSubLevel: number;
  /** EXP tối thiểu của bậc nhỏ hiện tại */
  currentSubLevelMinExp: number;
  /** EXP tối thiểu của bậc nhỏ tiếp theo */
  nextSubLevelMinExp: number;
}

/**
 * Tìm cảnh giới hiện tại dựa trên tổng EXP.
 */
export const getCurrentLevel = (totalExp: number): ExpLevel => {
  let current = EXP_LEVELS[0];
  for (const level of EXP_LEVELS) {
    if (totalExp >= level.minExp) {
      current = level;
    } else {
      break;
    }
  }
  return current;
};

/**
 * Tìm cảnh giới tiếp theo (null nếu đã max).
 */
export const getNextLevel = (totalExp: number): ExpLevel | null => {
  for (const level of EXP_LEVELS) {
    if (totalExp < level.minExp) {
      return level;
    }
  }
  return null;
};

/**
 * Tính EXP tối thiểu cho một bậc nhỏ cụ thể trong một cảnh giới.
 * Bậc nhỏ được chia đều trong khoảng EXP của cảnh giới.
 */
export const getSubLevelMinExp = (level: ExpLevel, subLevel: number): number => {
  const levelIndex = EXP_LEVELS.findIndex((l) => l.name === level.name);
  const nextLevel = levelIndex < EXP_LEVELS.length - 1 ? EXP_LEVELS[levelIndex + 1] : null;

  if (!nextLevel) {
    // Cảnh giới cuối: bậc 10 = minExp, các bậc trước chia đều (dùng 10000 EXP làm range giả định)
    const fakeRange = 10000;
    return level.minExp + Math.floor((fakeRange / SUB_LEVELS_PER_REALM) * (subLevel - 1));
  }

  const range = nextLevel.minExp - level.minExp;
  const step = Math.floor(range / SUB_LEVELS_PER_REALM);
  return level.minExp + step * (subLevel - 1);
};

/**
 * Tính toán đầy đủ thông tin cấp bậc: cảnh giới, bậc nhỏ, tiến độ.
 */
export const getLevelInfo = (totalExp: number): LevelInfo => {
  const currentLevel = getCurrentLevel(totalExp);
  const nextLevel = getNextLevel(totalExp);

  // Tính bậc nhỏ hiện tại (1-10)
  let subLevel = 1;
  for (let s = 1; s <= SUB_LEVELS_PER_REALM; s++) {
    const subMin = getSubLevelMinExp(currentLevel, s);
    if (totalExp >= subMin) {
      subLevel = s;
    } else {
      break;
    }
  }

  // Bậc nhỏ tiếp theo
  let nextSubLevel: number | null = null;
  let nextSubLevelMinExp = 0;
  let currentSubLevelMinExp = getSubLevelMinExp(currentLevel, subLevel);

  if (subLevel < SUB_LEVELS_PER_REALM) {
    // Còn bậc nhỏ trong cảnh giới hiện tại
    nextSubLevel = subLevel + 1;
    nextSubLevelMinExp = getSubLevelMinExp(currentLevel, nextSubLevel);
  } else if (nextLevel) {
    // Đã bậc 10 → chuyển sang bậc 1 cảnh giới tiếp theo
    nextSubLevel = 1;
    nextSubLevelMinExp = nextLevel.minExp;
  }

  // Tiến độ trong bậc nhỏ hiện tại
  let progressPercent = 100;
  let expToNextSubLevel = 0;

  if (nextSubLevel !== null) {
    const range = nextSubLevelMinExp - currentSubLevelMinExp;
    const progress = totalExp - currentSubLevelMinExp;
    progressPercent = Math.min(100, Math.round((progress / range) * 100));
    expToNextSubLevel = Math.max(0, nextSubLevelMinExp - totalExp);
  }

  return {
    level: currentLevel,
    subLevel,
    nextLevel: nextSubLevel === 1 ? nextLevel : null,
    nextSubLevel,
    progressPercent,
    expToNextSubLevel,
    currentSubLevelMinExp,
    nextSubLevelMinExp,
  };
};

/**
 * Tính % tiến độ tổng thể từ cảnh giới hiện tại đến cảnh giới tiếp theo.
 */
export const getProgressPercent = (totalExp: number): number => {
  const current = getCurrentLevel(totalExp);
  const next = getNextLevel(totalExp);
  if (!next) return 100;
  const range = next.minExp - current.minExp;
  const progress = totalExp - current.minExp;
  return Math.min(100, Math.round((progress / range) * 100));
};

/**
 * EXP cần thêm để lên cảnh giới tiếp theo.
 */
export const getExpToNextLevel = (totalExp: number): number => {
  const next = getNextLevel(totalExp);
  if (!next) return 0;
  return next.minExp - totalExp;
};
