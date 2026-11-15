# Magic AI — everything to paste

Paste section 0 first, then one scene block at a time. Each scene block holds its own visual direction and its own narration, so it works whether your tool takes one long brief or one scene per generation.

---

## 0. Settings and master brief

Title: **6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem**

Format: 16:9, 1920×1080, 11 scenes in this order.

Style: every shot is a 3D animation. Realistic 3D models of a five-inch FPV quad, its motors, props, flight controller and frame, lit in a dark studio. Charts and logs are 3D data panels floating in the same space, drawn with thin lines and clear axis labels. Clean, technical, calm.

Hard rules:
- No people, no hands, no faces, no presenters, no avatars.
- No real footage, no screenshots, no logos, no source names, no URLs, no citations, no credits anywhere on screen.
- On-screen text is limited to the short words and labels quoted in each scene. One text block at a time, never two overlapping.
- Charts are illustrations, not real flight data. Axes carry real quantities and units.
- Narration is the voiceover below, spoken word for word, one scene per block. Do not add words, do not skip sentences.

---

## 1. Before you buy the part

Visual direction: 3D animation, six shots. A 5-inch quad drops past a tree silhouette and wobbles while air moves around the props. Close-up of a motor bell with faint heat shimmer, then a thin line that overshoots and returns after a roll. The word "BROKEN?" in oversized type with the quad passing over it. A wrench and a bent prop beside a settings slider, with a highlight moving from the wrench to the slider. A log panel building three traces labelled "SETPOINT", "GYRO" and "MOTORS". The title "6 SIGNS" with the quad and four small line icons.

Narration:
The quad wobbles as it drops behind a tree. The motors come down warm. After a fast roll, the nose swings back a little, as if it changed its mind. And the obvious thought arrives: something is broken. A motor, a bearing, maybe the flight controller itself.

Sometimes that is exactly right. A bent prop or a rough bearing will never be fixed by a number in a menu. But many symptoms that feel like failing hardware are something else: a control loop doing precisely what it was told to do, with settings that do not suit this aircraft, these props, or this way of flying.

With Blackbox logging switched on, the flight controller records what the sticks asked for, what the gyro measured, and what the motors were told to do. In this episode we go through six signs that a problem is more likely to be the tune than the hardware. For each one: what you feel, what it looks like in the log, why it points at tuning, and the honest counter-check that would send you back to the workbench instead.

---

## 2. Two lines and one rule

Visual direction: 3D animation, six shots. A chart panel draws its axes, roll rate in deg/s and time in s, and a setpoint line and a gyro line appear one at a time. The area between them fills in while a loop diagram stick → PID → motors → gyro pulses once per loop. The gyro line sits exactly on setpoint, then lags slightly behind it, while the airflow at the motors brightens. Three small charts in sequence: a gap that rings, a gap that lingers, a gap that only appears at some throttle positions, one highlighted at a time. Two columns of text, "FOLLOWS THE FLIGHT" with throttle, stick speed and move, against "FOLLOWS THE PART" with one frequency, one motor and changes on a swap. A checklist where screws, props and FC mount get ticked off, ending on the line "MECHANICS FIRST".

Narration:
Almost everything here comes down to two lines. Setpoint is the rotation rate your sticks are asking for. Gyro is the rotation rate the quad actually achieved. The difference between them is the error, and the PID controller exists to shrink that error, over and over, by changing motor speeds.

In a perfect world, the gyro line would sit exactly on top of the setpoint line. It cannot, because real motors need time to speed up and slow down. But the shape of the gap is full of information. A gap that rings, a gap that lingers, a gap that only appears at certain throttle positions. Each one tells a different story.

Keep one rule in mind. Tuning problems tend to follow the conditions of the flight: throttle, stick speed, the kind of move. Hardware problems tend to follow the hardware. They stay at one frequency, sit on one motor or one arm, and change when you swap a part. The rule is not perfect, but it runs through all six signs.

And before any of this, check the mechanics first. Tuning a quad that is physically damaged only hides the damage.

---

## 3. Sign one: wobble in your own wash

