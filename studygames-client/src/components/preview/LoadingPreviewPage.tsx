import { useState, useRef, useEffect } from 'react';
import { Loading } from '../helpers';
import './LoadingPreviewPage.css';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Size[] = ['sm', 'md', 'lg'];

export default function LoadingPreviewPage() {
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayLabel, setOverlayLabel] = useState('Đang khởi tạo thế giới Xianria…');
  const [overlayDuration, setOverlayDuration] = useState(2500);
  const [overlayVisual, setOverlayVisual] = useState<'ring' | 'spinner' | 'bar'>('ring');

  const [inlineActive, setInlineActive] = useState(false);
  const [inlineDuration, setInlineDuration] = useState(2000);

  const [simulatedContent, setSimulatedContent] = useState(false);
  const [simDuration, setSimDuration] = useState(1500);

  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const runOverlay = () => {
    setOverlayActive(true);
    const id = window.setTimeout(() => setOverlayActive(false), overlayDuration);
    timersRef.current.push(id);
  };

  const runInline = () => {
    setInlineActive(true);
    const id = window.setTimeout(() => setInlineActive(false), inlineDuration);
    timersRef.current.push(id);
  };

  const runSimulated = () => {
    setSimulatedContent(false);
    const id = window.setTimeout(() => setSimulatedContent(true), simDuration);
    timersRef.current.push(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <header className="px-6 py-8 border-b border-teal-500/10">
        <h1 className="font-pacifico italic text-3xl sm:text-4xl text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]">
          Loading Showcase
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Trang demo component <code className="text-teal-300">&lt;Loading /&gt;</code> — chỉ gọi component và truyền text.
        </p>
      </header>

      <main className="flex-1 px-6 py-8 space-y-10 max-w-4xl w-full mx-auto">
        {/* SECTION 1: Inline — ring (mặc định) */}
        <section className="lpp-section">
          <h2 className="lpp-h2">1. Ring (mặc định — logo + 12 chấm xoay)</h2>
          <p className="lpp-desc">
            <code className="text-teal-300">&lt;Loading visual="ring" label="..." size="..." /&gt;</code>
          </p>

          <div className="lpp-grid">
            {SIZES.map((s) => (
              <div key={`ring-${s}`} className="lpp-card">
                <div className="lpp-card-head">
                  <span className="lpp-tag">ring · size: {s}</span>
                </div>
                <div className="lpp-card-body">
                  <Loading visual="ring" size={s} label="Đang tải…" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 1b: Inline — bar */}
        <section className="lpp-section">
          <h2 className="lpp-h2">1b. Bar (thanh ngang 0→100%, icon chạy giữa)</h2>
          <p className="lpp-desc">
            <code className="text-teal-300">&lt;Loading visual="bar" label="..." size="..." /&gt;</code>
          </p>

          <div className="lpp-grid">
            {SIZES.map((s) => (
              <div key={`bar-${s}`} className="lpp-card">
                <div className="lpp-card-head">
                  <span className="lpp-tag">bar · size: {s}</span>
                </div>
                <div className="lpp-card-body">
                  <Loading visual="bar" size={s} label="Đang tải…" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 1c: Inline — spinner (legacy) */}
        <section className="lpp-section">
          <h2 className="lpp-h2">1c. Spinner (vòng tròn đơn giản)</h2>
          <p className="lpp-desc">
            <code className="text-teal-300">&lt;Loading visual="spinner" size="..." /&gt;</code>
          </p>

          <div className="lpp-grid">
            {SIZES.map((s) => (
              <div key={`spin-${s}`} className="lpp-card">
                <div className="lpp-card-head">
                  <span className="lpp-tag">spinner · size: {s}</span>
                </div>
                <div className="lpp-card-body">
                  <Loading visual="spinner" size={s} label="Đang tải…" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Inline + children swap */}
        <section className="lpp-section">
          <h2 className="lpp-h2">2. Inline + children swap (fetch data)</h2>
          <p className="lpp-desc">
            <code className="text-teal-300">active=false</code> → render children.
          </p>

          <div className="lpp-controls">
            <label className="lpp-control">
              <span>Delay (ms)</span>
              <input
                type="number"
                value={simDuration}
                min={200}
                step={100}
                onChange={(e) => setSimDuration(Number(e.target.value) || 1500)}
              />
            </label>
            <button type="button" className="lpp-btn" onClick={runSimulated}>
              Simulate fetch
            </button>
          </div>

          <div className="lpp-card">
            <div className="lpp-card-body">
              <Loading active={!simulatedContent} size="md" label="Đang lấy bài học…" minHeight={160}>
                {simulatedContent && (
                  <ul className="lpp-fake-list">
                    <li>Bài 1 — Bộ thủ 一 (Một)</li>
                    <li>Bài 2 — Bộ thủ 丨 (Trụ)</li>
                    <li>Bài 3 — Bộ thủ 丿 (Phiệt)</li>
                    <li>Bài 4 — Bộ thủ 乙 (Ất)</li>
                  </ul>
                )}
              </Loading>
            </div>
          </div>
        </section>

        {/* SECTION 3: Inline toggle */}
        <section className="lpp-section">
          <h2 className="lpp-h2">3. Inline toggle</h2>
          <p className="lpp-desc">
            Bật loading trong {inlineDuration}ms rồi tự tắt.
          </p>

          <div className="lpp-controls">
            <label className="lpp-control">
              <span>Duration (ms)</span>
              <input
                type="number"
                value={inlineDuration}
                min={300}
                step={100}
                onChange={(e) => setInlineDuration(Number(e.target.value) || 2000)}
              />
            </label>
            <button type="button" className="lpp-btn" onClick={runInline} disabled={inlineActive}>
              {inlineActive ? 'Loading…' : 'Trigger'}
            </button>
          </div>

          <div className="lpp-card">
            <div className="lpp-card-body">
              <Loading active={inlineActive} size="lg" label="Đang đồng bộ tiến trình…" minHeight={180}>
                <p className="lpp-placeholder">Nội dung sẽ hiện ở đây khi loading xong.</p>
              </Loading>
            </div>
          </div>
        </section>

        {/* SECTION 4: Overlay */}
        <section className="lpp-section">
          <h2 className="lpp-h2">4. Overlay (phủ toàn màn hình)</h2>
          <p className="lpp-desc">
            <code className="text-teal-300">variant="overlay"</code> — z-index 100000, backdrop blur.
          </p>

          <div className="lpp-controls">
            <label className="lpp-control">
              <span>Visual</span>
              <select
                value={overlayVisual}
                onChange={(e) => setOverlayVisual(e.target.value as 'ring' | 'spinner' | 'bar')}
              >
                <option value="ring">ring</option>
                <option value="bar">bar</option>
                <option value="spinner">spinner</option>
              </select>
            </label>
            <label className="lpp-control">
              <span>Label</span>
              <input
                type="text"
                value={overlayLabel}
                onChange={(e) => setOverlayLabel(e.target.value)}
              />
            </label>
            <label className="lpp-control">
              <span>Duration (ms)</span>
              <input
                type="number"
                value={overlayDuration}
                min={300}
                step={100}
                onChange={(e) => setOverlayDuration(Number(e.target.value) || 2500)}
              />
            </label>
            <button type="button" className="lpp-btn lpp-btn-primary" onClick={runOverlay} disabled={overlayActive}>
              {overlayActive ? 'Đang chạy…' : 'Trigger overlay'}
            </button>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 text-center border-t border-slate-800/50 text-slate-500 text-xs">
        Route: <code className="text-teal-300">/view/loading</code> · Component:{' '}
        <code className="text-teal-300">src/components/Loading.tsx</code>
      </footer>

      {overlayActive && (
        <Loading variant="overlay" visual={overlayVisual} size="lg" label={overlayLabel} />
      )}
    </div>
  );
}
