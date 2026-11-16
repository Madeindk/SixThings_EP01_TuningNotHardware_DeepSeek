/* 6 THINGS motion-graphics base.
 *
 * Adapted from shared/animation-reference/lib.js, which is the architecture this
 * series is meant to use: a canvas-2D overlay for all type, HUD and charts, drawn
 * over a Three.js plate. Every text call registers its box, and endFrame() reports
 * overlaps and safe-area breaches in window.__issues — so the QA the style lock
 * demands is measured, not assumed.
 *
 * Changes from the reference: the 6 Things palette instead of Inside the Log
 * navy/gold, and the three bundled OFL faces instead of Inter.
 */

export const W = 1920, H = 1080;
export const SAFE = { x: 96, y: 72 };

export const C = {
  paper: '#F4F1EA', ink: '#111111', ink2: '#5E5B55',
  accent: '#EC4118',
  void: '#0B0E12', studio: '#1A2027', spot: '#C9D6DE',
  airflow: '#8FE8DF',
  hudline: '#5D6B75', hudtext: '#E6ECEF', huddim: '#8E9BA3',
  teal: '#4FE0CF',
};

export const F = {
  display: 'BC',       // Barlow Condensed, weight 800/900
  text: 'IT',          // Inter Tight, 100..900
  mono: 'JM',          // JetBrains Mono, 100..800
};

export const ease = {
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  expo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  quart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
};

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, u) => a + (b - a) * u;
export const fade = (t, a, b, dur = 0.5) => ease.io(seg(t, a, a + dur)) * (1 - ease.io(seg(t, b - dur, b)));

/* ------------------------------------------------------------------ */
/* fonts: the bundled OFL faces, loaded before the first frame        */
/* ------------------------------------------------------------------ */
const FONT_FILES = [
  ['BC', 800, 'BarlowCondensed-ExtraBold.ttf'],
  ['BC', 900, 'BarlowCondensed-Black.ttf'],
  ['IT', 400, 'InterTight-VariableFont_wght.ttf'],
  ['JM', 400, 'JetBrainsMono-VariableFont_wght.ttf'],
];

export async function loadFonts(base) {
  const faces = FONT_FILES.map(async ([family, weight, file]) => {
    try {
      const ff = new FontFace(family, `url(${base}/SixThings_EP01/style/fonts/${file})`, { weight: String(weight) });
      await ff.load();
      document.fonts.add(ff);
    } catch (e) {
      // file:// blocks font fetches; the renderer serves over http, so this is a real error
      console.error('font failed', file, e.message);
    }
  });
  await Promise.all(faces);
  return document.fonts.ready;
}

/* ------------------------------------------------------------------ */
/* audit: overlaps and safe-area breaches                             */
/* ------------------------------------------------------------------ */
let boxes = [];
window.__issues = window.__issues || [];
export function beginFrame() { boxes = []; }

export function reg(x, y, w, h, s, a) { boxes.push({ x, y, w, h, s, a }); }

export function endFrame(t) {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.a < 0.05 || b.a < 0.05) continue;
      if (a.x < b.x + b.w + 6 && b.x < a.x + a.w + 6 && a.y < b.y + b.h + 6 && b.y < a.y + a.h + 6) {
        window.__issues.push(`t=${t.toFixed(2)} OVERLAP "${a.s}" / "${b.s}"`);
      }
    }
  }
  for (const a of boxes) {
    if (a.a < 0.05) continue;
    if (a.x < SAFE.x - 1 || a.y < SAFE.y - 1 || a.x + a.w > W - SAFE.x + 1 || a.y + a.h > H - SAFE.y + 1) {
      window.__issues.push(`t=${t.toFixed(2)} OUTSIDE SAFE "${a.s}"`);
    }
  }
  window.__lastBoxes = boxes.filter((a) => a.a >= 0.05).map((a) => [
    Math.round(a.x), Math.round(a.y), Math.round(a.w), Math.round(a.h), +a.a.toFixed(2), a.s,
  ]);
}

/* ------------------------------------------------------------------ */
/* text                                                              */
/* ------------------------------------------------------------------ */
export function text(g, s, x, y, o = {}) {
  const {
    size = 30, weight = 500, color = C.ink, align = 'left', base = 'alphabetic',
    alpha = 1, track = 0, font = F.text, register = true, upper = false,
  } = o;
  if (alpha <= 0.001) return null;
  const str = upper ? String(s).toUpperCase() : String(s);
  g.save();
  g.globalAlpha = alpha;
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = base;
  if (track) g.letterSpacing = track + 'px';
  const m = g.measureText(str);
  g.fillText(str, x, y);
  g.restore();

  const w = m.width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const asc = size * 0.76, desc = size * 0.24;
  const y0 = base === 'middle' ? y - size * 0.5 : base === 'top' ? y : y - asc;
  if (register) reg(x0, y0, w, asc + desc, str, alpha);
  return { x: x0, y: y0, w, h: asc + desc };
}

/* E display type: oversized, tracked in and cropped on purpose. */
export function display(g, s, x, y, size, o = {}) {
  return text(g, s, x, y, {
    size, weight: 900, font: F.display, color: C.ink, upper: true,
    track: -size * 0.015, ...o,
  });
}

export function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/* ------------------------------------------------------------------ */
/* panels and charts (F mode)                                        */
/* ------------------------------------------------------------------ */
export function hudPanel(g, x, y, w, h, title, tag, alpha = 1) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha;
  rrect(g, x, y, w, h, 6);
  g.fillStyle = 'rgba(11,14,18,0.62)';
  g.fill();
  g.lineWidth = 1.2;
  g.strokeStyle = C.hudline;
  g.stroke();
  g.restore();

  text(g, title, x + 22, y + 34, { size: 22, weight: 600, color: C.hudtext, track: 3.1, upper: true, alpha });
  if (tag) {
    text(g, tag, x + w - 22, y + 34, { size: 18, weight: 500, color: C.huddim, track: 2, upper: true, align: 'right', alpha });
  }
  g.save();
  g.globalAlpha = alpha;
  g.beginPath();
  g.moveTo(x + 16, y + 48.5); g.lineTo(x + w - 16, y + 48.5);
  g.strokeStyle = 'rgba(93,107,117,0.6)'; g.lineWidth = 1; g.stroke();
  g.restore();
}

