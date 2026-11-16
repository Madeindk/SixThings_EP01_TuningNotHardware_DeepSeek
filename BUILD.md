# Building the film

The episode is generated, not edited. Nothing here was hand-drawn frame by frame: every beat
is code, and the same command reproduces the same pixels.

```
node build/render.js --fps 30 --encode     # 11 scene clips, ~16 min on a Ryzen 7 9800X3D
node build/assemble.js                     # concat + mux narration
```

## Why it stays in sync

The renderer works on the **absolute episode timeline**, not per scene. Frame `f` maps to
`t = f / 30`, and `sixthings_ep01_p1_timing.csv` says which scene that `t` belongs to. A scene
border is therefore never a judgement call: frame number and audio sample index are the same
clock.

Scene gaps (the 0.70 s of silence in the narration) hold the outgoing scene's state rather
than cutting to black, which is why the assembled film has no black flashes and no drift.

Verification, run on the finished file:

| Check | Result |
|---|---|
| Duration vs narration | 764.894 s vs 764.894 s |
| Scene starts vs timing CSV | every one exact |
| Black frames (≥ 0.3 s) | none |
| Loudness / true peak | −16.7 LUFS / −1.6 dBTP |

## Components

| File | Role |
|---|---|
| `build/renderer/index.html` | the page: F stage, E stage, HUD slots |
| `build/renderer/style.css` | tokens and layout, matching `STYLE_6THINGS.md` |
| `build/renderer/main.js` | Three.js studio, HUD charts, E cards, the beat table |
| `build/renderer/cutout.js` | renders the E-mode quad cut-out with alpha |
| `build/make_fonts_css.js` | embeds the bundled OFL fonts as data URIs |
| `build/render.js` | frame driver: timeline mapping, CDP screenshots, scene encoding |
| `build/assemble.js` | concat + audio mux |
| `build/preview.js` | render single frames at arbitrary times, for review |
| `build/diag.js` | font and layout diagnostics |

### The current renderer: `build/renderer6/`

The first renderer (above) is superseded but kept because its HUD helpers are still
useful reading. The film is built by this set:

| File | Role |
|---|---|
| `build/server.js` | static server, so modules and fonts load as they do in a browser |
| `build/renderer6/index.html` | two stacked canvases: WebGL plate under, 2D overlay over |
| `build/renderer6/lib6.js` | type, HUD panels, charts, and the layout audit |
| `build/renderer6/quad6.js` | the airframe and the studio light rig |
| `build/renderer6/flight6.js` | the manoeuvre that each beat performs |
| `build/renderer6/main6.js` | beat table, E cards, compositing |
| `build/render6.js` | frame driver over http, with the layout audit collected per frame |
| `build/assemble6.js` | concat + mux + delivery encode |
| `build/preview6.js` | single frames at arbitrary times |

Build:

```
node build/render6.js --fps 30 --encode
node build/assemble6.js
```

## The quad must show what is being explained

This is the part that matters most, and it is why motion is authored per beat rather than
applied as one generic wiggle. `flight6.js` maps each beat to a manoeuvre:

| Manoeuvre | What it does | Where |
|---|---|---|
| `chopWash` | chops throttle, falls through its own air, shakes with the wash, settles in clean air | sign 1 |
| `spinDown` | motors wind down while the bells stay warm | sign 2 |
| `rollNod` | full roll, then the nose nods back past level and rings out | sign 3 |
| `lagSnap` | arrives late, then overshoots the target and rings back | sign 4 |
| `twitch` | three small sharp impulses, never a drift | sign 5 |
| `punchOsc` | smooth cruise, violent oscillation on a punch-out, calm again | sign 6 |
| `dropIn` | the opening descent past the tree | scene 1 |
| `hover`, `present`, `reversal` | idle life, or no manoeuvre at all | scene cards |

Every manoeuvre is a pure function of `u` (progress through the beat), so a frame renders
identically twice. The camera follows the manoeuvre with damping, which keeps a drop or a
climb framed without the camera chasing the object exactly.

