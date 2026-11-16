/* 6 THINGS EP01 — frame renderer.
 *
 * Architecture adapted from shared/animation-reference working examples: a Three.js
 * plate for the dimensional quad, composited under a canvas-2D layer that carries
 * ALL type, HUD and charts. The 2D layer registers every text box, so endFrame()
 * reports overlaps and safe-area breaches instead of leaving them to be spotted by
 * eye (window.__issues).
 *
 * Deterministic: every pixel is a function of (scene, beat, t). No clock, no
 * Math.random in layout.
 */

import * as THREE from 'three';
import {
  W, H, SAFE, C, F, ease, clamp, seg, lerp,
  loadFonts, beginFrame, endFrame, text, display, rrect,
  hudPanel, legend, axis, series, markerLine, panelGradient, brackets, vignette, rng,
} from './lib6.js';
import { createQuad, createTree, enrichQuad } from './quad6.js';
import { flightState } from './flight6.js';

/* ------------------------------------------------------------------ */
/* setup                                                              */
/* ------------------------------------------------------------------ */
const glCanvas = document.getElementById('gl');
const g = document.getElementById('g').getContext('2d');

const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const quad = createQuad(renderer);
const { scene, Q, motors, materials } = quad;
const tree = createTree();
tree.position.set(-520, -70, -430);
scene.add(tree);

const camera = new THREE.PerspectiveCamera(30, W / H, 5, 6000);

/* A fill light that rides with the camera. Without it a macro shot of a dark
 * airframe in a dark studio reads as a silhouette; a studio photographer would
 * use exactly this. It is off for every wide preset, so the wide shots keep the
 * one-key-light look the style lock asks for. */
const camFill = new THREE.DirectionalLight(0xBcd0DE, 0);
camera.add(camFill);
camFill.position.set(0.4, 0.6, 1);
scene.add(camera);

/* Camera presets.
 *
 * The base orbit is the reference scene's: a 30-degree lens at about 900 from the
 * centre, elevated around 38 degrees, drifting slowly in azimuth. That framing is
 * what makes the airframe read as an object rather than as a plan view. Presets
 * change azimuth and elevation, never below about 20 degrees: a low angle flattens
 * the props into ellipses and the quad stops reading as a quad.
 *
 *   az radians around the vertical axis from +Z, el radians above the horizon,
 *   d distance from the centre.
 */
function setCamera(preset, t, u, fs) {
  const drift = ease.sine((Math.sin(t * 0.22) + 1) / 2);

  camFill.intensity = preset === "macro" ? 2.6 : 0;

  if (preset === "macro") {
    /* Three-quarter view of one motor so the bell, the washer and the prop nut all
     * read. The front-left motor sits at (+79.2, +79.2) because ARM/√2 = 79.2, so
     * the camera looks AT that motor rather than at the frame centre, then the aim
     * point is nudged along the camera's right axis to place it in the left half of
     * the frame: aiming right of the subject moves the subject left. */
    const mx = 79.2, mz = 79.2;
    const camPos = new THREE.Vector3(mx + 84 - u * 10, 66 - u * 6, mz + 90 - u * 9);
    const target = new THREE.Vector3(mx, 20, mz);
    const fwd = target.clone().sub(camPos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const dist = camPos.distanceTo(target);
    const aim = target.clone().addScaledVector(right, dist * 0.16);
    camera.position.copy(camPos);
    camera.lookAt(aim);
    return;
  }

  const orbit = {
    hero: { az: 0.62, el: 0.62, d: 810 },
    wide: { az: 0.30, el: 0.58, d: 800 },
    drop: { az: 0.22, el: 0.52, d: 860 },
    low: { az: 0.55, el: 0.34, d: 780 },
    three: { az: 0.44, el: 0.46, d: 800 },
    top: { az: 0.62, el: 1.02, d: 860 },
    dim: { az: 1.04, el: 0.54, d: 920 },
  }[preset] || { az: 0.62, el: 0.62, d: 900 };

  const az = orbit.az + (drift - 0.5) * 0.10;
  const el = orbit.el + Math.sin(t * 0.42) * 0.012;
  const d = orbit.d;

  // Damped follow: the object moves inside the frame, the frame does not chase it
  // exactly, which is what keeps a drop or a climb legible.
  const fy = fs ? fs.pos[1] : 0;
  const fx = fs ? fs.pos[0] : 0;

  camera.position.set(
    Math.sin(az) * Math.cos(el) * d + fx * 0.22,
    Math.sin(el) * d + fy * 0.62,
    Math.cos(az) * Math.cos(el) * d,
  );
  camera.lookAt(fx * 0.42, 16 + fy * 0.85, 0);
}

/* one-off render of the quad with alpha, used as the E-mode cut-out */
let cutoutImg = null;

/* Render the quad once with alpha for the E-mode cut-out.
 * Deliberately cheap: no PMREM, no shadows, no second quad build. The first
 * attempt spawned a second full scene with its own PMREM and hung SwiftShader,
 * so this clones the existing meshes and lights them with three directionals. */
function makeCutout() {
  const size = 1100;
  const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r2.setPixelRatio(1);
  r2.setSize(size, size, false);
  r2.outputColorSpace = THREE.SRGBColorSpace;
  r2.toneMapping = THREE.ACESFilmicToneMapping;
  r2.toneMappingExposure = 1.6;

  const s2 = new THREE.Scene();
  const clone = Q.clone(true);
  clone.rotation.set(0.30, -0.62, 0.07);
  clone.position.y = 0;
  s2.add(clone);

  s2.add(new THREE.AmbientLight(0xa8b8c4, 2.6));
  const k = new THREE.DirectionalLight(0xffffff, 3.0); k.position.set(-260, 520, 380); s2.add(k);
  const f = new THREE.DirectionalLight(0xc2d4e0, 1.6); f.position.set(420, 140, 260); s2.add(f);
  const rm = new THREE.DirectionalLight(0xeaf4fa, 2.0); rm.position.set(120, 260, -520); s2.add(rm);

  const c2 = new THREE.PerspectiveCamera(26, 1, 50, 5000);
  c2.position.set(0, 300, 900);
  c2.lookAt(0, 25, 0);
  r2.render(s2, c2);

  cutoutImg = document.createElement('canvas');
  cutoutImg.width = cutoutImg.height = size;
  cutoutImg.getContext('2d').drawImage(r2.domElement, 0, 0);
  r2.dispose();
  r2.forceContextLoss?.();
}

/* ------------------------------------------------------------------ */
/* synthetic data                                                     */
/* ------------------------------------------------------------------ */
function rateTrace(seed, dur, o = {}) {
  const {
    wn = 2 * Math.PI * 9, zeta = 0.75, amp = 320, start = 0.15, end = 0.5,
    burst = null, noise = 3, throttle = null, dt = 0.002,
  } = o;
  const r = rng(seed);
  const n = Math.round(dur / dt);
  const t = new Float64Array(n), sp = new Float64Array(n), gy = new Float64Array(n);
  let gg = 0, v = 0;
  for (let i = 0; i < n; i++) {
    const ti = i * dt; t[i] = ti;
    sp[i] = ti > start && ti < end ? amp * Math.sin(Math.PI * (ti - start) / (end - start)) ** 2 : 0;
    const a = wn * wn * (sp[i] - gg) - 2 * zeta * wn * v;
    v += a * dt; gg += v * dt;
    let val = gg;
    if (burst) {
      const [b0, b1, hz, a2] = burst;
      const env = ti > b0 && ti < b1 ? Math.sin(Math.PI * (ti - b0) / (b1 - b0)) ** 2 : 0;
      val += a2 * env * Math.sin(2 * Math.PI * hz * ti);
    }
    gy[i] = val + (r() - 0.5) * 2 * noise;
  }
  let thr = null;
  if (throttle) {
    const [lo, hi, v0, v1] = throttle;
    thr = new Float64Array(n);
    for (let i = 0; i < n; i++) thr[i] = t[i] >= lo && t[i] < hi ? v1 : v0;
    const w = Math.round(0.04 / dt), sm = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) { s += thr[j]; c++; } }
      sm[i] = s / c;
    }
    thr = sm;
  }
  return { t, sp, gy, thr };
}

