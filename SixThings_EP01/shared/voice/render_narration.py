#!/usr/bin/env python3
"""Render Inside the Log narration with Kokoro v1.0 voice bm_daniel.

This is the locked narrator chain from EP5 onward (Thomas, 12 Nov 2026).
It is the same engine, trim, sentence gap and two-pass loudnorm used to
build the approved sample:

  /workspace/videos/voice_samples/6_kokoro_bm_daniel.mp3
  (see that folder's README.md and build_samples.py)

Constants that must stay as they are:
  VOICE = 'bm_daniel'
  SPEED = 1.0
  LANG  = 'en-gb'
  SGAP  = 0.28          # silence between sentences inside a paragraph
  PGAP  = 0.70          # silence between paragraphs inside a scene
  SCENE_GAP = 0.70      # silence between scenes in a full-part track
  trim threshold 0.01, head pad 480, tail pad 1200 samples at 24 kHz
  phoneme input after the NORM / text-respell table, Betaflight fix, lexicon
  two-pass ffmpeg loudnorm I=-16 LUFS, TP=-1.5 dBTP, LRA=11
  output 48 kHz 24-bit WAV + 192 kb/s MP3

EP4 Part 2 and all earlier episodes keep am_michael. Do not use this script
to replace EP4 audio.

Windows (PowerShell 5.1), from the extracted package root:

  py -3 -m venv .venv
  .\\.venv\\Scripts\\python.exe -m pip install -r .\\shared\\voice\\requirements.txt
  # download kokoro-v1.0.onnx + voices-v1.0.bin into .\\shared\\voice\\models
  # (URLs and SHA-256 are in shared/voice/voice.lock.json)
  .\\.venv\\Scripts\\python.exe .\\shared\\voice\\render_narration.py --models .\\shared\\voice\\models --episode .\\EP06 --part 1
  .\\.venv\\Scripts\\python.exe .\\shared\\voice\\render_narration.py --models .\\shared\\voice\\models --episode .\\EP06 --part 2

If phonemizer cannot find espeak-ng, install espeak-ng for Windows and/or
the script will try espeakng-loader automatically.

DeepSeek / any other production agent: do NOT generate, re-synthesize,
re-time or alter the voice. Cut visuals to the supplied audio and timing sheet.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

# ---------------------------------------------------------------------------
# Locked voice settings (must match the approved bm_daniel sample)
# ---------------------------------------------------------------------------
VOICE = "bm_daniel"
SPEED = 1.0
LANG = "en-gb"
SGAP = 0.28
PGAP = 0.70
SCENE_GAP = 0.70
TRIM_THR = 0.01
HEAD_PAD = 480
TAIL_PAD = 1200
TARGET_LOUD = -16.0
TARGET_TP = -1.5
TARGET_LRA = 11.0
NATIVE_SR = 24000
OUT_SR = 48000

# Historical EP2/EP4 text normalisation (applied after the explicit respell
# table). EasyQuadTune / blackbox / FPV etc. are also listed as logged respells
# so a miss in one path is still caught in the other.
NORM = [
    (r"\bFPV\b", "F P V"),
    (r"\bPID\b", "P I D"),
    (r"\bESC(s?)\b", r"E S C\1"),
    (r"\bD ?[Ss]hot\b", "D-Shot"),
    (r"\bDShot\b", "D-Shot"),
    (r"\bRPM\b", "R P M"),
    (r"\brpm\b", "R P M"),
    (r"\bMEMS\b", "mems"),
    (r"\bkHz\b", "kilohertz"),
    (r"\bMHz\b", "megahertz"),
    (r"\bGHz\b", "gigahertz"),
    (r"(\d)\s*µs\b", r"\1 microseconds"),
    (r"µs\b", "microseconds"),
    (r"\bms\b", "milliseconds"),
    (r"°/s", " degrees per second"),
    (r"\bF([1347])\b", lambda m: "F " + ["", "one", "", "three", "four", "", "", "seven"][int(m.group(1))]),
    (r"\bH7\b", "H seven"),
    ("EasyQuadTune", "Easy Quad Tune"),
    (r"\bblackbox\b", "black box"),
    (r"\bBlackbox\b", "black box"),
    (r"\bairmode\b", "air mode"),
    (r"\bfeedforward\b", "feed-forward"),
    ("nineteen twenties", "nineteen-twenties"),
    (r"\bLiPo\b", "lie-po"),
    (r"\bUAV\b", "U A V"),
    (r"\bFFT\b", "F F T"),
    (r"\bCSV\b", "C S V"),
    (r"\bGNSS\b", "G N S S"),
    (r"\bGPS\b", "G P S"),
    (r"\bIMU\b", "I M U"),
    (r"\bOSD\b", "O S D"),
    (r"\bVTX\b", "V T X"),
    (r"\bVRX\b", "V R X"),
    (r"\bDJI\b", "D J I"),
    (r"\bCRSF\b", "C R S F"),
    (r"\bELRS\b", "E L R S"),
    (r"\bSBUS\b", "S bus"),
    (r"\bPWM\b", "P W M"),
    (r"\bNTSC\b", "N T S C"),
    (r"\bCVBS\b", "C V B S"),
    (r"\bRF\b", "R F"),
    (r"\bRHCP\b", "right-hand circular polarisation"),
    (r"\bLHCP\b", "left-hand circular polarisation"),
]

# Logged, episode-facing text respells (applied first). Official manuscript
# files are never rewritten; these change TTS input only.
TEXT_RESPELLS = [
    {"id": "ExpressLRS's", "pattern": r"ExpressLRS's", "replace": "Express L R S's",
     "why": "EP4 spoken form; letter names after Express"},
    {"id": "ExpressLRS", "pattern": r"ExpressLRS", "replace": "Express L R S",
     "why": "EP4 spoken form; letter names after Express"},
    {"id": "EasyQuadTune", "pattern": r"EasyQuadTune", "replace": "Easy Quad Tune",
     "why": "Channel name, three spoken words"},
    {"id": "Blackbox", "pattern": r"\bBlackbox\b", "replace": "black box",
     "why": "Spoken 'black box', not one jammed word"},
    {"id": "blackbox", "pattern": r"\bblackbox\b", "replace": "black box",
     "why": "Spoken 'black box', not one jammed word"},
    {"id": "NTSC", "pattern": r"\bNTSC\b", "replace": "N T S C",
     "why": "Letter names, per EP05 pronunciation list"},
    {"id": "PAL", "pattern": r"\bPAL\b", "replace": "pal",
     "why": "Must be the word 'pal', not letter names P A L (en-gb default)"},
    {"id": "FPV", "pattern": r"\bFPV\b", "replace": "F P V",
     "why": "Letter names, per EP05 pronunciation list and EP2 NORM"},
    {"id": "CVBS", "pattern": r"\bCVBS\b", "replace": "C V B S",
     "why": "Letter names, per EP05 pronunciation list"},
    {"id": "RF", "pattern": r"\bRF\b", "replace": "R F",
     "why": "Letter names, per EP05 pronunciation list"},
    {"id": "GHz", "pattern": r"\bGHz\b", "replace": "gigahertz",
     "why": "Spoken unit, per EP05 pronunciation list"},
    {"id": "MHz", "pattern": r"\bMHz\b", "replace": "megahertz",
     "why": "Spoken unit, per EP2 NORM / EP05 list"},
    {"id": "kHz", "pattern": r"\bkHz\b", "replace": "kilohertz",
     "why": "Spoken unit, per EP2 NORM"},
    {"id": "multipath", "pattern": r"\b[Mm]ultipath\b", "replace": "multi-path",
     "why": "MULT-ee-path, per EP05 pronunciation list"},
    {"id": "PID", "pattern": r"\bPID\b", "replace": "P I D",
     "why": "Letter names, EP2 NORM (for EP06–10)"},
    {"id": "FFT", "pattern": r"\bFFT\b", "replace": "F F T",
     "why": "Letter names, EP06 list"},
    {"id": "CSV", "pattern": r"\bCSV\b", "replace": "C S V",
     "why": "Letter names, EP06 list"},
    {"id": "LiPo", "pattern": r"\bLiPo\b", "replace": "lie-po",
     "why": "EP2 NORM / later episode lists"},
    {"id": "feedforward", "pattern": r"\b[Ff]eedforward\b", "replace": "feed-forward",
     "why": "EP2 NORM (case-insensitive first letter, Six Things EP01)"},
    {"id": "TPA", "pattern": r"\bTPA\b", "replace": "T P A",
     "why": "Letter names (throttle PID attenuation), Six Things EP01"},
]

# Betaflight: en-gb espeak says BEE-ta-flight; channel wants BAY-ta-flight.
# Also keep the original en-us flap form used in the EP2/EP4 chain.
BF_PATTERNS = [
    (re.compile(r"b[ˈˌ]?iːtəfl[ˈˌ]?aɪt"), "bˈeɪtəflˌaɪt"),
    (re.compile(r"b[ˈˌ]?eɪɾəfl[ˈˌ]?aɪt"), "bˈeɪtəflˌaɪt"),
    (re.compile(r"b[ˈˌ]?eɪtɐfl[ˈˌ]?aɪt"), "bˈeɪtəflˌaɪt"),
]

# Term-specific phoneme substitutions. Fresnel is the important EP05 one.
# Do NOT run the EP4 'log' -> lˈɔːɡ rule here: en-gb already yields lˈɒɡ
# (LOG, not lock). That American rule would lengthen it to 'lawg' and can
# also hit the final syllable of 'analog'.
DEFAULT_PHONE_SUBS = [
    {"match": r"fɹˈɛsnəl", "replace": "fɹʌˈnɛl",
     "why": "Fresnel as fruh-NELL, not FRESS-nuhl"},
    {"match": r"n[ˈˌ]?(?:ɑː|ɑ|ɔː|ɔ|oʊ|a)tʃ", "replace": "nˈɑːtʃ",
     "why": "notch / notchy (from EP3/EP4, harmless if unused)"},
]

MODEL_SHA = {
    "kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}

_K = None


def setup_espeak() -> None:
    try:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        lib = espeakng_loader.get_library_path()
        EspeakWrapper.set_library(lib)
        os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = lib
    except Exception as exc:  # pragma: no cover - environment specific
        print("espeakng-loader setup skipped or failed:", exc, file=sys.stderr)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_models(models: Path) -> None:
    for name, expected in MODEL_SHA.items():
        p = models / name
        if not p.is_file():
            raise SystemExit(f"Missing model file: {p}")
        got = sha256_file(p)
        if got != expected:
            raise SystemExit(f"Hash mismatch for {name}: {got} != {expected}")


def kokoro(models: Path):
    global _K
    if _K is None:
        setup_espeak()
        from kokoro_onnx import Kokoro
        _K = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
    return _K


def sents_of(text: str) -> list[str]:
    return [x for x in re.split(r"(?<=[.?!])\s+", text.strip()) if x]


def apply_text_respells(text: str, scene_id: str, log: list[dict]) -> str:
    out = text
    for rule in TEXT_RESPELLS:
        pat, rep = rule["pattern"], rule["replace"]
        matches = list(re.finditer(pat, out))
        if not matches:
            continue
        for m in matches:
            log.append({
                "scene": scene_id,
                "rule": rule["id"],
                "original": m.group(0),
                "spoken": rep,
                "why": rule["why"],
                "stage": "text",
                "context": out[max(0, m.start() - 40): m.end() + 40].replace("\n", " "),
            })
        out = re.sub(pat, rep, out)
    return out


def norm(s: str) -> str:
    for a, b in NORM:
        s = re.sub(a, b, s)
    return s


def trim24(a: np.ndarray) -> np.ndarray:
    a = a.astype(np.float32)
    nz = np.where(np.abs(a) > TRIM_THR)[0]
    if len(nz):
        a = a[max(0, nz[0] - HEAD_PAD): nz[-1] + TAIL_PAD]
    return a


def to48k(a: np.ndarray, sr: int = NATIVE_SR) -> np.ndarray:
    if sr == OUT_SR:
        return a.astype(np.float32)
    return resample_poly(a.astype(np.float32), 2, 1).astype(np.float32)


def synth_sentence(text: str, models: Path, phone_subs: list[tuple[str, str]],
                   scene_id: str, log: list[dict]) -> tuple[np.ndarray, str]:
    k = kokoro(models)
    spoken = norm(text)
    ph = k.tokenizer.phonemize(spoken, LANG)
    before = ph
    for pat, rep in BF_PATTERNS:
        ph = pat.sub(rep, ph)
    if ph != before:
        log.append({
            "scene": scene_id,
            "rule": "Betaflight phoneme",
            "original": before,
            "spoken": ph,
            "why": "BAY-ta-flight, not British BEE-ta-flight",
            "stage": "phoneme",
            "context": spoken,
        })
    for pat, rep in phone_subs:
        new = re.sub(pat, rep, ph)
        if new != ph:
            log.append({
                "scene": scene_id,
                "rule": pat,
                "original": ph,
                "spoken": new,
                "why": "lexicon phoneme sub",
                "stage": "phoneme",
                "context": spoken,
            })
            ph = new
    a, sr = k.create(ph, voice=VOICE, speed=SPEED, lang=LANG, is_phonemes=True)
    if sr != NATIVE_SR:
        raise RuntimeError(f"unexpected sample rate {sr}")
    return trim24(a), ph


def synth_block(official_text: str, models: Path, phone_subs: list[tuple[str, str]],
                scene_id: str, log: list[dict]) -> tuple[np.ndarray, list[dict]]:
    """Return 24 kHz float audio for one scene and per-sentence phoneme rows."""
    spoken_block = apply_text_respells(official_text, scene_id, log)
    paragraphs = [p for p in spoken_block.strip().split("\n\n") if p.strip()]
    arrays: list[np.ndarray] = []
    phonemes: list[dict] = []
    official_paras = [p for p in official_text.strip().split("\n\n") if p.strip()]
    for pi, para in enumerate(paragraphs):
        if pi:
            arrays.append(np.zeros(int(NATIVE_SR * PGAP), np.float32))
        official_para = official_paras[pi] if pi < len(official_paras) else para
        official_sents = sents_of(official_para)
        spoken_sents = sents_of(para)
        for si, sent in enumerate(spoken_sents):
            if si:
                arrays.append(np.zeros(int(NATIVE_SR * SGAP), np.float32))
            wave, ph = synth_sentence(sent, models, phone_subs, scene_id, log)
            arrays.append(wave)
            official_sent = official_sents[si] if si < len(official_sents) else sent
            phonemes.append({
                "paragraph": pi,
                "sentence": si,
                "official_text": official_sent,
                "tts_text": sent,
                "phonemes": ph,
            })
    return np.concatenate(arrays), phonemes


def loudnorm_wav(a: np.ndarray, sr: int, out_wav: Path, subtype: str = "PCM_24") -> dict:
    # mkstemp returns an open descriptor; close it or Windows refuses the unlink
    # in the finally block (permission denied on a file still open in-process).
    fd, tmp_name = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    tmp = Path(tmp_name)
    try:
        sf.write(tmp, a, sr)
        codec = "pcm_s24le" if subtype == "PCM_24" else "pcm_s16le"
        probe = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-i", str(tmp),
                "-af", f"loudnorm=I={TARGET_LOUD}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
                "-f", "null", "-",
            ],
            check=True, capture_output=True, text=True,
        )
        err = probe.stderr
        start = err.rfind("{")
        if start < 0:
            raise RuntimeError("loudnorm JSON not found in ffmpeg stderr:\n" + err[-2000:])
        m, _end = json.JSONDecoder().raw_decode(err[start:])
        af = (
            f"loudnorm=I={TARGET_LOUD}:TP={TARGET_TP}:LRA={TARGET_LRA}"
            f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={m['target_offset']}:linear=true"
        )
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(tmp), "-af", af,
                "-ar", str(OUT_SR), "-c:a", codec, str(out_wav),
            ],
            check=True,
        )
        return m
    finally:
        tmp.unlink(missing_ok=True)


def wav_to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "192k",
            str(mp3),
        ],
        check=True,
    )


def measure_lufs(path: Path) -> dict:
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    info: dict[str, str] = {}
    # Only parse the final "Summary:" block. In it, ebur128 prints a
    # "True peak:" header line followed by "Peak: x dBFS" (the true peak).
    err = p.stderr
    k = err.rfind("Summary:")
    lines = err[k:].splitlines() if k >= 0 else err.splitlines()
    in_tp = False
    for ln in lines:
        s = ln.strip()
        if s.startswith("I:"):
            info["I"] = s
        elif s.startswith("LRA:"):
            info["LRA"] = s
        elif s.startswith("True peak:"):
            in_tp = True
        elif s.startswith("Peak:") and in_tp:
            info["True peak"] = s
            in_tp = False
    return info


def first_words(text: str, n: int = 8) -> str:
    words = text.split()
    return " ".join(words[:n])


def load_phone_subs(lexicon: Path | None) -> list[tuple[str, str]]:
    if lexicon is None:
        return [(e["match"], e["replace"]) for e in DEFAULT_PHONE_SUBS]
    obj = json.loads(lexicon.read_text(encoding="utf-8"))
    return [(e["match"], e["replace"]) for e in obj.get("phoneme_subs", [])]


def fmt_tc(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def render_part(episode: Path, part: int, models: Path, out_dir: Path,
                lexicon: Path | None, stem_prefix: str, subtype: str,
                keep: set[str] | None = None) -> dict:
    keep = keep or set()
    prev_rows: dict[str, dict] = {}
    prev_events: list[dict] = []
    if keep:
        # Reuse already-rendered, unchanged scenes verbatim (no re-synthesis).
        prev_csv = out_dir / f"{stem_prefix}_p{part}_timing.csv"
        with prev_csv.open(encoding="utf-8") as f:
            prev_rows = {r["scene"]: r for r in csv.DictReader(f)}
        prev_log = out_dir / f"{stem_prefix}_respell_log.json"
        if prev_log.exists():
            prev_events = json.loads(prev_log.read_text(encoding="utf-8"))
    blocks_dir = episode / "blocks"
    sources = sorted(blocks_dir.glob(f"P{part}-S*.txt"))
    if not sources:
        raise SystemExit(f"No scene blocks found in {blocks_dir} for part {part}")
    phone_subs = load_phone_subs(lexicon)
    out_dir.mkdir(parents=True, exist_ok=True)
    phone_dir = out_dir / "phonemes"
    phone_dir.mkdir(parents=True, exist_ok=True)

    log: list[dict] = []
    rows: list[dict] = []
    scene_audio: list[np.ndarray] = []
    cursor = 0.0
    gap = np.zeros(int(OUT_SR * SCENE_GAP), np.float32)

    for src in sources:
        # P1-S01 -> ep05_p1_s01
        m = re.match(r"P(\d+)-S(\d+)$", src.stem)
        if not m:
            raise SystemExit(f"Unexpected block name: {src.name}")
        scene_id = src.stem
        fname = f"{stem_prefix}_p{int(m.group(1))}_s{int(m.group(2)):02d}"
        official = src.read_text(encoding="utf-8").strip()
        wav_path = out_dir / f"{fname}.wav"
        mp3_path = out_dir / f"{fname}.mp3"
        if scene_id in keep:
            print(f"  {scene_id} KEPT (unchanged text) -> {fname}", flush=True)
            pr = prev_rows[scene_id]
            if int(pr["word_count"]) != len(official.split()):
                raise SystemExit(f"{scene_id} marked keep but word count changed")
            log.extend(e for e in prev_events if e.get("scene") == scene_id)
            phonemes = json.loads((phone_dir / f"{fname}.phonemes.json").read_text(encoding="utf-8"))
            meas = {"input_i": pr.get("loudnorm_input_i", "")}
        else:
            print(f"  {scene_id} ({len(official.split())} words) -> {fname}", flush=True)
            raw24, phonemes = synth_block(official, models, phone_subs, scene_id, log)
            raw48 = to48k(raw24, NATIVE_SR)
            meas = loudnorm_wav(raw48, OUT_SR, wav_path, subtype=subtype)
            wav_to_mp3(wav_path, mp3_path)
        audio, sr = sf.read(wav_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        if sr != OUT_SR:
            raise RuntimeError(f"{wav_path} is {sr} Hz")
        dur = len(audio) / float(sr)
        lufs = measure_lufs(wav_path)
        (phone_dir / f"{fname}.phonemes.json").write_text(
            json.dumps(phonemes, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        rows.append({
            "scene": scene_id,
            "file": f"{fname}.wav",
            "mp3": f"{fname}.mp3",
            "duration_s": f"{dur:.3f}",
            "duration_tc": fmt_tc(dur),
            "start_s": f"{cursor:.3f}",
            "start_tc": fmt_tc(cursor),
            "end_s": f"{cursor + dur:.3f}",
            "end_tc": fmt_tc(cursor + dur),
            "first_words": first_words(official),
            "word_count": len(official.split()),
            "sentences": len(phonemes),
            "loudness": lufs.get("I", ""),
            "true_peak": lufs.get("True peak", ""),
            "loudnorm_input_i": meas.get("input_i", ""),
        })
        scene_audio.append(audio.astype(np.float32))
        cursor += dur + SCENE_GAP

    # Full-part track: already-loudnormed scenes joined with SCENE_GAP.
    full_parts: list[np.ndarray] = []
    for i, a in enumerate(scene_audio):
        full_parts.append(a)
        if i < len(scene_audio) - 1:
            full_parts.append(gap)
    full = np.concatenate(full_parts)
    full_name = f"{stem_prefix}_p{part}_full.wav"
    full_wav = out_dir / full_name
    # 24-bit (or 16-bit) 48 kHz, no second loudnorm — levels already match the scenes.
    sf.write(str(full_wav), full, OUT_SR, subtype=subtype)
    full_mp3 = out_dir / f"{stem_prefix}_p{part}_full.mp3"
    wav_to_mp3(full_wav, full_mp3)
    full_dur = len(full) / float(OUT_SR)
    full_lufs = measure_lufs(full_wav)

    csv_path = out_dir / f"{stem_prefix}_p{part}_timing.csv"
    fieldnames = [
        "scene", "file", "mp3", "duration_s", "duration_tc",
        "start_s", "start_tc", "end_s", "end_tc",
        "first_words", "word_count", "sentences",
        "loudness", "true_peak", "loudnorm_input_i",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    summary = {
        "part": part,
        "scenes": len(rows),
        "full_wav": str(full_wav),
        "full_mp3": str(full_mp3),
        "full_duration_s": round(full_dur, 3),
        "full_duration_tc": fmt_tc(full_dur),
        "scene_gap_s": SCENE_GAP,
        "timing_csv": str(csv_path),
        "full_loudness": full_lufs,
        "rows": rows,
        "respell_events": log,
    }
    print(
        f"PART {part} done: {len(rows)} scenes, {fmt_tc(full_dur)} "
        f"({full_dur:.1f}s)  {full_lufs}",
        flush=True,
    )
    return summary


def write_respell_log(path: Path, summaries: list[dict]) -> None:  # noqa: C901
    events = []
    for s in summaries:
        events.extend(s["respell_events"])
    lines = [
        f"# {Path(path).name.split('_respell')[0]} narration respell log",
        "",
        "Official manuscript files were not rewritten. These changes apply only to the TTS input (and, where noted, to the phoneme string after espeak).",
        "",
        f"Voice: {VOICE}, speed {SPEED}, lang {LANG}.",
        "",
        "## Events actually applied",
        "",
    ]
    if not events:
        lines.append("None.")
    else:
        lines += [
            "| scene | stage | rule | original | spoken | why |",
            "|---|---|---|---|---|---|",
        ]
        for e in events:
            def cell(x: str) -> str:
                return str(x).replace("|", "\\|").replace("\n", " ")
            lines.append(
                f"| {cell(e['scene'])} | {cell(e['stage'])} | {cell(e['rule'])} | "
                f"{cell(e['original'])} | {cell(e['spoken'])} | {cell(e['why'])} |"
            )
    # Unique rule summary
    seen = {}
    for e in events:
        seen.setdefault(e["rule"], {"why": e["why"], "stage": e["stage"], "n": 0, "examples": []})
        seen[e["rule"]]["n"] += 1
        if len(seen[e["rule"]]["examples"]) < 3:
            seen[e["rule"]]["examples"].append(e["original"])
    lines += ["", "## Counts", "", "| rule | stage | count | why |", "|---|---|---|---|"]
    for rule, info in seen.items():
        lines.append(f"| {rule} | {info['stage']} | {info['n']} | {info['why']} |")
    lines += [
        "",
        "## Rules considered but not applied on this episode",
        "",
        "The renderer also knows ExpressLRS, GHz, MHz, kHz, CVBS, RF, PID, FFT, CSV, LiPo, feedforward and EasyQuadTune respells. They are logged only when the official text actually contains them. The EP4 phoneme rule that forces American 'lawg' on the word log was deliberately not used: with en-gb, 'log' already comes out as lˈɒɡ (LOG, not lock), and that rule can distort 'analog'.",
        "",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    path.with_suffix(".json").write_text(json.dumps(events, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Render Inside the Log narration with bm_daniel.")
    ap.add_argument("--models", type=Path, required=True, help="Folder with kokoro-v1.0.onnx and voices-v1.0.bin")
    ap.add_argument("--episode", type=Path, required=True, help="Episode folder containing blocks/")
    ap.add_argument("--part", choices=["1", "2", "both"], default="both")
    ap.add_argument("--out", type=Path, help="Output folder (default: <episode>/project/voice or --out)")
    ap.add_argument("--lexicon", type=Path, help="Optional lexicon JSON with phoneme_subs")
    ap.add_argument("--stem", default=None, help="Filename prefix, default from episode folder (ep05)")
    ap.add_argument("--subtype", choices=["PCM_24", "PCM_16"], default="PCM_24")
    ap.add_argument("--skip-hash", action="store_true")
    ap.add_argument("--keep", default="", help="Comma list of scene ids (e.g. P1-S01,P1-S11) to reuse unchanged from a previous render")
    args = ap.parse_args()

    if not args.skip_hash:
        verify_models(args.models)

    ep_name = args.episode.resolve().name  # EP05
    m = re.search(r"(\d+)", ep_name)
    stem = args.stem or (f"ep{int(m.group(1)):02d}" if m else ep_name.lower())
    out_dir = args.out or (args.episode / "project" / "voice")
    parts = [1, 2] if args.part == "both" else [int(args.part)]

    print(f"VOICE={VOICE} SPEED={SPEED} LANG={LANG} SGAP={SGAP} PGAP={PGAP}", flush=True)
    print(f"episode={args.episode} out={out_dir} stem={stem} parts={parts}", flush=True)

    summaries = []
    for part in parts:
        summaries.append(
            render_part(args.episode, part, args.models, out_dir, args.lexicon, stem, args.subtype,
                        {s.strip() for s in args.keep.split(",") if s.strip()})
        )
    write_respell_log(out_dir / f"{stem}_respell_log.md", summaries)
    (out_dir / f"{stem}_render_summary.json").write_text(
        json.dumps(
            {
                "voice": VOICE,
                "speed": SPEED,
                "lang": LANG,
                "sgap": SGAP,
                "pgap": PGAP,
                "scene_gap": SCENE_GAP,
                "loudnorm": {"I": TARGET_LOUD, "TP": TARGET_TP, "LRA": TARGET_LRA},
                "sample_rate": OUT_SR,
                "subtype": args.subtype,
                "parts": [
                    {k: v for k, v in s.items() if k not in ("rows", "respell_events")}
                    | {"scenes": s["scenes"], "rows": s["rows"]}
                    for s in summaries
                ],
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