Visual direction: 3D animation, six shots. Title card "01 / 06" and "PROPWASH" with the quad and a small chart. The quad chops throttle and sinks through its own airflow with a small frame jitter, then an inset of one prop blade with reverse-flow arrows where the flow detaches and reattaches, and a thrust arrow jumping larger than the requested arrow. Setpoint and gyro lines with a throttle lane, a "stick stops" marker and a burst that starts in the disturbed air. A spectrum panel with the low band highlighted and labelled "below ~100 Hz (typical 5-inch)". Two prop silhouettes, one higher pitch and one lower pitch tagged "more forgiving", then a mechanism view where the D-term lights up, a filter-delay arrow lengthens and an RPM gauge holds a minimum floor. A counter-check card with icons for loose screws, cracked plate, rough bearing, loose bell and damaged prop, ending on "FIX THESE FIRST. THEN TUNE."

Narration:
Sign one. The quad wobbles when it falls through its own air.

You chop the throttle and drop behind an obstacle, or make a hard reversal, and for a moment the picture shakes. Then it settles as the quad flies out into clean air. That is propwash. The simple explanation is turbulence from the quad's own props. The fuller one is that in reverse airflow, the blades can stall, then suddenly regain their thrust as the motors speed up. The controller asks for a little more thrust, and gets far more than it expected.

In the log, look at the moments when throttle is low and the quad is descending or braking. The gyro shows a burst of oscillation that begins with the disturbed air and fades as the quad leaves it, not locked to the instant the stick stopped. In a spectrum, on a typical five-inch quad, it sits low, below about a hundred hertz, well under the band where motor and prop noise live.

This sign sits closest to the border. Prop choice matters a great deal: lower-pitch props are far more forgiving in reverse flow. But how well a given quad fights propwash also depends on its settings. The D-term is the part of the loop fast enough to respond. Filter delay matters too: the more the gyro signal is delayed, the later every correction arrives. And dynamic idle, which keeps the motors above a minimum RPM, helps keep the props out of that stalled region and ready to respond.

The counter-check. Propwash that suddenly gets worse, after a crash or on a quad that used to handle it well, deserves an inspection: loose screws, a cracked frame plate, rough bearings, a loose motor bell, damaged props. Fix those first. Then tune.

---

## 4. Sign two: hot motors on clean props

Visual direction: 3D animation, six shots. Title card "02 / 06" and "HOT MOTORS". Four motors spin down with heat shimmer on the bells while fresh, intact props sit in the light. A signal chain where gyro noise passes through filters and the D-term amplifies it into rapid motor commands, with the amplification step highlighted and the motor shimmering. A log with a thick fuzzy D-term band beside a clean gyro line, and jagged motor outputs while the attitude barely moves. A spectrogram where diagonal motor harmonics climb with throttle and thin notch markers ride on each line. A split view: "raw gyro noisy on defaults → look for a mechanical/electrical cause", and one motor alone marked hot with "check that motor, bearing, prop".

Narration:
Sign two. The motors come down hot, but the props are fresh and nothing looks wrong.

After a short flight, the motor bells are far warmer than they should be. Maybe there is a rough, grinding sound in a hover. Nothing is bent, nothing is loose, and still something is cooking the motors.

A common explanation is the D-term. D reacts to how fast the error is changing, which makes it very sensitive to high-frequency vibration. If too much noise gets through the filters, D turns that noise into rapid motor commands, faster than the motors can follow, and the effort ends up as heat.

In the log, a D-term that looks like a thick, fuzzy band even in calm cruise is a warning. So are motor outputs that stay busy and jagged while the quad is barely moving. The controller is reacting to vibration, not to flight. The spectrum shows where that noise lives. Motor and prop noise climbs with throttle, and an RPM filter is designed to follow it, placing notch filters on each motor's frequency and its harmonics.

Why tuning? Because the cause is a balance between gain and filtering. More D, or less filtering, lets more noise reach the motors. Both are settings, and both can be walked back.

The counter-check. If the raw gyro is already noisy with default filters, the answer is not more filtering, but a search for mechanical or electrical causes. And if only one motor runs hot, look at that motor, its bearing and its prop first. The tune is shared by all four. A fault that belongs to one of them is more likely to be in the part.

