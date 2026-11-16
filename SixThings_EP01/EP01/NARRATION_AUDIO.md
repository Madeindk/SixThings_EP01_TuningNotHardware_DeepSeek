# How the EP01 narration is produced (en-US-AndrewNeural)

The narration is finished and approved wording. Do **not** rewrite, re-synthesize or re-time
it. Cut picture to the audio and to the timing sheet.

Voice: **`en-US-AndrewNeural`**. Rendered locally with Chatterbox TTS as a zero-shot clone of
`voice_refs/andrew_reference.wav`, or directly via Microsoft Edge TTS. Chain: sentence gap
0.28 s, paragraph gap 0.70 s, comma gap 0.12 s when a long sentence is split, scene gap 0.70 s
in the full track, trim 0.01 / head 480 / tail 1200 samples at 24 kHz, two-pass ffmpeg
loudnorm −16 LUFS / −1.5 dBTP / LRA 11, 48 kHz 24-bit mono WAV + 192 kb/s MP3.

Decision dated 15 Nov 2026. The earlier `bm_daniel` decision is superseded; see
`../shared/voice/VOICE-CHAIN.md`.

## Audio in this repo

The narration exists as MP3 in `audio/andrew/` — 11 scene files plus `sixthings_ep01_p1_full.mp3`
(12:45). The 24-bit WAV working files are deliberately excluded: they are 6–7 MB per scene
and only needed for editing.

Regenerate everything:

```
& C:\Users\Thomas\venvs\sixthings-cb\Scripts\python.exe .\SixThings_EP01\shared\voice\render_narration_tts.py ^
    --engine chatterbox --ref .\voice_refs\andrew_reference.wav ^
    --episode .\SixThings_EP01\EP01 --part 1 --stem sixthings_ep01 ^
    --out .\SixThings_EP01\EP01\audio\andrew
```

Expected output: `sixthings_ep01_p1_s01` … `_s11` as WAV and MP3, plus `_p1_full` WAV/MP3,
and a `sixthings_ep01_p1_timing.csv` measured on that render.

## What is committed

- `sixthings_ep01_p1_timing.csv` — measured start, end and duration per scene, from the
  Andrew render. This is the file the renderer cuts to.
- `andrew/` — the narration itself: 11 scene MP3s, the full track, and the respell log and
  render summary for that render.
- `previous-chain/` — the artefacts that came with the original package from the earlier
  `bm_daniel` chain: the per-sentence phoneme records and the old render summary and respell
  logs. Kept for provenance only. They do not describe the Andrew audio, and nothing in the
  production should read them as current.

## Warning: the timing sheet must be regenerated after a render

`audio/sixthings_ep01_p1_timing.csv` is written by the renderer, so it always describes the
audio that actually exists. It is committed for the current render.

Two files are derived from it and must not be edited by hand — `scene-index.json` and the
YouTube chapter list in `RELEASE_DRAFTS.md`. After any render, run:

```
python .\SixThings_EP01\shared\tools\sync_timing.py ^
    --timing .\SixThings_EP01\EP01\audio\andrew\sixthings_ep01_p1_timing.csv ^
    --episode .\SixThings_EP01\EP01
```

Picture is cut to this sheet. The Andrew clone paces faster than the previous `bm_daniel`
audio, so the episode is a little shorter than the old draft numbers suggested. Do not
stretch the voice to chase an old runtime.

## The 11 scene units

`blocks/P1-S01.txt` … `P1-S11.txt` hold the exact scene text, matching `STORYBOARD.md`.
`NARRATION.txt` is the spoken words only. Headings in the storyboard are not spoken.
