# Prompt — Six Things EP01

**What it is about:** six signs that a quad's problem is the tune, not the hardware. The video takes a pilot whose quad wobbles, shakes or feels wrong and who assumes something is broken, and shows six symptoms that usually point at settings instead: propwash wobble, hot motors on clean props, bounce-back at the end of a move, a gyro that arrives late or goes too far, a twitch that follows the thumbs, and shaking that only arrives with high throttle. For each sign: what the pilot feels, what it looks like in a Blackbox log, why it points at tuning, and the counter-check that would send them back to the workbench. It also covers the two lines everything hangs on — setpoint, what the sticks ask for, and gyro, what the quad actually did — and the one rule that separates the two kinds of problem: tuning problems follow the flight conditions, hardware problems follow the part.

**How to make it:** 11 scenes in this order. Every numbered line is one separate shot, and each shot is one continuous 3D animation. The scene headings are for you, not for the screen. Use only the text quoted in the shots.

---

## Scene 1 — Before you buy the part
*Intro: a quad that feels broken. The obvious thought is a failed part, but many symptoms are a control loop doing what it was told with settings that do not suit the aircraft. The log records what the sticks asked for, what the gyro measured and what the motors were told to do.*

1. 3D animation of a 5-inch quad dropping past a tree silhouette, wobbling slightly, air moving around the props.
2. 3D animation of a close-up of a motor bell with faint heat shimmer, then a thin line that overshoots and returns after a roll.
3. 3D animation of the word "BROKEN?" in oversized type with a quad passing over it.
4. 3D animation of a wrench and a bent prop beside a settings slider, with a highlight moving from the wrench to the slider.
5. 3D animation of a log panel building three traces: "SETPOINT", "GYRO" and "MOTORS".
6. 3D animation of the title "6 SIGNS" with a quad and four small line icons.

## Scene 2 — Two lines and one rule
*The foundation: setpoint versus gyro, the error between them, and the PID loop that shrinks it. Plus the rule — tuning follows the flight, hardware follows the part — and mechanics before tuning.*

1. 3D animation of a chart panel drawing its axes, roll rate in deg/s and time in s, with a setpoint line and a gyro line appearing one at a time.
2. 3D animation of the area between the two lines filling in, and a loop diagram stick → PID → motors → gyro pulsing once per loop.
3. 3D animation of the gyro line sitting exactly on the setpoint, then lagging slightly behind it, while the airflow at the motors brightens.
4. 3D animation of three small charts in sequence: a gap that rings, a gap that lingers, and a gap that only appears at some throttle positions, one highlighted at a time.
5. 3D animation of two columns of text, "FOLLOWS THE FLIGHT" with throttle, stick speed and move, and "FOLLOWS THE PART" with one frequency, one motor and changes on a swap.
6. 3D animation of a checklist where screws, props and FC mount get ticked off, ending with the line "MECHANICS FIRST".

## Scene 3 — Sign one: wobble in your own wash
*Propwash: the quad shakes when it drops into its own disturbed air and settles again in clean air. The blades stall in reverse flow and regain thrust suddenly. In the log it is a burst that starts with the disturbed air, low in the spectrum.*

1. 3D animation of the title card "01 / 06" and "PROPWASH" with a quad and a small chart.
2. 3D animation of a quad chopping throttle and sinking through its own airflow with a small frame jitter, then an inset of one prop blade with reverse-flow arrows, the flow detaching and reattaching, and a thrust arrow jumping larger than the requested arrow.
3. 3D animation of setpoint and gyro lines with a throttle lane, a "stick stops" marker and a burst starting in the disturbed air.
4. 3D animation of a spectrum panel with the low band highlighted and labelled "below ~100 Hz (typical 5-inch)".
5. 3D animation of two prop silhouettes, one higher pitch and one lower pitch with the lower tagged "more forgiving", then a mechanism view where the D-term lights up, a filter-delay arrow lengthens and an RPM gauge shows a minimum floor.
6. 3D animation of a counter-check card with icons for loose screws, cracked plate, rough bearing, loose bell and damaged prop, ending with the line "FIX THESE FIRST. THEN TUNE."