function stepTrace(seed, o = {}) {
  const { wn = 2 * Math.PI * 14, zeta = 0.35, dur = 0.5, noise = 0.004, dt = 0.0005 } = o;
  const r = rng(seed);
  const n = Math.round(dur / dt);
  const t = new Float64Array(n), sp = new Float64Array(n), gy = new Float64Array(n);
  let gg = 0, v = 0;
  for (let i = 0; i < n; i++) {
    const ti = i * dt; t[i] = ti;
    sp[i] = ti >= 0.05 ? 1 : 0;
    const a = wn * wn * (sp[i] - gg) - 2 * zeta * wn * v;
    v += a * dt; gg += v * dt;
    gy[i] = gg + (r() - 0.5) * 2 * noise;
  }
  return { t, sp, gy };
}

const SIGNS = {
  'P1-S03': { num: '01', word: 'PROPWASH', label: 'Sign 01 — Wobble in your own wash' },
  'P1-S04': { num: '02', word: 'HOT MOTORS', label: 'Sign 02 — Hot motors on clean props' },
  'P1-S05': { num: '03', word: 'BOUNCE-BACK', label: 'Sign 03 — Bounce-back at the end of a move' },
  'P1-S06': { num: '04', word: 'LAG / OVERSHOOT', label: 'Sign 04 — A gyro that arrives late, or goes too far' },
  'P1-S07': { num: '05', word: 'STICK TWITCH', label: 'Sign 05 — A twitch that follows your thumbs' },
  'P1-S08': { num: '06', word: 'HIGH THROTTLE', label: 'Sign 06 — Shaking that arrives only with throttle' },
};

/* ------------------------------------------------------------------ */
/* E mode (paper)                                                     */
/* ------------------------------------------------------------------ */
function paper() {
  g.fillStyle = C.paper;
  g.fillRect(0, 0, W, H);
}

function counter(num) {
  const x = W - SAFE.x;
  g.save();
  g.font = `600 40px ${F.text}`;
  g.textBaseline = 'alphabetic';
  const numW = g.measureText(num).width;
  const restW = g.measureText(' / 06').width;
  g.restore();

  text(g, num, x - restW, 132, { size: 40, weight: 600, color: C.accent, align: 'right', font: F.text });
  text(g, '/ 06', x, 132, { size: 40, weight: 600, color: C.ink, align: 'right', font: F.text });
  g.fillStyle = C.accent;
  g.fillRect(x - 56, 148, 56, 5);
}

function eSignCard(scene, t, beatDur) {
  paper();
  const S = SIGNS[scene];
  const size = S.word.length > 10 ? 300 : S.word.length > 8 ? 360 : 470;
  // display word, cropped off the left edge on purpose
  display(g, S.word, -20, 150 + size * 0.78, size, { alpha: 1 });

  // cut-out quad, in front of the word
  if (cutoutImg) {
    const qw = 1020, qh = qw;
    g.save();
    g.globalAlpha = 1;
    g.drawImage(cutoutImg, W - qw + 90, 300, qw, qh);
    g.restore();
  }

  counter(S.num);

  // label block
  g.fillStyle = C.accent;
  g.fillRect(SAFE.x, 806, 96, 6);
  text(g, S.label, SAFE.x, 852, { size: 28, weight: 600, color: C.ink, track: 1.4, upper: true });

  // mini chart, same synthetic data as the sign's F beat
  miniChart(scene, 470, 792, 430, 186);
}

function miniChart(scene, x, y, w, h) {
  const step = scene === 'P1-S06';
  const d = step ? stepTrace(11, { wn: 2 * Math.PI * 14, zeta: 0.35 })
    : rateTrace(6001, 1.6, { burst: [0.85, 1.35, 38, 85], throttle: [0.7, 1.3, 55, 8] });
  const x0 = x + 40, x1 = x + w, y0 = y + 16, y1 = y + h - 34;
  const xMax = step ? 0.5 : 1.6, yMin = step ? -0.1 : -120, yMax = step ? 1.45 : 380;
  const px = (v) => x0 + (v / xMax) * (x1 - x0);
  const py = (v) => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);

  g.save();
  g.strokeStyle = C.ink; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
  g.restore();

  series(g, d.t, d.sp, d.t.length, { x0, x1, y0, y1 }, { px, py }, { color: C.ink2, width: 1.6, dash: [7, 6] });
  series(g, d.t, d.gy, d.t.length, { x0, x1, y0, y1 }, { px, py }, { color: C.ink, width: 2 });

  text(g, step ? 'STEP RESPONSE' : 'ROLL RATE', x0, y + h - 8, { size: 16, weight: 600, color: C.ink2, track: 1.3 });
  text(g, 'SYNTHETIC EXAMPLE', x1, y + h - 8, { size: 16, weight: 500, color: C.ink2, align: 'right' });
}

function eTitleCard(t) {
  paper();
  const rv = ease.out(clamp(t / 0.28));
  if (cutoutImg) g.drawImage(cutoutImg, W - 900, 300, 980, 980);

  g.save(); g.globalAlpha = rv;
  display(g, '6 SIGNS', -20, 260 + 430 * 0.76, 430);
  g.restore();

  text(g, '6 Things · Episode 01', SAFE.x, 150, { size: 28, weight: 600, color: C.ink2, track: 1.4, upper: true });
  g.fillStyle = C.accent;
  g.fillRect(SAFE.x, 800, 96, 6);
  text(g, 'Your quad has a tuning problem,', SAFE.x, 862, { size: 38, weight: 600, color: C.ink });
  text(g, 'not a hardware problem', SAFE.x, 912, { size: 38, weight: 600, color: C.ink });
}

function eBroken(t) {
  paper();
  display(g, 'BROKEN?', -20, 150 + 620 * 0.8, 620);
  if (cutoutImg) g.drawImage(cutoutImg, W - 1000, 240, 1060, 1060);
  g.fillStyle = C.accent; g.fillRect(SAFE.x, 806, 96, 6);
  text(g, 'The obvious thought', SAFE.x, 852, { size: 28, weight: 600, color: C.ink, track: 1.4, upper: true });
}

function eSplit(t, beatDur) {
  paper();
  const mv = ease.io(clamp((t - beatDur * 0.32) / (beatDur * 0.28)));
  const cols = [
    ['THE PART', 'Bent prop, rough bearing, a cracked plate', 1 - mv],
    ['THE TUNE', 'A control loop doing exactly what it was told', mv],
  ];
  cols.forEach(([head, sub, on], i) => {
    const x = SAFE.x + i * 900;
    display(g, head, x, 250 + 190 * 0.76, 190, { alpha: 0.45 + 0.55 * on });
    text(g, sub, x, 560, { size: 30, weight: 500, color: C.ink2 });
    g.save(); g.globalAlpha = 0.25 + 0.75 * on;
    g.fillStyle = C.accent;
    g.fillRect(x, 600, 96 + 300 * on, 6);
    g.restore();
  });
}

function eRule(t) {
  paper();
  const rv = ease.out(clamp(t / 0.4));
  text(g, 'One rule', SAFE.x, 175, { size: 28, weight: 600, color: C.ink2, track: 1.4, upper: true });
  display(g, 'TWO KINDS', SAFE.x, 210 + 170 * 0.8, 170);
  display(g, 'OF PROBLEM', SAFE.x, 210 + 170 * 0.8 + 145, 170);

  const col = (x, head, items, accent) => {
    g.save(); g.globalAlpha = rv;
    g.fillStyle = accent ? C.accent : C.ink;
    g.fillRect(x, 600, accent ? 400 : 800, accent ? 6 : 2);
    text(g, head, x, 660, { size: 46, weight: 600, color: C.ink, upper: true });
    items.forEach((s, i) => text(g, s, x, 716 + i * 48, { size: 30, weight: 500, color: C.ink2 }));
    g.restore();
  };
  col(SAFE.x, 'FOLLOWS THE FLIGHT', ['Throttle', 'Stick speed', 'The kind of move'], false);
  col(SAFE.x + 900, 'FOLLOWS THE PART', ['One frequency', 'One motor or one arm', 'Changes when you swap a part'], true);
}