## Realism notes

The airframe is modelled to 5" freestyle dimensions and was checked against a photograph of
race quads on Wikimedia Commons:

- 220 mm motor-to-motor diagonal, 112 mm centre-to-motor
- 28 mm motor bell on a 2207 stator, with ribs and a prop nut
- 127 mm props on a frame whose body is narrow and tall
- propellers dominate the silhouette, which is what the earlier box model got wrong
- stack: ESC and FC boards, standoffs, MOSFETs, gyro can, USB, boot button, capacitor
- XT60, three motor wires per arm, camera cage with a tilted lens, battery with straps,
  two antennas

A propeller is drawn twice: modelled blades at low RPM and a motion-blurred disc at high RPM,
cross-faded by throttle. The disc is the technique from the reference scene: three blades
stamped at 14 rotations each, which is what makes the spin read as rotation.

## Lighting

The first attempt used a SpotLight with physical decay as the key. Over the ~600 mm from lamp
to airframe it lost almost all of its illuminance, and the frame was 97 percent black. The key
is now a directional light with no distance falloff, with rim, fill and kick lights, a real
floor plane, and a soft radial pool of light. Brightness was tuned by measuring the mean
luminance of rendered frames rather than by eye.

## Delivery encode

`render.js` writes scene clips at CRF 17 (the master). `assemble.js` muxes them against the
narration. The committed file is then re-encoded once to CRF 21 / preset slow / AAC 192 kb/s,
which lands at 64.9 MB — visually identical on flat graphics, and comfortably inside GitHub's
per-file limit. For an archival master, keep the CRF 17 concat before that step.

## Determinism

- Every visual is a pure function of `(scene, beat, t)`. No `Date.now()`, no `Math.random()`.
- Chart data comes from seeded generators (`mulberry32`) mirroring the formulas in
  `style/build_frames.py`, so the E mini chart and the F HUD of the same sign share data.
- Frames are rendered by headless Chrome at a fixed 1920×1080 viewport with
  `deviceScaleFactor: 1`.
- Existing frames are skipped, so an interrupted run resumes at the frame it stopped on.

## Two things that had to be solved

**Fonts over `file://`.** Chrome fetches font files with CORS semantics and silently falls
back to a system font when the page is opened from disk, which produced frames with the wrong
typeface and no error. `make_fonts_css.js` inlines the four bundled faces as data URIs, and
`main.js` explicitly loads every face before the first frame.

**A name collision.** The Three.js scene was a module-level `scene`, and `renderFrame(spec)`
destructures `scene` from the spec — the episode name, a string. Three.js then received a
string where it expected a scene and threw inside a `WeakMap`. The scene object is now
`glScene`.

## What is generated vs authored

Authored: the manuscript, the storyboard, the style lock, the narration and its respells, the
beat-to-primitive mapping, and the chapter labels.

Generated: every frame, every chart path, every type position, the timing sheet, the scene
index, the chapter timestamps, and the final encode.

## Limits worth knowing

- The studio quad is built from primitives (plates, arms, bells, blades). It reads correctly
  in the light and at the sizes used, but it is not a modelled airframe. Replacing
  `buildQuadInto()` with a real mesh would improve the macro beats most.
- The renderer covers 8 visual primitives reused across 66 beats. Beats within a scene
  therefore share a primitive and differ in data, marker and caption rather than in camera
  and staging. More bespoke staging per beat is the obvious next step.
- 30 fps, not the 60 fps the style lock specifies. The lock's motion rules are expressed in
  frames (e.g. "8 frames" for a mask reveal), so at 30 fps those durations are twice as long
  in milliseconds. If 60 fps is required, re-render with `--fps 60`; nothing else changes.
- The E-mode `style/src/*PLACEHOLDER*` concept images are not used by the film. The cut-out
  quad is a real render from `cutout.js`.
