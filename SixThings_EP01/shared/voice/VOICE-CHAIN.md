# Inside the Log narrator — EP5 onward (bm_daniel)

Decision: Thomas, 12 November 2026, Europe/Copenhagen. He chose sample 6 of the comparison set (the read that starts around 3:00 in all_samples.mp3). EP4 Part 2 and all earlier episodes keep am_michael and must not be retimed or re-rendered.

Engine: Kokoro v1.0 via kokoro-onnx 0.6.1.
Voice: `bm_daniel`
Speed: `1.0` (do not use the old Episode 2 speed 1.188)
Language: `en-gb`
Input: phonemes (espeak via the Kokoro tokenizer) after the text-respell / NORM table, the Betaflight phoneme fix, and lexicon.json
Native rate: 24 kHz. Delivery files are 48 kHz 24-bit WAV + 192 kb/s MP3.

Chain constants, identical to the approved sample
`/workspace/videos/voice_samples/6_kokoro_bm_daniel.mp3` (see that folder's README.md and build_samples.py):

- sentence gap `SGAP = 0.28` s
- paragraph gap `PGAP = 0.70` s
- scene gap on a full-part track = 0.70 s
- trim threshold `0.01`, head pad `480` samples, tail pad `1200` samples at 24 kHz
- two-pass ffmpeg `loudnorm` to **−16 LUFS**, true peak −1.5 dBTP, LRA 11
- 24 kHz → 48 kHz with `scipy.signal.resample_poly(a, 2, 1)` before loudnorm

## Windows setup

```
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\shared\voice\requirements.txt
```

Download these two files into `shared/voice/models` (hashes in voice.lock.json):

- `kokoro-v1.0.onnx` (325,532,387 bytes, SHA-256 `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`)
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
- `voices-v1.0.bin` (28,214,398 bytes, SHA-256 `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`)
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

espeak-ng is required for phonemes. The `espeakng-loader` package bundles the library. If phonemizer cannot find it, install [espeak-ng for Windows](https://github.com/espeak-ng/espeak-ng/releases) and/or set:

```python
import os, espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_library(espeakng_loader.get_library_path())
os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = espeakng_loader.get_library_path()
```

`render_narration.py` already does this.

## Render an episode (EP06–10)

From the extracted package root:

```
.\.venv\Scripts\python.exe .\shared\voice\render_narration.py --models .\shared\voice\models --episode .\EP06 --part 1 --lexicon .\shared\voice\lexicon.json --out .\EP06\project\voice
.\.venv\Scripts\python.exe .\shared\voice\render_narration.py --models .\shared\voice\models --episode .\EP06 --part 2 --lexicon .\shared\voice\lexicon.json --out .\EP06\project\voice
```

EP05 is already rendered. Do not re-synthesize it unless Thomas explicitly asks.

## Rules for any production agent (including DeepSeek)

Narration is supplied as finished audio files (bm_daniel), or must be rendered with this script only.
Do NOT generate, re-synthesize, re-time or alter the voice; cut visuals to the supplied audio and timing sheet.
Keep official manuscript wording in captions. Respells are TTS-only.
Do not use ep2_voice_chain.py for EP5–10. Do not modify EP4.

## Historical note

ep2_voice_chain.py, the am_michael 1.188 reference WAV and the original EP2 verification paragraph remain in this folder as provenance for Episodes 1–4 only.