function eCheck(displayWord, items, note) {
  paper();
  const lines = displayWord.split('\n');
  lines.forEach((ln, i) => display(g, ln, -20, 160 + i * 210 + 200, 230));
  g.fillStyle = C.accent;
  g.fillRect(SAFE.x, 160 + lines.length * 205, 96, 6);

  items.forEach((it, i) => {
    const y = 250 + i * 92;
    const x = 1080;
    g.save();
    g.strokeStyle = C.ink; g.lineWidth = 2;
    g.strokeRect(x, y - 26, 34, 34);
    g.beginPath(); g.moveTo(x + 7, y - 9); g.lineTo(x + 13, y - 3); g.lineTo(x + 26, y - 18); g.stroke();
    g.restore();
    text(g, it, x + 54, y, { size: 30, weight: 500, color: C.ink });
  });
  if (note) text(g, note, SAFE.x, 968, { size: 26, weight: 500, color: C.ink2 });
}

function eRecap(t, beatDur) {
  paper();
  text(g, 'Recap', SAFE.x, 132, { size: 28, weight: 600, color: C.ink2, track: 1.4, upper: true });
  display(g, 'SIX SIGNS', -20, 130 + 170 * 0.8, 170);

  const cells = [
    ['01', 'PROPWASH', 'Wobble in your own wash'],
    ['02', 'HOT MOTORS', 'Hot on clean props'],
    ['03', 'BOUNCE-BACK', 'Nod at the end of a move'],
    ['04', 'LAG', 'Gyro late or past'],
    ['05', 'TWITCH', 'Follows your thumbs'],
    ['06', 'THROTTLE', 'Shaking up high'],
  ];
  const active = clamp(Math.floor((t / Math.max(0.001, beatDur)) * 6), 0, 5);
  cells.forEach(([n, head, sub], i) => {
    const x = SAFE.x + (i % 3) * 590;
    const y = 340 + Math.floor(i / 3) * 250;
    const on = i === active;
    g.save(); g.globalAlpha = on ? 1 : 0.42;
    g.fillStyle = C.ink; g.fillRect(x, y, 540, 2);
    g.restore();
    text(g, n, x, y + 52, { size: 40, weight: 600, color: on ? C.accent : C.ink, font: F.text });
    display(g, head, x, y + 130, 70, { alpha: on ? 1 : 0.5 });
    text(g, sub, x, y + 172, { size: 24, weight: 500, color: C.ink2, alpha: on ? 1 : 0.5 });
  });
}

function eClosing(kind, t) {
  paper();
  if (kind === 'recap2') {
    display(g, 'SIX', -20, 170 + 250 * 0.8, 250);
    display(g, 'SIGNS', -20, 170 + 250 * 0.8 + 205, 250);
    g.fillStyle = C.accent; g.fillRect(1000, 240, 96, 6);
    text(g, 'Check the mechanics first.', 1000, 320, { size: 46, weight: 600, color: C.ink });
    text(g, 'Then fly a log that can answer.', 1000, 382, { size: 46, weight: 600, color: C.ink });
  } else if (kind === 'recap3') {
    text(g, 'One rule to carry', SAFE.x, 200, { size: 28, weight: 600, color: C.ink2, track: 1.4, upper: true });
    display(g, 'TUNING FOLLOWS', -20, 250 + 150 * 0.8, 150);
    display(g, 'THE FLIGHT', -20, 250 + 150 * 0.8 + 128, 150);
    g.fillStyle = C.ink; g.fillRect(SAFE.x, 760, 1728, 2);
    text(g, 'Hardware follows the part.', SAFE.x, 812, { size: 34, weight: 500, color: C.ink });
  } else if (kind === 'end') {
    display(g, '6', -20, 210 + 300 * 0.8, 300);
    display(g, 'THINGS', -20, 210 + 300 * 0.8 + 250, 300);
    const icon = new Image();
    icon.src = '/SixThings_EP01/shared/brand/eqt-icon.svg';
    if (icon.complete) g.drawImage(icon, 1080, 300, 130, 130);
    text(g, 'EasyQuadTune', 1080, 490, { size: 38, weight: 600, color: C.ink });
    text(g, 'Analyse your own log. Check the mechanics first.', 1080, 534, { size: 26, weight: 500, color: C.ink2 });
    g.fillStyle = C.ink; g.fillRect(1080, 566, 700, 2);
    text(g, 'All charts in this episode are synthetic examples.', 1080, 610, { size: 24, weight: 500, color: C.ink2 });
  } else if (kind === 'hardware') {
    text(g, 'The other side', SAFE.x, 175, { size: 28, weight: 600, color: C.ink2, track: 1.4, upper: true });
    display(g, 'WHEN IT IS', -20, 210 + 260 * 0.8, 260);
    display(g, 'HARDWARE', -20, 210 + 260 * 0.8 + 215, 260);
    g.fillStyle = C.accent; g.fillRect(SAFE.x, 806, 96, 6);
    text(g, 'A log is just as good at pointing at a part.', SAFE.x, 858, { size: 32, weight: 500, color: C.ink });
  } else if (kind === 'flylog') {
    display(g, 'FLY A', -20, 160 + 230 * 0.8, 230);
    display(g, 'LOG', -20, 160 + 230 * 0.8 + 195, 230);
    text(g, 'Clean air. Clear moves. Enough time.', SAFE.x, 700, { size: 30, weight: 500, color: C.ink2 });
    g.fillStyle = C.ink; g.fillRect(1080, 240, 700, 2);
    ['A low hover', 'A few sharp rolls', 'A punch-out', 'One slow descent']
      .forEach((s, i) => text(g, s, 1080, 300 + i * 56, { size: 28, weight: 500, color: C.ink2 }));
  } else if (kind === 'brand') {
    const icon = new Image();
    icon.src = '/SixThings_EP01/shared/brand/eqt-icon.svg';
    if (icon.complete) g.drawImage(icon, SAFE.x, 220, 170, 170);
    display(g, 'EASY', SAFE.x, 430 + 150 * 0.8, 150);
    display(g, 'QUAD TUNE', SAFE.x, 430 + 150 * 0.8 + 128, 150);
    g.fillStyle = C.accent; g.fillRect(1000, 300, 96, 6);
    ['Frequency view', 'Step response', 'Motors and props']
      .forEach((s, i) => text(g, s, 1000, 370 + i * 58, { size: 40, weight: 600, color: C.ink }));
    text(g, 'Naming the physical cause still needs your hands on the quad.',
      1000, 580, { size: 24, weight: 500, color: C.ink2 });
  }
}

/* ------------------------------------------------------------------ */
/* F mode (studio + HUD)                                              */
/* ------------------------------------------------------------------ */
function panelBox(full) {
  return full ? { x: 160, y: 140, w: 1600, h: 720 } : { x: 1120, y: 120, w: 700, h: 680 };
}

function caption(idx, txt, alpha = 1) {
  if (alpha <= 0.02) return;
  const x = 1120;
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = 'rgba(93,107,117,0.55)';
  g.fillRect(x, 836, 700, 1);
  g.restore();
  text(g, idx, x, 890, { size: 22, weight: 500, color: C.accent, font: F.mono, alpha });
  text(g, txt, x + 46, 890, { size: 36, weight: 500, color: C.hudtext, alpha });
}