## Scene 4 — Sign two: hot motors on clean props
*Motors come down hot while the props are fresh and nothing is bent. Too much D-term turns vibration that gets past the filters into rapid motor commands, and the effort becomes heat. One hot motor alone is a part, not the tune.*

1. 3D animation of the title card "02 / 06" and "HOT MOTORS".
2. 3D animation of four motors spinning down with heat shimmer on the bells, fresh intact props in the light.
3. 3D animation of a signal chain where gyro noise passes through filters and the D-term amplifies it into rapid motor commands, with the amplification step highlighted and the motor shimmering.
4. 3D animation of a log with a thick fuzzy D-term band next to a clean gyro line, and jagged motor outputs while the attitude barely moves.
5. 3D animation of a spectrogram where diagonal motor harmonics climb with throttle and thin notch markers ride on each line.
6. 3D animation of a split view: "raw gyro noisy on defaults → look for a mechanical/electrical cause", and one motor alone marked hot with "check that motor, bearing, prop".

## Scene 5 — Sign three: bounce-back
*The quad goes a little too far and swings back at the end of every flip. Fast ringing means the P/D balance is off; one slow return with the I-term still raised means integrator windup. A delayed motor start-up or motors already at their limit can look the same.*

1. 3D animation of the title card "03 / 06" and "BOUNCE-BACK".
2. 3D animation of a quad completing a roll and making a small reverse nod at the end, shown twice from a fixed camera.
3. 3D animation of a zoom where the setpoint goes flat and the gyro rings through several fast cycles, labelled "P/D balance".
4. 3D animation of one slow return through the target with the I-term trace still raised after the move, labelled "I-term windup".
5. 3D animation of the I-term accumulating during a fast move and discharging in reverse, with an "I-term relax" gate clamping the accumulation.
6. 3D animation of random wobble at the end of a late flip, with icons for low idle, over-propped and weak ESC start-up, and motor bars pinned at their limit labelled "thrust limit".

## Scene 6 — Sign four: gyro late, gyro past
*The quad feels mushy, or it snaps past the point where the pilot wanted it to stop. The step response estimated from the log shows it: a slow rise is lag, a peak above the target is overshoot, and a plateau below the target is a third fault. Each one points at a different lever.*

1. 3D animation of the title card "04 / 06" and "LAG / OVERSHOOT".
2. 3D animation of two takes: the stick moves and the quad lags behind, then the quad snaps past the target.
3. 3D animation of a step-response chart with axes response and time, drawing a slow rise.
4. 3D animation of an overshoot peak with its ring circled, then a third variant that levels off below the target.
5. 3D animation of a lever map where lag points to feedforward and P, overshoot points to D, too much D points to slow, and filter delay points to a late rise, one lever highlighted at a time.
6. 3D animation of motor bars hitting their limit while the gyro still falls short, labelled "physical ceiling: torque", then a card reading "step response per axis from your own log".

## Scene 7 — Sign five: a twitch that follows your thumbs
*A small twitch that appears with stick movement and not when the sticks are still. The log shows feedforward spikes tied to the stick trace, and dropped RC packets make them worse. Turning feedforward off and widening the deadband are the two tests that decide it.*

1. 3D animation of the title card "05 / 06" and "STICK TWITCH".
2. 3D animation of centred sticks with a calm horizon line, then a slow turn with fine jitter on the horizon.
3. 3D animation of a timeline of RC packets as discrete steps, where one dropped packet makes the feedforward trace dip and then jump.
4. 3D animation of feedforward spikes aligned with stick movement, the same spikes visible again in the motor outputs.
5. 3D animation of two test cards in sequence, "FEEDFORWARD = 0 TEST FLIGHT" and "TEMPORARY WIDE DEADBAND TEST", with the arrow and the line "no change → not the cause".
6. 3D animation of close-ups of frame flex, an unbalanced prop and a worn bearing, ending with the line "twitch with sticks centred in calm air → hardware".

