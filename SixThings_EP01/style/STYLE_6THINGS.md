# 6 THINGS — STYLE LOCK v1 (12 Nov 2026)

Applies ONLY to the "6 Things" series (EP01 onward). It REPLACES the inherited Inside the Log / EP04 G2 navy-gold lock for this series. **G2 does NOT apply to 6 Things**: no G2 discovery gate, no G2_REFERENCE_LOCK, no navy/gold palette. Inside the Log EP05–10 stay on G2, unchanged.

Thomas chose a COMBINATION of two concept frames (src/ref_E_editorial.jpg, src/ref_F_cinematic.jpg):
- **E — Editorial**: thumbnail, intro title card, the six sign title cards, section cards, rule/test cards, recap, end card.
- **F — Cinematic**: every explanation beat inside a sign (log traces, step response, spectra, mechanisms, hardware close-ups).
- **Bridge rule**: E's red-orange accent is the ONLY highlight in F's HUD and always means "this is the problem". Teal is always measured data. Nothing else carries colour emphasis.

Reference frames (code-rendered, 1920×1080): `frames/a_thumbnail_1920x1080.png` (+ `a_thumbnail_1280x720.jpg`), `frames/b_sign01_titlecard_propwash.png`, `frames/c_F_hud_beat_sign01.png`, `frames/d_recap_card.png`, `frames/e_end_card.png`. Regenerate with `python build_frames.py` (needs headless Chrome/Chromium + numpy + Pillow). Synthetic data: `data/*.csv`, formulas in the script docstrings.

## Hard rules (unchanged from Thomas)
1. Faceless: no people, faces, hands, presenters, avatars, lip-sync, silhouettes of pilots.
2. No sources in the video: no source names, citations, URLs, doc/page/channel titles, screenshots of docs or videos, "source:"/"according to" captions, footnotes, credit overlays.
3. No corner watermarks or brand bugs. The EasyQuadTune icon appears only on the restrained E cards named in the storyboard and on the end card.
4. One caption block at a time. Outgoing text is gone before incoming text arrives. No overlapping text (cut-out quad may overlap the DISPLAY word only, never labels, counters, captions or charts).
5. All charts are synthetic, seeded, labelled "SYNTHETIC EXAMPLE" once per chart, with accurate axes (see Chart rules). No tuning values (PID, filter, TPA, idle numbers) on screen.
6. Default music NONE. Finished narration is supplied; never generate, alter or re-time the voice.

## Palette (exact)
| Token | Hex | Use |
|---|---|---|
| E.paper | #F4F1EA | E background (flat, no texture, no vignette) |
| E.ink | #111111 | display type, chart lines (gyro), rules — 16.7:1 on paper |
| E.ink2 | #5E5B55 | secondary text, tick numerals, setpoint dashed line — 6.0:1 |
| ACCENT (shared E+F) | #EC4118 | the single highlight: counter's current number, accent rules, problem band/marker — 3.5:1 on paper (large/bold use only, ≥26 px semibold), 4.9:1 on F.void |
| ACCENT tint | #EC4118 @ 10–12 % | problem band fill behind a chart region |
| F.void | #0B0E12 | F background floor / panel base |
| F.studio | #1A2027 | spotlight falloff, backdrop mid-tone |
| F.spot | #C9D6DE @ ≤35 % | the one cool top light cone |
| F.airflow | #8FE8DF @ 25–45 % | translucent airflow around props |
| F.hudline | #5D6B75 | HUD hairlines, panel border, corner brackets, grid |
| F.hudtext | #E6ECEF | HUD titles, captions, legend — 16.2:1 on void |
| F.huddim | #8E9BA3 | axis numerals, secondary HUD text, throttle trace — 6.8:1 |
| F.teal | #4FE0CF | MEASURED data only (gyro, spectra, filtered signals) — 11.9:1 |
| F.setpoint | #E6ECEF dashed 9/7 | COMMANDED data (setpoint) |
| F.panel | rgba(11,14,18,0.55) | HUD panel fill over the plate |

No other hues. Heat is shown as a desaturated warm shimmer on the bell (not ACCENT) unless that motor IS the problem marker.

