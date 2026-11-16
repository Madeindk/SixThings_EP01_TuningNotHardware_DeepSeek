"""HISTORICAL — Episodes 1–4 only (am_michael, speed 1.188, en-us).
Do NOT use this script for EP5–10. From EP5 the locked narrator is bm_daniel
speed 1.0 en-gb, rendered by render_narration.py. Do not retouch EP4 audio.

Episode 2 narrator voice chain, made portable for Episode 4.
Source of truth: ep2_tts_original_build3.py (= /workspace/videos/doc-ep2/build3/tts.py on the bot box,
used for the final episode-2 v4 build). Values below are copied from it unchanged; only file paths are
made configurable. Assembly constants (sentence gap, paragraph gap, 24->48 kHz) come from the same build
(tts.py SGAP, timeline.py PG, audio.py resample_poly(2,1)).

Usage:
  python ep2_voice_chain.py --models DIR --text "One sentence." --out s.wav           # one sentence, 24 kHz
  python ep2_voice_chain.py --models DIR --para-file para.txt --out S01.1.wav --sr48  # one paragraph
DIR must contain kokoro-v1.0.onnx and voices-v1.0.bin (see VOICE-CHAIN.md for download + SHA-256).
"""
import re, sys, argparse, numpy as np, soundfile as sf

VOICE = 'am_michael'     # Kokoro v1.0 voice
SPEED = 1.188            # ep2 final (NOT 1.0; ep3 used 1.0)
LANG = 'en-us'
SGAP = 0.28              # silence between sentences inside a paragraph (s)
PGAP = 0.70              # silence between consecutive paragraphs on the ep2 timeline (s)
TRIM_THR = 0.01          # trim: first/last sample with |a| > 0.01
HEAD_PAD = 480           # keep 480 samples (20 ms @24 kHz) before first loud sample
TAIL_PAD = 1200          # keep 1200 samples (50 ms) after last loud sample (exclusive end = last+1200)

NORM = [(r'\bFPV\b','F P V'),(r'\bPID\b','P I D'),(r'\bESC(s?)\b',r'E S C\1'),(r'\bD ?[Ss]hot\b','D-Shot'),(r'\bDShot\b','D-Shot'),
        (r'\bRPM\b','R P M'),(r'\brpm\b','R P M'),(r'\bMEMS\b','mems'),(r'\bkHz\b','kilohertz'),(r'\bMHz\b','megahertz'),
        (r'(\d)\s*µs\b',r'\1 microseconds'),(r'µs\b','microseconds'),(r'\bms\b','milliseconds'),(r'°/s',' degrees per second'),
        (r'\bF([1347])\b',lambda m:'F '+['','one','','three','four','','','seven'][int(m.group(1))]),(r'\bH7\b','H seven'),
        ('EasyQuadTune','Easy Quad Tune'),(r'\bblackbox\b','black box'),(r'\bairmode\b','air mode'),(r'\bfeedforward\b','feed-forward'),
        ('nineteen twenties','nineteen-twenties'),(r'\bgyro\b','gyro'),(r'\bLiPo\b','lie-po'),(r'\bUAV\b','U A V')]
BF = re.compile(r'b[ˈˌ]?eɪɾəfl[ˈˌ]?aɪt')     # Betaflight phoneme fix (ep2)
BF_FIX = 'bˈeɪtəflˌaɪt'
OVR = {}   # per-sentence text respellings (ep2 had 3, specific to ep2 sentences); add ep4 ones here
PHO = {}   # per-sentence full phoneme overrides; add ep4 ones here

def norm(s):
    for a, b in NORM: s = re.sub(a, b, s)
    return s

def sents_of(text):
    return [x for x in re.split(r'(?<=[.?!])\s+', text.strip()) if x]

_k = None
def kokoro(models):
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(f'{models}/kokoro-v1.0.onnx', f'{models}/voices-v1.0.bin')
    return _k

def synth(s, models, extra_phoneme_subs=()):
    k = kokoro(models)
    ph = PHO.get(s) or k.tokenizer.phonemize(norm(OVR.get(s, s)), LANG)
    ph = BF.sub(BF_FIX, ph)
    for pat, rep in extra_phoneme_subs: ph = re.sub(pat, rep, ph)   # ep4 lexicon hook (log etc.)
    a, sr = k.create(ph, voice=VOICE, speed=SPEED, lang=LANG, is_phonemes=True)
    a = a.astype(np.float32); nz = np.where(np.abs(a) > TRIM_THR)[0]
    if len(nz): a = a[max(0, nz[0] - HEAD_PAD): nz[-1] + TAIL_PAD]
    return a, sr, ph

def paragraph(text, models, **kw):
    parts, sr = [], 24000
    for s in sents_of(text):
        a, sr, _ = synth(s, models, **kw)
        parts += [a, np.zeros(int(sr * SGAP), np.float32)]
    return np.concatenate(parts[:-1]), sr

def to48k(a):
    from scipy.signal import resample_poly
    return resample_poly(a, 2, 1).astype(np.float32)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True); ap.add_argument('--out', required=True)
    g = ap.add_mutually_exclusive_group(required=True); g.add_argument('--text'); g.add_argument('--para-file')
    ap.add_argument('--sr48', action='store_true', help='resample 24k->48k exactly as the ep2 mix did')
    ap.add_argument('--lexicon', help='lexicon.ep4.json (phoneme_subs applied after the ep2 Betaflight fix); omit for pure ep2 behaviour')
    a = ap.parse_args()
    text = a.text if a.text else open(a.para_file, encoding='utf-8').read()
    subs = ()
    if a.lexicon:
        import json
        subs = tuple((e['match'], e['replace']) for e in json.load(open(a.lexicon, encoding='utf-8'))['phoneme_subs'])
    audio, sr = paragraph(text, a.models, extra_phoneme_subs=subs)
    if a.sr48: audio, sr = to48k(audio), 48000
    sf.write(a.out, audio, sr); print(a.out, round(len(audio) / sr, 2), 's')