## Scene 8 — Sign six: shaking that arrives with throttle
*Smooth in a cruise, shaking in a punch-out. The oscillation lives only in the top throttle band, where thrust stops rising with motor command and the same stick input gets a different answer. A fixed frequency across throttle points at the frame, not the tune.*

1. 3D animation of the title card "06 / 06" and "HIGH THROTTLE".
2. 3D animation of a quad cruising smooth, then a punch-out that brightens the airflow and triggers a fast oscillation, then easing off as it calms again.
3. 3D animation of a log with a throttle lane where the oscillation only appears in the top throttle band, with the band highlighted.
4. 3D animation of a thrust curve bending away from a straight reference near full throttle, then a gain multiplier that stays flat until a breakpoint and then slopes down.
5. 3D animation of the same stick input producing a different response at two throttle levels.
6. 3D animation of a spectrogram with a horizontal fixed line across throttle next to diagonal motor lines, with the line "Fixed frequency → check the frame", then a card reading "frequency view".

## Scene 9 — When it really is hardware
*The honest other side: how a real hardware fault behaves. One motor and arm marked and standing out, one trace running higher because a weak part is driven harder, and a one-change test — swap, tighten, move the motor — where the odd trace follows the part. Filtering can hide a symptom but not fix the wear.*

1. 3D animation of the section card "HARDWARE".
2. 3D animation of a quad where one motor and arm are lit and marked with their own trace while the other arms stay clean.
3. 3D animation of three spectrum shapes side by side, a fixed tone, a raised floor and a clean one, highlighted one at a time.
4. 3D animation of four motor-output traces where one runs consistently higher, with icons for loose prop, rough bearing and failing motor and the line "less thrust → driven harder", then all bars pinned at the limit labelled "out of authority".
5. 3D animation of a one-change test: a prop swap, screws tightened, and a suspect motor moved to another arm with the odd trace following the motor, then the peak disappearing in a before/after spectrum.
6. 3D animation of the symptom fading on a chart like a mask while a small wear indicator on the part keeps growing.

## Scene 10 — A log that can answer
*The log is only as good as the flight that made it. A high enough logging rate, a test flight that actually does the manoeuvres, and one change at a time — otherwise the next flight cannot tell the pilot anything.*

1. 3D animation of the section card "THE LOG" with a flat hover-only trace.
2. 3D animation of high-rate and low-rate samples of the same vibration, where the low-rate samples miss it entirely.
3. 3D animation of a flight-plan timeline in a grid: throttle sweeps → roll flicks → pitch flicks → chops and drops → punch-outs, with the current item highlighted.
4. 3D animation of the rule cards "ONE CHANGE AT A TIME" and then "NEVER CHANGE PROPS AND TUNE TOGETHER", shown one at a time.
5. 3D animation of a thermometer line icon on a motor bell after landing.
6. 3D animation of a card reading "log quality and missing manoeuvres".

## Scene 11 — The right order
*Close: the six signs as a list, all of them following the flight, against the question of what follows the part. Then the order of work — mechanics, log, one change, same moves — and the point that the answer is in the record.*

1. 3D animation of the recap "6 SIGNS" with six numbered cells appearing in order, the current number lit.
2. 3D animation of all six cells sliding into one column headed "FOLLOWS THE FLIGHT".
3. 3D animation of the question card "FOLLOWS THE FLIGHT, OR FOLLOWS THE PART?".
4. 3D animation of a four-step loop diagram: mechanics → log → one change → same moves.
5. 3D animation of a log strip quietly scrolling beside the quad with the line "It is in the record".
6. 3D animation of the end card "READ IT IN THE RIGHT ORDER." with a quad, then cut to black.

---

# Research links

For background only. Do not put any source name, citation, URL, page title or credit line in the video. Chart values and settings numbers are not needed; the facts below are the qualitative claims the video rests on. All links were checked on 12 Nov 2026.

## Scene 1 — intro and the log

