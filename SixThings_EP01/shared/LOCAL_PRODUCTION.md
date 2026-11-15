# Local production contract — Windows PowerShell 5.1 / AMD

Extract into C:\Users\Thomas\InsideTheLog_EP05-10 (or any writable short path). All references are relative to this extracted root. Do not assume Linux paths, Bash, CUDA/NVIDIA, old projects or existing credentials. Use Python3 CPU and an available browser/Blender/FFmpeg. Inspect installed tools first, record exact versions. No automatic purchase, API charges, account creation, publishing or upload. Public model/tool downloads must be explicit, from official sources, hash-verified where a known hash exists, and never install by piping a remote script to a shell.

[6 Things override: read ../style/STYLE_6THINGS.md first — the Inside the Log G2 STYLE_LOCK does not apply to this series and is not bundled.]

[VOICE OVERRIDE, 15 Nov 2026: 6 Things EP01 uses en-US-AndrewNeural, not bm_daniel. Wherever this file says Kokoro / bm_daniel / render_narration.py, read it as: the narrator chain in ../voice/VOICE-CHAIN.md, rendered with ../voice/render_narration_tts.py. The Kokoro model download and phoneme setup below do not apply to this episode.]

Then read then the episode's complete scripts and source ledger. Do not invent missing material. Produce PART1 then PART2, episode by episode. Finished handoff content is not finished video. STOP on an unfinished episode directory; do not substitute an outline for a manuscript.

## Project layout (generate locally, not supplied as finished media)
EPxx/project/config/ — tool versions, voice lock, renderer tokens, pronunciation overrides
EPxx/project/src/ — new animation/render/assembly source
EPxx/project/data/ — provenance-tagged real or synthetic data
EPxx/project/voice/P1/ and P2/ — scene WAVs, phoneme logs, measured durations
EPxx/project/renders/P1/ and P2/ — scene clips and thumbnail candidates
EPxx/project/edit/ — EDL with source ID, in/out, text box lifecycle and sound events
EPxx/project/qa/ — ASR diff, fonts/layout checks, audio measurements, rights audit, human listening decision
EPxx/project/delivery/ — EPxx_1of2_review.mp4, EPxx_2of2_review.mp4, separate VO/music/SFX stems, SRT, descriptions, credits, poster, scene sources

## Chronological checklist
0. [6 Things override] STYLE FIRST: read ../style/STYLE_6THINGS.md and the reference frames in ../style/frames/. There is NO G2 discovery gate for 6 Things; do not search C:\Users\Thomas\EP4 and do not apply the navy/gold G2 tokens. Copy the style-lock tokens (palette, fonts, type scale, slots, motion) into EP01/project/config/ before any rendering.
1. Read every narration block and storyboard. Create an asset ledger with status BUNDLED / CREATE_LOCALLY / OPTIONAL_EXTERNAL. Match every block ID exactly. Recheck applicable firmware/manual version before using a real UI screenshot or procedure. Never connect to/change a flight controller automatically.
2. Voice for this episode: en-US-AndrewNeural, rendered with shared/voice/render_narration_tts.py — either a local Chatterbox zero-shot clone or Microsoft Edge TTS. Read shared/voice/VOICE-CHAIN.md and shared/voice/voice.lock.json. The clone needs its own Python environment outside the repo (chatterbox-tts pins torch 2.6.0 and numpy<2); setup is in VOICE-CHAIN.md. Do not silently change narrator.
3. The finished narration is committed as MP3 in EP01/audio/andrew/. Do NOT rewrite, re-synthesize or re-time it; cut visuals to those files and to EP01/audio/sixthings_ep01_p1_timing.csv. If you must re-render, use render_narration_tts.py only, into a new output folder. After any render, run shared/tools/sync_timing.py so scene-index.json and the chapter list follow the measured audio. No time stretching to chase runtime.
4. Pronunciation respells live in render_narration_tts.py (TTS_RESPELLS) and lexicon.json and apply to TTS input only. Retain the official English manuscript in captions and graphics. Run ASR/full-text comparison as an automated aid, log mismatches; ASR does NOT prove pronunciation or voice quality.
5. Build animation components locally in the locked style. Seed synthetic generation, keep formulas/source beside data. Do not claim synthetic plots are measured flights. Match sound/visual events to measured speech, not estimated WPM. Use useful holds; no padded runtime, infinite loops or static cards used to fake depth. Render a representative small sample for local technical comparison against available G2; no new creative style drift.
6. Assemble Part1 and technical-QA it, then Part2. Optional music is SILENCE by default until a specific track has documented licence and Thomas approval. No automatic reuse of EP3's Wholesome recording. Original procedural SFX may be generated locally and labelled as such, never sold as real quad audio. Music only in planned breaks, ≤-18LUFS short-term; end/fade it before explanatory narration. If an explicitly approved overlap exists, duck strongly and audit the cut. Never leave music carried under an unplanned next scene. Export clean separate stems.
7. Automated checks: every block used once in order; no truncation; duration from actual WAVs; subtitle text/timing checked; all fonts loaded and embedded/rendered consistently; every frame's text safe bounds/overlap; no faces/people/corner watermarks; accurate units/scales; placeholders absent from export; rights ledger complete; no missing media. FFprobe1920×1080 constant60fps H.264 yuv420p; audio48kHz. Review at a reduced proxy before expensive final output. Measure full master with FFmpeg loudness/true-peak analysis: target-14LUFS±1, ≤-1dBTP; no sample clipping. Dialogue short-term target-16 to-13LUFS. Log measurements, do not assert pass without running them.
8. ONE final human listening/review gate per part: Thomas must actually listen to ALL spoken audio including technical terms and scene cuts and inspect the rendered video. A local agent cannot hear; do not replace this with ASR or declare his approval. Repair exact flagged sentences/cuts, remeasure. Only mark approved after real explicit human confirmation. This gate is distinct from automated checking and cannot be bypassed.
9. Final local delivery only. Real chapter timestamps derive from final edit. Resolve every part/playlist/credits URL placeholder before any future publication. Do not upload or change YouTube disclosure/settings. New videos' disclosure decisions must comply with then-current platform rules; no automatic toggle based on stale notes.

## Preferred renderer (Windows)
Use shared/voice/render_narration_tts.py as shown in step 3; its setup and both engines are documented in shared/voice/VOICE-CHAIN.md. It does not mix music, produce video, or claim a listening check.

## Text/caption portability
All supplied text is UTF-8. In Windows PowerShell5.1 read with Get-Content -LiteralPath ... -Encoding UTF8; avoid rewriting Unicode narration through default ANSI encoding. Python helpers explicitly read UTF-8. Use short local paths and relative references; no Bash/CUDA requirement. Historical /workspace paths in voice provenance describe origin only, never runtime inputs.
No timed SRT or chapters are bundled because no audio/edit has been produced. Generate SRT and chapter times from actual measured approved narration/edit; compare full text, preserve version/safety qualifications, test readability and do not burn captions over labels. Retain placeholder metadata drafts separately until actual public URLs and required attribution are resolved.
