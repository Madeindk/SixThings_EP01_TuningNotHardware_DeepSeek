/* Deterministic flight model.
 *
 * The point of this module: the quad must DEMONSTRATE what the narration says,
 * not wobble generically. Each storyboard beat therefore names a manoeuvre, and
 * the manoeuvre is authored to match that beat's spoken content:
 *
 *   chopWash    throttle chop, drop into its own air, wobble from the wash, then
 *               settle when it flies out into clean air        (sign one)
 *   rollNod     a fast roll that nods BACK past level at the end
 *                                                               (sign three)
 *   lagSnap     rotates late and then overshoots the target      (sign four)
 *   twitch      small sharp impulses from the sticks              (sign five)
 *   punchOsc    smooth cruise, violent oscillation on a punch-out, calm again
 *                                                               (sign six)
 *   spinDown    motors wind down while the bells stay warm        (sign two)
 *   present     no manoeuvre: the camera does the work (close-ups)
 *
 * Every value is a pure function of (manoeuvre, u) where u is 0..1 through the
 * beat, so a re-render of the same frame is identical.
 */

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (u, a, b) => clamp((u - a) / (b - a));

/* A damped oscillation: amplitude decays, phase is fixed. */
function ring(u, freq, decay, phase = 0) {
  return Math.sin(TAU * freq * u + phase) * Math.exp(-decay * u);
}

/* ------------------------------------------------------------------ */
/* manoeuvres                                                         */
/* ------------------------------------------------------------------ */
/* Each returns { pos, rot, throttle, rpm, heat }.
 *   pos      metres of offset from the studio origin, in quad-relative axes
 *   rot      radians, applied as pitch / roll / yaw
 *   throttle 0..1, drives prop RPM and the airflow glow
 *   heat     0..1, drives the bell emissive (desaturated warm, never accent)
 */

const M = {
  /* gentle idle hover: reads as "this thing is alive" */
  hover(u) {
    return {
      pos: [Math.sin(TAU * u * 0.7) * 8, Math.sin(TAU * u * 0.9) * 5, 0],
      rot: [Math.sin(TAU * u * 0.55) * 0.02, Math.sin(TAU * u * 0.8) * 0.03, Math.sin(TAU * u * 0.4) * 0.04],
      throttle: 0.34 + Math.sin(TAU * u * 1.1) * 0.02,
      heat: 0,
    };
  },

  /* sign one: chop the throttle, fall through your own disturbed air, then settle */
  chopWash(u) {
    const chop = u > 0.18 && u < 0.62;              // falling through the wash
    const fall = easeInOutCubic(seg(u, 0.12, 0.58));
    const settle = easeOutCubic(seg(u, 0.58, 1));
    // the wobble starts WITH the disturbed air and fades as clean air arrives
    const wash = seg(u, 0.24, 0.34) * (1 - seg(u, 0.58, 0.86));
    const wob = wash * ring(u, 8.5, 2.2);
    const wob2 = wash * ring(u, 5.3, 1.6, 1.1);
    return {
      pos: [wob * 6, -fall * 90 + settle * 18, wob2 * 4],
      rot: [
        wob * 0.16 + wob2 * 0.10,                    // pitch shake
        wob2 * 0.20,                                 // roll shake
        Math.sin(TAU * u * 0.6) * 0.05,
      ],
      throttle: chop ? 0.06 + 0.04 * Math.sin(TAU * u * 6) : (u < 0.18 ? 0.46 : 0.40),
      heat: 0,
    };
  },

  /* sign three: a roll, then the nose nods back past level and settles */
  rollNod(u) {
    // roll: 1.2 turns, finished at u=0.42
    const rollU = easeInOutCubic(seg(u, 0.10, 0.42));
    // bounce-back: overshoot past zero and ring back, exactly what the narrator
    // describes: "the nose swings back a little, as if it changed its mind"
    const nod = u > 0.42 ? -0.55 * Math.exp(-(u - 0.42) * 9) * Math.cos(TAU * (u - 0.42) * 1.6) : 0;
    return {
      pos: [0, Math.sin(TAU * u * 0.8) * 4, 0],
      rot: [
        nod * 0.55,
        rollU * TAU * 1.2 + nod,
        Math.sin(TAU * u * 0.5) * 0.03,
      ],
      throttle: 0.42 + 0.06 * Math.sin(Math.PI * seg(u, 0.08, 0.44)),
      heat: 0,
    };
  },

  /* sign four: arrives late (lag), then goes too far (overshoot) */
  lagSnap(u) {
    const lag = easeOutCubic(seg(u, 0.10, 0.56));       // slow to arrive
    const snap = easeOutCubic(seg(u, 0.56, 0.72));      // then a jolt past the target
    const settle = ring(u, 3.2, 3.4);                    // and rings back
    const target = 0.42;
    const now = lag * target * 0.72 + snap * target * 0.55;
    const over = u > 0.56 ? settle * 0.10 * (1 - seg(u, 0.75, 1)) : 0;
    return {
      pos: [0, Math.sin(TAU * u * 0.75) * 4, 0],
      rot: [now + over, (1 - lag) * 0.05, Math.sin(TAU * u * 0.5) * 0.02],
      throttle: 0.40 + 0.09 * seg(u, 0.5, 0.65),
      heat: 0,
    };
  },

  /* sign five: small sharp impulses that follow the stick, never a drift */
  twitch(u) {
    // three impulses at fixed points, each a fast attack and quick decay
    const imp = [0.22, 0.47, 0.71].map((p) => {
      const d = (u - p) / 0.035;
      return Math.exp(-d * d * 2.4) * Math.sign(Math.round(Math.sin(p * 31) * 10) || 1);
    });
    const sum = imp.reduce((a, b) => a + b, 0);
    return {
      pos: [sum * 3, Math.sin(TAU * u * 0.6) * 3, 0],
      rot: [sum * 0.09, sum * 0.13, Math.sin(TAU * u * 0.45) * 0.03],
      throttle: 0.36 + Math.abs(sum) * 0.05,
      heat: 0,
    };
  },

  /* sign six: smooth, then a punch-out that shakes, then calm */
  punchOsc(u) {
    const punch = seg(u, 0.14, 0.26) * (1 - seg(u, 0.62, 0.72));
    const osc = punch * ring(u, 11, 0.9) * 0.6 + punch * ring(u, 17, 1.1, 0.7) * 0.32;
    const climb = easeInOutCubic(seg(u, 0.14, 0.3)) * (1 - seg(u, 0.62, 0.8));
    return {
      pos: [osc * 5, climb * 70, osc * 4],
      rot: [osc * 0.20, osc * 0.26, Math.sin(TAU * u * 0.5) * 0.03],
      throttle: 0.36 + climb * 0.54 + Math.abs(osc) * 0.05,
      heat: punch * 0.25,
    };
  },

  /* sign two: motors wind down while the bells stay warm */
  spinDown(u) {
    const down = 1 - easeOutCubic(seg(u, 0.15, 0.85));
    return {
      pos: [0, Math.sin(TAU * u * 0.6) * 3, 0],
      rot: [0, 0.02, Math.sin(TAU * u * 0.4) * 0.02],
      throttle: 0.10 + 0.42 * down,
      heat: 0.55 + 0.45 * (1 - down),
    };
  },

  /* no manoeuvre: the camera presents the object */
  present(u) {
    return {
      pos: [0, 0, 0],
      rot: [0, Math.sin(TAU * u * 0.35) * 0.05, 0],
      throttle: 0.16 + 0.10 * Math.sin(TAU * u * 0.8),
      heat: 0,
    };
  },

  /* the opening drop past the tree */
  dropIn(u) {
    const fall = easeOutCubic(seg(u, 0.05, 0.72));
    const settle = easeOutCubic(seg(u, 0.72, 1));
    const wob = seg(u, 0.3, 0.4) * (1 - seg(u, 0.8, 1)) * ring(u, 6.4, 1.8);
    return {
      pos: [wob * 8, 260 - fall * 260 + settle * 16, 0],
      rot: [wob * 0.13, wob * 0.17, Math.sin(TAU * u * 0.5) * 0.06],
      throttle: 0.30 + fall * 0.14,
      heat: 0,
    };
  },

  /* a quick reversal for the sign-two mechanism beat */
  reversal(u) {
    const r = easeInOutCubic(seg(u, 0.18, 0.46)) * (1 - easeInOutCubic(seg(u, 0.62, 0.9)));
    return {
      pos: [-r * 40, -Math.sin(Math.PI * seg(u, 0.18, 0.9)) * 22, 0],
      rot: [r * 0.22, -r * 0.30, r * 0.12],
      throttle: 0.40 - r * 0.20,
      heat: 0,
    };
  },
};

