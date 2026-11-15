#!/usr/bin/env python3
"""Render narration in the Andrew voice, either directly or as a local clone.

Decision: Thomas, 15 Nov 2026. The narrator for 6 Things EP01 is the
Microsoft Edge voice en-US-AndrewNeural, replacing the Kokoro bm_daniel chain.

Two engines produce that voice:

  --engine edge        edge-tts calls Microsoft's en-US-AndrewNeural directly.
                       Seconds per episode, deterministic, no model download.
  --engine chatterbox  Chatterbox TTS zero-shot clone of a supplied reference
                       WAV of the same voice (--ref). Runs locally on CPU,
                       roughly 5x realtime on a Ryzen 7 9800X3D.

Nothing is trained in either case; the clone is zero-shot from the reference
audio. Use chatterbox when the voice must not depend on Microsoft's service,
use edge when exact reproduction of the original voice matters.

Everything downstream of synthesis is identical to the Kokoro chain
(render_narration.py), so timing sheets, loudness and delivery format do not
change:

  sentence gap SGAP = 0.28 s, paragraph gap PGAP = 0.70 s,
  scene gap SCENE_GAP = 0.70 s on a full-part track
  trim threshold 0.01, head pad 480, tail pad 1200 samples at 24 kHz
  text respell / NORM table applied to TTS input only
  two-pass ffmpeg loudnorm I=-16 LUFS, TP=-1.5 dBTP, LRA=11
  output 48 kHz 24-bit WAV + 192 kb/s MP3

Neither engine takes espeak phonemes, so the Kokoro-only phoneme fixes
(Betaflight, Fresnel, lexicon.json) appear here as text respells in
TTS_RESPELLS.

Windows (PowerShell 5.1), from the package root:

  python -m pip install -r .\\shared\\voice\\requirements.txt

  # direct Microsoft voice
  python .\\shared\\voice\\render_narration_tts.py --engine edge ^
      --episode .\\SixThings_EP01\\EP01 --part 1 --stem sixthings_ep01 ^
      --out .\\SixThings_EP01\\EP01\\audio

  # local zero-shot clone (needs chatterbox-tts + torch)
  python .\\shared\\voice\\render_narration_tts.py --engine chatterbox ^
      --ref .\\voice_refs\\andrew_reference.wav ^
      --episode .\\SixThings_EP01\\EP01 --part 1 --stem sixthings_ep01 ^
      --out .\\SixThings_EP01\\EP01\\audio

DeepSeek / any other production agent: do NOT alter the rendered voice.
Cut visuals to the audio and the timing sheet.
"""
from __future__ import annotations

import argparse
import asyncio
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

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_narration import (  # noqa: E402
    NORM,
    NATIVE_SR,
    OUT_SR,
    PGAP,
    SCENE_GAP,
    SGAP,
    TARGET_LRA,
    TARGET_LOUD,
    TARGET_TP,
    TEXT_RESPELLS,
    first_words,
    fmt_tc,
    loudnorm_wav,
    measure_lufs,
    sents_of,
    to48k,
    trim24,
    wav_to_mp3,
)

# ---------------------------------------------------------------------------
# Locked voice settings
# ---------------------------------------------------------------------------
VOICE = "en-US-AndrewNeural"
RATE = "+0%"
PITCH = "+0Hz"
VOLUME = "+0%"
LANG = "en-US"

# Chatterbox zero-shot clone settings (only used with --engine chatterbox).
# temperature is left at the library default 0.8; lowering it did not fix the
# 0:07 slur in testing, the sentence length did.
CB_EXAGGERATION = 0.5
CB_CFG_WEIGHT = 0.5
CB_MIN_P = 0.05
CB_REPETITION_PENALTY = 1.2

