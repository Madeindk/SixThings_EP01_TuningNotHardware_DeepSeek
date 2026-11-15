"""Compatibility wrapper. EP5 onward uses shared/voice/render_narration.py (bm_daniel).

Do NOT generate, re-synthesize, re-time or alter finished narration with any other
tool. This wrapper only forwards to render_narration.py and refuses to overwrite
existing scene WAVs. Historical ep2_voice_chain.py (am_michael) is not used here.
"""
from pathlib import Path
import argparse, sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--episode', required=True, type=Path)
    ap.add_argument('--models', required=True, type=Path)
    ap.add_argument('--part', required=True, choices=['1', '2'])
    ap.add_argument('--lexicon', type=Path, help='Optional lexicon JSON (phoneme_subs)')
    ap.add_argument('--out', type=Path)
    a = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    renderer = root / 'voice' / 'render_narration.py'
    lexicon = a.lexicon or (root / 'voice' / 'lexicon.json')
    out = a.out or (a.episode / 'project' / 'voice')
    # Refuse overwrite of existing scene WAVs
    existing = list(out.glob(f'*_p{a.part}_s*.wav')) + list(out.glob(f'P{a.part}-S*.wav'))
    if existing:
        raise SystemExit(
            'Existing scene WAVs found. Narration is supplied as finished audio files '
            '(bm_daniel). Do NOT generate, re-synthesize, re-time or alter the voice. '
            'Cut visuals to the supplied audio and timing sheet. If you must re-render, '
            'choose a new output folder.'
        )
    sys.argv = [
        str(renderer),
        '--models', str(a.models),
        '--episode', str(a.episode),
        '--part', a.part,
        '--out', str(out),
    ]
    if lexicon.is_file():
        sys.argv += ['--lexicon', str(lexicon)]
    import runpy
    runpy.run_path(str(renderer), run_name='__main__')

if __name__ == '__main__':
    main()