---

## 5. Sign three: bounce-back

Visual direction: 3D animation, six shots. Title card "03 / 06" and "BOUNCE-BACK". The quad completes a roll and makes a small reverse nod at the end, shown twice from a fixed camera. A zoom where the setpoint goes flat and the gyro rings through several fast cycles, labelled "P/D balance". One slow return through the target with the I-term trace still raised after the move, labelled "I-term windup". The I-term accumulating during a fast move and discharging in reverse, with an "I-term relax" gate clamping the accumulation. Random wobble at the end of a late flip, with icons for low idle, over-propped and weak ESC start-up, and motor bars pinned at their limit labelled "thrust limit".

Narration:
Sign three. The quad bounces back at the end of a flip or a roll.

You finish a fast roll and centre the stick, and the quad does not stop cleanly. It goes a little too far, then swings back. In the footage, it looks like a small nod at the end of every move.

In the log, zoom in where the setpoint goes flat. If the gyro rings, several fast cycles around the target, the loop is under-damped, and the balance between P and D is the place to look. If instead the gyro makes one slow return through the target, check the I-term trace. If I is still raised after the move has ended, you are looking at I-term windup.

The mechanism is called integrator windup. During a fast move, a quad that cannot keep up builds a large error, and I accumulates to correct it. When the flip stops, that stored I drives a movement in the reverse direction, which slowly fades away. I-term relax limits that accumulation during fast stick movement. On quads with low authority, too much I is the most common cause.

The counter-check has two parts. There is also a look-alike: random wobbles at the end of some flips, but not all, especially fast ones late in the flight. Those are often caused by delayed motor start-up: idle set too low, props that ask too much of the motors, or weak ESC start-up at low RPM. That is configuration and hardware matching, not a PID gain. And if the motors were already at their limits during the move, the controller had no authority left to stop it. That is a thrust limit, and no gain can fix it.

---

## 6. Sign four: gyro late, gyro past

Visual direction: 3D animation, six shots. Title card "04 / 06" and "LAG / OVERSHOOT". Two takes: the stick moves and the quad lags behind, then the quad snaps past the target. A step-response chart with axes response and time, drawing a slow rise. An overshoot peak with its ring circled, then a third variant that levels off below the target. A lever map where lag points to feedforward and P, overshoot points to D, too much D points to slow, and filter delay points to a late rise, one lever highlighted at a time. Motor bars hitting their limit while the gyro still falls short, labelled "physical ceiling: torque", then a card reading "step response per axis from your own log".

Narration:
Sign four. The quad feels late, or it overshoots every move.

Some pilots call it mushy, or disconnected: you move the stick, and the quad seems to think about it first. Others feel the opposite, a quad that snaps past the point where they wanted it to stop.

This is where the step response earns its place. Analysis tools estimate it from the log: an average picture of how the gyro follows a sudden change in setpoint. A response that rises slowly is lag. A peak that climbs well above the target and rings back is overshoot. One that levels off below the target and stays there is a different fault again: the integrator has not made up the difference.

Why tuning? Because each shape has a known lever. When the gyro lags behind setpoint, the usual levers are feedforward and P. When it overshoots, D is there to dampen it. But too much D can make the response slow, which pilots often describe as mushy. And filter delay shows up as a late rise. All of these are settings.

The counter-check is in the motor traces. If raising P or feedforward does not bring the gyro closer, and the motors are already at their limit, the quad has reached its physical ceiling. That usually points to motors without enough torque. That is a hardware answer, and the log is what lets you give it honestly.

EasyQuadTune reads the step response for each axis from your own log, and it says so when a chart is too weak to support a decision.

---

## 7. Sign five: a twitch that follows your thumbs