# Neither engine reads phonemes, so the Kokoro phoneme fixes become respells.
# Applied after TEXT_RESPELLS and NORM.
TTS_RESPELLS = [
    {"id": "Betaflight", "pattern": r"\bBetaflight('s)?\b", "replace": r"Bay-ta-flight\1",
     "why": "BAY-ta-flight in en-US; guards against BEE-ta-flight"},
    {"id": "Fresnel", "pattern": r"\bFresnel\b", "replace": "fruh-nell",
     "why": "fruh-NELL, not FRESS-nuhl"},
]

MAX_CONCURRENT = 6
RETRIES = 4

# Chatterbox mumbles towards the end of long sentences: a 37-word sentence with
# three commas came out unclear at 0:07 in scene 1. Splitting at commas gives it
# short prosody units. COMMA_GAP is deliberately shorter than SGAP because it is
# a pause inside a sentence, not a sentence boundary. Edge handles long text
# cleanly and keeps whole sentences.
COMMA_GAP = 0.12
COMMA_SPLIT_WORDS = 8  # only split a sentence if it is longer than this

_CB_MODEL = None


# ---------------------------------------------------------------------------
# Text preparation
# ---------------------------------------------------------------------------
def apply_respells(text: str, scene_id: str, log: list[dict]) -> str:
    out = text
    for rule in TEXT_RESPELLS + TTS_RESPELLS:
        pat, rep = rule["pattern"], rule["replace"]
        matches = list(re.finditer(pat, out))
        if not matches:
            continue
        for m in matches:
            log.append({
                "scene": scene_id,
                "rule": rule["id"],
                "original": m.group(0),
                "spoken": re.sub(pat, rep, m.group(0)),
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


# ---------------------------------------------------------------------------
# Engine: chatterbox (local zero-shot clone)
# ---------------------------------------------------------------------------
def chatterbox_model():
    global _CB_MODEL
    if _CB_MODEL is None:
        import torch
        from chatterbox.tts import ChatterboxTTS

        torch.set_num_threads(max(1, (os.cpu_count() or 8) - 1))
        print("  loading chatterbox model...", flush=True)
        _CB_MODEL = ChatterboxTTS.from_pretrained(device="cpu")
    return _CB_MODEL


# ---------------------------------------------------------------------------
# Sentence cache (survives a crash or a reboot)
# ---------------------------------------------------------------------------
# Chatterbox takes minutes per scene on CPU, so a single long process is
# fragile: the machine went down mid-render and everything would have been
# lost. Every synthesized sentence is therefore written to a cache keyed by a
# hash of the engine, voice, settings, reference file hash and the exact text.
# Re-running the same command resumes where it stopped instead of starting over.
_CACHE_DIR: Path | None = None


def cache_dir() -> Path:
    global _CACHE_DIR
    if _CACHE_DIR is None:
        root = Path.home() / ".cache" / "sixthings_tts"
        root.mkdir(parents=True, exist_ok=True)
        _CACHE_DIR = root
    return _CACHE_DIR


def cache_key(text: str, engine: str, ref: Path | None) -> str:
    h = hashlib.sha256()
    h.update(engine.encode("utf-8"))
    h.update(VOICE.encode("utf-8"))
    h.update(f"{RATE}|{PITCH}|{VOICE}".encode("utf-8"))
    if engine == "chatterbox":
        h.update(f"{CB_EXAGGERATION}|{CB_CFG_WEIGHT}|{CB_MIN_P}|{CB_REPETITION_PENALTY}".encode("utf-8"))
        if ref is not None:
            h.update(sha256_file(ref).encode("utf-8"))
    h.update(text.encode("utf-8"))
    return h.hexdigest()[:32]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def cache_get(key: str) -> np.ndarray | None:
    p = cache_dir() / f"{key}.npy"
    if p.is_file():
        try:
            a = np.load(p).astype(np.float32)
            if a.size:
                return a
        except Exception:  # noqa: BLE001 - corrupt entry, re-synthesize
            p.unlink(missing_ok=True)
    return None


def cache_put(key: str, a: np.ndarray) -> None:
    p = cache_dir() / f"{key}.npy"
    tmp = p.with_suffix(".tmp.npy")
    np.save(tmp, a)
    os.replace(tmp, p)


def synth_chatterbox(text: str, ref: Path) -> np.ndarray:
    key = cache_key(text, "chatterbox", ref)
    hit = cache_get(key)
    if hit is not None:
        return hit
    model = chatterbox_model()
    wav = model.generate(
        text,
        audio_prompt_path=str(ref),
        exaggeration=CB_EXAGGERATION,
        cfg_weight=CB_CFG_WEIGHT,
        min_p=CB_MIN_P,
        repetition_penalty=CB_REPETITION_PENALTY,
    )
    a = wav.squeeze().cpu().numpy().astype(np.float32)
    if model.sr != NATIVE_SR:
        raise RuntimeError(f"unexpected chatterbox sample rate {model.sr}")
    a = trim24(a)
    cache_put(key, a)
    return a


# ---------------------------------------------------------------------------
# Engine: edge (Microsoft voice direct)
# ---------------------------------------------------------------------------
async def edge_one(text: str, out_mp3: Path) -> None:
    import edge_tts

    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            com = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, volume=VOLUME)
            await com.save(str(out_mp3))
            if out_mp3.exists() and out_mp3.stat().st_size > 0:
                return
            raise RuntimeError("empty mp3 from edge-tts")
        except Exception as exc:  # noqa: BLE001 - network flake, retry
            last = exc
            await asyncio.sleep(1.0 + attempt * 1.5)
    raise RuntimeError(f"edge-tts failed for {text[:60]!r}: {last}")


def mp3_to_24k_mono(mp3: Path) -> np.ndarray:
    fd, tmp_name = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    tmp = Path(tmp_name)
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(mp3),
             "-ar", str(NATIVE_SR), "-ac", "1", str(tmp)],
            check=True,
        )
        a, sr = sf.read(tmp, dtype="float32")
        if sr != NATIVE_SR:
            raise RuntimeError(f"unexpected sample rate {sr} from edge-tts decode")
        return a
    finally:
        tmp.unlink(missing_ok=True)


