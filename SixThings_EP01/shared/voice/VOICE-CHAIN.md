# Narrator — 6 Things EP01: en-US-AndrewNeural

Decision: Thomas, 15 November 2026, Europe/Copenhagen. The narrator for 6 Things EP01 is
**`en-US-AndrewNeural`**. This supersedes the `bm_daniel` decision of 12 November 2026.
Inside the Log EP05 and later keep `bm_daniel` and must not be re-rendered.

Two engines produce the voice. Both feed the same mastering chain, so timing sheets,
loudness and delivery format are identical either way.

| | `--engine edge` | `--engine chatterbox` |
|---|---|---|
| What it is | Microsoft's own `en-US-AndrewNeural` | zero-shot local clone of the reference clip |
| Speed | about 0.5x realtime (31 s for scene 1) | about 5x realtime (~6 min for scene 1) |
| Voice fidelity | exact, nothing is cloned | close: F0 119 vs 123 Hz, spectral distance 1.7 dB |
| Needs | `edge-tts` | `chatterbox-tts` + `torch` in a separate venv |
| Offline | no | yes |

Thomas compared both on scene 1 and preferred **chatterbox**.

## Render

From the repo root:

```
# Microsoft voice, direct
python .\SixThings_EP01\shared\voice\render_narration_tts.py --engine edge ^
    --episode .\SixThings_EP01\EP01 --part 1 --stem sixthings_ep01 ^
    --out .\SixThings_EP01\EP01\audio\andrew_edge

# local zero-shot clone (recommended)
& C:\Users\Thomas\venvs\sixthings-cb\Scripts\python.exe .\SixThings_EP01\shared\voice\render_narration_tts.py ^
    --engine chatterbox --ref .\voice_refs\andrew_reference.wav ^
    --episode .\SixThings_EP01\EP01 --part 1 --stem sixthings_ep01 ^
    --out .\SixThings_EP01\EP01\audio\andrew
```

Add `--only P1-S01` to render a single scene while tuning voice settings.

## Setup for the clone engine

The clone engine needs its own Python environment: `chatterbox-tts` pins `torch==2.6.0`
and `numpy<2`, which would break anything else. Put it **outside the repo** — it holds about
47,000 files, and inside the workspace it makes Cursor report "too many active changes".

```
python -m venv C:\Users\Thomas\venvs\sixthings-cb
& C:\Users\Thomas\venvs\sixthings-cb\Scripts\python.exe -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
& C:\Users\Thomas\venvs\sixthings-cb\Scripts\python.exe -m pip install chatterbox-tts
```

There is no GPU acceleration: AMD DirectML on Windows stops at torch 2.4, and the
RX 9070 XT is not CUDA. Rendering is CPU only, about 5x realtime on a Ryzen 7 9800X3D.

## Chain constants

- sentence gap `SGAP = 0.28` s, paragraph gap `PGAP = 0.70` s, scene gap `0.70` s
- comma gap `0.12` s, used only when chatterbox splits a long sentence (see below)
- trim threshold `0.01`, head pad `480` samples, tail pad `1200` samples at 24 kHz
- two-pass ffmpeg `loudnorm` to **−16 LUFS**, true peak −1.5 dBTP, LRA 11
- 24 kHz → 48 kHz with `scipy.signal.resample_poly(a, 2, 1)` before loudnorm
- delivery: 48 kHz 24-bit WAV + 192 kb/s MP3

`VOICE-CHAIN` values are mirrored in `voice.lock.json`.

## Long sentences are split (chatterbox only)

Chatterbox slurs the end of long text and can loop indefinitely: a 22-word chunk sat for
over nine minutes without producing audio, and a 16-word sentence came out unclear at 0:07
in scene 1. So chatterbox gets short prosody units.

But splitting too eagerly is its own defect. An earlier version split at every comma, which
turned a natural 9-word sentence into three fragments — *"A motor," / "a bearing," / "maybe
the flight controller itself."* — with audible gaps between them. That sounded wrong and was
reported by ear.

The rule is therefore:

1. A sentence at or below `CB_MAX_WORDS = 15` is passed through **completely whole**, keeping
   its own commas and rhythm.
2. Only a longer sentence is split: first at `,` `;` `:`, and if a piece is still too long,
   before a conjunction (`and`, `but`, `so`, `because`, `with`, `that`, `which`, `when`,
   `while`, `if`, `or`, `as`), and as a last resort at a word boundary.
3. The resulting pieces are then merged back greedily so no tiny fragment is left alone.

Pieces are joined with a 0.12 s gap — shorter than `SGAP`, because it is a pause inside a
sentence, not a sentence boundary. Edge handles long text cleanly and keeps whole sentences.

## Every sentence is cached

Synthesis is slow enough that a crash is expensive, and the machine did go down mid-render
once. Each sentence is cached under `%USERPROFILE%\.cache\sixthings_tts`, keyed by a SHA-256
of the engine, voice, settings, reference-file hash and the exact text. Re-running the same
command resumes where it stopped. Changing a voice setting or the reference clip invalidates
the cache as intended.

## The timing sheet is derived, never hand-edited

`EP01/audio/sixthings_ep01_p1_timing.csv` is written by the renderer and is the single source
of truth for cut points. Two files are derived from it and must never be edited by hand:

- `EP01/scene-index.json` — per-scene start, duration and word count
- the YouTube chapter list in `EP01/RELEASE_DRAFTS.md`

After every render, propagate the new measurements:

```
python .\SixThings_EP01\shared\tools\sync_timing.py ^
    --timing .\SixThings_EP01\EP01\audio\andrew\sixthings_ep01_p1_timing.csv ^
    --episode .\SixThings_EP01\EP01
```

That copies the CSV into `EP01/audio/` and rewrites both derived files. It is idempotent.

The chapter labels themselves are editorial text and live in `CHAPTERS` inside
`sync_timing.py`, so shift them there if a chapter needs renaming.

## Length

The Andrew clone renders shorter than the previous `bm_daniel` audio — scene 1 came out at
50.9 s against 56.4 s. That is expected: a different engine, different pacing. Picture is cut
to the measured sheet, so the episode is simply a little shorter than the old draft implied.
Do not stretch the audio to chase an old number; if a scene feels too brisk, that is an
editorial decision for Thomas, not a technical fix.

## Rules for any production agent

The narration is finished. Do **not** rewrite, shorten, extend, re-synthesize or re-time it,
and do not alter the voice. Cut visuals to the audio and the timing sheet. Captions and
graphics use the manuscript wording in `NARRATION.txt` and `blocks/`; the respells are
TTS-input only.

Do not use `ep2_voice_chain.py` for this series. Do not modify EP4 or Inside the Log EP05+.

## Historical note

`render_narration.py` (Kokoro `bm_daniel`) and `ep2_voice_chain.py` (`am_michael`, speed
1.188) remain in this folder as provenance for the earlier chains. They are not used for
6 Things EP01.