Visual direction: 3D animation, six shots. Title card "05 / 06" and "STICK TWITCH". Centred sticks with a calm horizon line, then a slow turn with fine jitter on the horizon. A timeline of RC packets as discrete steps, where one dropped packet makes the feedforward trace dip and then jump. Feedforward spikes aligned with stick movement, the same spikes visible again in the motor outputs. Two test cards in sequence, "FEEDFORWARD = 0 TEST FLIGHT" and "TEMPORARY WIDE DEADBAND TEST", with the arrow and the line "no change → not the cause". Close-ups of frame flex, an unbalanced prop and a worn bearing, ending on "twitch with sticks centred in calm air → hardware".

Narration:
Sign five. The quad twitches, but only while your thumbs are moving.

With the sticks centred, it is calm. But slow, gentle turns carry a fine, nervous jitter, or quick stick stabs produce brief shakes that look far too sharp for the input. It is tempting to blame the gyro, or a vibrating mount.

Feedforward responds to how fast the sticks are moving. That makes the quad feel immediate. It also means that a stick signal arriving in uneven steps can become a push on the motors. Radio commands arrive in packets, and dropped or uneven packets create sudden drops and jumps in the feedforward trace. Too much feedforward typically shows up as spikes in the motor traces with big stick steps, and as amplified shaking when the pilot is cold or nervous.

In the log, put the feedforward trace next to the stick input. Spikes that line up with stick movement, and carry into the motor outputs, point here. There is a clean test: fly once with feedforward at zero. If nothing changes, feedforward is not the problem. A temporary wide deadband does the same for the radio link. If that changes nothing, the link is not the cause.

The counter-check. Random wobbles in smooth cinematic footage usually come from a soft or flexy frame, slightly unbalanced props, or worn bearings. If the twitch is there with the sticks centred, in calm air, and the feedforward test makes no difference, go back to the hardware.

---

## 8. Sign six: shaking that arrives with throttle

Visual direction: 3D animation, six shots. Title card "06 / 06" and "HIGH THROTTLE". The quad cruises smooth, then a punch-out brightens the airflow and triggers a fast oscillation, and easing off calms it again. A log with a throttle lane where the oscillation only appears in the top throttle band, with the band highlighted. A thrust curve bending away from a straight reference near full throttle, then a gain multiplier that stays flat until a breakpoint and then slopes down. The same stick input producing a different response at two throttle levels. A spectrogram with a horizontal fixed line across throttle beside diagonal motor lines, with "Fixed frequency → check the frame", then a card reading "frequency view".

Narration:
Sign six. It flies beautifully, until you punch out.

At low and mid throttle, the quad is locked in. But on a long punch-out, or in fast forward flight, there is fast oscillation, or an audible flutter. Ease off, and it disappears.

In the log, the clue is the throttle trace. Mark the oscillation and check where the throttle was. If the shaking appears only above a certain throttle position, and the same moves at cruise are clean, the problem follows throttle.

Why tuning? Gains tuned around hover can be too strong near full throttle, where thrust no longer grows in a simple straight line with the motor command. Betaflight has a feature built for exactly this: TPA, throttle PID attenuation, which reduces gains as throttle rises past a breakpoint. A quad that flies fine at low and mid throttle, but oscillates only at high throttle, is the situation TPA was made for. The trade-off is consistency. The quad will respond a little differently at different throttle positions.

The counter-check. A frequency that stays fixed, wherever the throttle is, behaves like a structure, not a gain. Frames, arms, standoffs and mounts all have their own resonances. If a narrow peak sits at the same frequency from hover to full throttle, check the frame hardware before you change the tune. EasyQuadTune shows that frequency view from your log. Naming the physical cause still needs your hands on the quad.

---

## 9. When it really is hardware

Visual direction: 3D animation, six shots. Section card "HARDWARE". The quad with one motor and arm lit and marked with their own trace while the other arms stay clean. Three spectrum shapes side by side, a fixed tone, a raised floor and a clean one, highlighted one at a time. Four motor-output traces where one runs consistently higher, with icons for loose prop, rough bearing and failing motor and the line "less thrust → driven harder", then all bars pinned at the limit labelled "out of authority". A one-change test: a prop swap, screws tightened, and a suspect motor moved to another arm with the odd trace following the motor, then the peak disappearing in a before/after spectrum. The symptom fading on a chart like a mask while a small wear indicator on the part keeps growing.

