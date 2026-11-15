# 6 Things — EP01: "6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem"

This is the complete production package for one episode of **6 Things**, an EasyQuadTune
long-form series. It is a text-and-reference handoff for producing the visuals — it is
**not a finished video**, and no narration audio is committed to this repo.

Read this file first. It is the only entry point you need; everything else is detail.

---

## What to do

Produce the episode's visuals in shot order, cutting them to the narration timing sheet.

1. **Style lock** — `SixThings_EP01/style/STYLE_6THINGS.md`, then look at every image in
   `SixThings_EP01/style/frames/`. There are two modes: **[E] Editorial** cards (off-white
   paper, oversized cropped Barlow Condensed type, cut-out quad, one red-orange accent
   `#EC4118`) and **[F] Cinematic** explanation beats (dimensional 5-inch quad in a dark
   studio, one cool spotlight, translucent airflow, thin HUD, teal = measured data).
   Every storyboard beat is tagged [E] or [F]. Hard cut or fast wipe on the beat.
2. **The episode** — `SixThings_EP01/EP01/START_EP01.txt`, then `SCRIPT.md`,
   `STORYBOARD.md`, `NARRATION.txt`, `PROMPT_EP01.md`, `ASSETS.md`,
   `RELEASE_DRAFTS.md`.
3. **Shot list** — `SixThings_EP01/EP01/PROMPT_EP01.md` is the working order: 11 scenes,
   each numbered line is one shot, one continuous animation per shot.
4. **Timing** — `SixThings_EP01/EP01/audio/sixthings_ep01_p1_timing.csv` gives the measured
   start, end and duration of every scene. Cut picture to those numbers.

`MAGICAI_EP01.md` holds the same content pre-split into ready-to-paste blocks, if you are
feeding a shot-by-shot video generator instead of building the whole episode at once.

---

## Hard rules (non-negotiable)

- **Faceless.** No people, faces, hands, presenters, avatars or lip-sync.
- **No sources on screen.** No source names, citations, URLs, document/page/channel titles,
  doc screenshots, "source:"/"according to" captions, footnotes or credit overlays — in any
  scene, lower third or end card. `SOURCES_AND_FACT_QA.md` is internal research input only,
  never visual material.
- **One text block at a time.** No overlapping text, no corner watermarks, no brand bugs,
  no bottom disclaimers.
- **Charts are synthetic.** Always labelled once as a synthetic example; never presented as
  real flight data.
- **EasyQuadTune** appears only as the bundled icon (`shared/brand/`), sparingly, with no
  invented app UI or product claims.
- **Do not invent a third look.** If a beat cannot be done inside the [E]/[F] lock, stop and
  ask.
- **The narration is finished.** Do not rewrite, shorten, extend or re-time it, and do not
  generate or alter the voice. Captions and graphics use the manuscript wording in
  `NARRATION.txt` and `blocks/`.
- **No publication.** Nothing here has been uploaded or published.

---

## Current state (authoritative — overrides older documents)

- **Narrator: `en-US-AndrewNeural`.** Rendered with Chatterbox TTS as a local zero-shot
  clone of a reference clip, or directly via Microsoft Edge TTS.
  See `SixThings_EP01/shared/voice/VOICE-CHAIN.md`.
  **Any document that still names `bm_daniel` or Kokoro as the narrator is historical**
  (that was the previous Inside the Log chain) — do not follow it for this episode.
- **Audio is not in this repo.** Rendered speech is a derived artefact and is regenerated
  with `SixThings_EP01/shared/voice/render_narration_tts.py`. The timing CSV is the
  contract for cutting picture, not the audio files.
- **Timing is generated, not hand-written.** `EP01/audio/sixthings_ep01_p1_timing.csv` comes
  from the renderer, and `EP01/scene-index.json` plus the chapter list in
  `EP01/RELEASE_DRAFTS.md` are derived from it by
  `SixThings_EP01/shared/tools/sync_timing.py`. Never edit those by hand.
- **The episode is shorter than the old draft implied.** The Andrew voice paces faster than
  the previous `bm_daniel` audio. Cut picture to the measured sheet; do not stretch audio to
  chase an old runtime.
- **The quad images in `style/src/` are concept placeholders**, not the production asset.
  Render a proper dimensional 5-inch quad before production.
- **G2 does not apply.** This series has its own lock. There is no G2 discovery gate and no
  navy/gold palette; do not go looking for G2 files.
- Superseded and removed: the old ZIP/RAR archives, their checksum manifests, the duplicate
  `scripts_as_rendered/` copy and the DeepSeek-specific start file. If a document refers to
  them, ignore that reference.
---

## Layout

```
README.md                      <- you are here
GEMINI_AI_STUDIO.md            how to drive this repo from Google AI Studio
SixThings_EP01/
  EP01/
    START_EP01.txt             episode brief: read this after the style lock
    SCRIPT.md                  the manuscript
    NARRATION.txt              spoken words only
    STORYBOARD.md              66 beats, each tagged [E] or [F]
    PROMPT_EP01.md             shot list: 11 scenes, one line = one shot
    MAGICAI_EP01.md            same content as paste-ready blocks
    ASSETS.md                  which assets exist and what may be reused
    SOURCES_AND_FACT_QA.md     internal claim ledger (never on screen)
    RELEASE_DRAFTS.md          title, description, chapters, tags, thumbnail idea
    PRONUNCIATION.md           spoken forms of technical terms
    NARRATION_AUDIO.md         how the narration was produced
    blocks/P1-S01..S11.txt     the 11 exact scene units
    audio/                     timing CSV, phoneme and respell logs
  style/
    STYLE_6THINGS.md           the style lock
    frames/                    approved reference frames
    src/                       source imagery (placeholders)
    fonts/                     bundled fonts + OFL licences
  shared/
    SERIES_NOTE_SIX_THINGS.md  how the inherited shared files map to this series
    ASSET_MANIFEST.md          rights boundaries
    LOCAL_PRODUCTION.md        production checklist
    brand/                     EasyQuadTune icon
    voice/                     narrator chain and lock
    animation-reference/       technique reference only (vendored Three.js, MIT)
voice_refs/
    andrew_reference.wav       reference clip for the voice clone
```

---

## Notes for an AI agent reading this repo

- You cannot run Python, ffmpeg or local builds here. When a step needs a command, write the
  command for the human to run, and say plainly that you did not run it.
- Never claim to have heard audio or watched a render. Listening approval is the human's.
- `shared/animation-reference/` is vendored third-party code (Three.js, MIT licence). Use it
  as technique reference only; re-skin everything to the 6 Things tokens and never carry
  over its palette, fonts or panel style.
