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
in scene 1. Chatterbox therefore gets short prosody units, split in stages until every piece
is at most `CB_MAX_WORDS = 15`:

1. split after `,` `;` `:`
2. if still too long, split before a conjunction (`and`, `but`, `so`, `because`, `with`,
   `that`, `which`, `when`, `while`, `if`, `or`, `as`)
3. last resort: hard split at a word boundary

Pieces are joined with a 0.12 s gap — shorter than `SGAP`, because it is a pause inside a
sentence, not a sentence boundary. Edge handles long text cleanly and keeps whole sentences.

## Every sentence is cached

Synthesis is slow enough that a crash is expensive, and the machine did go down mid-render
once. Each sentence is cached under `%USERPROFILE%\.cache\sixthings_tts`, keyed by a SHA-256
of the engine, voice, settings, reference-file hash and the exact text. Re-running the same
command resumes where it stopped. Changing a voice setting or the reference clip invalidates
the cache as intended.

## Open issue: the timing sheet

`EP01/audio/sixthings_ep01_p1_timing.csv` was measured on the previous `bm_daniel` audio.

| | scene 1 |
|---|---|
| original `bm_daniel` audio | 56.38 s |
| `--engine edge` | 56.63 s |
| `--engine chatterbox` | 48.40 s |

The chatterbox render is about 14 percent shorter, so picture cut to the old sheet will
drift. Either the timing sheet must be re-measured from the new render, or the voice must be
kept close to the original length. Not yet decided.

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