Narration:
Now the other side, because a log is just as good at pointing at hardware.

A problem that stays on one motor, one arm, or one axis, while the tune is shared by all of them, points at the part. A narrow tone that holds its frequency while throttle changes behaves like a mechanical resonance. A raised noise floor across the whole spectrum, with no single peak, often comes from many small sources at once: damaged props, a hard-mounted flight controller, something rattling. Compare the motor outputs side by side, too. A motor with a loose prop, a rough bearing or a failing motor often has to be driven harder than the other three, because it is making less thrust. And motor outputs pinned at their limit mean the quad is out of authority. No gain can create thrust that is not there.

The simplest test is to change one mechanical thing, and fly the same moves again. Fit a known-good set of props. Tighten the arm and motor screws. Swap a suspect motor to another arm, and see whether the problem moves with it. If the peak moves or disappears, you have found something. If nothing changes, the cause is somewhere else.

A log also has limits. It cannot reliably judge a bearing from a single flight, and it cannot prove that a filter change helped without a before and after comparison: same props, same battery, same moves. That is why filtering is not a repair. A filter can stop the loop from amplifying a vibration. It cannot tighten a screw, or straighten a prop. Hide a mechanical fault behind heavier filtering, and the symptom goes quiet while the hardware keeps wearing.

---

## 10. A log that can answer

Visual direction: 3D animation, six shots. Section card "THE LOG" with a flat hover-only trace. High-rate and low-rate samples of the same vibration, where the low-rate samples miss it entirely. A flight-plan timeline in a grid: throttle sweeps → roll flicks → pitch flicks → chops and drops → punch-outs, with the current item highlighted. The rule cards "ONE CHANGE AT A TIME" and then "NEVER CHANGE PROPS AND TUNE TOGETHER", shown one at a time. A thermometer line icon on a motor bell after landing. A card reading "log quality and missing manoeuvres".

Narration:
None of this works if the log cannot answer the question. A hover-only log can tell you about noise, but it has no hard stop to measure. So fly with a purpose.

Log at a rate high enough to see vibration. A log can only show frequencies up to half its own sample rate, so the lowest logging rates show gross problems, but not subtle issues like vibration or tuning artifacts. Start with fresh, undamaged props. Fly a few slow throttle sweeps in clean air, so the spectrum can separate noise that follows RPM from noise that stays still. Then make isolated roll flicks and pitch flicks, one axis at a time, with a pause between them. Add a few throttle chops and drops for propwash, and a few full punch-outs.

Change one thing at a time, and log the same moves again. Never change the props and the tune on the same flight, or the next log cannot tell you which change did what. After every change, land and check motor temperature. A careful touch of the motor bells tells you things the log cannot.

And if you want a second opinion on the log itself, EasyQuadTune can tell you whether it is good enough to measure, and which manoeuvres are missing.

---

## 11. The right order

Visual direction: 3D animation, six shots. The recap "6 SIGNS" with six numbered cells appearing in order, the current number lit. All six cells slide into one column headed "FOLLOWS THE FLIGHT". The question card "FOLLOWS THE FLIGHT, OR FOLLOWS THE PART?". A four-step loop diagram: mechanics → log → one change → same moves. A log strip quietly scrolling beside the quad with the line "It is in the record". The end card "READ IT IN THE RIGHT ORDER." with the quad, then cut to black.

Narration:
Six signs. Wobble in your own wash. Hot motors on clean props. Bounce-back at the end of a move. A gyro that arrives late, or goes too far. A twitch that follows your thumbs. And shaking that arrives only with throttle.

None of them proves the hardware is fine. What they change is the order of the questions. Before you spend money, ask whether the problem follows the flight, or follows the part. Check the mechanics. Read the log. Change one thing, and fly the same moves again.

The quad has already recorded what happened. Very often, the answer to whether you need a new part or a new setting is in that record. You just have to read it in the right order.

---

## One-liner, if the tool asks for a short description

A calm technical explainer about six signs that a quad's problem is the tune and not the hardware, told through 3D animations of a five-inch quad and its Blackbox log.
