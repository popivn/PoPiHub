import React, { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBolt,
  faCircleCheck,
  faListCheck,
  faClock,
  faKey,
  faChevronDown,
  faChevronUp,
  faStar,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import type { TaskItem } from '../types';
import {
  EXP_LEVELS,
  SUB_LEVELS_PER_REALM,
  getLevelInfo,
  getSubLevelMinExp,
  type ExpLevel,
} from '../utils/expLevels';
import {
  RADAR_CRITERIA,
  aggregateRadarScores,
  radarScoresToChartData,
} from '../utils/radar';
import { getStoredAccessKey } from '../utils/auth';

interface ProfileProps {
  tasks: TaskItem[];
  onBack: () => void;
  /** Handler đánh giá lại radar scores bằng AI, lưu vào DB */
  onReevaluateRadar: () => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ tasks, onBack, onReevaluateRadar }) => {
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [evaluatingRadar, setEvaluatingRadar] = useState(false);

  const accessKey = getStoredAccessKey() || 'unknown';

  const { totalExp, stats, levelInfo, radarScores, radarData, hasRadarData } = useMemo(() => {
    const totalExp = tasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.exp ?? 0), 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const ongoingTasks = tasks.filter((t) => t.status === 'ongoing').length;
    const totalDurationMs = tasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.durationMs ?? 0), 0);

    const levelInfo = getLevelInfo(totalExp);
    const radarScores = aggregateRadarScores(tasks);
    const radarData = radarScoresToChartData(radarScores);
    const hasRadarData = tasks.some((t) => t.radarScores);

    return {
      totalExp,
      stats: { totalTasks, completedTasks, ongoingTasks, totalDurationMs },
      levelInfo,
      radarScores,
      radarData,
      hasRadarData,
    };
  }, [tasks]);

  const fmtDur = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
  };

  const currentLevel = levelInfo.level;
  const currentLevelIndex = EXP_LEVELS.findIndex((l) => l.name === currentLevel.name);
  const visibleLevels = showAllLevels ? EXP_LEVELS : EXP_LEVELS.slice(0, currentLevelIndex + 2);

  // Tính bậc nhỏ đã đạt cho mỗi cảnh giới (cho hiển thị)
  const getReachedSubLevel = (level: ExpLevel): number => {
    const levelIndex = EXP_LEVELS.findIndex((l) => l.name === level.name);
    const nextLevel = levelIndex < EXP_LEVELS.length - 1 ? EXP_LEVELS[levelIndex + 1] : null;
    if (!nextLevel) {
      // Cảnh giới cuối: bậc 10 nếu totalExp >= minExp
      return totalExp >= level.minExp ? SUB_LEVELS_PER_REALM : 0;
    }
    if (totalExp >= nextLevel.minExp) return SUB_LEVELS_PER_REALM;
    if (totalExp < level.minExp) return 0;
    // Đang trong cảnh giới này → tính bậc
    let sub = 0;
    for (let s = 1; s <= SUB_LEVELS_PER_REALM; s++) {
      if (totalExp >= getSubLevelMinExp(level, s)) sub = s;
      else break;
    }
    return sub;
  };

  // Xác định target next: tên cảnh giới tiếp theo hoặc bậc tiếp theo
  const nextTargetLabel = levelInfo.nextSubLevel !== null
    ? levelInfo.nextSubLevel === 1 && levelInfo.nextLevel
      ? `${levelInfo.nextLevel.emoji} ${levelInfo.nextLevel.name} - Bậc 1`
      : `${currentLevel.name} - Bậc ${levelInfo.nextSubLevel}`
    : null;

  const nextTargetColor = levelInfo.nextSubLevel === 1 && levelInfo.nextLevel
    ? levelInfo.nextLevel.color
    : currentLevel.color;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-all"
            title="Quay lại"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Hồ Sơ Tu Hành
            </h1>
            <p className="text-xs text-slate-400 font-medium">Tiến trình tu tiên của bạn</p>
          </div>
        </div>
      </header>

      {/* Profile Card - Main */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 p-6 sm:p-8"
        style={{
          borderColor: `${currentLevel.color}40`,
          background: `linear-gradient(135deg, ${currentLevel.color}15 0%, rgba(15,23,42,0.9) 100%)`,
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: currentLevel.color }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar / Emblem */}
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl border-2 shadow-2xl flex-shrink-0"
            style={{
              borderColor: currentLevel.color,
              backgroundColor: `${currentLevel.color}20`,
              boxShadow: `0 0 40px ${currentLevel.color}30`,
            }}
          >
            {currentLevel.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <FontAwesomeIcon icon={faKey} className="text-slate-500 text-xs" />
              <span className="text-xs text-slate-500 font-mono">Key: {accessKey}</span>
            </div>

            {/* Level name + sub-level with hover tooltip */}
            <div className="group relative inline-block">
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight cursor-help"
                style={{ color: currentLevel.color }}
              >
                {currentLevel.name}
                <span className="text-lg sm:text-xl ml-2 opacity-80">
                  · Bậc {levelInfo.subLevel}/{SUB_LEVELS_PER_REALM}
                </span>
              </h2>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                <p className="text-xs font-bold text-slate-200 mb-1">
                  {currentLevel.name} · {currentLevel.rank}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentLevel.description}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Bậc nhỏ: {levelInfo.subLevel}/{SUB_LEVELS_PER_REALM}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 font-semibold mb-3">
              {currentLevel.rank}
            </p>

            {/* Total EXP */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <FontAwesomeIcon icon={faBolt} className="text-amber-400" />
              <span className="text-2xl font-extrabold text-amber-400">
                {totalExp.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500 font-medium">EXP tổng</span>
            </div>
          </div>
        </div>

        {/* Sub-level dots (1-10) */}
        <div className="relative z-10 mt-5 flex items-center justify-center gap-1.5">
          {Array.from({ length: SUB_LEVELS_PER_REALM }, (_, i) => i + 1).map((s) => {
            const reached = s <= levelInfo.subLevel;
            const isCurrent = s === levelInfo.subLevel;
            return (
              <div
                key={s}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCurrent ? 'scale-110' : ''
                }`}
                style={{
                  backgroundColor: reached ? `${currentLevel.color}30` : 'rgba(30,41,59,0.5)',
                  border: `1.5px solid ${reached ? currentLevel.color : '#334155'}`,
                  color: reached ? currentLevel.color : '#475569',
                }}
                title={`Bậc ${s}${reached ? ' ✓' : ''}`}
              >
                {reached ? (
                  <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                ) : (
                  s
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar to next sub-level */}
        <div className="relative z-10 mt-5">
          {nextTargetLabel ? (
            <>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">
                  Bậc {levelInfo.subLevel}: {levelInfo.progressPercent}%
                </span>
                <span className="text-slate-400 font-medium">
                  Cần thêm{' '}
                  <span className="font-bold" style={{ color: nextTargetColor }}>
                    {levelInfo.expToNextSubLevel.toLocaleString()} EXP
                  </span>{' '}
                  →{' '}
                  <span className="font-bold" style={{ color: nextTargetColor }}>
                    {nextTargetLabel}
                  </span>
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    background: `linear-gradient(90deg, ${currentLevel.color}, ${nextTargetColor})`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm font-bold text-amber-400">
                🏆 Đã đạt cảnh giới tối cao: {currentLevel.name} Bậc {SUB_LEVELS_PER_REALM}!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini icon={faListCheck} label="Tổng task" value={stats.totalTasks} color="text-indigo-400" />
        <StatMini icon={faCircleCheck} label="Hoàn thành" value={stats.completedTasks} color="text-emerald-400" />
        <StatMini icon={faClock} label="Đang làm" value={stats.ongoingTasks} color="text-blue-400" />
        <StatMini icon={faClock} label="Thời gian" value={fmtDur(stats.totalDurationMs)} color="text-purple-400" />
      </div>

      {/* Radar Chart - Skill Assessment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Đánh Giá Kỹ Năng</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">10 tiêu chí năng lực (0-100)</p>
          </div>
          <button
            onClick={async () => {
              setEvaluatingRadar(true);
              try {
                await onReevaluateRadar();
              } finally {
                setEvaluatingRadar(false);
              }
            }}
            disabled={evaluatingRadar}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} spin={evaluatingRadar} />
            <span>{evaluatingRadar ? 'AI đang đánh giá...' : 'Đánh giá lại'}</span>
          </button>
        </div>

        {hasRadarData ? (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis
                  dataKey="criteria"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#475569', fontSize: 9 }}
                  stroke="#334155"
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}/100`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Criteria breakdown list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
              {RADAR_CRITERIA.map((c) => {
                const score = radarScores[c.key] ?? 0;
                const color =
                  score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={c.key} className="flex items-center gap-2 group relative">
                    <span className="text-base flex-shrink-0">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-bold text-slate-300 truncate">
                          {c.label}
                        </span>
                        <span
                          className="text-[11px] font-extrabold flex-shrink-0 ml-2"
                          style={{ color }}
                        >
                          {score}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${score}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    {/* Hover tooltip */}
                    <div className="absolute right-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-[10px] text-slate-400 whitespace-nowrap">
                        {c.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            <p className="mb-2">Chưa có đánh giá kỹ năng.</p>
            <p>Bấm "Đánh giá lại" để AI phân tích task và chấm điểm.</p>
          </div>
        )}
      </div>

      {/* Cultivation Path - All Levels with sub-levels */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-100">Lộ Trình Tu Tiên</h3>
          {EXP_LEVELS.length > visibleLevels.length && (
            <button
              onClick={() => setShowAllLevels(!showAllLevels)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FontAwesomeIcon icon={showAllLevels ? faChevronUp : faChevronDown} />
              <span>{showAllLevels ? 'Thu gọn' : 'Xem tất cả'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {visibleLevels.map((level) => {
            const isCurrent = level.name === currentLevel.name;
            const reachedSub = getReachedSubLevel(level);
            const isFullyPassed = reachedSub === SUB_LEVELS_PER_REALM && !isCurrent;
            const isNext = levelInfo.nextLevel?.name === level.name;
            const isLocked = reachedSub === 0 && !isCurrent && !isNext;

            return (
              <div
                key={level.name}
                className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-800/80'
                    : isFullyPassed
                    ? 'bg-slate-900/50'
                    : 'bg-slate-950/30'
                }`}
                style={{
                  borderColor: isCurrent ? level.color : isNext ? `${level.color}60` : '#1e293b',
                }}
              >
                {/* Level emoji */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    backgroundColor: `${level.color}20`,
                    opacity: isLocked ? 0.3 : 1,
                  }}
                >
                  {level.emoji}
                </div>

                {/* Level info + sub-level dots */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold"
                      style={{ color: isLocked ? '#64748b' : level.color }}
                    >
                      {level.name}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: level.color }}
                      >
                        HIỆN TẠI · BẬC {levelInfo.subLevel}
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        TIẾP THEO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mb-1.5">
                    {level.rank} · {level.minExp.toLocaleString()}+ EXP
                  </p>

                  {/* Mini sub-level dots */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: SUB_LEVELS_PER_REALM }, (_, i) => i + 1).map((s) => {
                      const reached = s <= reachedSub;
                      return (
                        <div
                          key={s}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: reached ? level.color : '#334155',
                            opacity: isLocked ? 0.3 : 1,
                          }}
                        />
                      );
                    })}
                    {isFullyPassed && (
                      <span className="text-[9px] text-emerald-500 font-bold ml-1">
                        ✓ {reachedSub}/{SUB_LEVELS_PER_REALM}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-bold ml-1" style={{ color: level.color }}>
                        {reachedSub}/{SUB_LEVELS_PER_REALM}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover description tooltip */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 w-56 text-right">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0 w-6 flex justify-center">
                  {isFullyPassed ? (
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-sm" />
                  ) : isCurrent ? (
                    <FontAwesomeIcon icon={faBolt} className="text-sm" style={{ color: level.color }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatMini: React.FC<{
  icon: any;
  label: string;
  value: number | string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
    <FontAwesomeIcon icon={icon} className={`${color} text-base`} />
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">{label}</p>
      <p className={`text-lg font-extrabold ${color} truncate`}>{value}</p>
    </div>
  </div>
);
