import { useEffect, useRef } from 'react';

// Each blob: [phaseStart, colorIdx, rxFrac, ryFrac, yFrac]
const BLOB_DEFS = [
  [0.00, 0, 0.40, 0.33, 0.18],
  [0.17, 1, 0.34, 0.28, 0.62],
  [0.33, 0, 0.37, 0.31, 0.78],
  [0.50, 1, 0.31, 0.26, 0.40],
  [0.67, 0, 0.38, 0.30, 0.54],
  [0.83, 1, 0.35, 0.32, 0.25],
];

// Header dots: [phaseStart, colorIdx, radius, yFrac]
const DOT_DEFS = [
  [0.00, 0, 4, 0.30],
  [0.07, 1, 3, 0.65],
  [0.14, 0, 5, 0.45],
  [0.21, 1, 3, 0.25],
  [0.28, 0, 3, 0.70],
  [0.35, 1, 5, 0.40],
  [0.42, 0, 4, 0.60],
  [0.49, 1, 3, 0.30],
  [0.56, 0, 5, 0.55],
  [0.63, 1, 4, 0.70],
  [0.70, 0, 3, 0.35],
  [0.77, 1, 4, 0.55],
  [0.84, 0, 5, 0.45],
  [0.91, 1, 3, 0.65],
];

const COLORS  = [[215, 95, 62], [72, 148, 108]];
const MAX_OPS = [0.70, 0.60];

const X_OFF  = -0.4;
const X_SPAN =  1.8;
const SPEED  =  0.026;

function dotX(phase, w) { return (X_OFF + phase * X_SPAN) * w; }

function edgeFade(x, rx, w) {
  const fade = w * 0.20;
  const lo = -rx * 0.2, hi = w + rx * 0.2;
  if (x < lo + fade) return Math.max(0, (x - lo) / fade);
  if (x > hi - fade) return Math.max(0, (hi - x) / fade);
  return 1;
}

export default function HomeBg({ showCutout = true, compact = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, elapsed = 0, lastTs = null;

    function resize() {
      canvas.width  = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || (compact ? 64 : window.innerHeight);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.fonts.ready.then(() => { lastTs = null; });

    function draw(ts) {
      if (lastTs !== null) elapsed += (ts - lastTs) / 1000;
      lastTs = ts;

      const w = canvas.width, h = canvas.height;
      if (!w || !h) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, w, h);

      if (compact) {
        // ── Header: rolling dots ───────────────────────────────────────
        ctx.filter = 'blur(1.5px)';
        ctx.globalCompositeOperation = 'source-over';

        for (const [p0, ci, r, yF] of DOT_DEFS) {
          const phase = (p0 + elapsed * SPEED) % 1;
          const x = dotX(phase, w);
          const y = yF * h + Math.sin(elapsed * 0.4 + p0 * 11) * h * 0.10;
          const fade = edgeFade(x, r * 3, w);
          if (fade <= 0) continue;
          const [rc, gc, bc] = COLORS[ci];
          ctx.fillStyle = `rgba(${rc},${gc},${bc},${0.55 * fade})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.filter = 'none';
      } else {
        // ── Full page: rolling blobs ───────────────────────────────────
        ctx.filter = 'blur(72px)';
        ctx.globalCompositeOperation = 'source-over';

        for (const [p0, ci, rxF, ryF, yF] of BLOB_DEFS) {
          const phase = (p0 + elapsed * SPEED) % 1;
          const x  = dotX(phase, w);
          const rx = rxF * w;
          const ry = ryF * h;
          const y  = yF * h + Math.sin(elapsed * 0.38 + p0 * 9) * h * 0.09;
          const fade = edgeFade(x, rx, w);
          if (fade <= 0) continue;
          const [r, g, b] = COLORS[ci];
          ctx.fillStyle = `rgba(${r},${g},${b},${MAX_OPS[ci] * fade})`;
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.filter = 'none';

        if (showCutout) {
          ctx.globalCompositeOperation = 'destination-out';
          const fs = Math.min(300, Math.max(100, w * 0.20));
          ctx.font = `700 ${fs}px 'Space Grotesk', 'Inter', system-ui, sans-serif`;
          if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.05em';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle    = '#000';
          ctx.fillText('Groundwork', w / 2, 20);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [compact]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
