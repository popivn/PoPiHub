import type { ReactNode, CSSProperties } from 'react';
import './Loading.css';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'overlay' | 'inline';
/** Kiểu visual của loading. */
type Visual = 'ring' | 'spinner' | 'bar';

interface Props {
  /** Trạng thái loading — false thì render `children` (hoặc null nếu không có). */
  active?: boolean;
  /** Bật chế độ phủ toàn màn hình (fixed + backdrop blur). */
  variant?: Variant;
  /** Kiểu visual: `ring` (logo + 12 chấm xoay), `spinner` (vòng tròn), `bar` (thanh ngang 0→100%). */
  visual?: Visual;
  /** Kích thước. */
  size?: Size;
  /** Thông điệp hiển thị dưới visual. */
  label?: ReactNode;
  /** Nội dung sẽ render khi `active` là false (chỉ dùng cho `inline`). */
  children?: ReactNode;
  /** Bọc inline trong một container có chiều cao tối thiểu để tránh layout jitter. */
  minHeight?: number | string;
  /** (Legacy) bật spinner tròn thay vì ring. Tương đương `visual="spinner"`. */
  spinner?: boolean;
  /** Thời gian một vòng fill của bar (ms). Mặc định 1800ms. */
  duration?: number;
  /** Path icon đi kèm bar (mặc định /logo.png). */
  icon?: string;
}

const SPINNER_PX: Record<Size, number> = { sm: 18, md: 32, lg: 56 };
const LOGO_PX: Record<Size, number> = { sm: 28, md: 48, lg: 80 };
const RING_RADIUS: Record<Size, number> = { sm: 18, md: 30, lg: 48 };
const BAR_WIDTH: Record<Size, number> = { sm: 160, md: 240, lg: 320 };
const BAR_HEIGHT: Record<Size, number> = { sm: 8, md: 12, lg: 16 };
const BAR_ICON: Record<Size, number> = { sm: 16, md: 22, lg: 30 };
const DOT_COUNT = 12;

export default function Loading({
  active = true,
  variant = 'inline',
  visual,
  size = 'md',
  label,
  children,
  minHeight,
  spinner = false,
  duration = 1800,
  icon = '/logo.png',
}: Props) {
  if (!active) return <>{children ?? null}</>;

  const resolvedVisual: Visual = visual ?? (spinner ? 'spinner' : 'ring');

  let visualEl: ReactNode;
  if (resolvedVisual === 'spinner') {
    visualEl = (
      <span
        className="ld-spinner"
        style={{
          width: SPINNER_PX[size],
          height: SPINNER_PX[size],
          borderWidth: Math.max(2, Math.round(SPINNER_PX[size] / 10)),
        }}
        aria-label="Loading"
        role="status"
      />
    );
  } else if (resolvedVisual === 'bar') {
    const iconSize = BAR_ICON[size];
    const barH = BAR_HEIGHT[size];
    // Icon nằm giữa thanh (center vertically) — kích thước icon lớn hơn bar một chút,
    // trồi lên trên để nhìn rõ. left = 0% → 100% theo đầu fill.
    const barStyle = {
      '--ld-bar-w': `${BAR_WIDTH[size]}px`,
      '--ld-bar-h': `${barH}px`,
      '--ld-bar-icon': `${iconSize}px`,
      '--ld-bar-duration': `${duration}ms`,
    } as CSSProperties;
    visualEl = (
      <div className="ld-bar" style={barStyle} role="status" aria-label="Loading">
        <div className="ld-bar-track">
          <div className="ld-bar-fill" />
          <img
            className="ld-bar-icon"
            src={icon}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{ width: iconSize, height: iconSize, top: `${(barH - iconSize) / 2}px` }}
          />
        </div>
        {label && <div className="ld-label">{label}</div>}
      </div>
    );
  } else {
    visualEl = (
      <div
        className="ld-logo-ring"
        style={{
          width: LOGO_PX[size] + RING_RADIUS[size] * 2,
          height: LOGO_PX[size] + RING_RADIUS[size] * 2,
        }}
        role="status"
        aria-label="Loading"
      >
        <div
          className="ld-dots"
          style={{ '--ld-radius': `${RING_RADIUS[size]}px` } as CSSProperties}
        >
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <span
              key={i}
              className="ld-dot"
              style={{ '--ld-i': i, '--ld-n': DOT_COUNT } as CSSProperties}
            />
          ))}
        </div>
        <img
          className="ld-logo"
          src="/logo.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ width: LOGO_PX[size], height: LOGO_PX[size] }}
        />
      </div>
    );
  }

  // Bar đã tự render label bên trong; ring/spinner render label ngoài stack.
  const showExternalLabel = resolvedVisual !== 'bar' && label;

  if (variant === 'overlay') {
    return (
      <div className="ld-overlay">
        <div className="ld-stack">
          {visualEl}
          {showExternalLabel && <div className="ld-label">{label}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ld-inline" style={minHeight ? { minHeight } : undefined}>
      <div className="ld-stack">
        {visualEl}
        {showExternalLabel && <div className="ld-label">{label}</div>}
      </div>
    </div>
  );
}
