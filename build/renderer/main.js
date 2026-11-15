/* 6 THINGS EP01 — deterministic frame renderer.
 *
 * Everything on screen is a function of (scene, beat, t). No clock, no
 * Math.random, no async animation: two runs of the same frame produce the same
 * pixels, which is what makes the render resumable and the timing exact.
 *
 * Modes follow STYLE_6THINGS.md:
 *   [F] Cinematic — dimensional quad in a dark studio, one cool spotlight,
 *       translucent airflow, thin HUD with teal measured data.
 *   [E] Editorial — paper, oversized cropped Barlow Condensed, cut-out quad,
 *       single red-orange accent.
 * The accent means "this is the problem" in both modes. Teal is measured data.
 */

import * as THREE from '../node_modules/three/build/three.module.js';

const C = {
  paper: '#F4F1EA', ink: '#111111', ink2: '#5E5B55', accent: '#EC4118',
  void: '#0B0E12', studio: '#1A2027', spot: '#C9D6DE', airflow: '#8FE8DF',
  hudline: '#5D6B75', hudtext: '#E6ECEF', huddim: '#8E9BA3', teal: '#4FE0CF',
};

/* ------------------------------------------------------------------ */
/* deterministic helpers                                              */
/* ------------------------------------------------------------------ */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

/* ------------------------------------------------------------------ */
/* synthetic data (seeded formulas, matching the style lock)          */
/* ------------------------------------------------------------------ */
function rateTrace(seed, dur, opts = {}) {
  const {
    wn = 2 * Math.PI * 9, zeta = 0.75, amp = 320, start = 0.15, end = 0.5,
    burst = null, burstAmp = 85, burstHz = 38, noise = 3, throttle = null, dt = 0.002,
  } = opts;
  const rng = mulberry32(seed);
  const n = Math.round(dur / dt);
  const t = new Float64Array(n), sp = new Float64Array(n), gy = new Float64Array(n);
  let g = 0, v = 0;
  for (let i = 0; i < n; i++) {
    const ti = i * dt; t[i] = ti;
    sp[i] = ti > start && ti < end ? amp * Math.sin(Math.PI * (ti - start) / (end - start)) ** 2 : 0;
    const a = wn * wn * (sp[i] - g) - 2 * zeta * wn * v;
    v += a * dt; g += v * dt;
    let val = g;
    if (burst) {
      const [b0, b1, hz, a2] = burst;
      const env = ti > b0 && ti < b1 ? Math.sin(Math.PI * (ti - b0) / (b1 - b0)) ** 2 : 0;
      val += a2 * env * Math.sin(2 * Math.PI * hz * ti);
    }
    gy[i] = val + (rng() - 0.5) * 2 * noise;
  }
  let thr = null;
  if (throttle) {
    thr = new Float64Array(n);
    const [lo, hi, v0, v1] = throttle;
    for (let i = 0; i < n; i++) thr[i] = t[i] >= lo && t[i] < hi ? v1 : v0;
    // 40 ms smoothing
    const w = Math.round(0.04 / dt);
    const sm = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) { s += thr[j]; c++; } }
      sm[i] = s / c;
    }
    thr = sm;
  }
  return { t, sp, gy, thr, dt };
}

function stepTrace(seed, opts = {}) {
  const { wn = 2 * Math.PI * 14, zeta = 0.35, dur = 0.5, noise = 0.004, dt = 0.0005 } = opts;
  const rng = mulberry32(seed);
  const n = Math.round(dur / dt);
  const t = new Float64Array(n), sp = new Float64Array(n), gy = new Float64Array(n);
  let g = 0, v = 0;
  for (let i = 0; i < n; i++) {
    const ti = i * dt; t[i] = ti;
    sp[i] = ti >= 0.05 ? 1 : 0;
    const a = wn * wn * (sp[i] - g) - 2 * zeta * wn * v;
    v += a * dt; g += v * dt;
    gy[i] = g + (rng() - 0.5) * 2 * noise;
  }
  return { t, sp, gy, dt };
}