function chartPanel(box, title, d, o = {}) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, title, 'Synthetic example');

  const bx = { x0: x + 96, x1: x + w - 40, y0: y + 112, y1: y + h - 158 };
  const xMax = o.xMax || 1.6, yMin = o.yMin ?? -120, yMax = o.yMax ?? 380;
  const px = (v) => bx.x0 + (v / xMax) * (bx.x1 - bx.x0);
  const py = (v) => bx.y1 - ((v - yMin) / (yMax - yMin)) * (bx.y1 - bx.y0);

  if (o.band) {
    g.save(); g.fillStyle = 'rgba(236,65,24,0.12)';
    g.fillRect(px(o.band[0]), bx.y0 - 6, px(o.band[1]) - px(o.band[0]), bx.y1 - bx.y0 + 12);
    g.restore();
  }

  const xTicks = [], yTicks = [];
  for (let v = 0; v <= xMax + 1e-9; v += xMax / 4) xTicks.push([v.toFixed(1), px(v)]);
  for (let v = Math.ceil(yMin / 200) * 200; v <= yMax; v += 200) yTicks.push([String(v), py(v)]);
  axis(g, bx, { xTicks, yTicks, xLabel: 'time (s)', yLabel: 'rate (deg/s)', zeroY: py(0) });

  const n = Math.max(2, Math.floor(d.t.length * clamp(o.progress ?? 1)));
  series(g, d.t, d.sp, n, bx, { px, py }, { color: C.hudtext, width: 2, dash: [9, 7] });
  series(g, d.t, d.gy, n, bx, { px, py }, { color: C.teal, width: 2.4 });

  if (o.marker !== undefined && o.marker !== null) {
    markerLine(g, px(o.marker), bx);
  }
  if (o.note) text(g, o.note, px(o.noteAt) + 12, py(o.noteY), { size: 19, weight: 600, color: C.accent });

  if (o.throttle && d.thr) {
    // Throttle lane sits at the bottom of the plot, inside the frame, so it can
    // never collide with the panel title.
    const ty1 = bx.y1 - 6, ty0 = bx.y1 - 58;
    const tpy = (v) => ty1 - (v / 80) * (ty1 - ty0);
    const pts = [];
    for (let i = 0; i < d.t.length; i += 8) {
      const qx = px(d.t[i]); if (qx > bx.x1) break;
      pts.push([qx, tpy(d.thr[i])]);
    }
    g.save(); g.strokeStyle = C.huddim; g.lineWidth = 2; g.globalAlpha = 0.85;
    g.beginPath();
    pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
    g.stroke(); g.restore();
    text(g, 'throttle', bx.x1, ty0 - 8, { size: 15, weight: 500, color: C.huddim, align: 'right' });
  }

  legend(g, x + 22, y + h - 16, o.legend || [['sp', 'setpoint'], ['teal', 'gyro']]);
}

function stepPanel(box, progress) {
  const d = stepTrace(9001, { wn: 2 * Math.PI * 14, zeta: 0.35 });
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Estimated step response', 'Synthetic example');
  const bx = { x0: x + 96, x1: x + w - 40, y0: y + 112, y1: y + h - 158 };
  const px = (v) => bx.x0 + (v / 0.5) * (bx.x1 - bx.x0);
  const py = (v) => bx.y1 - (v / 1.5) * (bx.y1 - bx.y0);
  const xTicks = [], yTicks = [];
  for (let v = 0; v <= 0.5; v += 0.1) xTicks.push([v.toFixed(1), px(v)]);
  for (let v = 0; v <= 1.5; v += 0.5) yTicks.push([v.toFixed(1), py(v)]);
  axis(g, bx, { xTicks, yTicks, xLabel: 'time (s)', yLabel: 'response (normalised to 1.0)', zeroY: null });

  g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1; g.setLineDash([4, 6]);
  g.beginPath(); g.moveTo(bx.x0, py(1)); g.lineTo(bx.x1, py(1)); g.stroke(); g.restore();

  const n = Math.max(2, Math.floor(d.t.length * clamp(progress)));
  series(g, d.t, d.sp, n, bx, { px, py }, { color: C.hudtext, width: 2, dash: [9, 7] });
  series(g, d.t, d.gy, n, bx, { px, py }, { color: C.teal, width: 2.6 });

  let peak = 0;
  for (let i = 0; i < n; i++) if (d.gy[i] > d.gy[peak]) peak = i;
  const cx = px(d.t[peak]), cy = py(d.gy[peak]);
  g.save(); g.strokeStyle = C.accent; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.stroke(); g.restore();
  // The label goes above the peak, not to its right: to the right it collided
  // with the y-axis tick numeral when the overshoot sat near the plot edge.
  text(g, 'overshoot', cx + 36, cy - 22, { size: 20, weight: 600, color: C.accent });

  legend(g, x + 22, y + h - 16, [['sp', 'setpoint'], ['teal', 'measured']]);
}

function spectrumPanel(box, progress) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Frequency content', 'Synthetic example');
  const bx = { x0: x + 96, x1: x + w - 40, y0: y + 108, y1: y + h - 96 };
  const r = rng(7001);
  const n = 110;
  g.save();
  g.fillStyle = 'rgba(236,65,24,0.12)';
  g.fillRect(bx.x0, bx.y0, (bx.x1 - bx.x0) * 0.25, bx.y1 - bx.y0);
  g.restore();

  const shown = Math.floor(n * clamp(progress));
  for (let i = 0; i < shown; i++) {
    const u = i / n;
    const low = u < 0.25;
    const bump = Math.exp(-Math.pow((i - 24) / 9, 2)) * 0.95;
    const v = clamp(0.1 + 0.5 * Math.pow(1 - u, 1.6) + bump + (r() - 0.5) * 0.06, 0, 1.25);
    const bw = (bx.x1 - bx.x0) / n - 5;
    const px = bx.x0 + u * (bx.x1 - bx.x0);
    const bh = (v / 1.3) * (bx.y1 - bx.y0);
    g.save();
    g.fillStyle = low ? C.accent : C.teal;
    g.globalAlpha = low ? 0.85 : 0.5;
    g.fillRect(px, bx.y1 - bh, bw, bh);
    g.restore();
  }
  g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(bx.x0, bx.y1); g.lineTo(bx.x1, bx.y1);
  g.moveTo(bx.x0, bx.y1); g.lineTo(bx.x0, bx.y0); g.stroke(); g.restore();

  text(g, 'below ~100 Hz (typical five-inch)', bx.x0 + 8, bx.y1 + 34, { size: 20, weight: 600, color: C.accent });
  text(g, 'motor and prop band', bx.x1, bx.y1 + 34, { size: 18, weight: 500, color: C.huddim, align: 'right' });
  text(g, 'FREQUENCY (Hz)', bx.x1, bx.y1 + 62, { size: 16, weight: 600, color: C.huddim, track: 1.2, align: 'right', upper: true });
  text(g, 'RELATIVE AMPLITUDE', bx.x0, bx.y0 - 14, { size: 16, weight: 600, color: C.huddim, track: 1.2, upper: true });

  legend(g, x + 22, y + h - 16, [['teal', 'measured'], ['acc', 'problem band']]);
}

function barsPanel(box, progress) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Motor output', 'Synthetic example');
  const vals = [0.42, 0.99, 0.55, 0.63].map((v) => v * clamp(progress * 1.7));
  const labels = ['M1', 'M2', 'M3', 'M4'];
  const baseY = y + h - 110, topY = y + 130;
  const bw = 74, gap = (w - 120 - bw * 4) / 3;
  vals.forEach((v, i) => {
    const bx = x + 84 + i * (bw + gap);
    const bh = v * (baseY - topY);
    const over = v > 0.95;
    g.save();
    g.fillStyle = over ? C.accent : C.hudline;
    g.globalAlpha = over ? 0.9 : 0.55;
    g.fillRect(bx, baseY - bh, bw, bh);
    g.restore();
    text(g, labels[i], bx + bw / 2, baseY + 34, { size: 18, weight: 500, color: over ? C.accent : C.huddim, font: F.mono, align: 'center' });
  });
  g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x + 60, baseY); g.lineTo(x + w - 40, baseY); g.stroke();
  g.strokeStyle = C.accent; g.setLineDash([4, 6]);
  g.beginPath(); g.moveTo(x + 60, baseY - 0.95 * (baseY - topY)); g.lineTo(x + w - 40, baseY - 0.95 * (baseY - topY)); g.stroke();
  g.restore();
  text(g, 'limit', x + w - 40, baseY - 0.95 * (baseY - topY) - 10, { size: 17, weight: 500, color: C.accent, align: 'right' });
}

