import type { ReactNode, CSSProperties } from 'react';
import './Loading.css';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'overlay' | 'inline';

interface Props {
  /** Trạng thái loading — false thì render `children` (hoặc null). */
  active?: boolean;
  /** `overlay` phủ toàn màn hình (fixed + backdrop blur), `inline` nằm trong flow. */
  variant?: Variant;
  /** Kích thước logo + vòng chấm. */
  size?: Size;
  /** Thông điệp hiển thị dưới vòng xoay. */
  label?: ReactNode;
  /** Nội dung render khi `active` là false (chỉ dùng cho `inline`). */
  children?: ReactNode;
  /** Đường dẫn logo (mặc định logo.png trong public). */
  logo?: string;
}

const LOGO_PX: Record<Size, number> = { sm: 24, md: 40, lg: 64 };
const RING_RADIUS: Record<Size, number> = { sm: 16, md: 26, lg: 42 };
const DOT_COUNT = 12;

export default function Loading({
  active = true,
  variant = 'inline',
  size = 'md',
  label,
  children,
  logo = 'logo.png',
}: Props) {
  if (!active) return <>{children ?? null}</>;

  const visualEl = (
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
        src={logo}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: LOGO_PX[size], height: LOGO_PX[size] }}
      />
    </div>
  );

  if (variant === 'overlay') {
    return (
      <div className="ld-overlay">
        <div className="ld-stack">
          {visualEl}
          {label && <div className="ld-label">{label}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ld-inline">
      <div className="ld-stack">
        {visualEl}
        {label && <div className="ld-label">{label}</div>}
      </div>
    </div>
  );
}