function spectrumBars(seed, opts = {}) {
  const { n = 96, hump = 38, humpW = 10, humpAmp = 1.0, floor = 0.12, tilt = 0.55 } = opts;
  const rng = mulberry32(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const g = Math.exp(-Math.pow((i - hump) / humpW, 2)) * humpAmp;
    out[i] = clamp(floor + tilt * Math.pow(1 - x, 1.6) + g + (rng() - 0.5) * 0.06, 0, 1.3);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* SVG helpers                                                        */
/* ------------------------------------------------------------------ */
const nf = (v, d = 1) => v.toFixed(d);

function polyline(xs, ys, x0, x1, y0, y1, X0, X1, Y0, Y1, step = 1) {
  const pts = [];
  for (let i = 0; i < xs.length; i += step) {
    const px = x0 + (xs[i] - X0) / (X1 - X0) * (x1 - x0);
    const py = y1 - (ys[i] - Y0) / (Y1 - Y0) * (y1 - y0);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
}

function axisFrame(x0, x1, y0, y1, o = {}) {
  const {
    xTicks = [], yTicks = [], xLabel = '', yLabel = '', zeroY = null,
    grid = C.hudline, num = C.huddim, label = C.huddim, axis = C.hudline,
  } = o;
  let s = '';
  // horizontal grid + numeric ticks
  for (const [v, py] of yTicks) {
    s += `<line x1="${x0}" y1="${py}" x2="${x1}" y2="${py}" stroke="${grid}" stroke-opacity="0.35" stroke-width="1"/>`;
    s += `<text x="${x0 - 10}" y="${py + 5}" fill="${num}" font-family="JM" font-size="18" text-anchor="end">${v}</text>`;
  }
  for (const [v, px] of xTicks) {
    s += `<line x1="${px}" y1="${y0}" x2="${px}" y2="${y1}" stroke="${grid}" stroke-opacity="0.35" stroke-width="1"/>`;
    s += `<text x="${px}" y="${y0 + 22}" fill="${num}" font-family="JM" font-size="18" text-anchor="middle">${v}</text>`;
  }
  s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${axis}" stroke-width="1.2"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${axis}" stroke-width="1.2"/>`;
  if (zeroY !== null) {
    s += `<line x1="${x0}" y1="${zeroY}" x2="${x1}" y2="${zeroY}" stroke="${axis}" stroke-opacity="0.9" stroke-width="1.2"/>`;
  }
  if (xLabel) s += `<text x="${(x0 + x1) / 2}" y="${y0 + 50}" fill="${label}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.44" text-anchor="middle">${xLabel}</text>`;
  if (yLabel) s += `<text x="${x0 - 54}" y="${(y0 + y1) / 2}" fill="${label}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.44" text-anchor="middle" transform="rotate(-90 ${x0 - 54} ${(y0 + y1) / 2})">${yLabel}</text>`;
  return s;
}

/* A two-trace HUD chart: dashed setpoint, teal gyro, optional throttle lane,
 * optional accent problem band and a single accent marker. */
function hudChart(o) {
  const {
    w = 656, h = 470, d, x0 = 78, x1 = 616, y0 = 44, y1 = 372,
    xMax = 1.6, yMax = 380, yMin = -120, xLabel = 'TIME (s)', yLabel = 'ROLL RATE (deg/s)',
    progress = 1, accentBand = null, marker = null, annotation = null,
    throttleLane = false, throttle = null, thrMax = 80,
    dashMarker = null,
  } = o;

  const X0 = 0, X1 = xMax, Y0 = yMin, Y1 = yMax;
  const yTicks = [];
  for (let v = -100; v <= yMax; v += 200) {
    const py = y1 - (v - Y0) / (Y1 - Y0) * (y1 - y0);
    yTicks.push([String(v), py]);
  }
  const xTicks = [];
  for (let v = 0; v <= xMax + 1e-9; v += 0.4) {
    const px = x0 + (v - X0) / (X1 - X0) * (x1 - x0);
    xTicks.push([v.toFixed(1), px]);
  }
  const zeroY = y1 - (0 - Y0) / (Y1 - Y0) * (y1 - y0);
  const thrH = throttleLane ? 66 : 0;
  const thrTop = throttleLane ? y0 + 6 : 0;

  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

  if (accentBand) {
    const [b0, b1] = accentBand;
    const px0 = x0 + (b0 - X0) / (X1 - X0) * (x1 - x0);
    const px1 = x0 + (b1 - X0) / (X1 - X0) * (x1 - x0);
    s += `<rect x="${px0}" y="${y0 - 6}" width="${px1 - px0}" height="${y1 - y0 + 12}" fill="${C.accent}" fill-opacity="0.12"/>`;
  }

  s += axisFrame(x0, x1, y0, y1, { xTicks, yTicks, xLabel, yLabel, zeroY });

  if (throttleLane && throttle) {
    s += `<text x="${x0}" y="${thrTop + 12}" fill="${C.huddim}" font-family="IT" font-size="17" font-weight="500">THROTTLE</text>`;
    const ty0 = thrTop + 22, ty1 = thrTop + 22 + thrH - 22;
    const py = (v) => ty1 - clamp(v / thrMax, 0, 1) * (ty1 - ty0);
    const pts = [];
    for (let i = 0; i < throttle.t.length; i += 6) {
      const px = x0 + (throttle.t[i] - X0) / (X1 - X0) * (x1 - x0);
      if (px > x1) break;
      pts.push(`${px.toFixed(1)},${py(throttle.v[i]).toFixed(1)}`);
    }
    s += `<path d="M${pts.join(' L')}" fill="none" stroke="${C.huddim}" stroke-width="2" stroke-opacity="0.85"/>`;
    s += `<text x="${x1}" y="${thrTop + 12}" fill="${C.huddim}" font-family="JM" font-size="16" text-anchor="end">%</text>`;
  }

  if (dashMarker !== null) {
    const px = x0 + (dashMarker - X0) / (X1 - X0) * (x1 - x0);
    s += `<line x1="${px}" y1="${y0}" x2="${px}" y2="${y1}" stroke="${C.huddim}" stroke-width="1.6" stroke-dasharray="4 6"/>`;
  }

  // traces are drawn left -> right at constant speed (progress of the beat)
  const nUse = Math.max(2, Math.floor(d.t.length * clamp(progress, 0, 1)));
  if (nUse > 2) {
    s += `<path d="${polyline(d.sp.slice(0, nUse), d.t.slice(0, nUse), 0, xMax, yMin, yMax, x0, x1, y0, y1, 2).replace('M', 'M')}"
      fill="none" stroke="${C.hudtext}" stroke-width="2" stroke-dasharray="9 7"/>`;
    // polyline returns (x from ys, y from xs) — swap by building explicitly below
    s = s.replace(/<path d="M[^"]*" fill="none" stroke="#E6ECEF" stroke-width="2" stroke-dasharray="9 7"\/>/, '');
    s += `<path d="${tracePath(d.t, d.sp, nUse, x0, x1, y0, y1, 0, xMax, yMin, yMax)}" fill="none" stroke="${C.hudtext}" stroke-width="2" stroke-dasharray="9 7"/>`;
    s += `<path d="${tracePath(d.t, d.gy, nUse, x0, x1, y0, y1, 0, xMax, yMin, yMax)}" fill="none" stroke="${C.teal}" stroke-width="2.4"/>`;
  }

  if (marker !== null) {
    const px = x0 + (marker - X0) / (X1 - X0) * (x1 - x0);
    s += `<line x1="${px}" y1="${y0 - 6}" x2="${px}" y2="${y1}" stroke="${C.accent}" stroke-width="2"/>`;
  }
  if (annotation) {
    const [ax, ay, txt] = annotation;
    const px = x0 + (ax - X0) / (X1 - X0) * (x1 - x0);
    s += `<text x="${px}" y="${ay}" fill="${C.accent}" font-family="IT" font-size="19" font-weight="600">${txt}</text>`;
  }
  s += `</svg>`;
  return s;
}

function tracePath(ts, vs, nUse, x0, x1, y0, y1, X0, X1, Y0, Y1) {
  const pts = [];
  const step = Math.max(1, Math.floor(nUse / 900));
  for (let i = 0; i < nUse; i += step) {
    const px = x0 + (ts[i] - X0) / (X1 - X0) * (x1 - x0);
    const py = y1 - (vs[i] - Y0) / (Y1 - Y0) * (y1 - y0);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
}

/* ------------------------------------------------------------------ */
/* Three.js studio plate (F mode)                                     */
/* ------------------------------------------------------------------ */
let renderer, glScene, camera, quadGroup, props = [], motors = [], airflows = [], heatMat = null;
let treeMesh = null;

function initGL() {
  if (renderer) return;
  const canvas = document.getElementById('gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(1920, 1080, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;

  glScene = new THREE.Scene();
  glScene.background = new THREE.Color(C.void);
  glScene.fog = new THREE.Fog(C.void, 1600, 3600);

  camera = new THREE.PerspectiveCamera(32, 1920 / 1080, 10, 9000);
  camera.position.set(-120, 210, 900);

  // floor: studio falloff to void
  const floorGeo = new THREE.PlaneGeometry(6000, 6000, 1, 1);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x232b33, roughness: 0.88, metalness: 0.02 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -150;
  glScene.add(floor);

  glScene.add(new THREE.AmbientLight(0x3b4650, 2.4));

  // the single cool top light
  const spot = new THREE.SpotLight(C.spot, 2600, 0, Math.PI / 6.4, 0.6, 1.2);
  spot.position.set(-260, 900, 320);
  spot.target.position.set(0, 0, 0);
  glScene.add(spot, spot.target);

  const rim = new THREE.DirectionalLight(0x4a5a68, 1.5);
  rim.position.set(600, 320, -500);
  glScene.add(rim);

  // tree silhouette that the quad drops past
  const treeGeo = new THREE.ConeGeometry(150, 620, 12, 1, true);
  const treeMat = new THREE.MeshBasicMaterial({ color: 0x11161c, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  treeMesh = new THREE.Mesh(treeGeo, treeMat);
  treeMesh.position.set(-560, 130, -420);
  glScene.add(treeMesh);

  quadGroup = new THREE.Group();
  glScene.add(quadGroup);
  buildQuadInto(quadGroup);
}

export function buildQuadInto(group) {
  const carbon = new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.42, metalness: 0.35 });
  const alu = new THREE.MeshStandardMaterial({ color: 0x8d97a1, roughness: 0.35, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0d1116, roughness: 0.6, metalness: 0.5 });
  const propMat = new THREE.MeshStandardMaterial({ color: 0x1b2229, roughness: 0.55, metalness: 0.15, transparent: true, opacity: 0.94 });
  const quadGroup = group;

  // bottom plate + top plate
  const plate = new THREE.BoxGeometry(150, 8, 150);
  const bp = new THREE.Mesh(plate, carbon); bp.position.y = -8; quadGroup.add(bp);
  const tp = new THREE.Mesh(new THREE.BoxGeometry(96, 8, 96), carbon); tp.position.y = 20; quadGroup.add(tp);

  // arms + motors + props at the four corners
  const armLen = 200, armW = 26;
  const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  corners.forEach(([sx, sz], i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 9, armW), carbon);
    arm.position.set(sx * armLen * 0.42, -6, sz * armLen * 0.42);
    arm.rotation.y = Math.atan2(sz * armLen * 0.42, sx * armLen * 0.42);
    quadGroup.add(arm);

    const mx = sx * armLen * 0.82, mz = sz * armLen * 0.82;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 26, 22), alu);
    base.position.set(mx, 6, mz); quadGroup.add(base);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 30, 24), alu);
    bell.position.set(mx, 30, mz); quadGroup.add(bell);
    motors.push(bell);

    const prop = new THREE.Group();
    prop.position.set(mx, 46, mz);
    for (let b = 0; b < 2; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(170, 3, 22), propMat);
      blade.position.x = (b === 0 ? 1 : -1) * 85;
      blade.rotation.z = (b === 0 ? 1 : -1) * 0.18;
      prop.add(blade);
    }
    prop.userData.dir = (i % 2 === 0) ? 1 : -1;
    quadGroup.add(prop);
    props.push(prop);

    // translucent airflow around the prop
    const air = new THREE.Mesh(
      new THREE.CylinderGeometry(96, 96, 90, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: C.airflow, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
    );
    air.position.set(mx, 44, mz);
    quadGroup.add(air);
    airflows.push(air);
  });

  // camera + VTX nub
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), dark);
  camBody.position.set(0, 42, -58); quadGroup.add(camBody);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 10, 16), dark);
  lens.rotation.x = Math.PI / 2; lens.position.set(0, 44, -74); quadGroup.add(lens);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 74, 8), dark);
  ant.position.set(0, 74, 50); ant.rotation.x = -0.32; quadGroup.add(ant);
}

/* heat shimmer material for the motor-bell macro */
function heatShimmer(t) {
  const g = Math.sin(t * 3.1) * 0.5 + 0.5;
  return 0.05 + 0.06 * g;
}

/* ------------------------------------------------------------------ */
/* F-mode camera presets                                              */
/* ------------------------------------------------------------------ */
function applyCamera(preset, t) {
  initGL();
  const drift = easeInOutSine((Math.sin(t * 0.25) + 1) / 2);
  if (preset === 'macro') {
    camera.position.set(110 + drift * 26, 96, 300);
    camera.lookAt(118, 34, 40);
  } else if (preset === 'drop') {
    camera.position.set(-140 - drift * 20, 200 + Math.sin(t * 0.7) * 10, 880);
    camera.lookAt(-60, -20, 0);
  } else if (preset === 'wide') {
    camera.position.set(-40, 260, 980);
    camera.lookAt(0, 10, 0);
  } else if (preset === 'dim') {
    camera.position.set(-260, 300, 1100);
    camera.lookAt(180, 10, 0);
  } else {
    camera.position.set(-120 + drift * 30, 210, 900);
    camera.lookAt(0, 6, 0);
  }
}

/* ------------------------------------------------------------------ */
/* E-mode card builders                                               */
/* ------------------------------------------------------------------ */
function show(el, html) { el.innerHTML = html; el.style.display = ''; }
function hideE() {
  for (const id of ['counter', 'display', 'quadcut', 'label', 'mini', 'eBody']) {
    const el = document.getElementById(id);
    el.style.display = 'none'; el.innerHTML = '';
  }
}

function eSignCard({ num, word, wordPx, label1, label2, miniSvg, quad = true, wordTop = 150 }) {
  const counter = document.getElementById('counter');
  counter.style.display = '';
  counter.innerHTML = `<span class="cur">${num}</span> / 06<span class="dash"></span>`;

  const display = document.getElementById('display');
  display.style.display = '';
  display.style.top = wordTop + 'px';
  display.style.fontSize = wordPx + 'px';
  display.textContent = word;

  if (quad) {
    const q = document.getElementById('quadcut');
    q.style.display = '';
    q.style.backgroundImage = `url('assets/quad_cutout.png')`;
  }
  if (label1) {
    const l = document.getElementById('label');
    l.style.display = '';
    l.innerHTML = `<div class="rule"></div><div class="l1">${label1}</div>${label2 ? `<div class="l2">${label2}</div>` : ''}`;
  }
  if (miniSvg) {
    const m = document.getElementById('mini');
    m.style.display = '';
    m.innerHTML = miniSvg;
  }
}

function eTitleCard(t) {
  hideE();
  const reveal = clamp(t / 0.28, 0, 1);
  document.getElementById('display').style.display = '';
  const d = document.getElementById('display');
  d.style.top = '110px';
  d.style.fontSize = '640px';
  d.style.width = '1400px';
  d.innerHTML = `<span style="display:inline-block; transform:translateY(${(1 - easeOutCubic(reveal)) * 40}px); opacity:${easeOutCubic(reveal)}">6 SIGNS</span>`;
  const q = document.getElementById('quadcut');
  q.style.display = '';
  q.style.backgroundImage = `url('assets/quad_cutout.png')`;
  q.style.top = '300px';
  const b = document.getElementById('eBody');
  b.style.display = '';
  b.innerHTML = `
    <div style="position:absolute; left:96px; top:790px; width:1180px;">
      <div class="rule accent" style="width:96px; margin-bottom:20px;"></div>
      <div style="font-family:'IT'; font-weight:600; font-size:44px; letter-spacing:-0.01em; color:#111; line-height:1.15;">
        Your quad has a tuning problem,<br>not a hardware problem
      </div>
      <div class="small" style="margin-top:18px; display:flex; gap:44px;">
        <span>What you feel</span><span>What the log shows</span><span>Why it points at tuning</span><span>The counter-check</span>
      </div>
    </div>
    <div style="position:absolute; left:96px; top:72px; font-family:'IT'; font-weight:600; font-size:28px; letter-spacing:0.05em; text-transform:uppercase; color:#5E5B55;">6 Things · Episode 01</div>`;
}

function eRuleCard(t) {
  hideE();
  const b = document.getElementById('eBody');
  b.style.display = '';
  const reveal = easeOutCubic(clamp(t / 0.4, 0, 1));
  b.innerHTML = `
    <div style="position:absolute; left:96px; top:150px; width:1728px;">
      <div class="colHead" style="font-size:28px; color:#5E5B55;">One rule</div>
      <div class="h1" style="font-size:220px; margin-top:6px;">TWO KINDS<br>OF PROBLEM</div>
    </div>
    <div style="position:absolute; left:96px; top:600px; width:800px; opacity:${reveal}">
      <div class="rule"></div>
      <div class="colHead" style="margin-top:20px; font-size:46px;">FOLLOWS THE FLIGHT</div>
      <div class="small" style="margin-top:16px; font-size:30px; line-height:1.5;">Throttle<br>Stick speed<br>The kind of move</div>
    </div>
    <div style="position:absolute; left:1000px; top:600px; width:800px; opacity:${reveal}">
      <div class="rule accent"></div>
      <div class="colHead" style="margin-top:20px; font-size:46px;">FOLLOWS THE PART</div>
      <div class="small" style="margin-top:16px; font-size:30px; line-height:1.5;">One frequency<br>One motor or one arm<br>Changes when you swap a part</div>
    </div>`;
}

function eCheckCard({ display, items, note }) {
  hideE();
  const b = document.getElementById('eBody');
  b.style.display = '';
  const rows = items.map((it) => `
    <div style="display:flex; align-items:center; gap:20px; margin-bottom:22px;">
      <svg width="34" height="34" viewBox="0 0 34 34"><rect x="1" y="1" width="32" height="32" fill="none" stroke="#111" stroke-width="2"/><path d="M8 18 L14 24 L26 10" fill="none" stroke="#111" stroke-width="2.6"/></svg>
      <span class="small" style="font-size:30px; color:#111;">${it}</span>
    </div>`).join('');
  b.innerHTML = `
    <div style="position:absolute; left:96px; top:150px; width:1000px;">
      <div class="h1" style="font-size:230px; line-height:0.86;">${display}</div>
      <div class="rule accent" style="width:96px; margin-top:26px;"></div>
    </div>
    <div style="position:absolute; left:1080px; top:210px; width:740px;">${rows}</div>
    ${note ? `<div style="position:absolute; left:96px; top:930px; width:1700px;" class="small">${note}</div>` : ''}`;
}

/* ------------------------------------------------------------------ */
/* the beat table                                                     */
/* ------------------------------------------------------------------ */
/* Each entry is one storyboard beat. `frac` is the beat's slice of the
 * scene, taken from STORYBOARD.md. The visual is a primitive plus params. */

const SIGNS = {
  'P1-S03': { num: '01', word: 'PROPWASH', label: 'Sign 01', sub: 'Wobble in your own wash' },
  'P1-S04': { num: '02', word: 'HOT MOTORS', label: 'Sign 02', sub: 'Hot motors on clean props' },
  'P1-S05': { num: '03', word: 'BOUNCE-BACK', label: 'Sign 03', sub: 'Bounce-back at the end of a move' },
  'P1-S06': { num: '04', word: 'LAG / OVERSHOOT', label: 'Sign 04', sub: 'A gyro that arrives late, or goes too far' },
  'P1-S07': { num: '05', word: 'STICK TWITCH', label: 'Sign 05', sub: 'A twitch that follows your thumbs' },
  'P1-S08': { num: '06', word: 'HIGH THROTTLE', label: 'Sign 06', sub: 'Shaking that arrives only with throttle' },
};

function miniChart(kind) {
  // 500x190 mini chart on paper: setpoint ink2 dashed, gyro ink solid, accent marker
  const W = 500, H = 190, x0 = 44, x1 = 486, y0 = 22, y1 = 146;
  const d = kind === 'step' ? stepTrace(11, { wn: 2 * Math.PI * 14, zeta: 0.35, dur: 0.5 })
    : rateTrace(6001, 1.6, { burst: [0.85, 1.35, 38, 85], throttle: [0.7, 1.3, 55, 8] });
  const xMax = kind === 'step' ? 0.5 : 1.6;
  const yMin = kind === 'step' ? -0.1 : -120, yMax = kind === 'step' ? 1.45 : 380;
  const P = (ts, vs) => tracePath(ts, vs, ts.length, x0, x1, y0, y1, 0, xMax, yMin, yMax);
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${C.ink}" stroke-width="1"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${C.ink}" stroke-width="1"/>`;
  s += `<path d="${P(d.t, d.sp)}" fill="none" stroke="${C.ink2}" stroke-width="1.6" stroke-dasharray="7 6"/>`;
  s += `<path d="${P(d.t, d.gy)}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<text x="${x0}" y="${H - 12}" fill="${C.ink2}" font-family="IT" font-size="16" font-weight="600" letter-spacing="0.08em">${kind === 'step' ? 'STEP RESPONSE' : 'ROLL RATE'}</text>`;
  s += `<text x="${x1}" y="${H - 12}" fill="${C.ink2}" font-family="IT" font-size="16" text-anchor="end">SYNTHETIC EXAMPLE</text>`;
  s += `</svg>`;
  return s;
}

function panelShell({ title, tag = 'SYNTHETIC EXAMPLE', body, legend = [], full = false }) {
  const p = document.getElementById('panel');
  p.className = 'abs' + (full ? ' full' : '');
  const lg = legend.map(([cls, txt]) => {
    const style = cls === 'teal' ? `border-top:2.4px solid ${C.teal};`
      : cls === 'sp' ? `border-top:2px dashed ${C.hudtext};`
        : cls === 'dim' ? `border-top:2px solid ${C.huddim};`
          : `border-top:2px solid ${C.accent};`;
    return `<span><i style="${style}"></i>${txt}</span>`;
  }).join('');
  p.innerHTML = `<div class="pHead"><div class="pTitle">${title}</div><div class="pTag">${tag}</div></div>
    <div class="pBody">${body}</div>
    <div class="pLegend">${lg}</div>`;
}

const BEATS = {};

function beats(scene) {
  if (BEATS[scene]) return BEATS[scene];
  const S = SIGNS[scene];
  let list;
  if (scene === 'P1-S01') {
    list = [
      { mode: 'F', cam: 'drop', v: 'quad', f: [0, 1] },
      { mode: 'F', cam: 'macro', v: 'macro', f: [1, 2] },
      { mode: 'E', v: 'broken', f: [2, 3] },
      { mode: 'E', v: 'split', f: [3, 4] },
      { mode: 'F', cam: 'wide', v: 'logstrip', f: [4, 5] },
      { mode: 'E', v: 'title', f: [5, 6] },
    ];
  } else if (scene === 'P1-S02') {
    list = [
      { mode: 'F', cam: 'wide', v: 'chart', f: [0, 1] },
      { mode: 'F', cam: 'wide', v: 'loop', f: [1, 2] },
      { mode: 'F', cam: 'wide', v: 'chart', f: [2, 3] },
      { mode: 'F', cam: 'dim', v: 'mini3', f: [3, 4] },
      { mode: 'E', v: 'rule', f: [4, 5] },
      { mode: 'E', v: 'mechanics', f: [5, 6] },
    ];
  } else if (S) {
    list = [
      { mode: 'E', v: 'sign', f: [0, 1] },
      { mode: 'F', cam: 'wide', v: 'sigh2', f: [1, 2] },
      { mode: 'F', cam: 'wide', v: 'sigh3', f: [2, 3] },
      { mode: 'F', cam: 'dim', v: 'sigh4', f: [3, 4] },
      { mode: 'F', cam: 'wide', v: 'sigh5', f: [4, 5] },
      { mode: 'F', cam: 'wide', v: 'sigh6', f: [5, 6] },
    ];
  } else if (scene === 'P1-S09') {
    list = [
      { mode: 'E', v: 'hardware', f: [0, 1] },
      { mode: 'F', cam: 'wide', v: 'hw1', f: [1, 2] },
      { mode: 'F', cam: 'dim', v: 'hw2', f: [2, 3] },
      { mode: 'F', cam: 'wide', v: 'hw3', f: [3, 4] },
      { mode: 'F', cam: 'wide', v: 'hw4', f: [4, 5] },
      { mode: 'F', cam: 'wide', v: 'hw5', f: [5, 6] },
    ];
  } else if (scene === 'P1-S10') {
    list = [
      { mode: 'E', v: 'flylog', f: [0, 1] },
      { mode: 'F', cam: 'wide', v: 'log1', f: [1, 2] },
      { mode: 'F', cam: 'wide', v: 'log2', f: [2, 3] },
      { mode: 'F', cam: 'dim', v: 'log3', f: [3, 4] },
      { mode: 'F', cam: 'wide', v: 'log4', f: [4, 5] },
      { mode: 'E', v: 'brand', f: [5, 6] },
    ];
  } else {
    list = [
      { mode: 'E', v: 'recap', f: [0, 1] },
      { mode: 'E', v: 'recap', f: [1, 2] },
      { mode: 'E', v: 'recap', f: [2, 3] },
      { mode: 'E', v: 'recap2', f: [3, 4] },
      { mode: 'E', v: 'recap3', f: [4, 5] },
      { mode: 'E', v: 'end', f: [5, 6] },
    ];
  }
  BEATS[scene] = list;
  return list;
}

/* ------------------------------------------------------------------ */
/* render one frame                                                   */
/* ------------------------------------------------------------------ */
let ready = false;

export async function renderFrame(spec) {
  const { scene, beatIndex, tLocal, beatDur, sceneDur, totalT } = spec;
  if (!ready) {
    initGL();
    // @font-face with data URIs still reports "unloaded" until something asks
    // for it; load every face explicitly so the first frame is not rendered in
    // a fallback font.
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
    await document.fonts.ready;
    ready = true;
  }
  const list = beats(scene);
  const b = list[clamp(beatIndex, 0, list.length - 1)] || list[0];
  const stageF = document.getElementById('stageF');
  const stageE = document.getElementById('stageE');
  const wash = document.getElementById('wipe');
  wash.style.display = 'none';

  document.getElementById('panel').style.display = 'none';
  document.getElementById('caption').style.display = 'none';

  if (b.mode === 'E') {
    stageF.classList.remove('on');
    stageE.classList.add('on');
    renderCard(scene, b, tLocal, beatDur);
    if (b.v !== 'title' && b.v !== 'rule' && b.v !== 'mechanics' && b.v !== 'recap'
      && b.v !== 'recap2' && b.v !== 'recap3' && b.v !== 'end' && b.v !== 'hardware'
      && b.v !== 'flylog' && b.v !== 'brand' && b.v !== 'split' && b.v !== 'broken') {
      // sign card handled in renderCard
    }
  } else {
    stageE.classList.remove('on');
    stageF.classList.add('on');
    renderStudio(scene, b, tLocal, beatDur, totalT);
  }
  renderer && renderer.render(glScene, camera);
  // force a layout flush so the screenshot is complete
  void document.body.offsetHeight;
  return true;
}

function renderCard(scene, b, t, beatDur) {
  hideE();
  const S = SIGNS[scene];
  const reveal = easeOutCubic(clamp(t / 0.3, 0, 1));

  switch (b.v) {
    case 'sign': {
      const wordPx = S.word.length > 10 ? 300 : S.word.length > 8 ? 380 : 480;
      eSignCard({
        num: S.num, word: S.word, wordPx,
        label1: `${S.label} — ${S.sub}`,
        miniSvg: miniChart(scene === 'P1-S06' ? 'step' : 'roll'),
      });
      break;
    }
    case 'title': eTitleCard(t); break;
    case 'rule': eRuleCard(t); break;
    case 'mechanics':
      eCheckCard({
        display: 'MECHANICS<br>FIRST',
        items: ['Screws and standoffs', 'Props: cracks, balance', 'Flight controller mount', 'Motor bells and bearings'],
        note: 'Tuning a quad that is physically damaged only hides the damage.',
      });
      break;
    case 'broken': {
      eSignCard({ num: '00', word: 'BROKEN?', wordPx: 620, label1: 'The obvious thought', miniSvg: null });
      document.getElementById('counter').style.display = 'none';
      break;
    }
    case 'split': {
      const b0 = document.getElementById('eBody');
      b0.style.display = '';
      const move = clamp((t - beatDur * 0.35) / (beatDur * 0.25), 0, 1);
      const accL = 1 - move, accR = move;
      b0.innerHTML = `
        <div style="position:absolute; left:96px; top:210px; width:700px;">
          <div class="h1" style="font-size:250px; line-height:0.86;">THE<br>PART</div>
          <div class="small" style="margin-top:26px; font-size:30px;">Bent prop, rough bearing,<br>a cracked plate</div>
          <div style="margin-top:34px; height:6px; background:${C.accent}; width:${lerp(96, 400, accL)}px; opacity:${0.25 + 0.75 * accL};"></div>
        </div>
        <div style="position:absolute; left:1000px; top:210px; width:700px;">
          <div class="h1" style="font-size:250px; line-height:0.86;">THE<br>TUNE</div>
          <div class="small" style="margin-top:26px; font-size:30px;">A control loop doing exactly<br>what it was told</div>
          <div style="margin-top:34px; height:6px; background:${C.accent}; width:${lerp(96, 400, accR)}px; opacity:${0.25 + 0.75 * accR};"></div>
        </div>`;
      break;
    }
    case 'recap': {
      const cells = [
        ['01', 'PROPWASH', 'Wobble in your own wash'],
        ['02', 'HOT MOTORS', 'Hot on clean props'],
        ['03', 'BOUNCE-BACK', 'Nod at the end of a move'],
        ['04', 'LAG', 'Gyro late or past'],
        ['05', 'TWITCH', 'Follows your thumbs'],
        ['06', 'THROTTLE', 'Shaking up high'],
      ];
      const active = clamp(Math.floor(t / Math.max(0.001, beatDur) * 6), 0, 5);
      const html = cells.map(([n, h, s], i) => {
        const x = 96 + (i % 3) * 590, y = 340 + Math.floor(i / 3) * 260;
        const on = i === active;
        return `<div style="position:absolute; left:${x}px; top:${y}px; width:540px;">
          <div class="rule" style="opacity:${on ? 1 : 0.35}"></div>
          <div style="font-family:'IT'; font-weight:600; font-size:40px; letter-spacing:0.02em; margin-top:12px; color:${on ? C.accent : C.ink};">${n}</div>
          <div class="h1" style="font-size:72px; line-height:0.95; opacity:${on ? 1 : 0.55}">${h}</div>
          <div class="small" style="margin-top:8px; opacity:${on ? 1 : 0.5}">${s}</div>
        </div>`;
      }).join('');
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:120px; width:1700px;">
          <div class="colHead" style="font-size:28px; color:#5E5B55;">Recap</div>
          <div class="h1" style="font-size:170px; line-height:0.86; margin-top:4px;">SIX SIGNS</div>
        </div>${html}`;
      break;
    }
    case 'recap2': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:170px; width:1200px;">
          <div class="h1" style="font-size:250px; line-height:0.86;">SIX<br>SIGNS</div>
        </div>
        <div style="position:absolute; left:1080px; top:230px; width:760px;">
          <div class="rule accent" style="width:96px; margin-bottom:24px;"></div>
          <div style="font-family:'IT'; font-weight:600; font-size:46px; line-height:1.25; color:#111;">
            Check the mechanics first.<br>Then fly a log that can answer.
          </div>
        </div>`;
      break;
    }
    case 'recap3': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:200px; width:1700px;">
          <div class="colHead" style="color:#5E5B55;">One rule to carry</div>
          <div class="h1" style="font-size:150px; line-height:0.9; margin-top:10px;">TUNING FOLLOWS<br>THE FLIGHT</div>
        </div>
        <div style="position:absolute; left:96px; top:760px; width:1700px;">
          <div class="rule"></div>
          <div class="small" style="margin-top:18px; font-size:34px; color:#111;">Hardware follows the part.</div>
        </div>`;
      break;
    }
    case 'end': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:200px; width:1200px;">
          <div class="h1" style="font-size:300px; line-height:0.84;">6<br>THINGS</div>
        </div>
        <div style="position:absolute; left:1080px; top:300px; width:760px;">
          <img src="../../SixThings_EP01/shared/brand/eqt-icon.svg" style="width:150px; height:150px;">
          <div style="font-family:'IT'; font-weight:600; font-size:38px; margin-top:28px; color:#111;">EasyQuadTune</div>
          <div class="small" style="margin-top:10px; font-size:26px;">Analyse your own log. Check the mechanics first.</div>
          <div class="rule" style="margin-top:34px;"></div>
          <div class="small" style="margin-top:14px;">All charts in this episode are synthetic examples.</div>
        </div>`;
      break;
    }
    case 'hardware': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:150px; width:1400px;">
          <div class="colHead" style="color:#5E5B55;">The other side</div>
          <div class="h1" style="font-size:260px; line-height:0.86; margin-top:6px;">WHEN IT IS<br>HARDWARE</div>
        </div>
        <div style="position:absolute; left:96px; top:800px; width:1700px;">
          <div class="rule accent" style="width:96px;"></div>
          <div class="small" style="margin-top:16px; font-size:32px; color:#111;">A log is just as good at pointing at a part.</div>
        </div>`;
      break;
    }
    case 'flylog': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:150px; width:1200px;">
          <div class="h1" style="font-size:230px; line-height:0.86;">FLY A<br>LOG</div>
          <div class="small" style="margin-top:26px; font-size:30px;">Clean air. Clear moves. Enough time.</div>
        </div>
        <div style="position:absolute; left:1080px; top:230px; width:740px;">
          <div class="rule"></div>
          <div class="small" style="margin-top:18px; font-size:28px; line-height:1.7;">
            A low hover<br>A few sharp rolls<br>A punch-out<br>One slow descent
          </div>
        </div>`;
      break;
    }
    case 'brand': {
      const bo = document.getElementById('eBody');
      bo.style.display = '';
      bo.innerHTML = `
        <div style="position:absolute; left:96px; top:220px; width:1200px;">
          <img src="../../SixThings_EP01/shared/brand/eqt-icon.svg" style="width:190px; height:190px;">
          <div class="h1" style="font-size:150px; line-height:0.88; margin-top:26px;">EASY<br>QUAD TUNE</div>
        </div>
        <div style="position:absolute; left:1000px; top:300px; width:800px;">
          <div class="rule accent" style="width:96px; margin-bottom:22px;"></div>
          <div style="font-family:'IT'; font-weight:600; font-size:42px; line-height:1.3; color:#111;">
            Frequency view<br>Step response<br>Motors and props
          </div>
          <div class="small" style="margin-top:22px;">Naming the physical cause still needs your hands on the quad.</div>
        </div>`;
      break;
    }
  }
}

/* ------------------------------------------------------------------ */
/* F-mode compositions                                                */
/* ------------------------------------------------------------------ */
function renderStudio(scene, b, t, beatDur, totalT) {
  initGL();
  applyCamera(b.cam, t);

  const S = SIGNS[scene];
  const dim = b.cam === 'dim';

  // spin props, drift airflow
  props.forEach((p, i) => { p.rotation.y = t * 26 * p.userData.dir + i; });
  airflows.forEach((a, i) => {
    a.material.opacity = dim ? 0.06 : 0.11 + 0.05 * Math.sin(t * 2.2 + i);
    a.scale.y = 1 + 0.06 * Math.sin(t * 1.7 + i * 1.3);
  });
  quadGroup.rotation.z = Math.sin(t * 1.4) * 0.012;
  treeMesh.visible = b.cam === 'drop';

  const prog = clamp(t / Math.max(0.001, beatDur), 0, 1);

  if (b.v === 'macro') {
    // bare bell + a thin overshoot arc in the HUD
    panelShell({
      title: 'Motor bell · heat',
      body: `<svg width="656" height="560" viewBox="0 0 656 560">
        <text x="40" y="120" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="500">WARM TO THE TOUCH</text>
        <path d="M40 300 C 160 ${300 - 90 * prog}, 300 ${300 - 120 * prog}, 420 300" fill="none"
          stroke="${C.hudtext}" stroke-width="2" stroke-dasharray="9 7" stroke-opacity="${0.3 + 0.7 * prog}"/>
        <path d="M40 300 C 170 300, 260 ${300 + 60 * prog}, 360 300 L 420 300" fill="none"
          stroke="${C.teal}" stroke-width="2.4" stroke-opacity="${0.3 + 0.7 * prog}"/>
        <line x1="40" y1="300" x2="600" y2="300" stroke="${C.hudline}" stroke-width="1" stroke-opacity="0.5"/>
        <text x="40" y="470" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="500">NOSE OVERSHOOTS, THEN RETURNS</text>
      </svg>`,
      legend: [['sp', 'setpoint'], ['teal', 'gyro']],
    });
  } else if (b.v === 'logstrip') {
    const d = rateTrace(6001, 1.6, { burst: [0.85, 1.35, 38, 85], throttle: [0.7, 1.3, 55, 8] });
    panelShell({
      title: 'Blackbox · three traces',
      body: hudChart({ d, progress: prog, accentBand: [0.85, 1.35], marker: 0.85, annotation: [0.92, 60, 'burst'] }),
      legend: [['sp', 'setpoint'], ['teal', 'gyro'], ['dim', 'motors']],
    });
  } else if (b.v === 'chart' || b.v === 'sigh3' || b.v === 'hw1' || b.v === 'log1') {
    const seed = 20 + scene.charCodeAt(5);
    const d = rateTrace(seed, 1.6, {
      wn: 2 * Math.PI * 9, zeta: 0.75, burst: [0.85, 1.35, 38, 85],
      throttle: scene === 'P1-S03' ? [0.7, 1.3, 55, 8] : null,
    });
    panelShell({
      title: scene === 'P1-S03' ? 'Roll setpoint vs gyro' : 'Rate response',
      body: hudChart({
        d, progress: prog, throttleLane: scene === 'P1-S03',
        accentBand: scene === 'P1-S03' ? [0.85, 1.35] : null,
        marker: scene === 'P1-S03' ? 0.85 : null,
        annotation: scene === 'P1-S03' ? [0.9, 62, 'wobble starts in the wash'] : null,
      }),
      legend: [['sp', 'setpoint'], ['teal', 'gyro']],
    });
  } else if (b.v === 'loop') {
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / Math.max(0.2, beatDur / 2));
    panelShell({
      title: 'Control loop',
      body: `<svg width="656" height="560" viewBox="0 0 656 560">
        ${loopDiagram(pulse)}
      </svg>`,
      legend: [['teal', 'measured'], ['sp', 'commanded']],
    });
  } else if (b.v === 'mini3') {
    panelShell({
      title: 'Three gaps',
      tag: 'SYNTHETIC EXAMPLE',
      full: true,
      body: `${threeMiniCharts(prog)}`,
      legend: [['sp', 'setpoint'], ['teal', 'gyro'], ['acc', 'this one']],
    });
  } else if (b.v === 'sigh2') {
    panelShell({
      title: scene === 'P1-S07' ? 'Stick input timeline' : 'Signal chain',
      body: signalChain(scene, prog),
      legend: [['dim', 'packets'], ['teal', 'measured'], ['acc', 'problem']],
    });
  } else if (b.v === 'sigh4') {
    panelShell({
      title: scene === 'P1-S06' ? 'Step response' : 'Frequency content',
      tag: 'SYNTHETIC EXAMPLE',
      full: true,
      body: scene === 'P1-S06' ? stepPanel(prog) : spectrumPanel(prog, scene),
      legend: [['sp', 'setpoint'], ['teal', 'measured'], ['acc', 'problem']],
    });
  } else if (b.v === 'sigh5') {
    panelShell({
      title: scene === 'P1-S06' ? 'Which lever' : 'Mechanism',
      body: scene === 'P1-S06' ? leverMap(prog) : motorBars(prog),
      legend: [['dim', 'motor output'], ['acc', 'limit']],
    });
  } else if (b.v === 'sigh6') {
    panelShell({
      title: 'Counter-check',
      body: counterSplit(scene, prog),
      legend: [['acc', 'problem'], ['teal', 'measured']],
    });
  } else if (b.v === 'hw2' || b.v === 'hw3' || b.v === 'hw4' || b.v === 'hw5') {
    panelShell({
      title: b.v === 'hw3' ? 'One motor, one frequency' : 'Part or tune',
      body: b.v === 'hw3' ? motorBars(prog) : spectrumPanel(prog, 'P1-S09'),
      legend: [['teal', 'measured'], ['acc', 'part']],
    });
  } else if (b.v === 'log2' || b.v === 'log3' || b.v === 'log4') {
    panelShell({
      title: b.v === 'log2' ? 'A log that can answer' : 'What to record',
      body: signalChain('P1-S10', prog),
      legend: [['dim', 'channels'], ['teal', 'measured']],
    });
  } else {
    panelShell({
      title: 'Studio',
      body: `<svg width="656" height="560" viewBox="0 0 656 560">
        <text x="40" y="80" fill="${C.hudtext}" font-family="IT" font-size="26" font-weight="600">Five-inch quad</text>
        <text x="40" y="120" fill="${C.huddim}" font-family="IT" font-size="18">One cool key light. Prop disc in motion.</text>
      </svg>`,
      legend: [['teal', 'measured']],
    });
  }

  // caption chip: one line, index in accent
  const cap = CAPTIONS[scene] && CAPTIONS[scene][beatIndexGlobal(scene, b)];
  const capEl = document.getElementById('caption');
  if (cap) {
    capEl.style.display = 'flex';
    capEl.innerHTML = `<span class="idx">${cap[0]}</span><span class="txt">${cap[1]}</span>`;
  }
}

