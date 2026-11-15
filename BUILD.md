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