## Fonts (all SIL Open Font License 1.1; files + licences bundled in `fonts/`)
- **Display (E):** Barlow Condensed ExtraBold 800 / Black 900 — `BarlowCondensed-ExtraBold.ttf`, `BarlowCondensed-Black.ttf`.
- **Text, labels, HUD (E+F):** Inter Tight (variable 100–900) — `InterTight-VariableFont_wght.ttf`.
- **Numerals on axes/HUD values, chip index:** JetBrains Mono (variable) — `JetBrainsMono-VariableFont_wght.ttf`.
Install locally or load via @font-face; never substitute system fonts. Tabular numerals for counters.

## Type scale at 1920×1080 (px)
| Role | Font | Size / line-height / tracking | Case |
|---|---|---|---|
| E.D1 one-word display (sign cards, thumbnail word) | Barlow Cond. 900 | 480–640 / 0.80 / −1.5 % | UPPER |
| E.D2 two-line display (end card, "IT'S THE") | Barlow Cond. 800–900 | 300–420 / 0.80 / −1.3 % | UPPER |
| E.H grid heading (recap cells) | Barlow Cond. 800 | 72 / 0.95 / 0 | UPPER |
| E.counter "01 / 06" | Inter Tight 600 | 40 / 1 / +2 % tabular | — |
| E.label | Inter Tight 600 | 28 / 1.25 / +5 % | UPPER |
| E.small | Inter Tight 500 | 24 / 1.2 / 0 | sentence |
| E.chart title / axis title | Inter Tight 600 | 18 / 1 / +8 % | UPPER |
| E/F tick numerals | JetBrains Mono 400 | 18 | — |
| F.caption chip (one line, ≤ 42 characters) | Inter Tight 500 | 36 / 1 / 0 | sentence |
| F.chip index ("01") | JetBrains Mono 500 | 22, ACCENT | — |
| F.panel title | Inter Tight 600 | 22 / 1 / +14 % | UPPER |
| F.panel tag "SYNTHETIC EXAMPLE" | Inter Tight 500 | 18 / 1 / +11 % | UPPER |
| F.annotation | Inter Tight 500–600 | 17 | sentence |
| F.legend | Inter Tight 400 | 18 | lower |
Minimum on-screen size 17 px. No italics, no outlines, no drop shadows on type.

## Safe areas
- Title-safe rectangle: x 96–1824, y 72–1008 (96 px left/right, 72 px top/bottom). Every counter, label, caption, chart, legend and icon lives inside it.
- Exception: E display words MAY bleed past the left/right/top frame edge (the "cropped" look), max 15 % of cap height or one partial letter; the word must stay instantly readable (never crop so a word reads as another word).
- F corner brackets: 64 px inset, 70 px arms, 2 px F.hudline. They are framing, not branding; omit on full-screen HUD beats if they collide with the panel.
- Thumbnail (designed at 1920×1080, delivered 1280×720): readable at 320 px wide; max two text elements.