function loopPanel(box, t, beatDur) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Control loop', null);
  const cx = x + w / 2, cy = y + h / 2 - 20, r = 140;
  const pulse = clamp((t / Math.max(0.2, beatDur / 2)) % 1);
  const nodes = [['STICK', -90], ['PID', 0], ['MOTORS', 90], ['GYRO', 180]];
  g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1; g.globalAlpha = 0.45;
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.restore();

  nodes.forEach(([n, deg], i) => {
    const a = (deg * Math.PI) / 180;
    const nx = cx + Math.cos(a) * r, ny = cy + Math.sin(a) * r;
    const on = i === Math.floor(pulse * 4);
    g.save();
    g.strokeStyle = on ? C.accent : C.hudline;
    g.lineWidth = on ? 2.4 : 1.2;
    g.beginPath(); g.arc(nx, ny, 46, 0, 7); g.stroke();
    g.restore();
    text(g, n, nx, ny + 6, { size: 19, weight: 600, color: on ? C.accent : C.hudtext, align: 'center' });
  });
  text(g, 'error', cx, cy + 6, { size: 18, weight: 500, color: C.huddim, align: 'center' });
  legend(g, x + 22, y + h - 16, [['teal', 'measured'], ['sp', 'commanded']]);
}

function chainPanel(box, progress) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Signal chain', null);
  const steps = ['RC input', 'Feedforward', 'PID', 'Motors', 'Gyro'];
  const active = clamp(Math.floor(progress * steps.length), 0, steps.length - 1);
  steps.forEach((s, i) => {
    const by = y + 90 + i * 96;
    const on = i === active;
    g.save();
    g.strokeStyle = on ? C.accent : C.hudline;
    g.lineWidth = on ? 2.2 : 1.1;
    g.strokeRect(x + 120, by, 400, 62);
    g.restore();
    text(g, s, x + 320, by + 39, { size: 21, weight: 600, color: on ? C.accent : C.hudtext, track: 1.4, align: 'center', upper: true });
    if (i < steps.length - 1) {
      g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x + 320, by + 62); g.lineTo(x + 320, by + 96); g.stroke();
      g.restore();
    }
  });
}

function threeMini(box, progress) {
  const { x, y, w, h } = box;
  hudPanel(g, x, y, w, h, 'Three gaps', 'Synthetic example');
  const kinds = [
    { wn: 2 * Math.PI * 18, zeta: 0.12, label: 'rings' },
    { wn: 2 * Math.PI * 4.2, zeta: 0.95, label: 'lingers' },
    { wn: 2 * Math.PI * 12, zeta: 0.5, label: 'throttle-dependent' },
  ];
  const active = clamp(Math.floor(progress * 3), 0, 2);
  kinds.forEach((k, i) => {
    const cw = 490, ch = 520;
    const cx = x + 40 + i * 512, cy = y + 96;
    const d = stepTrace(300 + i, { wn: k.wn, zeta: k.zeta });
    const on = i === active;
    g.save();
    g.strokeStyle = on ? C.accent : C.hudline;
    g.lineWidth = on ? 2 : 1.1;
    g.strokeRect(cx, cy, cw, ch);
    g.restore();
    const bx = { x0: cx + 40, x1: cx + cw - 26, y0: cy + 40, y1: cy + ch - 60 };
    const px = (v) => bx.x0 + (v / 0.5) * (bx.x1 - bx.x0);
    const py = (v) => bx.y1 - ((v + 0.1) / 1.55) * (bx.y1 - bx.y0);
    series(g, d.t, d.sp, d.t.length, bx, { px, py }, { color: C.hudtext, width: 1.8, dash: [9, 7], alpha: on ? 1 : 0.5 });
    series(g, d.t, d.gy, d.t.length, bx, { px, py }, { color: on ? C.accent : C.teal, width: 2.4, alpha: on ? 1 : 0.45 });
    text(g, k.label, cx + 14, cy + ch - 22, { size: 19, weight: 600, color: on ? C.accent : C.huddim });
  });
  legend(g, x + 22, y + h - 16, [['sp', 'setpoint'], ['teal', 'gyro'], ['acc', 'speaking now']]);
}

/* ------------------------------------------------------------------ */
/* beat table                                                         */
/* ------------------------------------------------------------------ */
const BEATS = {
  'P1-S01': [
    { m: 'F', cam: 'drop', k: 'plain', cap: ['01', 'It wobbles, then it settles'] },
    { m: 'F', cam: 'macro', k: 'macro', noProp: true, cap: ['02', 'The bell comes down warm'] },
    { m: 'E', k: 'broken' },
    { m: 'E', k: 'split' },
    { m: 'F', cam: 'wide', k: 'chart', cap: ['05', 'Two lines and what the motors did'] },
    { m: 'E', k: 'title' },
  ],
  'P1-S02': [
    { m: 'F', cam: 'wide', k: 'chart', cap: ['01', 'Setpoint is what you asked for'] },
    { m: 'F', cam: 'wide', k: 'loop', cap: ['02', 'The error is the whole story'] },
    { m: 'F', cam: 'hero', k: 'chart', cap: ['03', 'Real motors take time'] },
    { m: 'F', cam: 'dim', k: 'mini3', full: true, cap: ['04', 'Each gap tells a different story'] },
    { m: 'E', k: 'rule' },
    { m: 'E', k: 'mechanics' },
  ],
  'P1-S03': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'low', k: 'chart', cap: ['01', 'Reverse flow, then thrust returns'] },
    { m: 'F', cam: 'wide', k: 'chart', cap: ['02', 'It begins with the wash'] },
    { m: 'F', cam: 'dim', k: 'spectrum', full: true, cap: ['03', 'Low, well under the prop band'] },
    { m: 'F', cam: 'macro', k: 'bars', cap: ['04', 'Settings decide how well it fights'] },
    { m: 'E', k: 'check', display: 'FIX THESE\nFIRST', items: ['Loose screws', 'Cracked frame plate', 'Rough bearings', 'Loose motor bell', 'Damaged props'] },
  ],
  'P1-S04': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'top', k: 'plain', cap: ['01', 'Fresh props, hot bells'] },
    { m: 'F', cam: 'hero', k: 'chain', cap: ['02', 'D turns noise into commands'] },
    { m: 'F', cam: 'dim', k: 'chart', full: true, cap: ['03', 'A thick fuzzy band in calm cruise'] },
    { m: 'F', cam: 'dim', k: 'spectrum', full: true, cap: ['04', 'Noise climbs with throttle'] },
    { m: 'F', cam: 'wide', k: 'bars', cap: ['05', 'One bell alone points at the part'] },
  ],
  'P1-S05': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'hero', k: 'plain', cap: ['01', 'A small nod at the end'] },
    { m: 'F', cam: 'dim', k: 'step', full: true, cap: ['02', 'Fast rings: P and D'] },
    { m: 'F', cam: 'dim', k: 'chart', full: true, cap: ['03', 'One slow return: I-term'] },
    { m: 'F', cam: 'wide', k: 'chain', cap: ['04', 'It accumulates, then discharges'] },
    { m: 'F', cam: 'wide', k: 'bars', cap: ['05', 'Or the motors are already at the limit'] },
  ],
  'P1-S06': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'hero', k: 'plain', cap: ['01', 'Mushy, then snappy'] },
    { m: 'F', cam: 'dim', k: 'step', full: true, cap: ['02', 'Slow rise is lag'] },
    { m: 'F', cam: 'dim', k: 'step', full: true, cap: ['03', 'Past the target is overshoot'] },
    { m: 'F', cam: 'wide', k: 'chart', cap: ['04', 'One lever at a time'] },
    { m: 'F', cam: 'wide', k: 'bars', cap: ['05', 'Or a physical ceiling'] },
  ],
  'P1-S07': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'hero', k: 'plain', cap: ['01', 'Calm sticks, calm horizon'] },
    { m: 'F', cam: 'wide', k: 'chain', cap: ['02', 'A dropped packet shows up downstream'] },
    { m: 'F', cam: 'dim', k: 'chart', full: true, cap: ['03', 'Spikes that follow the stick'] },
    { m: 'E', k: 'check', display: 'TWO\nTESTS', items: ['Feedforward = 0 test flight', 'Temporary wide deadband', 'No change means it is not the cause'] },
    { m: 'F', cam: 'macro', k: 'bars', cap: ['04', 'Sticks centred, still twitching'] },
  ],
  'P1-S08': [
    { m: 'E', k: 'sign' },
    { m: 'F', cam: 'low', k: 'plain', cap: ['01', 'Smooth until you punch it'] },
    { m: 'F', cam: 'wide', k: 'chart', cap: ['02', 'Only in the top of the throttle'] },
    { m: 'F', cam: 'dim', k: 'chart', full: true, cap: ['03', 'Gain comes down as throttle rises'] },
    { m: 'F', cam: 'hero', k: 'bars', cap: ['04', 'The same input, two responses'] },
    { m: 'F', cam: 'wide', k: 'spectrum', cap: ['05', 'Or one frequency that does not move'] },
  ],
  'P1-S09': [
    { m: 'E', k: 'hardware' },
    { m: 'F', cam: 'hero', k: 'chart', cap: ['01', 'The log points at a part'] },
    { m: 'F', cam: 'dim', k: 'bars', cap: ['02', 'One motor, one arm, one axis'] },
    { m: 'F', cam: 'dim', k: 'spectrum', full: true, cap: ['03', 'A tone that holds its frequency'] },
    { m: 'F', cam: 'wide', k: 'spectrum', cap: ['04', 'A raised floor across the spectrum'] },
    { m: 'F', cam: 'macro', k: 'plain', cap: ['05', 'Many small sources at once'] },
  ],
  'P1-S10': [
    { m: 'E', k: 'flylog' },
    { m: 'F', cam: 'wide', k: 'chart', cap: ['01', 'A log that can answer'] },
    { m: 'F', cam: 'wide', k: 'chain', cap: ['02', 'Record the channels you will read'] },
    { m: 'F', cam: 'dim', k: 'chart', full: true, cap: ['03', 'Moves you can compare'] },
    { m: 'F', cam: 'hero', k: 'plain', cap: ['04', 'Clean air, clear manoeuvres'] },
    { m: 'E', k: 'brand' },
  ],
  'P1-S11': [
    { m: 'E', k: 'recap' },
    { m: 'E', k: 'recap' },
    { m: 'E', k: 'recap' },
    { m: 'E', k: 'recap2' },
    { m: 'E', k: 'recap3' },
    { m: 'E', k: 'end' },
  ],
};

