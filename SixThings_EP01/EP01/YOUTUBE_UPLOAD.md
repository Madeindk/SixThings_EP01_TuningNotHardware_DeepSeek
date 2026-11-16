# YouTube upload pack — EP01

Everything below is ready to paste. **Nothing has been uploaded.** This
environment has no YouTube publishing tool and no access to the channel, so the
upload itself has to be done by hand in YouTube Studio. Everything else — the
finished file, both thumbnails, the title, the description, the chapters, the
tags — is prepared and checked.

## Files to upload

| What | Path | Notes |
|---|---|---|
| Video | `SixThings_EP01/EP01/out/SixThings_EP01_TuningNotHardware.mp4` | 1920×1080, 30 fps, 12:44.9, H.264 + AAC, 75.7 MB |
| Thumbnail A | `build/thumb/thumb_ep01_a_1280x720.jpg` | 1280×720, 76 KB. Primary. |
| Thumbnail B | `build/thumb/thumb_ep01_b_1280x720.jpg` | 1280×720, 86 KB. Alternative. |

Both thumbnails are under YouTube's 2 MB limit and above its minimum width.
The 1920×1080 masters are next to them (`*_1920x1080.png`) if a different crop is
ever needed.

---

## Title

Pick one. The first is the strongest for search; the second carries the series
tag.

```
6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem
```

62 characters — fits everywhere including mobile search results.

Alternatives:

```
6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem | 6 Things EP01
```
78 characters — still inside YouTube's 100, but the tail is cut on mobile.

```
Tuning Problem or Hardware Problem? 6 Signs in Your Blackbox Log
```
64 characters — leads with the question, which reads better in a browse feed.

```
Is It the Tune or the Hardware? 6 Signs Before You Buy Parts
```
60 characters — the most clickable of the four, the least searchable.

---

## Description

Paste as-is. The chapters are generated from the measured narration timing sheet
and match this render exactly.

```
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

Motor 3D model: "EMAX RSII 2306" by CK90 (Thingiverse, CC BY).
```

### Why the chapters are these numbers

`build/render6.js` builds the timeline straight from
`SixThings_EP01/EP01/audio/sixthings_ep01_p1_timing.csv`: each scene starts at its
`start_s` on the absolute clock, with a 0.70 s gap between scenes and no pre-roll.
So chapter time = `start_s`, exactly. The earlier draft in `RELEASE_DRAFTS.md` was
one second off on most chapters because it had been rounded by hand; these are
computed, and they were verified against the rendered file (764.894 s total,
22,946 frames).

If the edit is ever changed — an intro added, a hold extended — every chapter
after the change shifts, and they must be recomputed with
`SixThings_EP01/shared/tools/sync_timing.py` before publishing.

---

## Tags

Copy the whole line; YouTube splits on commas.

```
fpv, betaflight, blackbox, blackbox log, fpv tuning, pid tuning, betaflight tuning, propwash, hot motors, bounce back, bounceback, step response, feedforward, tpa, iterm relax, fpv drone, quadcopter tuning, fpv freestyle, filter tuning, easyquadtune
```

---

## Studio settings

- **Category:** Science & Technology
- **Visibility:** start on **Unlisted**, watch it once end to end, then schedule.
- **Audience:** not made for kids.
- **Playlist:** create `6 Things` and add this as episode 1. YouTube needs the
  playlist to exist before the video can be added to it.
- **End screen:** link the `Inside the Log` playlist if it exists. Do not link a
  video that has not been published.
- **Language:** English (video language, title and description).
- **Captions:** none supplied. If auto-captions are used, check the six sign names
  — "propwash", "bounce-back", "I-term relax" and "feedforward" are the terms
  auto-captioning reliably gets wrong.

---

## Attribution — read this before publishing

The film's 3D passes are the airframe already rendered for this series. The motor
mesh in the project is the **EMAX RSII 2306** by **CK90** on Thingiverse
(`thing:3041414`), licensed **Creative Commons — Attribution**. That licence
requires the credit to be visible, so the line above sits at the very end of the
description. It must stay there, and it must not appear on screen.

No other third-party asset is used. No music, no stock footage. If either is added
later, its attribution goes in the same place.

---

## What you have to do

1. Open [YouTube Studio](https://studio.youtube.com) → **Create** → **Upload videos**.
2. Drop in `SixThings_EP01/EP01/out/SixThings_EP01_TuningNotHardware.mp4`
   (75.7 MB, uploads in well under a minute on a normal connection).
3. Paste the title, then the description.
4. Paste the tags.
5. Upload Thumbnail A. Look at it on a phone before you commit to it; if the
   headline is not readable at thumbnail size in the feed, swap to Thumbnail B.
6. Set the category, audience and playlist.
7. Publish as Unlisted first, watch the first minute and the last minute, then
   schedule.