async def edge_all(texts: list[str], workdir: Path) -> list[np.ndarray]:
    sem = asyncio.Semaphore(MAX_CONCURRENT)

    async def one(i: int, t: str) -> np.ndarray:
        mp3 = workdir / f"s{i:05d}.mp3"
        async with sem:
            await edge_one(t, mp3)
        a = mp3_to_24k_mono(mp3)
        mp3.unlink(missing_ok=True)
        return trim24(a)

    return list(await asyncio.gather(*(one(i, t) for i, t in enumerate(texts))))


# ---------------------------------------------------------------------------
# Scene assembly
# ---------------------------------------------------------------------------
def synth_sentences(texts: list[str], engine: str, ref: Path | None) -> list[np.ndarray]:
    if engine == "chatterbox":
        if ref is None or not ref.is_file():
            raise SystemExit(f"--ref must be an existing wav file, got {ref}")
        print(f"  chatterbox clone from {ref.name}, {len(texts)} sentences", flush=True)
        return [synth_chatterbox(t, ref) for t in texts]
    with tempfile.TemporaryDirectory() as td:
        return asyncio.run(edge_all(texts, Path(td)))


def render_scene(official_text: str, scene_id: str, log: list[dict], engine: str,
                 ref: Path | None) -> tuple[np.ndarray, int]:
    spoken_block = norm(apply_respells(official_text, scene_id, log))
    paragraphs = [p for p in spoken_block.strip().split("\n\n") if p.strip()]

    # Flatten to (text to synthesize, silence after it) items.
    items: list[tuple[str, float]] = []
    n_sentences = 0
    for pi, para in enumerate(paragraphs):
        last_para = pi == len(paragraphs) - 1
        sents = sents_of(para)
        for si, sent in enumerate(sents):
            n_sentences += 1
            last_sent = si == len(sents) - 1
            if last_sent:
                sent_gap = 0.0 if last_para else PGAP
            else:
                sent_gap = SGAP

            if engine == "chatterbox" and len(sent.split()) > COMMA_SPLIT_WORDS:
                chunks = [c for c in re.split(r"(?<=,)\s+", sent.strip()) if c.strip()]
            else:
                chunks = [sent]

            for ci, chunk in enumerate(chunks):
                last_chunk = ci == len(chunks) - 1
                items.append((chunk, sent_gap if last_chunk else COMMA_GAP))

    if not items:
        return np.zeros(NATIVE_SR // 10, np.float32), 0

    arrays = synth_sentences([t for t, _ in items], engine, ref)

    parts: list[np.ndarray] = []
    for a, (_text, gap_after) in zip(arrays, items):
        parts.append(a)
        if gap_after > 0:
            parts.append(np.zeros(int(NATIVE_SR * gap_after), np.float32))
    return np.concatenate(parts), n_sentences


def render_part(episode: Path, part: int, out_dir: Path, stem_prefix: str,
                subtype: str, engine: str, ref: Path | None,
                only: set[str] | None = None) -> dict:
    blocks_dir = episode / "blocks"
    sources = sorted(blocks_dir.glob(f"P{part}-S*.txt"))
    if only:
        sources = [s for s in sources if s.stem in only]
    if not sources:
        raise SystemExit(f"No scene blocks found in {blocks_dir} for part {part}")

    out_dir.mkdir(parents=True, exist_ok=True)
    log: list[dict] = []
    rows: list[dict] = []
    scene_audio: list[np.ndarray] = []
    cursor = 0.0

    for src in sources:
        m = re.match(r"P(\d+)-S(\d+)$", src.stem)
        if not m:
            raise SystemExit(f"Unexpected block name: {src.name}")
        scene_id = src.stem
        fname = f"{stem_prefix}_p{int(m.group(1))}_s{int(m.group(2)):02d}"
        official = src.read_text(encoding="utf-8").strip()
        wav_path = out_dir / f"{fname}.wav"
        mp3_path = out_dir / f"{fname}.mp3"

        print(f"  {scene_id} ({len(official.split())} words) -> {fname}", flush=True)
        raw24, n_sent = render_scene(official, scene_id, log, engine, ref)
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
            "sentences": n_sent,
            "loudness": lufs.get("I", ""),
            "true_peak": lufs.get("True peak", ""),
            "loudnorm_input_i": meas.get("input_i", ""),
        })
        scene_audio.append(audio.astype(np.float32))
        cursor += dur + SCENE_GAP

    gap = np.zeros(int(OUT_SR * SCENE_GAP), np.float32)
    full_parts: list[np.ndarray] = []
    for i, a in enumerate(scene_audio):
        full_parts.append(a)
        if i < len(scene_audio) - 1:
            full_parts.append(gap)
    full = np.concatenate(full_parts)
    full_name = f"{stem_prefix}_p{part}_full.wav"
    full_wav = out_dir / full_name
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
        "voice": VOICE,
        "engine": engine,
        "rate": RATE,
        "pitch": PITCH,
        "lang": LANG,
        "reference": str(ref) if ref else "",
        "chatterbox": {"exaggeration": CB_EXAGGERATION, "cfg_weight": CB_CFG_WEIGHT},
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
    print(f"PART {part} done: {len(rows)} scenes, {fmt_tc(full_dur)} ({full_dur:.1f}s)  {full_lufs}", flush=True)
    return summary