/* ------------------------------------------------------------------ */
/* plates: the airframe that is already rendered                      */
/* ------------------------------------------------------------------ */
/* The quad in this episode is the one modelled and rendered for Six Things
 * already, not a new model. build/ingest_plates.js turns those finished frames
 * into the nine clips in build/plates, and this layer cuts between them.
 *
 * The renders are beauty passes: the airframe sits in the studio and turns
 * slowly. They carry almost no motion of their own, so the movement the edit
 * needs is added here — every beat gets its own camera move (push, pull, drift)
 * and its own in-point, so no two beats cut to the same image twice and the
 * frame is never dead while the narration carries a fourteen-second beat.
 *
 * The source is 1080p and stays 1080p: no upscale, only a slow transform.
 */
const PLATE_FPS = 30;

const PANEL_KINDS = new Set(['chart', 'step', 'spectrum', 'bars', 'loop', 'chain', 'mini3', 'macro']);

/* Every source plate, with where the airframe actually sits in it.
 *
 * cx/cy are the median centroid of the subject measured over sampled frames of
 * each source, as fractions of the frame. They differ per pass — SH02 sits right
 * of centre, SH08 sits high and left, the stills are already composed for a
 * right-hand panel — so the compositor reframes each one individually instead of
 * assuming the subject is centred.
 *
 *   kind  video for the animated passes, still for the four hero frames
 *   zoom  how far this source can be pushed before it turns to mush; the
 *         sources are all 1920x1080, so 1.45 is the ceiling
 */
const PLATES = {
  hero_a:   { kind: 'still', src: 'img/hero_a.png',   cx: 0.34, cy: 0.39, zoom: 1.12 },
  hero_b:   { kind: 'still', src: 'img/hero_b.png',   cx: 0.56, cy: 0.54, zoom: 1.10 },
  propwash: { kind: 'still', src: 'img/propwash.png', cx: 0.38, cy: 0.43, zoom: 1.10 },
  bearings: { kind: 'still', src: 'img/bearings.png', cx: 0.47, cy: 0.55, zoom: 1.18 },
  drop:     { kind: 'video', src: 'drop.mp4',         cx: 0.59, cy: 0.42, zoom: 1.25 },
  motorcu:  { kind: 'video', src: 'motorcu.mp4',      cx: 0.52, cy: 0.44, zoom: 1.30 },
  SH02:     { kind: 'video', src: 'SH02.mp4',         cx: 0.60, cy: 0.48, zoom: 1.40 },
  SH03:     { kind: 'video', src: 'SH03.mp4',         cx: 0.49, cy: 0.53, zoom: 1.45 },
  SH04:     { kind: 'video', src: 'SH04.mp4',         cx: 0.51, cy: 0.48, zoom: 1.45 },
  SH08:     { kind: 'video', src: 'SH08.mp4',         cx: 0.47, cy: 0.35, zoom: 1.45 },
};

/* Which plate answers each beat, and how it is cut.
 *
 *   clip   key in PLATES
 *   at     seconds into the clip where the beat starts (video only)
 *   speed  playback rate, so a fourteen-second beat can sit without racing
 *   move   camera move applied across the beat
 *
 * The hero stills and the two motion passes carry the beats the narration is
 * actually showing something on; the wide passes carry the chart and log beats,
 * where the panel is the subject and the airframe is context.
 */
const PLATE_CUTS = {
  'P1-S01:0': { clip: 'drop', at: 0.0, speed: 1.0, move: 'push' },
  'P1-S01:1': { clip: 'motorcu', at: 0.6, speed: 0.85, move: 'push' },
  'P1-S01:4': { clip: 'hero_a', move: 'driftL' },

  'P1-S02:0': { clip: 'hero_a', move: 'push' },
  'P1-S02:1': { clip: 'SH03', at: 0.6, speed: 0.85, move: 'driftR' },
  'P1-S02:2': { clip: 'hero_b', move: 'pull' },
  'P1-S02:3': { clip: 'SH04', at: 1.2, speed: 0.85, move: 'push' },

  'P1-S03:1': { clip: 'SH08', at: 0.4, speed: 0.9, move: 'rise' },
  'P1-S03:2': { clip: 'propwash', move: 'push' },
  'P1-S03:3': { clip: 'SH02', at: 4.5, speed: 0.8, move: 'pull' },
  'P1-S03:4': { clip: 'propwash', move: 'driftR' },

  'P1-S04:1': { clip: 'SH04', at: 0.5, speed: 0.9, move: 'push' },
  'P1-S04:2': { clip: 'motorcu', at: 2.4, speed: 0.85, move: 'driftR' },
  'P1-S04:3': { clip: 'hero_a', move: 'pull' },
  'P1-S04:4': { clip: 'SH03', at: 2.2, speed: 0.85, move: 'push' },
  'P1-S04:5': { clip: 'hero_b', move: 'driftL' },

  'P1-S05:1': { clip: 'hero_a', move: 'push' },
  'P1-S05:2': { clip: 'hero_b', move: 'pull' },
  'P1-S05:3': { clip: 'SH03', at: 1.0, speed: 0.85, move: 'driftR' },
  'P1-S05:4': { clip: 'hero_a', move: 'driftL' },
  'P1-S05:5': { clip: 'SH02', at: 2.4, speed: 0.85, move: 'rise' },

  'P1-S06:1': { clip: 'hero_b', move: 'push' },
  'P1-S06:2': { clip: 'SH02', at: 7.0, speed: 0.8, move: 'driftL' },
  'P1-S06:3': { clip: 'hero_a', move: 'pull' },
  'P1-S06:4': { clip: 'SH04', at: 2.8, speed: 0.85, move: 'push' },
  'P1-S06:5': { clip: 'SH08', at: 1.5, speed: 0.9, move: 'driftR' },

  'P1-S07:1': { clip: 'hero_a', move: 'push' },
  'P1-S07:2': { clip: 'SH02', at: 5.6, speed: 0.85, move: 'driftL' },
  'P1-S07:3': { clip: 'SH03', at: 3.4, speed: 0.85, move: 'pull' },
  'P1-S07:5': { clip: 'bearings', move: 'push' },

  'P1-S08:1': { clip: 'SH08', at: 0.8, speed: 0.9, move: 'rise' },
  'P1-S08:2': { clip: 'hero_a', move: 'driftR' },
  'P1-S08:3': { clip: 'SH04', at: 4.0, speed: 0.85, move: 'push' },
  'P1-S08:4': { clip: 'hero_b', move: 'pull' },
  'P1-S08:5': { clip: 'SH02', at: 9.2, speed: 0.8, move: 'driftL' },

  'P1-S09:1': { clip: 'hero_a', move: 'push' },
  'P1-S09:2': { clip: 'SH03', at: 4.4, speed: 0.85, move: 'driftR' },
  'P1-S09:3': { clip: 'bearings', move: 'push' },
  'P1-S09:4': { clip: 'SH02', at: 1.6, speed: 0.85, move: 'pull' },
  'P1-S09:5': { clip: 'motorcu', at: 1.4, speed: 0.9, move: 'driftL' },

  'P1-S10:1': { clip: 'hero_a', move: 'push' },
  'P1-S10:2': { clip: 'SH04', at: 3.6, speed: 0.85, move: 'driftR' },
  'P1-S10:3': { clip: 'SH03', at: 5.2, speed: 0.85, move: 'pull' },
  'P1-S10:4': { clip: 'hero_b', move: 'push' },
};

