# Six Things EP01 — scene-by-scene storyboard and asset plan

Every ID maps exactly to blocks/ID.txt and the matching heading in SCRIPT.md. Read the narration in full; beats are visual plans inside each scene, not replacements. Beat windows below are INITIAL planning fractions of the measured scene WAV (see audio/sixthings_ep01_p1_timing.csv). Move boundaries to the exact spoken clause after listening to the supplied audio; do not re-time the voice.

Style: the 6 THINGS STYLE LOCK (../style/STYLE_6THINGS.md) — NOT the Inside the Log G2 navy/gold lock, which does not apply to this series. Two modes, tagged on every beat: [E] Editorial (paper background, oversized cropped Barlow Condensed type, cut-out quad, single red-orange accent, thin black charts) for thumbnail, intro title, the six sign title cards, section cards, rule/test cards, recap and end card; [F] Cinematic (dimensional 5-inch quad in a dark studio, one cool spotlight, translucent airflow, thin HUD with teal measured data) for every explanation beat. Bridge: the same red-orange accent is the single 'this is the problem' marker in F; teal is always measured data. E↔F changes are a hard cut or a fast wipe on the beat. Reference frames: ../style/frames/. FACELESS: no people, hands, faces, presenters or avatars. All charts are SYNTHETIC illustrations generated from seeded formulas in project/data/ and labelled once per chart as 'synthetic example'; axes carry real quantities and units; never present them as a real flight log. One caption block at a time, no overlapping text, no corner watermarks or brand bugs, no bottom disclaimer bars. Default music NONE.

NO SOURCES IN THE VIDEO (hard rule): no source names, citations, URLs, document/page/channel titles, screenshots or traced charts of docs/guides/videos, 'source:' or 'according to' captions, footnotes, reference numbers or credit overlays anywhere — not in scene cards, chart titles, lower thirds or the end card. The ledger refs in this storyboard are for fact traceability only. The narration itself names no source.

Reusable assets: shared/animation-reference/b.js (control-loop diagram), d.js (dimensional quad/mixer), a.js (flight controller) are authentic EP2 references to adapt, not finished shots. Thomas's EP2/EP3 reusable motor / FC / ESC / gyro / quad / signal / filter animation sources (Drive archive, already delivered) MAY be reused as geometry/motion technique for motor spin, gyro, filter and quad beats, re-skinned to the 6 Things tokens; record each reused file and hash in project/edit/. Build everything else locally.

EasyQuadTune appears only as the bundled icon on short, restrained [E] cards in S06, S08 and S10 (and the end card); never as a corner bug. No invented UI screenshots of the app, no claims beyond the narration.