def write_logs(out_dir: Path, stem: str, s: dict) -> None:
    lines = [
        f"# {stem} narration respell log ({s['engine']}, {VOICE})",
        "",
        "Official manuscript files were not rewritten. These changes apply only to the TTS input.",
        "",
        f"Voice: {VOICE} via {s['engine']}, rate {RATE}, pitch {PITCH}, lang {LANG}.",
        "",
        "## Events actually applied",
        "",
    ]
    events = s["respell_events"]
    if not events:
        lines.append("None.")
    else:
        lines += ["| scene | stage | rule | original | spoken | why |", "|---|---|---|---|---|---|"]
        for e in events:
            def cell(x: str) -> str:
                return str(x).replace("|", "\\|").replace("\n", " ")

            lines.append(
                f"| {cell(e['scene'])} | {cell(e['stage'])} | {cell(e['rule'])} | "
                f"{cell(e['original'])} | {cell(e['spoken'])} | {cell(e['why'])} |"
            )
    counts: dict[str, dict] = {}
    for e in events:
        d = counts.setdefault(e["rule"], {"why": e["why"], "stage": e["stage"], "n": 0})
        d["n"] += 1
    lines += ["", "## Counts", "", "| rule | stage | count | why |", "|---|---|---|---|"]
    for rule, info in counts.items():
        lines.append(f"| {rule} | {info['stage']} | {info['n']} | {info['why']} |")
    lines += [
        "",
        "## Notes",
        "",
        "Neither engine takes espeak phonemes, so the Kokoro phoneme rules "
        "(Betaflight, Fresnel, lexicon.json) are applied as text respells instead.",
        "Respelled forms are not verified by listening: Thomas must confirm them.",
        "",
    ]
    (out_dir / f"{stem}_respell_log.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out_dir / f"{stem}_respell_log.json").write_text(
        json.dumps(events, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=f"Render narration in {VOICE}.")
    ap.add_argument("--engine", choices=["edge", "chatterbox"], default="edge")
    ap.add_argument("--ref", type=Path, help="Reference wav for chatterbox cloning")
    ap.add_argument("--episode", type=Path, required=True, help="Episode folder containing blocks/")
    ap.add_argument("--part", choices=["1", "2", "both"], default="1")
    ap.add_argument("--out", type=Path, help="Output folder (default: <episode>/audio)")
    ap.add_argument("--stem", default="narration", help="Filename prefix, e.g. sixthings_ep01")
    ap.add_argument("--subtype", choices=["PCM_24", "PCM_16"], default="PCM_24")
    ap.add_argument("--only", default="", help="Comma list of scene ids, e.g. P1-S01")
    args = ap.parse_args()

    out_dir = args.out or (args.episode / "audio")
    parts = [1, 2] if args.part == "both" else [int(args.part)]
    only = {s.strip() for s in args.only.split(",") if s.strip()}

    print(f"VOICE={VOICE} ENGINE={args.engine} RATE={RATE} PITCH={PITCH} LANG={LANG} "
          f"SGAP={SGAP} PGAP={PGAP}", flush=True)
    print(f"episode={args.episode} out={out_dir} stem={args.stem} parts={parts}", flush=True)

    summaries = [
        render_part(args.episode, p, out_dir, args.stem, args.subtype, args.engine, args.ref,
                    only or None)
        for p in parts
    ]
    write_logs(out_dir, args.stem, summaries[0])
    (out_dir / f"{args.stem}_render_summary.json").write_text(
        json.dumps(
            {
                "voice": VOICE,
                "engine": args.engine,
                "rate": RATE,
                "pitch": PITCH,
                "lang": LANG,
                "sgap": SGAP,
                "pgap": PGAP,
                "scene_gap": SCENE_GAP,
                "loudnorm": {"I": TARGET_LOUD, "TP": TARGET_TP, "LRA": TARGET_LRA},
                "sample_rate": OUT_SR,
                "subtype": args.subtype,
                "parts": [
                    {k: v for k, v in x.items() if k not in ("rows", "respell_events")}
                    | {"scenes": x["scenes"], "rows": x["rows"]}
                    for x in summaries
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