export function legend(g, x, y, items, alpha = 1) {
  let cx = x;
  for (const [kind, label] of items) {
    g.save();
    g.globalAlpha = alpha;
    g.lineWidth = kind === 'teal' ? 3 : 2;
    if (kind === 'sp') { g.setLineDash([9, 7]); g.strokeStyle = C.hudtext; }
    else if (kind === 'teal') g.strokeStyle = C.teal;
    else if (kind === 'acc') g.strokeStyle = C.accent;
    else g.strokeStyle = C.huddim;
    g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + 24, y); g.stroke();
    g.setLineDash([]);
    g.restore();
    text(g, label, cx + 32, y + 6, { size: 18, weight: 400, color: C.huddim, alpha });
    cx += 32 + g.measureText(label).width * 1.15 + 26;
  }
}

/* Axis frame with ticks, zero line and real units. */
export function axis(g, box, o = {}) {
  const { xTicks = [], yTicks = [], xLabel = '', yLabel = '', zeroY = null, alpha = 1 } = o;
  const { x0, x1, y0, y1 } = box;
  g.save();
  g.globalAlpha = alpha;
  for (const [label, py] of yTicks) {
    g.beginPath(); g.moveTo(x0, py); g.lineTo(x1, py);
    g.strokeStyle = 'rgba(93,107,117,0.35)'; g.lineWidth = 1; g.stroke();
    text(g, String(label), x0 - 12, py + 5, { size: 18, font: F.mono, color: C.huddim, align: 'right', alpha });
  }
  for (const [label, px] of xTicks) {
    g.beginPath(); g.moveTo(px, y0); g.lineTo(px, y1);
    g.strokeStyle = 'rgba(93,107,117,0.35)'; g.lineWidth = 1; g.stroke();
    text(g, String(label), px, y0 + 24, { size: 18, font: F.mono, color: C.huddim, align: 'center', alpha });
  }
  if (zeroY !== null) {
    g.beginPath(); g.moveTo(x0, zeroY); g.lineTo(x1, zeroY);
    g.strokeStyle = C.hudline; g.globalAlpha = alpha * 0.9; g.lineWidth = 1.2; g.stroke();
  }
  g.globalAlpha = alpha;
  g.strokeStyle = C.hudline; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.stroke();
  g.restore();
  if (xLabel) text(g, xLabel, (x0 + x1) / 2, y0 + 52, { size: 18, weight: 600, color: C.huddim, track: 1.44, align: 'center', upper: true, alpha });
  if (yLabel) {
    g.save(); g.globalAlpha = alpha; g.translate(x0 - 56, (y0 + y1) / 2); g.rotate(-Math.PI / 2);
    text(g, yLabel, 0, 0, { size: 18, weight: 600, color: C.huddim, track: 1.44, align: 'center', upper: true, alpha });
    g.restore();
  }
}

/* Draw a series left-to-right up to `progress`. */
export function series(g, ts, vs, n, box, map, o = {}) {
  const { color = C.teal, width = 2.4, dash = null, alpha = 1 } = o;
  const { x0, x1, y0, y1 } = box;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = color;
  g.lineWidth = width;
  if (dash) g.setLineDash(dash);
  g.beginPath();
  const step = Math.max(1, Math.floor(n / 1400));
  let first = true;
  for (let i = 0; i < n; i += step) {
    const px = map.px(ts[i], x0, x1);
    const py = map.py(vs[i], y0, y1);
    if (first) { g.moveTo(px, py); first = false; } else g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
}

export function markerLine(g, px, box, o = {}) {
  const { color = C.accent, width = 2, alpha = 1, dash = null } = o;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = color; g.lineWidth = width;
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(px, box.y0 - 6); g.lineTo(px, box.y1); g.stroke();
  g.restore();
}

/* The darkening gradient the style lock puts behind the HUD panel. */
export function panelGradient(g, x = 1120) {
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(11,14,18,0)');
  grad.addColorStop(0.45, 'rgba(11,14,18,0)');
  grad.addColorStop(0.62, 'rgba(11,14,18,0.70)');
  grad.addColorStop(1, 'rgba(11,14,18,0.82)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
}

/* Corner brackets: framing, not branding. */
export function brackets(g, alpha = 0.55) {
  const i = 64, arm = 70;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = C.hudline;
  g.lineWidth = 2;
  const corner = (x, y, sx, sy) => {
    g.beginPath();
    g.moveTo(x, y + sy * arm); g.lineTo(x, y); g.lineTo(x + sx * arm, y);
    g.stroke();
  };
  corner(i, i, 1, 1);
  corner(W - i, i, -1, 1);
  corner(i, H - i, 1, -1);
  corner(W - i, H - i, -1, -1);
  g.restore();
}

/* Vignette, so the studio floor falls off to void. */
export function vignette(g) {
  const v = g.createRadialGradient(W * 0.42, H * 0.42, H * 0.35, W * 0.5, H * 0.5, W * 0.78);
  v.addColorStop(0, 'rgba(11,14,18,0)');
  v.addColorStop(1, 'rgba(11,14,18,0.85)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}

/* ------------------------------------------------------------------ */
/* deterministic noise (charts only, never layout)                   */
/* ------------------------------------------------------------------ */
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
