# Six Things EP01 pronunciation checklist — NOT lexicon JSON

Narrator: **`en-US-AndrewNeural`** (decision 15 Nov 2026; the earlier `bm_daniel` /
Kokoro chain is superseded — see `../shared/voice/VOICE-CHAIN.md`).

The narration wording is locked. Captions and graphics keep the manuscript wording in
`blocks/` and `NARRATION.txt`. The respells below change the **TTS input only** and are
logged in `audio/sixthings_ep01_respell_log.md`.

Neither engine takes espeak phonemes, so the old Kokoro phoneme fixes now run as text
respells:

| Written | Spoken as | How |
|---|---|---|
| Blackbox | "black box" | text respell |
| EasyQuadTune | "Easy Quad Tune" | text respell |
| PID | "P I D" | text respell |
| TPA | "T P A" | text respell |
| RPM | "R P M" | NORM table |
| ESC | "E S C" | NORM table |
| feedforward / Feedforward | "feed-forward" | text respell (matches capital F at sentence start) |
| Betaflight / Betaflight's | BAY-ta-flight | text respell (`Bay-ta-flight`); en-US default can drift to BEE-ta |
| Fresnel | fruh-NELL | text respell (`fruh-nell`), was a phoneme fix under Kokoro |
| D-term | "dee-term" | default |
| I-term | "eye-term" | default |
| gyro | "jy-roh" | default |
| setpoint | "set-point" | default |
| propwash | "prop-wash" | default |
| log | "log" (not "lock") | default; the old American log rule is NOT used |

Checked and natural by default: under-damped, deadband, standoffs, integrator, harmonics,
manoeuvres, stall, regain, lower-pitch, forgiving, integrator windup, look-alike, levers,
straight line, bearing, sample rate.

## Verification status

The `Betaflight` and `Fresnel` respells have **not** been confirmed by listening. An agent
cannot hear, so these are unverified until Thomas's own listening pass. Known defect from the
first chatterbox render: the sentence at 0:07 in scene 1 was unclear; the cause was sentence
length, not pronunciation, and it is addressed by splitting long sentences at commas (see
`VOICE-CHAIN.md`).

Thomas's full listening pass is required before release.