const plateMedia = new Map();
const plateLoads = new Map();

function plateMediaFor(id) {
  const have = plateMedia.get(id);
  if (have) return have;

  const spec = PLATES[id];
  let el;
  if (spec.kind === 'still') {
    el = new Image();
    el.src = `/build/plates/${spec.src}`;
  } else {
    el = document.createElement('video');
    el.src = `/build/plates/${spec.src}`;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:4px;height:4px;opacity:0;';
    document.body.appendChild(el);
    el.load();
  }

  plateMedia.set(id, el);
  plateLoads.set(id, new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    if (spec.kind === 'still') {
      if (el.complete && el.naturalWidth) done(true);
      else {
        el.addEventListener('load', () => done(true));
        el.addEventListener('error', () => done(false));
      }
    } else {
      el.addEventListener('loadeddata', () => done(true));
      el.addEventListener('error', () => done(false));
    }
    setTimeout(() => done(false), 10000);
  }));

  return el;
}

function cutFor(sceneId, beatIndex) {
  return PLATE_CUTS[`${sceneId}:${beatIndex}`] || PLATE_CUTS['P1-S02:0'];
}

/* Ease the camera move. Linear transforms read as a slide; a smoothstep holds
 * for a beat at each end, which is what makes a push-in feel deliberate. */
function smooth(u) {
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  return x * x * (3 - 2 * x);
}

async function seekPlate(v, t) {
  const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1e9;
  const target = Math.max(0, Math.min(t % d, d - 0.05));
  if (Math.abs(v.currentTime - target) < 0.008) return;
  await new Promise((resolve) => {
    let settled = false;
    const fin = () => {
      if (settled) return;
      settled = true;
      v.removeEventListener('seeked', fin);
      resolve();
    };
    v.addEventListener('seeked', fin);
    setTimeout(fin, 500);
    try { v.currentTime = target; } catch (e) { fin(); }
  });
}

async function loadPlate(id, t) {
  const el = plateMediaFor(id);
  const ok = await plateLoads.get(id);
  if (!ok) return null;
  if (PLATES[id].kind === 'video') {
    if (el.readyState < 2) return null;
    await seekPlate(el, t);
  }
  return el;
}

/* Draw the plate for this beat.
 *
 * The source is reframed so the airframe lands where the composition wants it —
 * clear of the HUD panel on panel beats, centred when the panel is full-screen
 * — and only then does the beat's camera move run on top. Because the subject is
 * not centred in every source, the zoom required to move it also depends on how
 * far it has to travel: an offset image at scale 1 leaves a bare strip, so the
 * scale is raised until the frame is covered, capped at the source's zoom limit.
 * When the cap is hit the target is pulled back instead, which keeps the
 * airframe whole rather than pushing it off the edge. */
