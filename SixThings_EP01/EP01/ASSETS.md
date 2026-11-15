# Six Things EP01 asset manifest

BUNDLED: complete manuscript (SCRIPT.md), clean narration (NARRATION.txt), 11 scene narration blocks, 11 storyboard scenes with 66 visual beats, source/claim ledger, pronunciation checklist, metadata/thumbnail drafts, timing sheet and respell/phoneme logs for the finished audio. Shared style/voice/brand references are in ../shared/.

SUPPLIED SEPARATELY (finished, do not regenerate): bm_daniel narration WAV/MP3 per scene and full track — see NARRATION_AUDIO.md.

REUSE (optional, geometry/motion technique only, re-skinned to ../style/STYLE_6THINGS.md): Thomas's EP2/EP3 reusable animation sources and renders (motor, FC, ESC, gyro, quad, signal, filter) from the Drive archive already delivered; shared/animation-reference a.js (FC), b.js (control loop), d.js (quad/mixer). Record every reused file, its path and SHA-256 in project/edit/.

CREATE_LOCALLY: dimensional 5-inch quad model/renders in the F studio look and its E cut-out, all log-graph charts (setpoint/gyro/I-term/D-term/feedforward/motor traces), step-response charts, spectra and spectrograms, TPA curve, throttle-band colouring, propwash particle wake, heat tint, RC-packet timeline, recap icons, chapter cards, thumbnail. Generate every chart from seeded formulas stored in project/data/ with the formula beside the data.

SYNTHETIC — must stay labelled once per chart as "synthetic example": every log trace, spectrum, step response and motor bar in this episode. None of them is a real flight. Do not imply measured values; axes may show units but no specific tuning numbers.

EXTERNAL: none required. Source pages (Betaflight docs, Oscar Liang, EasyQuadTune guides) are research only, not licensed visuals, and never appear in the video: no screenshots, traced charts, names, URLs, citations or credit overlays. No music, no footage, no people, no hands.

STYLE (bundled): ../style/STYLE_6THINGS.md, reference frames ../style/frames/ (thumbnail, sign-01 title card, F HUD beat, recap, end card), seeded synthetic data ../style/data/, fonts with OFL licences ../style/fonts/, generator ../style/build_frames.py.

PLACEHOLDERS (concept only, replace before production): ../style/src/quad_cutout_PLACEHOLDER.png and ../style/src/plate_F_clean_PLACEHOLDER.jpg, derived from Thomas's two concept frames (../style/src/ref_E_editorial.jpg, ref_F_cinematic.jpg). Low resolution; the cut-out has no props. CREATE_LOCALLY a dimensional 5-inch quad (3D) for F beats and a clean cut-out render for E cards.

NOT BUNDLED: Kokoro model weights, tool binaries, final renders. G2/EP4 material is not used by this series.