- Betaflight — Black Box logging and usage: https://betaflight.com/docs/wiki/guides/current/Black-Box-logging-and-usage — the log records sticks, gyro and motor commands; logging starts on arm.
- Oscar Liang — Blackbox basics: https://oscarliang.com/blackbox/ — what a log contains; the gyro ideally sits on setpoint but the motors need time to respond.
- Betaflight wiki — PID Tuning Guide: https://betaflight.com/docs/wiki/guides/current/PID-Tuning-Guide — D is the term fast enough for propwash; excessive D feels mushy; check motor temperature after D and filter changes.

## Scene 2 — setpoint, gyro, and the rule

- Oscar Liang — Why excessive D gain causes oscillation and motor overheating: https://oscarliang.com/excessive-d-gain-cause-oscillations-motor-overheat/ — setpoint, measurement and error; D reacts to the rate of change of the error.
- Oscar Liang — Propwash: https://oscarliang.com/propwash/ — mechanical integrity first: soft-mounted FC, loose screws, cracked plates, bearings, loose bells.
- EasyQuadTune — Why does my quad wobble on hard stops?: https://easyquadtune.vercel.app/guides/quad-wobble-hard-stops — don't change props and tune in the same flight.
- PX4 — Multicopter PID Tuning Guide: https://docs.px4.io/main/en/config_mc/pid_tuning_guide_multicopter — same control theory in another firmware: too little P reacts slowly, too little D overshoots after a step, too much D amplifies noise and can heat motors.

## Scene 3 — propwash

- Chris Rosser — "The Science of Prop Wash: How to Actually Fix It!": https://www.youtube.com/watch?v=1WDcEJ2DHBA — "flying through your own wake" is not wrong but incomplete; a small throttle increase unstalls the flow and the prop suddenly makes much more thrust; a lower-pitch prop is far more robust to propwash; dynamic idle sets a minimum RPM above the transition region.
- Oscar Liang — Propwash: https://oscarliang.com/propwash/ — definition; D helps but too much D overheats.
- Oscar Liang — Dynamic idle: https://oscarliang.com/how-to-enable-and-configure-betaflight-dynamic-idle/ and Betaflight wiki — Dynamic Idle: https://betaflight.com/docs/wiki/guides/current/Dynamic-Idle — minimum-RPM floor keeps the props out of the stalled region.
- Oscar Liang — PID and filter tuning with Blackbox: https://oscarliang.com/pid-filter-tuning-blackbox/ — on a typical 5-inch, propwash and PID oscillation sit roughly 20–100 Hz, frame resonance and loose parts roughly 100–250 Hz, motor and prop noise above; over-filtering adds delay and can worsen propwash.
- Betaflight wiki — Freestyle Tuning Principles: https://betaflight.com/docs/wiki/guides/current/Freestyle-Tuning-Principles — the gyro lowpass is the biggest source of phase delay and makes propwash response poor.
- PX4 — Filter Tuning and Control Latency: https://docs.px4.io/main/en/config_mc/filter_tuning and ArduPilot — Managing Gyro Noise: https://ardupilot.org/copter/docs/common-imu-notch-filtering.html — filter delay limits how aggressive the tune can be before oscillation.
- ArduPilot — Measuring Vibration: https://ardupilot.org/copter/docs/common-measuring-vibration.html — vertical vibration can come from a bent propeller or vertical play in a motor.

## Scene 4 — hot motors on clean props

- Betaflight wiki — PID Tuning Guide: https://betaflight.com/docs/wiki/guides/current/PID-Tuning-Guide — D is very sensitive to high-frequency noise and can heat or burn motors.
- Joshua Bardwell — "Why Do FPV Motors Get Hot? What Settings Cause It?": https://www.youtube.com/watch?v=omat80ZiGHA — hot motors come specifically from the D-term and insufficient gyro filtering; D amplifies noise into commands the motors cannot follow, and the effort becomes heat.
- Oscar Liang — Excessive D gain: https://oscarliang.com/excessive-d-gain-cause-oscillations-motor-overheat/ — motors asked to change faster than they can leads to oscillation and heat.
- Oscar Liang — RPM filter: https://oscarliang.com/rpm-filter/ — notches are placed on each motor's frequency and its harmonics.
- Oscar Liang — FPV drone tuning: https://oscarliang.com/fpv-drone-tuning/ — grinding sound in a hover when filtering is too low; check motor temperature; bent props should be replaced.
- PX4 — PID Tuning Guide: https://docs.px4.io/main/en/config_mc/pid_tuning_guide_multicopter — the D-term amplifying noise is a general control-theory effect, not firmware-specific.

