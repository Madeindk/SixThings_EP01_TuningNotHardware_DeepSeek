# Final handoff QA — text + finished narration, not media (v2)
Review date 2026-11-12 Europe/Copenhagen. v2 applies Thomas's rule "no sources in the video" and adds independent second sources.

## Checks actually run
- NARRATION.txt == 11 ordered blocks; SCRIPT.md contains every block in order (VALIDATION.json)
- 11 IDs each have exactly one storyboard heading, 6 beats and one claim-ledger row
- Timing CSV rows match the 11 blocks in order, word counts match
- NO SOURCES IN VIDEO: narration scanned for Betaflight docs/wiki/notes/guide, Oscar Liang, PX4, ArduPilot, INAV, Rosser, Bardwell, UAV Tech, Wikipedia, "published", "according to", "source", http — zero hits ("Betaflight" occurs once, as the firmware that has TPA, not as a citation). START_HERE_DEEPSEEK.txt, START_EP01.txt, STORYBOARD.md and ASSETS.md forbid on-screen source names, citations, URLs, screenshots and credit overlays. The description no longer carries a research-reference list.
- Description contains the exact own-work line; no AI/TTS/voice-tool mention; no URL placeholders
- Narration mentions EasyQuadTune 3 times (S06 step response per axis, S08 frequency view, S10 log quality); each checked against easyquadtune.vercel.app home, sample report and guides on 12 Nov 2026
- v1 URLs: EP01/URL_CHECK_2026-11-12.txt. v2 independent sources: EP01/URL_CHECK_v2_2026-11-12.txt (15 cited, all 200; two tried-and-not-cited)
- Audio v2: S02–S10 re-rendered with the identical chain; S01 and S11 byte-identical to v1. 11 scene WAVs 48 kHz 24-bit mono, each −16.0/−16.1 LUFS, true peak −1.5 dBTP; full WAV 875.793 s (14:35.793) −16.1 LUFS −1.5 dBTP (ffmpeg ebur128); full MP3 192 kb/s 20.0 MiB, measures −16.3 LUFS / −1.7 dBTP after MP3 encoding
- Pronunciation: phoneme strings inspected for every technical term and every new v2 word (PRONUNCIATION.md). Respell events v2: feedforward 9, PID 3, EasyQuadTune 3, TPA 2, Blackbox 1, Betaflight phoneme 1

## Style v1 (6 Things lock, 12 Nov 2026)
- style/STYLE_6THINGS.md written: exact palette, OFL fonts (bundled with licences), 1080p type scale, safe areas, E/F layout slots, HUD spec, motion/easing, transitions, chart rules, hard rules. G2 lock, G2 gate and EP2 style files removed from this package; START files, SERIES_NOTE, LOCAL_PRODUCTION step 0, ASSETS and ASSET_MANIFEST point to the new lock.
- All 66 storyboard beats re-tagged [E] or [F] (counts in VALIDATION.json); the six sign title cards are E.
- Five reference frames rendered by code (HTML/CSS/SVG + headless Chrome, build_frames.py), 1920×1080, plus a 1280×720 thumbnail. Chart data are seeded synthetic (style/data/). Text on frames is taken from the script (sign names, S11 recap list, closing line "read it in the right order").
- Visually inspected for overlapping text and safe areas after two fix passes. Accent darkened from the concept's #FF4A1C to #EC4118 so it reaches ≥3:1 contrast on paper.
- Quad imagery in the frames = concept placeholders cut from Thomas's two concept images (low-res; the E cut-out has no props). Not production assets.

## Not done / limits
- Nobody has listened to the audio. The agent cannot hear; phoneme inspection is a proxy. Thomas must listen to all of it.
- No visuals, edit, captions or thumbnail exist yet. Chapter times are from the audio timing sheet and must be re-checked after the edit.
- Fact review is a written source review, not a flight test. All charts are to be synthetic.