## P1-S01 — Before you buy the part
Narration: blocks/P1-S01.txt; 184 words. Evidence/assets: CREATE_LOCALLY: generic quad (d.js mixer look), tree silhouette, procedural shopping-cart icon card, three-trace log strip; internal fact-ledger refs 5,7 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S01-B1|0/6 to 1/6|[F] Cold open: dimensional 5-inch quad in the dark studio under the single cool spotlight drops past a soft-edged tree silhouette; slight wobble driven by a seeded synthetic signal; translucent airflow at the props (no real footage)|
|P1-S01-B2|1/6 to 2/6|[F] Close-up macro: motor bell under the spotlight with a faint warm heat shimmer (desaturated warm, not accent); then a nose overshoot-and-return arc drawn as a thin HUD line after a roll|
|P1-S01-B3|2/6 to 3/6|[E] Hard cut on the beat to paper: oversized cropped display word 'BROKEN?' with the quad cut-out overlapping it; one small Inter Tight label; card leaves before the next text arrives|
|P1-S01-B4|3/6 to 4/6|[E] Swiss split on paper: left a thin-line wrench + bent-prop pictogram, right a thin-line settings slider; the single red-orange accent moves from the wrench to the slider on 'something else'|
|P1-S01-B5|4/6 to 5/6|[F] Fast wipe back to the studio: HUD log strip builds, three thin stacked traces labelled SETPOINT (light dashed), GYRO (teal), MOTORS (dim grey); 'SYNTHETIC EXAMPLE' tag appears once in the panel header|
|P1-S01-B6|5/6 to 6/6|[E] Intro title card: '6 SIGNS' oversized and cropped, full title in Inter Tight below on one line block, quad cut-out overlapping the display type; four tiny line pictograms (feel / log / why / counter-check); hold|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S02 — Two lines and one rule
Narration: blocks/P1-S02.txt; 192 words. Evidence/assets: CREATE_LOCALLY: setpoint vs gyro chart, control-loop diagram (adapt shared b.js), rule card; internal fact-ledger refs 5,6,10,20 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S02-B1|0/6 to 1/6|[F] HUD chart panel draws on beside the quad: axes with real labels (roll rate, deg/s; time, s); light dashed SETPOINT then teal GYRO introduced one at a time|
|P1-S02-B2|1/6 to 2/6|[F] Error area between the lines fills in translucent teal; a thin HUD loop diagram (stick → PID → motors → gyro) pulses once per loop|
|P1-S02-B3|2/6 to 3/6|[F] Perfect-world overlay: gyro sits exactly on setpoint, then relaxes to a realistic small lag; motor spin-up shown as the airflow glow brightening|
|P1-S02-B4|3/6 to 4/6|[F] Three mini HUD charts in sequence: ringing gap, lingering gap, throttle-dependent gap; the one being spoken gets the red-orange marker, the others stay dim|
|P1-S02-B5|4/6 to 5/6|[E] Rule card on paper: two Swiss columns, 'FOLLOWS THE FLIGHT' (throttle, stick speed, move) vs 'FOLLOWS THE PART' (one frequency, one motor, changes on swap); thin black rules, accent underline on the active column|
|P1-S02-B6|5/6 to 6/6|[E] Checklist hold on paper: screws / props / FC mount as thin-line items with ticks; display line 'MECHANICS FIRST'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S03 — Sign one: wobble in your own wash
Narration: blocks/P1-S03.txt; 295 words. Evidence/assets: CREATE_LOCALLY: drop/reversal flight path, turbulent-air particles, log zoom with throttle, low-band spectrum, dynamic-idle motor RPM gauge; internal fact-ledger refs 1,2,3,10,11,12 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S03-B1|0/6 to 1/6|[E] Sign title card (frame b): '01 / 06' counter top right with 01 in accent, oversized 'PROPWASH' cropped/bleeding, quad cut-out overlapping, label 'Sign 01 — Wobble in your own wash', small thin-line chart of the same synthetic data|
|P1-S03-B2|1/6 to 2/6|[F] Quad chops throttle and sinks through its own translucent airflow; small, short frame jitter; HUD inset: one prop blade with reverse-flow arrows, flow detaches (stall) and reattaches as RPM rises; the thrust arrow jumps larger than the small requested arrow (jump marked in accent)|
|P1-S03-B3|2/6 to 3/6|[F] HUD beat (frame c): setpoint vs gyro with throttle lane; dashed 'stick stops' marker, then the burst begins in the wash, marked with the accent band 'wobble starts in the wash'|
|P1-S03-B4|3/6 to 4/6|[F] HUD spectrum panel (frequency, Hz; amplitude, relative): low band highlighted in accent and labelled 'below ~100 Hz (typical 5-inch)'; motor/prop band to the right stays teal-dim|
|P1-S03-B5|4/6 to 5/6|[F] Border beat: two prop silhouettes under the spotlight, higher vs lower pitch (no numbers), lower one tagged 'more forgiving'; then mechanism HUD: D-term block lights, filter-delay arrow lengthens correction arrival, RPM gauge shows a minimum-RPM floor (dynamic idle) keeping the blade out of the stalled region|
|P1-S03-B6|5/6 to 6/6|[E] Counter-check card on paper: thin-line icons for loose screws, cracked plate, rough bearing, loose bell, damaged prop; display line 'FIX THESE FIRST. THEN TUNE.'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S04 — Sign two: hot motors on clean props
Narration: blocks/P1-S04.txt; 279 words. Evidence/assets: CREATE_LOCALLY: motor heat visual, D-term noise trace, motor output trace, spectrum with RPM-tracking harmonics + notches; internal fact-ledger refs 1,6,12,13,14 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S04-B1|0/6 to 1/6|[E] Sign title card: '02 / 06', oversized 'HOT MOTORS', quad cut-out, label 'Sign 02 — Hot motors on clean props'|
|P1-S04-B2|1/6 to 2/6|[F] Studio: four motors spin down, bells show a warm shimmer; fresh, intact props in the light|
|P1-S04-B3|2/6 to 3/6|[F] HUD signal chain: gyro noise → filters → D-term amplifies → rapid motor commands; the amplification step carries the accent; motor can't follow, heat shimmer|
|P1-S04-B4|3/6 to 4/6|[F] HUD log: fuzzy D-term band in calm cruise vs clean teal gyro; jagged motor outputs while attitude barely moves|
|P1-S04-B5|4/6 to 5/6|[F] HUD spectrogram (throttle vs frequency): diagonal motor harmonics climbing with throttle; thin notch markers ride on each line (RPM-filter concept)|
|P1-S04-B6|5/6 to 6/6|[F] Counter-check split HUD: 'raw gyro noisy on defaults → look for a mechanical/electrical cause'; one motor alone marked hot in accent → 'check that motor, bearing, prop'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S05 — Sign three: bounce-back
Narration: blocks/P1-S05.txt; 285 words. Evidence/assets: CREATE_LOCALLY: roll with nod-back, step zoom, two shape variants (ringing vs slow return), I-term trace, motor saturation bar; internal fact-ledger refs 5,8,9,20,21 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S05-B1|0/6 to 1/6|[E] Sign title card: '03 / 06', oversized 'BOUNCE-BACK', label 'Sign 03 — Bounce-back at the end of a move'|
|P1-S05-B2|1/6 to 2/6|[F] Quad completes a roll in the spotlight; small reverse nod at the end, shown twice from a fixed camera|
|P1-S05-B3|2/6 to 3/6|[F] HUD zoom where setpoint goes flat: variant A, gyro rings several fast cycles; label 'P/D balance'|
|P1-S05-B4|3/6 to 4/6|[F] HUD variant B: one slow return, I-term trace still elevated after the move (accent on the elevated I-term); label 'I-term windup'|
|P1-S05-B5|4/6 to 5/6|[F] HUD mechanism: I accumulates during the fast move then discharges in reverse; an 'I-term relax' gate clamps the accumulation|
|P1-S05-B6|5/6 to 6/6|[F] Counter-check: late-flight random wobble with low idle / over-propped / weak ESC start-up line icons; motor bars pinned at their limit (accent) → 'thrust limit'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S06 — Sign four: gyro late, gyro past
Narration: blocks/P1-S06.txt; 262 words. Evidence/assets: CREATE_LOCALLY: step-response chart with three variants, motor output bars, EasyQuadTune brand card (bundled icon only); internal fact-ledger refs 1,5,12,17,18 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S06-B1|0/6 to 1/6|[E] Sign title card: '04 / 06', oversized 'LAG / OVERSHOOT', label 'Sign 04 — A gyro that arrives late, or goes too far'|
|P1-S06-B2|1/6 to 2/6|[F] Two takes in the studio: stick moves, quad lags (mushy); second take snaps past the target|
|P1-S06-B3|2/6 to 3/6|[F] HUD step-response chart (response, normalised to 1.0; time, s), header 'Estimated step response — synthetic example': slow rise (lag)|
|P1-S06-B4|3/6 to 4/6|[F] Overlay variant: overshoot peak and ring (peak circled in accent); then a third variant that plateaus below target|
|P1-S06-B5|4/6 to 5/6|[F] HUD lever map: lag → feedforward / P, overshoot → D, too much D → slow, filter delay → late rise; the lever being spoken gets the accent|
|P1-S06-B6|5/6 to 6/6|[F] Counter-check: motor bars hit the limit while gyro still falls short → 'physical ceiling: torque'. Then [E] short paper card with the bundled EasyQuadTune icon and one line 'step response per axis from your own log'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S07 — Sign five: a twitch that follows your thumbs
Narration: blocks/P1-S07.txt; 246 words. Evidence/assets: CREATE_LOCALLY: stick gimbal animation, RC packet timeline, feedforward trace with spikes, motor outputs, deadband test card; internal fact-ledger refs 9,16 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S07-B1|0/6 to 1/6|[E] Sign title card: '05 / 06', oversized 'STICK TWITCH', label 'Sign 05 — A twitch that follows your thumbs'|
|P1-S07-B2|1/6 to 2/6|[F] Centred sticks: calm horizon line in the HUD; slow turn: fine jitter on the horizon|
|P1-S07-B3|2/6 to 3/6|[F] HUD timeline: RC packets as discrete steps; one dropped packet makes the feedforward trace dip then jump (jump marked in accent)|
|P1-S07-B4|3/6 to 4/6|[F] HUD log: feedforward spikes aligned with stick movement and visible again in the motor outputs|
|P1-S07-B5|4/6 to 5/6|[E] Two test cards on paper in sequence: 'FEEDFORWARD = 0 TEST FLIGHT' and 'TEMPORARY WIDE DEADBAND TEST'; outcome arrow 'no change → not the cause'|
|P1-S07-B6|5/6 to 6/6|[F] Counter-check close-ups under the spotlight: frame flex, unbalanced prop, worn bearing; HUD line 'twitch with sticks centred in calm air → hardware'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S08 — Sign six: shaking that arrives with throttle
Narration: blocks/P1-S08.txt; 238 words. Evidence/assets: CREATE_LOCALLY: punch-out animation, throttle-coloured log, TPA curve, fixed-frequency spectrogram line; internal fact-ledger refs 1,2,12,15,18 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S08-B1|0/6 to 1/6|[E] Sign title card: '06 / 06', oversized 'HIGH THROTTLE', label 'Sign 06 — Shaking that arrives only with throttle'|
|P1-S08-B2|1/6 to 2/6|[F] Quad cruising smooth; punch-out brightens the airflow and triggers fast oscillation; ease off, it calms|
|P1-S08-B3|2/6 to 3/6|[F] HUD log with a throttle lane: oscillation only in the top throttle band (band marked in accent)|
|P1-S08-B4|3/6 to 4/6|[F] HUD curve: thrust vs motor command bending away from a straight reference near full throttle (qualitative, axes labelled, no values); then TPA graphic: gain multiplier flat until the breakpoint, then sloping down (no numeric values)|
|P1-S08-B5|4/6 to 5/6|[F] Trade-off: the same stick input gives a slightly different HUD response at two throttle levels|
|P1-S08-B6|5/6 to 6/6|[F] Counter-check spectrogram: a horizontal fixed line across throttle (frame, in accent) vs diagonal motor lines (teal); line 'Fixed frequency → check the frame'. Then [E] brief paper card with the bundled EasyQuadTune icon and 'frequency view'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S09 — When it really is hardware
Narration: blocks/P1-S09.txt; 283 words. Evidence/assets: CREATE_LOCALLY: summary diagnostic panel, before/after comparison, filter-as-mask metaphor; internal fact-ledger refs 12,15,20 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S09-B1|0/6 to 1/6|[E] Section card on paper: oversized 'HARDWARE' cropped, label 'When it really is hardware' (no counter: this is not one of the six)|
|P1-S09-B2|1/6 to 2/6|[F] Studio quad: one motor/arm lit and marked in accent with its own HUD trace; others clean|
|P1-S09-B3|2/6 to 3/6|[F] Three HUD spectrum shapes side by side: fixed tone, raised floor, clean; one highlighted at a time|
|P1-S09-B4|3/6 to 4/6|[F] Four HUD motor-output traces: one runs consistently higher (accent; loose prop / rough bearing / failing motor icons, 'less thrust → driven harder'); then all bars pinned at limit → 'out of authority'|
|P1-S09-B5|4/6 to 5/6|[F] One-change test: prop swap / tightened screws / suspect motor moved to another arm (the odd trace follows the motor), then the peak disappears in a before/after spectrum|
|P1-S09-B6|5/6 to 6/6|[F] Filter as a mask: the symptom fades on the HUD chart while a small wear indicator on the part keeps growing; hold|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S10 — A log that can answer
Narration: blocks/P1-S10.txt; 213 words. Evidence/assets: CREATE_LOCALLY: test-flight plan timeline, logging-rate card, motor temperature check; internal fact-ledger refs 7,12,14,17,18,19 (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S10-B1|0/6 to 1/6|[E] Section card on paper: oversized 'THE LOG' cropped, label 'A log that can answer'; a flat, unhelpful hover-only trace drawn in thin black|
|P1-S10-B2|1/6 to 2/6|[F] HUD sampling beat: high-rate vs low-rate samples of the same vibration; the low-rate samples miss it (frequencies above half the sample rate cannot be shown). No numeric rates|
|P1-S10-B3|2/6 to 3/6|[E] Flight-plan timeline on paper, Swiss grid: throttle sweeps → roll flicks → pitch flicks → chops/drops → punch-outs; current item in accent|
|P1-S10-B4|3/6 to 4/6|[E] Rule cards: 'ONE CHANGE AT A TIME', then 'NEVER CHANGE PROPS AND TUNE TOGETHER' (one at a time, never stacked)|
|P1-S10-B5|4/6 to 5/6|[F] After landing: thermometer line icon on a motor bell under the spotlight (no hands, no people)|
|P1-S10-B6|5/6 to 6/6|[E] Restrained paper card with the bundled EasyQuadTune icon and one line 'log quality and missing manoeuvres'|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.

## P1-S11 — The right order
Narration: blocks/P1-S11.txt; 124 words. Evidence/assets: CREATE_LOCALLY: six-icon recap grid, closing brand card; internal fact-ledger refs: all (recap) (SOURCES_AND_FACT_QA.md — research only, never shown on screen).

|Beat|Provisional fraction of scene WAV|Animation/evidence/action|
|---|---|---|
|P1-S11-B1|0/6 to 1/6|[E] Recap card (frame d): '6 SIGNS' oversized; six numbered grid cells appear in order with the spoken list, current cell number in accent|
|P1-S11-B2|1/6 to 2/6|[E] All six cells slide into a 'FOLLOWS THE FLIGHT' column|
|P1-S11-B3|2/6 to 3/6|[E] Question card: 'FOLLOWS THE FLIGHT, OR FOLLOWS THE PART?'|
|P1-S11-B4|3/6 to 4/6|[E] Four-step loop as thin-line Swiss diagram: mechanics → log → one change → same moves|
|P1-S11-B5|4/6 to 5/6|[F] Last studio beat: HUD log strip quietly scrolls beside the quad; line 'It is in the record'|
|P1-S11-B6|5/6 to 6/6|[E] End card (frame e): 'READ IT IN THE RIGHT ORDER.' with ORDER. in accent, quad cut-out, bundled EasyQuadTune icon small (no URL, no claims); cut to black|

Edit: match highlights to the spoken clause; clear outgoing text before incoming text. Keep a legible final hold; do not stretch to a target runtime. Dialogue is primary; no music bed.