## Scene 5 — bounce-back

- Betaflight 4.2 Tuning Notes: https://betaflight.com/docs/wiki/tuning/4-2-Tuning-Notes — integrator windup: stored I drives a reverse movement that slowly fades; I-term relax limits accumulation; over-propped quads struggle to change thrust.
- Betaflight wiki — I-Term Relax Explained: https://betaflight.com/docs/wiki/guides/current/I-Term-Relax-Explained — I is held during fast manoeuvres; a lower cutoff suppresses earlier.
- Betaflight 4.3 Tuning Notes: https://betaflight.com/docs/wiki/tuning/4-3-Tuning-Notes — most bounce-back is too much I on a low-authority quad; random end-of-flip wobbles from delayed motor start-up (low idle, over-propped, weak ESC start-up).
- UAV Tech — "How to FIX Bounceback": https://www.youtube.com/watch?v=23CAS_nlVbo — P-term bounce-back is rapid past setpoint, I-term bounce-back is much slower and visible in HD footage; adding D does not fix an I-term bounce-back.
- Chris Rosser — "Betaflight 4.5 PID Tuning": https://www.youtube.com/watch?v=1oYoVE4xu1U — in a fast move the quad lags the stick and the I-term can wind up and cause a bounce-back.
- Wikipedia — Integral windup: https://en.wikipedia.org/wiki/Integral_windup — the general mechanism in control theory.

## Scene 6 — lag and overshoot

- Oscar Liang — PID and filter tuning with Blackbox: https://oscarliang.com/pid-filter-tuning-blackbox/ — step response peak and latency; more D means less overshoot and more latency.
- EasyQuadTune — Overshoot vs droop: https://easyquadtune.vercel.app/guides/step-response-overshoot-vs-droop — the three shapes: overshoot and ring, a slow rise, and a plateau below the target; filter delay shows as a late rise.
- Chris Rosser — "Betaflight 4.5 PID Tuning": https://www.youtube.com/watch?v=1oYoVE4xu1U — use the step response to check PD balance; a good response reaches 1.0 quickly with just a hair of overshoot; too little feedforward shows as lag, too much as overshoot at the start and end of sharp moves.
- Oscar Liang — Blackbox basics: https://oscarliang.com/blackbox/ — lag points at feedforward or P, overshoot at D; gyro lagging with motors saturated means not enough torque.
- Wikipedia — Step response: https://en.wikipedia.org/wiki/Step_response — overshoot, ringing and settling time.
- PX4 — PID Tuning Guide: https://docs.px4.io/main/en/config_mc/pid_tuning_guide_multicopter — too little D gives overshoot after a step input.

## Scene 7 — twitch that follows the thumbs

- Betaflight wiki — Feed Forward 2.0: https://betaflight.com/docs/wiki/guides/current/Feed-Forward-2-0 — feedforward is proportional to stick rate of change; RC packets arrive as steps; dropped packets make the feedforward dip and then double-step.
- Chris Rosser — "BF 4.3 Tuning Guide Part 5: Feedforward!": https://www.youtube.com/watch?v=sNch1Kp414g — a change in setpoint produces a spike in feedforward; jitter reduction reduces feedforward when the sticks move slowly; gimbal jitter shows up in the RC command.
- Betaflight 4.3 Tuning Notes: https://betaflight.com/docs/wiki/tuning/4-3-Tuning-Notes — the feedforward-at-zero test and the wide-deadband RC test; random wobbles in HD footage point at a soft frame, unbalanced props or worn bearings.

## Scene 8 — shaking with throttle