/* ------------------------------------------------------------------ */
/* per-scene, per-beat assignment                                     */
/* ------------------------------------------------------------------ */
/* The manoeuvre each beat shows. Beats not listed fall back to the scene's
 * default, so the mapping is readable rather than exhaustive. */
const PROGRAM = {
  'P1-S01': ['dropIn', 'present', null, null, 'present', null],
  'P1-S02': ['present', 'present', 'hover', 'present', null, null],
  'P1-S03': [null, 'chopWash', 'chopWash', 'present', 'reversal', null],
  'P1-S04': [null, 'spinDown', 'present', 'present', 'present', 'present'],
  'P1-S05': [null, 'rollNod', 'rollNod', 'present', 'present', 'present'],
  'P1-S06': [null, 'lagSnap', 'lagSnap', 'lagSnap', 'present', 'present'],
  'P1-S07': [null, 'twitch', 'twitch', 'present', null, 'present'],
  'P1-S08': [null, 'punchOsc', 'punchOsc', 'present', 'present', 'present'],
  'P1-S09': [null, 'present', 'present', 'present', 'present', 'present'],
  'P1-S10': [null, 'present', 'hover', 'present', 'hover', null],
  'P1-S11': [null, null, null, null, null, null],
};

const DEFAULT_FOR_SCENE = {
  'P1-S03': 'chopWash',
  'P1-S05': 'rollNod',
  'P1-S06': 'lagSnap',
  'P1-S07': 'twitch',
  'P1-S08': 'punchOsc',
};

export function flightState(sceneId, beatIndex, u) {
  const row = PROGRAM[sceneId];
  let name = row ? row[beatIndex] : null;
  if (!name) name = DEFAULT_FOR_SCENE[sceneId] || 'present';
  const fn = M[name] || M.present;
  const st = fn(clamp(u, 0, 1));
  st.name = name;
  return st;
}

export const MANOEUVRES = Object.keys(M);