function beatIndexGlobal(scene, b) { return beats(scene).indexOf(b); }

const CAPTIONS = {
  'P1-S01': [['01', 'It wobbles, then it settles'], ['02', 'The bell comes down warm'], ['03', 'Broken?'],
    ['04', 'A part, or a setting'], ['05', 'Two lines and what the motors did'], ['06', 'Six signs']],
};

/* ---- small panel drawings ---- */
function loopDiagram(pulse) {
  const cx = 328, cy = 250, r = 130;
  const nodes = [['STICK', -90], ['PID', 0], ['MOTORS', 90], ['GYRO', 180]];
  let s = '';
  nodes.forEach(([n, deg], i) => {
    const a = (deg * Math.PI) / 180;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    const on = pulse > 0.6 && i === Math.floor(((pulse - 0.6) / 0.4) * 4);
    s += `<circle cx="${x}" cy="${y}" r="46" fill="none" stroke="${on ? C.accent : C.hudline}" stroke-width="${on ? 2.4 : 1.2}"/>`;
    s += `<text x="${x}" y="${y + 6}" fill="${on ? C.accent : C.hudtext}" font-family="IT" font-size="19" font-weight="600" text-anchor="middle">${n}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.hudline}" stroke-width="1" stroke-opacity="0.45"/>`;
  s += `<text x="${cx}" y="${cy + 6}" fill="${C.huddim}" font-family="IT" font-size="18" text-anchor="middle">error</text>`;
  return s;
}

function threeMiniCharts(prog) {
  const W = 1600, H = 720;
  const kinds = [
    { wn: 2 * Math.PI * 18, zeta: 0.12, t: 'rings' },
    { wn: 2 * Math.PI * 4.2, zeta: 0.95, t: 'lingers' },
    { wn: 2 * Math.PI * 12, zeta: 0.5, t: 'throttle-dependent' },
  ];
  const active = clamp(Math.floor(prog * 3), 0, 2);
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  kinds.forEach((k, i) => {
    const x = 60 + i * 520, y = 90, w = 440, h = 470;
    const d = stepTrace(300 + i, { wn: k.wn, zeta: k.zeta, dur: 0.5 });
    const on = i === active;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${on ? C.accent : C.hudline}" stroke-width="${on ? 2 : 1.1}" stroke-opacity="${on ? 1 : 0.55}"/>`;
    s += `<line x1="${x + 40}" y1="${y + h - 60}" x2="${x + w - 26}" y2="${y + h - 60}" stroke="${C.hudline}" stroke-width="1"/>`;
    s += `<line x1="${x + 40}" y1="${y + 40}" x2="${x + 40}" y2="${y + h - 60}" stroke="${C.hudline}" stroke-width="1"/>`;
    const tp = tracePath(d.t, d.sp, d.t.length, x + 40, x + w - 26, y + 40, y + h - 60, 0, 0.5, -0.1, 1.45);
    const gp = tracePath(d.t, d.gy, d.t.length, x + 40, x + w - 26, y + 40, y + h - 60, 0, 0.5, -0.1, 1.45);
    s += `<path d="${tp}" fill="none" stroke="${C.hudtext}" stroke-width="1.8" stroke-dasharray="9 7" stroke-opacity="${on ? 1 : 0.5}"/>`;
    s += `<path d="${gp}" fill="none" stroke="${on ? C.accent : C.teal}" stroke-width="2.4" stroke-opacity="${on ? 1 : 0.45}"/>`;
    s += `<text x="${x + 12}" y="${y + h - 22}" fill="${on ? C.accent : C.huddim}" font-family="IT" font-size="19" font-weight="600">${k.t}</text>`;
  });
  s += `<text x="${60}" y="${H - 30}" fill="${C.huddim}" font-family="IT" font-size="17">Each gap tells a different story. Synthetic step responses.</text>`;
  s += `</svg>`;
  return s;
}

function signalChain(scene, prog) {
  const steps = ['RC input', 'Feedforward', 'PID', 'Motors', 'Gyro'];
  const active = clamp(Math.floor(prog * steps.length), 0, steps.length - 1);
  let s = `<svg width="656" height="560" viewBox="0 0 656 560">`;
  steps.forEach((n, i) => {
    const y = 80 + i * 92;
    const on = i === active;
    s += `<rect x="120" y="${y}" width="400" height="64" fill="none" stroke="${on ? C.accent : C.hudline}" stroke-width="${on ? 2.2 : 1.1}"/>`;
    s += `<text x="320" y="${y + 40}" fill="${on ? C.accent : C.hudtext}" font-family="IT" font-size="22" font-weight="600" text-anchor="middle" letter-spacing="1.2">${n.toUpperCase()}</text>`;
    if (i < steps.length - 1) {
      s += `<line x1="320" y1="${y + 64}" x2="320" y2="${y + 92}" stroke="${C.hudline}" stroke-width="1.2"/>`;
      s += `<path d="M314 ${y + 86} L320 ${y + 92} L326 ${y + 86}" fill="none" stroke="${C.hudline}" stroke-width="1.2"/>`;
    }
  });
  s += `</svg>`;
  return s;
}

function spectrumPanel(prog) {
  const W = 1600, H = 720;
  const bars = spectrumBars(7001, { n: 120, hump: 30, humpW: 9, humpAmp: 0.95 });
  const nShow = Math.floor(bars.length * clamp(prog, 0, 1));
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  const x0 = 110, x1 = 1500, y0 = 560, y1 = 90;
  // accent band for the low region
  s += `<rect x="${x0}" y="${y1}" width="${(x0 + (x1 - x0) * 0.25 - x0)}" height="${y0 - y1}" fill="${C.accent}" fill-opacity="0.12"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${C.hudline}" stroke-width="1.2"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${C.hudline}" stroke-width="1.2"/>`;
  for (let i = 0; i < bars.length; i++) {
    const px = x0 + (i / bars.length) * (x1 - x0);
    const bw = (x1 - x0) / bars.length - 6;
    const hgt = bars[i] / 1.3 * (y0 - y1);
    const low = i < bars.length * 0.25;
    if (i > nShow) break;
    s += `<rect x="${px}" y="${y0 - hgt}" width="${bw}" height="${hgt}" fill="${low ? C.accent : C.teal}" fill-opacity="${low ? 0.85 : 0.55}"/>`;
  }
  s += `<text x="${x0 + 10}" y="${y0 + 40}" fill="${C.accent}" font-family="IT" font-size="20" font-weight="600">below ~100 Hz (typical five-inch)</text>`;
  s += `<text x="${x1}" y="${y0 + 40}" fill="${C.huddim}" font-family="IT" font-size="18" text-anchor="end">motor and prop band</text>`;
  s += `<text x="${(x0 + x1) / 2}" y="${y0 + 78}" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.6" text-anchor="middle">FREQUENCY (Hz)</text>`;
  s += `<text x="${x0 - 46}" y="${(y0 + y1) / 2}" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.6" text-anchor="middle" transform="rotate(-90 ${x0 - 46} ${(y0 + y1) / 2})">RELATIVE AMPLITUDE</text>`;
  s += `</svg>`;
  return s;
}

function stepPanel(prog) {
  const W = 1600, H = 720;
  const d = stepTrace(9001, { wn: 2 * Math.PI * 14, zeta: 0.35, dur: 0.5 });
  const x0 = 110, x1 = 1500, y0 = 560, y1 = 90;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="${C.hudline}" stroke-width="1.2"/>`;
  s += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${C.hudline}" stroke-width="1.2"/>`;
  const target = y0 - (1.0 - 0) / (1.5 - 0) * (y0 - y1);
  s += `<line x1="${x0}" y1="${target.toFixed(1)}" x2="${x1}" y2="${target.toFixed(1)}" stroke="${C.hudline}" stroke-width="1" stroke-dasharray="4 6"/>`;
  const nUse = Math.max(2, Math.floor(d.t.length * clamp(prog, 0, 1)));
  s += `<path d="${tracePath(d.t, d.sp, nUse, x0, x1, y0, y1, 0, 0.5, 0, 1.5)}" fill="none" stroke="${C.hudtext}" stroke-width="2" stroke-dasharray="9 7"/>`;
  s += `<path d="${tracePath(d.t, d.gy, nUse, x0, x1, y0, y1, 0, 0.5, 0, 1.5)}" fill="none" stroke="${C.teal}" stroke-width="2.6"/>`;
  // overshoot peak circled in accent
  let peakI = 0;
  for (let i = 0; i < nUse; i++) if (d.gy[i] > d.gy[peakI]) peakI = i;
  const px = x0 + (d.t[peakI] / 0.5) * (x1 - x0);
  const py = y0 - (d.gy[peakI] / 1.5) * (y0 - y1);
  s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="26" fill="none" stroke="${C.accent}" stroke-width="2"/>`;
  s += `<text x="${(px + 34).toFixed(1)}" y="${(py + 4).toFixed(1)}" fill="${C.accent}" font-family="IT" font-size="20" font-weight="600">overshoot</text>`;
  s += `<text x="${(x0 + x1) / 2}" y="${y0 + 78}" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.6" text-anchor="middle">TIME (s)</text>`;
  s += `<text x="${x0 - 46}" y="${(y0 + y1) / 2}" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="600" letter-spacing="1.6" text-anchor="middle" transform="rotate(-90 ${x0 - 46} ${(y0 + y1) / 2})">RESPONSE (NORMALISED TO 1.0)</text>`;
  s += `</svg>`;
  return s;
}

function leverMap(prog) {
  const rows = [['LAG', 'feedforward / P'], ['OVERSHOOT', 'D'], ['TOO MUCH D', 'slower'], ['FILTER DELAY', 'late rise']];
  const active = clamp(Math.floor(prog * rows.length), 0, rows.length - 1);
  let s = `<svg width="656" height="560" viewBox="0 0 656 560">`;
  rows.forEach(([a, b], i) => {
    const y = 80 + i * 110;
    const on = i === active;
    s += `<line x1="40" y1="${y}" x2="616" y2="${y}" stroke="${on ? C.accent : C.hudline}" stroke-width="${on ? 2 : 1}" stroke-opacity="${on ? 1 : 0.5}"/>`;
    s += `<text x="40" y="${y - 16}" fill="${on ? C.accent : C.hudtext}" font-family="IT" font-size="21" font-weight="600" letter-spacing="1.2">${a}</text>`;
    s += `<text x="616" y="${y - 16}" fill="${C.huddim}" font-family="IT" font-size="19" text-anchor="end">${b}</text>`;
  });
  s += `</svg>`;
  return s;
}

function motorBars(prog) {
  const vals = [0.42, 0.98, 0.55, 0.61].map((v, i) => v * clamp(prog * 1.6, 0, 1));
  const labels = ['M1', 'M2', 'M3', 'M4'];
  let s = `<svg width="656" height="560" viewBox="0 0 656 560">`;
  s += `<text x="40" y="60" fill="${C.huddim}" font-family="IT" font-size="18" font-weight="500">MOTOR OUTPUT</text>`;
  vals.forEach((v, i) => {
    const x = 70 + i * 140, h = v * 380;
    const over = v > 0.95;
    s += `<rect x="${x}" y="${470 - h}" width="74" height="${h}" fill="${over ? C.accent : C.hudline}" fill-opacity="${over ? 0.9 : 0.55}"/>`;
    s += `<text x="${x + 37}" y="${500}" fill="${over ? C.accent : C.huddim}" font-family="JM" font-size="18" text-anchor="middle">${labels[i]}</text>`;
  });
  s += `<line x1="40" y1="470" x2="616" y2="470" stroke="${C.hudline}" stroke-width="1.2"/>`;
  s += `<line x1="40" y1="${470 - 380}" x2="616" y2="${470 - 380}" stroke="${C.accent}" stroke-width="1" stroke-dasharray="4 6"/>`;
  s += `<text x="616" y="${470 - 388}" fill="${C.accent}" font-family="IT" font-size="17" text-anchor="end">limit</text>`;
  s += `</svg>`;
  return s;
}

function counterSplit(scene, prog) {
  const a = clamp(prog * 2, 0, 1), b2 = clamp(prog * 2 - 1, 0, 1);
  let s = `<svg width="656" height="560" viewBox="0 0 656 560">`;
  s += `<text x="40" y="70" fill="${C.hudtext}" font-family="IT" font-size="20" font-weight="600" letter-spacing="1.2">MECHANICALLY CLEAN?</text>`;
  s += `<line x1="40" y1="90" x2="${40 + 560 * a}" y2="90" stroke="${C.teal}" stroke-width="3"/>`;
  s += `<text x="40" y="180" fill="${C.hudtext}" font-family="IT" font-size="20" font-weight="600" letter-spacing="1.2">ONE MOTOR ALONE?</text>`;
  s += `<line x1="40" y1="200" x2="${40 + 560 * b2}" y2="200" stroke="${C.accent}" stroke-width="3"/>`;
  s += `<text x="40" y="290" fill="${C.huddim}" font-family="IT" font-size="19">Noisy on defaults: look mechanical first.</text>`;
  s += `<text x="40" y="330" fill="${C.accent}" font-family="IT" font-size="19">One hot bell: that motor, bearing or prop.</text>`;
  s += `<text x="40" y="440" fill="${C.huddim}" font-family="IT" font-size="19">Both follow the part, not the flight.</text>`;
  s += `</svg>`;
  return s;
}

/* expose for the driver */
window.renderFrame = renderFrame;
window.__ready = true;
