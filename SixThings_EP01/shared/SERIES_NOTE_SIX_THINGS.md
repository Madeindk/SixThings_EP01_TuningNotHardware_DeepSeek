# 6 Things — series note (overrides naming in the inherited shared files)

"6 Things" is a NEW EasyQuadTune long-form series, separate from Inside the Log. The shared files in this folder were copied from the Inside the Log EP05–10 FINAL handoff and still use that series name and EPxx paths. For this package read them as follows:

- STYLE: 6 Things has its OWN lock, ../style/STYLE_6THINGS.md (Editorial E cards + Cinematic F explanation beats, red-orange accent bridge), with reference frames in ../style/frames/. The Inside the Log / EP04 G2 navy-gold lock and its discovery gate do NOT apply to this series; STYLE_LOCK.md, G2_DISCOVERY_GATE.md, G2_REFERENCE_LOCK.json and shared/style/ (EP2) were removed from this package on purpose. Do not look for G2 on Thomas's PC for this series. Inside the Log EP05–10 remain on G2.
- animation-reference/: keep only as TECHNIQUE references (deterministic headless-Chrome/Three.js rendering, dimensional quad/mixer geometry in d.js, control-loop layout in b.js). Re-skin everything to the 6 Things tokens; never carry over the EP2/G2 palette, fonts or panel style.
- Hard rules that carry over unchanged: faceless; no sources/citations/URLs/credit overlays on screen; no corner watermarks or brand bugs; one caption block at a time; no overlapping text; synthetic charts labelled once.
- LOCAL_PRODUCTION.md: apply its checklist to EP01 as a single part. "EP06–10 render with render_narration.py" does not apply: EP01 narration is ALREADY RENDERED and supplied as finished files. Do NOT generate, re-synthesize, re-time or alter the voice; cut visuals to the supplied audio and timing sheet.
- voice/render_narration.py: updated copy (12 Nov 2026) of the locked bm_daniel chain. Changes vs the EP05 copy: added TTS-only respell TPA → "T P A"; the feedforward respell now also matches a capital F; the ebur128 true-peak column in the timing CSV now parses; the respell-log heading uses the stem name. Voice, speed, language, gaps, trim and loudnorm are unchanged. Kept only so the audio is reproducible; DeepSeek must not run it.
- ASSET_MANIFEST.md: same rights boundaries (see its 6 Things override note).
- LOCAL_PRODUCTION.md: its step 0 is replaced by the 6 Things style step (already patched in this copy).
- The Inside the Log name must not appear on screen in this episode. Series title on screen: "6 Things".
