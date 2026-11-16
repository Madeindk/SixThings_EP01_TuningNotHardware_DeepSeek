# English release drafts — review before publishing

Nothing has been uploaded or posted. Thomas approves the final title, description and thumbnail before any upload.

## Title
Primary: 6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem
With series tag (77 characters): 6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem | 6 Things EP01
Shorter alternative: Tuning Problem or Hardware Problem? 6 Signs in Your Blackbox Log

## Thumbnail concept (faceless, 6 Things style E — see ../style/frames/a_thumbnail_1920x1080.png and a_thumbnail_1280x720.jpg)
Off-white paper (#F4F1EA). Oversized black Barlow Condensed type, cropped at the left/top edge: "IT'S THE" on line one, a huge "TUNE" on line two. A photoreal cut-out 5-inch quad overlaps the end of "TUNE" from the lower right, in front of the type. Lower left: a thin black step-response line (dashed setpoint, solid gyro) with its one overshoot peak circled in the red-orange accent (#EC4118). Top right: a small accent tag "6 SIGNS" in paper-coloured type. Exactly two text elements, no axis numbers, no people or hands, no corner watermark, no app screenshot, no source text. Option B display text: "DON'T BUY PARTS YET". Mobile check: readable at 320 px wide. The quad in the reference frame is a concept placeholder; the final thumbnail uses the production quad render.

## Description
Your quad wobbles, the motors come down hot, and the nose bounces back after every roll. Is something broken, or is it the tune? Before you buy new parts, here are six signs that a problem is more likely the tune than the hardware: what you feel, what it looks like in a Blackbox log, why it points at tuning, and the honest counter-check that sends you back to the workbench instead.

Original script, research and creative direction by Thomas / EasyQuadTune.

Chapters
0:00 Intro: before you buy the part
0:50 Setpoint, gyro and one rule
1:46 Sign 1: propwash on drops and chops
3:13 Sign 2: hot motors on clean props
4:36 Sign 3: bounce-back after flips and rolls
6:00 Sign 4: gyro lags or overshoots setpoint
7:15 Sign 5: a twitch that follows your sticks
8:30 Sign 6: shaking only at high throttle
9:45 When it really is hardware
11:07 How to fly a log that can answer
12:08 Recap

Analyse your own Blackbox log: https://easyquadtune.vercel.app

All log charts in this video are illustrative examples, not a specific aircraft's flight. No tuning values are given: the right numbers depend on your build.

EasyQuadTune is not affiliated with Betaflight.

## Chapters — how they were made
Derived from the measured narration timing sheet (scene start times in audio/sixthings_ep01_p1_timing.csv, full track 764.894 s). They are valid only if the final edit starts narration at 0:00 with no pre-roll and keeps the 0.70 s scene gaps. If the edit adds an intro, title card or holds, shift every chapter by the actual offset and re-check against the final video before publishing. YouTube requires the first chapter at 0:00 and at least 10 s per chapter (all are well over).

These were corrected against the current render (764.894 s, 22,946 frames), which
builds its timeline straight from that CSV. The upload-ready copy of the title,
description, tags and chapters lives in `YOUTUBE_UPLOAD.md`; keep the two files in
step if either changes.

## Tags
fpv, betaflight, blackbox, blackbox log, fpv tuning, pid tuning, betaflight tuning, propwash, hot motors, bounce back, bounceback, step response, feedforward, tpa, iterm relax, fpv drone, quadcopter tuning, fpv freestyle, filter tuning, easyquadtune

## Playlist / series
New series "6 Things" (create a playlist when publishing; not created). Optional end screen: Inside the Log playlist + next 6 Things episode when it exists. Do not link a URL that does not exist yet.

## Sources (not in the description)
No research sources are listed in the description and none appear in the video. All sources live only in the internal fact ledger EP01/SOURCES_AND_FACT_QA.md. No source used requires attribution: they are research reading only, nothing is quoted on screen, and no third-party chart, image or footage is reproduced. If a licensed asset (e.g. CC BY) is ever added, its attribution goes in a single discreet credits line at the very end of the description, never on screen.

## Credits

External footage/music: NONE.

3D model: the motor on the airframe is the **EMAX RSII 2306** by **CK90** (Thingiverse,
thing:3041414), licensed **Creative Commons — Attribution**. If that mesh is used in the
published render, this single line must go at the very end of the description, never on
screen:

> Motor 3D model: "EMAX RSII 2306" by CK90 (Thingiverse, CC BY).

Battery, ESC, AIO flight controller and receiver were supplied as STEP files. Only their
external dimensions were measured; the geometry on screen is modelled, not copied. No CC BY
asset other than the motor is used, so no further attribution line is needed. If any
third-party asset is added in the edit, its attribution must be added here and kept.
Narration and all graphics are produced locally for EasyQuadTune.
