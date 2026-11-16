# Third-party models used by the renderer

## EMAX RSII 2306 motor

`models/emax_rsii_2306.stl` — the motor used on the airframe in this episode.

- **Work:** "EMAX RSII 2306"
- **Author:** CK90
- **Source:** https://www.thingiverse.com/thing:3041414
- **Licence:** Creative Commons — Attribution
- **Modifications:** vertex normals recomputed; the mesh is scaled and instanced only,
  the geometry itself is unchanged.

Attribution for this asset must appear in the published video's description, never on
screen. See `../SixThings_EP01/EP01/RELEASE_DRAFTS.md` → Credits.

## Measured, not copied

The battery, ESC, AIO flight controller and receiver were supplied as STEP files. Their
geometry is **not** reproduced: only their external dimensions were measured from the STEP
coordinate lists, and the parts are modelled procedurally to those dimensions. Measured
envelopes:

| Part | Envelope (mm) |
|---|---|
| GNB 1100 mAh 4S | 87.4 × 32.9 × 48.8 (includes leads) |
| 20×20 ESC | 32.0 × 31.0 × 3.6 |
| 25.5×25.5 AIO flight controller | 30.0 × 29.0 × 7.3 |
| 2306 motor | 26.7 × 27.7 × 31.8 |
| Crossfire Nano RX | 112.2 × 41.7 × 24.2 (includes antennas) |
