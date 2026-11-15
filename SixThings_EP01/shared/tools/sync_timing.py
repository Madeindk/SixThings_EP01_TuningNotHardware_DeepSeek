#!/usr/bin/env python3
"""Propagate the measured narration timing through every file that depends on it.

The episode's cut points live in one place: the timing CSV written by
render_narration_tts.py. Everything else — scene-index.json and the YouTube
chapter list in RELEASE_DRAFTS.md — is derived from it. Hand-editing those by
hand is how they drift out of sync with the audio, so this script rewrites them
mechanically.

Run it after every render, from the package root:

    python .\\SixThings_EP01\\shared\\tools\\sync_timing.py ^
        --timing .\\SixThings_EP01\\EP01\\audio\\andrew\\sixthings_ep01_p1_timing.csv ^
        --episode .\\SixThings_EP01\\EP01

It is idempotent: running it twice changes nothing the second time.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
from pathlib import Path

# Human-written chapter labels, one per scene. These are editorial text, not
# measurements, so they are kept here rather than derived.
CHAPTERS = {
    "P1-S01": "Intro: before you buy the part",
    "P1-S02": "Setpoint, gyro and one rule",
    "P1-S03": "Sign 1: propwash on drops and chops",
    "P1-S04": "Sign 2: hot motors on clean props",
    "P1-S05": "Sign 3: bounce-back after flips and rolls",
    "P1-S06": "Sign 4: gyro lags or overshoots setpoint",
    "P1-S07": "Sign 5: a twitch that follows your sticks",
    "P1-S08": "Sign 6: shaking only at high throttle",
    "P1-S09": "When it really is hardware",
    "P1-S10": "How to fly a log that can answer",
    "P1-S11": "Recap",
}

# Scene titles used by scene-index.json.
TITLES = {
    "P1-S01": "Before you buy the part",
    "P1-S02": "Two lines and one rule",
    "P1-S03": "Sign one: wobble in your own wash",
    "P1-S04": "Sign two: hot motors on clean props",
    "P1-S05": "Sign three: bounce-back",
    "P1-S06": "Sign four: gyro late, gyro past",
    "P1-S07": "Sign five: a twitch that follows your thumbs",
    "P1-S08": "Sign six: shaking that arrives with throttle",
    "P1-S09": "When it really is hardware",
    "P1-S10": "A log that can answer",
    "P1-S11": "The right order",
}


def read_timing(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit(f"No rows in {path}")
    for r in rows:
        r["duration_f"] = float(r["duration_s"])
        r["start_f"] = float(r["start_s"])
    return rows


def mmss(seconds: float) -> str:
    """YouTube chapter format, m:ss (or h:mm:ss past an hour)."""
    total = int(round(seconds))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def write_scene_index(episode: Path, rows: list[dict]) -> None:
    index = []
    for r in rows:
        sid = r["scene"]
        index.append({
            "id": sid,
            "title": TITLES.get(sid, sid),
            "words": int(r["word_count"]),
            "duration_s": round(r["duration_f"], 3),
            "start_s": round(r["start_f"], 3),
        })
    out = episode / "scene-index.json"
    out.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(index)} scenes, {index[-1]['start_s'] + index[-1]['duration_s']:.1f}s total)")


def write_chapters(episode: Path, rows: list[dict], full_s: float) -> None:
    lines = [mmss(r["start_f"]) + " " + CHAPTERS.get(r["scene"], r["scene"]) for r in rows]
    block = "Chapters\n" + "\n".join(lines)

    path = episode / "RELEASE_DRAFTS.md"
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"^Chapters\n(?:\d+:\d{2}(?::\d{2})? .*\n)+", re.MULTILINE)
    if not pattern.search(text):
        raise SystemExit(f"chapter block not found in {path}")
    text = pattern.sub(block + "\n", text, count=1)

    # Keep the explanatory note in step with the measured full-track length.
    text = re.sub(
        r"full track [\d.]+ s",
        f"full track {full_s:.3f} s",
        text,
    )
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path} ({len(lines)} chapters, first {lines[0]}, last {lines[-1]})")


def copy_timing(timing: Path, episode: Path) -> None:
    dest = episode / "audio" / "sixthings_ep01_p1_timing.csv"
    if timing.resolve() == dest.resolve():
        print(f"timing already in place: {dest}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(timing, dest)
    print(f"copied timing -> {dest}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Sync timing-derived files to the rendered audio.")
    ap.add_argument("--timing", type=Path, required=True,
                    help="timing CSV written by render_narration_tts.py")
    ap.add_argument("--episode", type=Path, required=True, help="episode folder, e.g. SixThings_EP01/EP01")
    ap.add_argument("--no-copy", action="store_true", help="do not copy the CSV into EP01/audio")
    args = ap.parse_args()

    rows = read_timing(args.timing)
    last = rows[-1]
    full_s = last["start_f"] + last["duration_f"]

    print(f"{len(rows)} scenes, full track {full_s:.3f} s ({mmss(full_s)})")
    if not args.no_copy:
        copy_timing(args.timing, args.episode)
        rows = read_timing(args.episode / "audio" / "sixthings_ep01_p1_timing.csv")
        full_s = rows[-1]["start_f"] + rows[-1]["duration_f"]

    write_scene_index(args.episode, rows)
    write_chapters(args.episode, rows, full_s)


if __name__ == "__main__":
    main()