- Betaflight wiki — PID Tuning Guide: https://betaflight.com/docs/wiki/guides/current/PID-Tuning-Guide — oscillations only at high throttle point at TPA.
- Betaflight wiki — Freestyle Tuning Principles: https://betaflight.com/docs/wiki/guides/current/Freestyle-Tuning-Principles — TPA reduces gains with throttle; TPA costs consistency; motors maxing out breaks consistency.
- Chris Rosser — "Betaflight 4.5 PID Tuning": https://www.youtube.com/watch?v=1oYoVE4xu1U — TPA reduces the gains as throttle rises to avoid high-throttle oscillations; set the breakpoint just below where they start.
- INAV — PID tuning: https://github.com/iNavFlight/inav/blob/master/docs/PID%20tuning.md — the same TPA behaviour in a second firmware.
- PX4 — PID Tuning Guide: https://docs.px4.io/main/en/config_mc/pid_tuning_guide_multicopter — thrust does not rise linearly with motor command, which is why hover-tuned gains can be too strong near full throttle.
- Oscar Liang — PID and filter tuning with Blackbox: https://oscarliang.com/pid-filter-tuning-blackbox/ and EasyQuadTune — Frame resonance or prop noise?: https://easyquadtune.vercel.app/guides/frame-resonance-vs-prop-noise — a fixed tone across throttle versus a ridge that tracks throttle.

## Scene 9 — when it really is hardware

- Joshua Bardwell — "Blackbox Log Analysis: ringo42 – Mechanical motor issue": https://www.youtube.com/watch?v=eSxh16qDBD8 — a failing motor, a loose prop or a bad bearing shows up as one motor running higher than the other three because it makes less thrust; the motor that is the odd one out is the problem; swap the suspect motor and see whether the problem follows it.
- EasyQuadTune — Frame resonance or prop noise?: https://easyquadtune.vercel.app/guides/frame-resonance-vs-prop-noise — a fixed tone, a raised noise floor, the one-change test, and filtering is not a repair.
- EasyQuadTune — Why does my quad wobble on hard stops?: https://easyquadtune.vercel.app/guides/quad-wobble-hard-stops — motors saturated is a thrust problem, not a gain problem.
- PX4 — Vibration Isolation: https://docs.px4.io/main/en/assembly/vibration_isolation — better to remove the source of vibration than to filter it out in software.
- ArduPilot — Measuring Vibration: https://ardupilot.org/copter/docs/common-measuring-vibration.html — bent blades and motor play as mechanical causes.

## Scene 10 — a log that can answer

- Chris Rosser — "Betaflight 4.5 Filter Tuning": https://www.youtube.com/watch?v=E3s5XYk3M74 — you only see frequencies up to half the logging sample rate.
- Betaflight wiki — Black Box logging and usage: https://betaflight.com/docs/wiki/guides/current/Black-Box-logging-and-usage — the lowest rate shows gross problems but not subtle vibration.
- EasyQuadTune — When a blackbox log cannot support a tune: https://easyquadtune.vercel.app/guides/blackbox-log-not-good-enough — a hover-only or short log cannot measure a tune.
- EasyQuadTune — home and sample report: https://easyquadtune.vercel.app/ and https://easyquadtune.vercel.app/sample-report — log quality verdict and missing manoeuvres.
- Oscar Liang — PID and filter tuning with Blackbox: https://oscarliang.com/pid-filter-tuning-blackbox/ — throttle sweeps; EasyQuadTune — Overshoot vs droop: https://easyquadtune.vercel.app/guides/step-response-overshoot-vs-droop — isolated flicks for a readable chart.
- EasyQuadTune — Why does my quad wobble on hard stops?: https://easyquadtune.vercel.app/guides/quad-wobble-hard-stops — one change at a time.

## Scene 11 — recap

- No new claims. The closing line is a summary of scenes 1–10; nothing is added that is not supported above.

## Also used for reference

- Betaflight Blackbox Explorer: https://github.com/betaflight/blackbox-log-viewer — the log viewer the analysis is done in.
- Betaflight wiki — Dynamic D: https://betaflight.com/docs/wiki/guides/current/Dynamic-D — D Max boosts damping in propwash and noisy builds push D up.