## E layout slots (12-column grid: margins 96, gutter 24, column 124)
- Counter: top-right, right edge x 1824, top y 72; ACCENT dash 56×5 at y 132. Current number in ACCENT, "/ 06" in ink. Only on the six sign cards and the recap (06 / 06).
- Display band: y 150–560 (sign cards), left bleed allowed from x −20.
- Cut-out quad: right half, x ≈ 930–1930, y ≈ 360–1080, in front of the display word (overlap 10–30 % of the word's height), never in front of counter/label/chart.
- Label block: x 96, y 830–920, ACCENT rule 96×6 at y 802. Two lines max ("SIGN 0N" / short sign name).
- Mini chart: x 470–960, y 790–960 incl. axes; same synthetic data as the sign's F beat.
- Recap grid: 3 × 2 cells, 540 wide, x 96 / 686 / 1276, y 560 / 760; 2 px ink top rule per cell; number (ACCENT only for the active cell), heading E.H, one E.small line.
- Rule/test cards: one display line (E.D2 at 220–300) + at most one E.small line.

## F layout slots
- Hero: quad in the left 0–1100 px, single cool spot from top-centre-left, floor falloff to F.void. Translucent F.airflow around props.
- HUD panel: x 1120–1820, y 120–800, radius 6, 1.2 px F.hudline, F.panel fill. Header row: title left, "SYNTHETIC EXAMPLE" right. Legend row at the panel bottom.
- Caption chip: x 1120–1820, y 836–920, one line, index in ACCENT JetBrains Mono.
- Full-width HUD variant (spectrogram, four motor traces): x 160–1760, y 140–860; quad dimmed to ≤30 % or out of frame.
- Darkening gradient behind the panel: transparent at 45 % width → rgba(11,14,18,.70) at 62 % → .82 at 100 %.

## HUD spec
Hairlines 1–1.2 px F.hudline; grid lines 35 % opacity, zero line 90 %. Traces: gyro 2.4 px F.teal; setpoint 2 px F.setpoint dashed 9/7; secondary traces (throttle, motors, D-term) 2 px F.huddim. Problem marker: ACCENT 2 px vertical line and/or 12 % ACCENT band, plus one ≤ 4-word annotation in ACCENT — ONE marker per frame. Event markers that are not the problem (e.g. "stick stops") are F.huddim dashed 4/6. No glow on HUD lines (glow is reserved for airflow).

## Motion, easing, timing (60 fps, deterministic: every frame rendered from time t)
- E card in: hard cut. Optional display-word mask reveal 8 frames, cubic-bezier(0.2, 0, 0, 1). Cut-out quad slow push 2–3 % scale over the whole card, linear. Counter does not animate.
- F camera: slow dolly/orbit ≤ 6°/s, ease-in-out-sine. Props spin continuously; airflow particles drift, never strobe.
- HUD draw-on: panel border 300 ms, axes 400 ms, traces left→right at constant speed 600–900 ms, ease-out cubic(0.33, 1, 0.68, 1) for non-trace elements. ACCENT marker last: 250 ms fade + 2 px grow.
- Text: in 200 ms fade/slide 12 px; out 200 ms fade, fully gone before the next block. Hold ≥ 1.5 s + 0.3 s per 10 characters. Sign title cards hold ≥ 2.0 s.
- Sync visual events to the measured narration clause (timing CSV + listening), never to estimates.

## Transition rules
- E ↔ F: hard cut on a beat (sentence or clause boundary from the supplied audio), or a fast horizontal wipe 6–10 frames (100–167 ms), ease-in-out-quart, with a 6 px ACCENT leading edge allowed only on the wipe INTO a sign title card.
- F ↔ F inside a sign: straight cut or a HUD morph (panel stays, data changes). No cross-dissolves longer than 8 frames.
- Forbidden: whip pans, zoom-blur, glitch/RGB-split, shake, light leaks, 3D page flips, more than one transition per 2 s.

## Chart rules
- Every chart is synthetic: generated from seeded formulas kept in project/data/ (formula beside the data); labelled "SYNTHETIC EXAMPLE" exactly once per chart (panel tag or chart title). Never imply a real flight log.
- Axes carry the real quantity and unit: roll/pitch/yaw rate in deg/s; time in s; frequency in Hz; throttle in %; step response normalised to 1.0. Ticks at round values that match the plotted data; zero line drawn. Qualitative-only charts (thrust curve, TPA multiplier) label the axes but show no numbers.
- Colour semantics: F — setpoint light dashed, gyro teal, others dim; E — setpoint ink2 dashed, gyro ink solid. ACCENT only for the problem region.
- The only number spoken about frequency ("below about a hundred hertz, typical five-inch") is the only frequency label with a number besides axis ticks.
- The same sign uses the same synthetic data on its E mini chart and its F HUD (as frames b and c do).

## Placeholders — must be replaced before production
- `src/quad_cutout_PLACEHOLDER.png`: cut out (OpenCV GrabCut) from Thomas's concept frame E; low-res (≈650 px wide source), props missing, edges imperfect. Concept placeholder only.
- `src/plate_F_clean_PLACEHOLDER.jpg`: Thomas's concept frame F with its baked HUD inpainted out; 1280×720 source upscaled. Concept placeholder only.
- Both concept frames were supplied by Thomas as concept art (they look image-generated; their origin and rights are for Thomas to confirm). For production, render a dimensional 5-inch quad locally (e.g. Three.js in the manner of shared/animation-reference/d.js, or Blender) in the F lighting, plus a clean cut-out still/turntable for E. Do not ship the placeholders unless Thomas explicitly approves them.
