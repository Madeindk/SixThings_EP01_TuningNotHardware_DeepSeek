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

## Audio is not stored in this repo

Rendered speech is a derived artefact and can be regenerated:

```
.\.venv-cb\Scripts\python.exe .\SixThings_EP01\shared\voice\render_narration_tts.py ^
    --engine chatterbox --ref .\voice_refs\andrew_reference.wav ^
    --episode .\SixThings_EP01\EP01 --part 1 --stem sixthings_ep01 ^
    --out .\SixThings_EP01\EP01\audio\andrew
```

Expected output: `sixthings_ep01_p1_s01` … `_s11` as WAV and MP3, plus `_p1_full` WAV/MP3,
and a `sixthings_ep01_p1_timing.csv` measured on the new render.

## What is committed

- `sixthings_ep01_p1_timing.csv` — measured start, end and duration per scene (from the
  previous audio, see the warning below)
- `sixthings_ep01_render_summary.json`, `sixthings_ep01_respell_log.md/.json`
- `phonemes/` — per-sentence records from the previous chain

## Warning: the timing sheet is stale

`audio/sixthings_ep01_p1_timing.csv` was measured on the previous `bm_daniel` audio (full
track 14:35.793). The Andrew clone renders shorter — scene 1 is 48.40 s against 56.38 s,
about 14 percent — so picture cut to this sheet will drift against a chatterbox render.
The Edge render is very close (56.63 s vs 56.38 s) and can use the sheet almost as-is.

This is unresolved. Until it is settled, treat the timing sheet as a shape-of-the-episode
reference, not as final cut points.

## The 11 scene units

`blocks/P1-S01.txt` … `P1-S11.txt` hold the exact scene text, matching `STORYBOARD.md`.
`NARRATION.txt` is the spoken words only. Headings in the storyboard are not spoken.
