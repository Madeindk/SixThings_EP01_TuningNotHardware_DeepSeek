# 6 Things — series note (overrides naming in the inherited shared files)

"6 Things" is a NEW EasyQuadTune long-form series, separate from Inside the Log. The shared files in this folder were copied from the Inside the Log EP05–10 FINAL handoff and still use that series name and EPxx paths. For this package read them as follows:

- STYLE: 6 Things has its OWN lock, ../style/STYLE_6THINGS.md (Editorial E cards + Cinematic F explanation beats, red-orange accent bridge), with reference frames in ../style/frames/. The Inside the Log / EP04 G2 navy-gold lock and its discovery gate do NOT apply to this series; STYLE_LOCK.md, G2_DISCOVERY_GATE.md, G2_REFERENCE_LOCK.json and shared/style/ (EP2) were removed from this package on purpose. Do not look for G2 on Thomas's PC for this series. Inside the Log EP05–10 remain on G2.
- Hard rules that carry over unchanged: faceless; no sources/citations/URLs/credit overlays on screen; no corner watermarks or brand bugs; one caption block at a time; no overlapping text; synthetic charts labelled once.
- LOCAL_PRODUCTION.md: apply its checklist to EP01 as a single part. "EP06–10 render with render_narration.py" does not apply: EP01 narration is produced with voice/render_narration_tts.py (see below). Do NOT rewrite, re-synthesize or re-time the voice; cut visuals to the audio and the timing sheet.
- VOICE (changed 15 Nov 2026): the narrator is en-US-AndrewNeural, not bm_daniel. Read shared/voice/VOICE-CHAIN.md. Two engines produce it — a local Chatterbox zero-shot clone (preferred, ~5x realtime on CPU) or Microsoft Edge TTS (fast, exact). voice/render_narration.py and its bm_daniel chain are historical, kept only as Inside the Log provenance for EP05+. Any other file still naming bm_daniel or Kokoro as this episode's narrator is out of date.
- TIMING WARNING: EP01/audio/sixthings_ep01_p1_timing.csv was measured on the old bm_daniel audio. The Andrew clone renders about 14 percent shorter, so picture cut to that sheet drifts. Re-measure before cutting, or keep the render close to the original length. Unresolved.
- ASSET_MANIFEST.md: same rights boundaries (see its 6 Things override note).
- LOCAL_PRODUCTION.md: its step 0 is replaced by the 6 Things style step (already patched in this copy).
- The Inside the Log name must not appear on screen in this episode. Series title on screen: "6 Things".