function drawPlate(ctx, media, cut, u, hasPanel, full) {
  const spec = PLATES[cut.clip];
  const isStill = spec.kind === 'still';
  const e = smooth(u);

  let scale = 1.0;
  let moveX = 0;
  let moveY = 0;
  let rot = 0;

  switch (cut.move) {
    case 'push': scale = 1.03 + 0.085 * e; break;
    case 'pull': scale = 1.115 - 0.085 * e; break;
    case 'driftL': scale = 1.07; moveX = 0.022 - 0.055 * e; break;
    case 'driftR': scale = 1.07; moveX = -0.022 + 0.055 * e; break;
    case 'rise': scale = 1.07; moveY = 0.020 - 0.045 * e; break;
    default: scale = 1.04;
  }

  /* A still has no internal motion, and a slow push on its own reads as a
   * frozen frame drifting closer. Half a degree of rotation across the beat
   * turns the same push into a turntable, which is how the airframe is lit. */
  if (isStill) rot = (-0.30 + 0.60 * e) * Math.PI / 180;

  // where the subject should land on screen
  let tx = full ? 0.50 : (hasPanel ? 0.36 : 0.50);
  let ty = 0.50;

  tx += moveX;
  ty += moveY;

  // full coverage: scale s can place the subject anywhere in this band
  const fitX = (s) => [1 - (1 - spec.cx) * s, spec.cx * s];
  const fitY = (s) => [1 - (1 - spec.cy) * s, spec.cy * s];

  // rotation swings the corners, so it needs a little more scale
  const rotPad = Math.abs(rot) * 2;

  const lo = Math.max(scale + rotPad, 1.0);
  const coverX = Math.max(tx / spec.cx, (1 - tx) / (1 - spec.cx));
  const coverY = Math.max(ty / spec.cy, (1 - ty) / (1 - spec.cy));
  let s = Math.max(lo, coverX, coverY);

  if (s > spec.zoom) {
    s = spec.zoom;
    const [x0, x1] = fitX(s);
    const [y0, y1] = fitY(s);
    tx = Math.min(Math.max(tx, x0), x1);
    ty = Math.min(Math.max(ty, y0), y1);
  }

  const w = W * s;
  const h = H * s;

  if (rot) {
    ctx.save();
    ctx.translate(tx * W, ty * H);
    ctx.rotate(rot);
    ctx.drawImage(media, -spec.cx * w, -spec.cy * h, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(media, tx * W - spec.cx * w, ty * H - spec.cy * h, w, h);
  }
}

let ready = false;

export async function renderFrame(spec) {
  const { scene: sceneId, beatIndex, tLocal, beatDur, totalT } = spec;

  if (!ready) {
    await loadFonts('/SixThings_EP01/style/fonts');
    // the real EMAX 2306 mesh replaces the procedural motor before the first frame
    await enrichQuad(quad);
    makeCutout();
    ready = true;
  }

  const list = BEATS[sceneId] || BEATS['P1-S01'];
  const b = list[clamp(beatIndex, 0, list.length - 1)];
  const u = clamp(tLocal / Math.max(0.001, beatDur));

  beginFrame();

  if (b.m === 'E') {
    g.clearRect(0, 0, W, H);
    switch (b.k) {
      case 'sign': eSignCard(sceneId, tLocal, beatDur); break;
      case 'title': eTitleCard(tLocal); break;
      case 'broken': eBroken(tLocal); break;
      case 'split': eSplit(tLocal, beatDur); break;
      case 'rule': eRule(tLocal); break;
      case 'mechanics':
        eCheck('MECHANICS\nFIRST', ['Screws and standoffs', 'Props: cracks and balance', 'Flight controller mount', 'Motor bells and bearings'],
          'Tuning a quad that is physically damaged only hides the damage.');
        break;
      case 'hardware': eClosing('hardware', tLocal); break;
      case 'flylog': eClosing('flylog', tLocal); break;
      case 'brand': eClosing('brand', tLocal); break;
      case 'recap': eRecap(tLocal, beatDur); break;
      case 'recap2': eClosing('recap2', tLocal); break;
      case 'recap3': eClosing('recap3', tLocal); break;
      case 'end': eClosing('end', tLocal); break;
      case 'check': eCheck(b.display, b.items, b.note); break;
      default: eSignCard(sceneId, tLocal, beatDur);
    }
    endFrame(totalT);
    return true;
  }

  /* F mode: the rendered plate first, then the 2D layer on top. */
  const cut = cutFor(sceneId, beatIndex);
  const plate = await loadPlate(cut.clip, cut.at + tLocal * cut.speed);
  const hasPanel = PANEL_KINDS.has(b.k);

  const fs = flightState(sceneId, beatIndex, u);
  setCamera(b.cam, tLocal, u, fs);

  Q.position.set(fs.pos[0], fs.pos[1], fs.pos[2]);
  Q.rotation.set(fs.rot[0], fs.rot[2], fs.rot[1]);
  tree.visible = b.cam === 'drop';

  // prop spin follows throttle. The disc carries a blade-smear texture, so it
  // reads as rotation at any angle; d.js rotates its circle about z.
  const rpm = clamp(fs.throttle * 1.4, 0, 1);
  motors.forEach((m, i) => {
    const local = clamp(rpm * (1 + 0.04 * Math.sin(i * 2.1)), 0, 1);
    m.prop.visible = !b.noProp;
    m.glow.visible = !b.noProp;
    const spin = m.dir * tLocal * (22 + 70 * local);
    m.prop.rotation.z = spin;
    m.prop.material.opacity = 0.30 + 0.60 * local;
    // the modelled blades sit under the blur: visible when slow, lost when fast
    m.bladePivot.rotation.y = spin;
    m.bladePivot.traverse((o) => {
      if (o.isMesh) { o.visible = !b.noProp; }
    });
    m.glow.material.opacity = 0.06 + 0.20 * local;
    m.glow.scale.setScalar(0.85 + 0.45 * local);
    // the ring glows brighter with motor effort, as it does in the reference
    m.ring.material.emissiveIntensity = 0.35 + 1.9 * Math.pow(local, 1.4);
  });

  // bell heat: a desaturated warm shimmer, never the accent
  materials.bellSteel.color.setHex(fs.heat > 0.02 ? 0x2b2420 : 0x202329);
  materials.bellSteel.emissive.setHex(0x5a2a10);
  materials.bellSteel.emissiveIntensity = fs.heat * 0.30;

  if (!plate) renderer.render(scene, camera);

  g.clearRect(0, 0, W, H);

  /* the plate carries the studio; the HUD only grades on top */
  if (plate) {
    drawPlate(g, plate, cut, u, hasPanel, !!b.full);
    if (b.full) {
      g.fillStyle = 'rgba(6,9,13,0.55)';
      g.fillRect(0, 0, W, H);
    }
  }

  // studio falloff and framing
  vignette(g);
  brackets(g, 0.35);
  panelGradient(g);

  const full = !!b.full;
  const box = panelBox(full);

  switch (b.k) {
    case 'chart': {
      const d = rateTrace(6001 + (sceneId.charCodeAt(5) || 0), 1.6, {
        burst: [0.85, 1.35, 38, 85],
        throttle: sceneId === 'P1-S03' ? [0.7, 1.3, 55, 8] : null,
      });
      chartPanel(box, sceneId === 'P1-S03' ? 'Roll setpoint vs gyro' : 'Rate response', d, {
        progress: clamp(tLocal / (beatDur * 0.55)),
        band: sceneId === 'P1-S03' ? [0.85, 1.35] : null,
        marker: sceneId === 'P1-S03' ? 0.85 : null,
        note: sceneId === 'P1-S03' ? 'wobble starts in the wash' : null,
        noteAt: 0.9, noteY: 60,
        throttle: sceneId === 'P1-S03',
      });
      break;
    }
    case 'step': stepPanel(box, clamp(tLocal / (beatDur * 0.6))); break;
    case 'spectrum': spectrumPanel(box, clamp(tLocal / (beatDur * 0.55))); break;
    case 'bars': barsPanel(box, clamp(tLocal / (beatDur * 0.7))); break;
    case 'loop': loopPanel(box, tLocal, beatDur); break;
    case 'chain': chainPanel(box, clamp(tLocal / (beatDur * 0.8))); break;
    case 'mini3': threeMini(box, clamp(tLocal / (beatDur * 0.8))); break;
    case 'macro': {
      hudPanel(g, box.x, box.y, box.w, box.h, 'Motor bell · heat', null);
      const p = clamp(tLocal / (beatDur * 0.6));
      text(g, 'warm to the touch', box.x + 40, box.y + 140, { size: 24, weight: 500, color: C.huddim });
      const bx = { x0: box.x + 60, x1: box.x + box.w - 40, y0: box.y + 260, y1: box.y + 520 };
      const px = (v) => bx.x0 + (v / 1.6) * (bx.x1 - bx.x0);
      const py = (v) => (bx.y0 + bx.y1) / 2 - v * 1.1;
      const d = rateTrace(77, 1.6, { burst: [0.9, 1.25, 34, 60] });
      const n = Math.max(2, Math.floor(d.t.length * p));
      series(g, d.t, d.sp, n, bx, { px, py }, { color: C.hudtext, width: 2, dash: [9, 7] });
      series(g, d.t, d.gy, n, bx, { px, py }, { color: C.teal, width: 2.4 });
      g.save(); g.strokeStyle = C.hudline; g.lineWidth = 1;
      g.beginPath(); g.moveTo(bx.x0, (bx.y0 + bx.y1) / 2); g.lineTo(bx.x1, (bx.y0 + bx.y1) / 2); g.stroke(); g.restore();
      text(g, 'nose overshoots, then returns', box.x + 40, box.y + box.h - 60, { size: 20, weight: 500, color: C.huddim });
      legend(g, box.x + 22, box.y + box.h - 16, [['sp', 'setpoint'], ['teal', 'gyro']]);
      break;
    }
    default: {
      // plain studio beat: a lone readout, so the quad carries the frame
      const x = 1120;
      hudPanel(g, x, 640, 700, 160, 'Studio', null);
      text(g, 'five-inch quad · one cool key light', x + 24, 740, { size: 22, weight: 500, color: C.huddim });
    }
  }

  if (b.cap) caption(b.cap[0], b.cap[1], ease.out(clamp(tLocal / 0.35)));

  endFrame(totalT);
  return true;
}

window.renderFrame = renderFrame;
window.__scene = scene;
window.__quad = Q;
window.__quadApi = quad;
/* Tuning hooks: exposure and a light multiplier, so brightness can be measured
 * instead of judged by eye. */
window.__setExposure = (e) => { renderer.toneMappingExposure = e; };
window.__setLightMult = (m) => {
  scene.traverse((o) => {
    if (o.isDirectionalLight || o.isHemisphereLight || o.isAmbientLight || o.isSpotLight) {
      if (o.userData.base === undefined) o.userData.base = o.intensity;
      o.intensity = o.userData.base * m;
    }
  });
};
window.__setEnvIntensity = (v) => {
  Q.traverse((o) => {
    if (o.material && o.material.envMapIntensity !== undefined) o.material.envMapIntensity = v;
  });
};
/* Measurement hooks for the render driver's diagnostics. */
window.__diag = () => {
  const box = new THREE.Box3().setFromObject(Q);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const p = centre.clone().project(camera);
  return {
    quad: { w: +size.x.toFixed(1), h: +size.y.toFixed(1), d: +size.z.toFixed(1) },
    centre: { x: +centre.x.toFixed(1), y: +centre.y.toFixed(1), z: +centre.z.toFixed(1) },
    cam: { x: +camera.position.x.toFixed(1), y: +camera.position.y.toFixed(1), z: +camera.position.z.toFixed(1) },
    dist: +camera.position.distanceTo(centre).toFixed(1),
    screen: { x: Math.round((p.x * 0.5 + 0.5) * W), y: Math.round((-p.y * 0.5 + 0.5) * H) },
    fov: camera.fov,
  };
};
window.__ready = true;
