/* Turn the existing Six Things quad renders into the plate library the
 * compositor cuts from.
 *
 * The airframe was already modelled, lit and rendered for this series, so this
 * does not build geometry: it takes the finished frames under G:\YT-arbejde and
 * produces one seekable clip per shot in build/plates, plus a manifest of what
 * each clip actually contains (frame count, duration).
 *
 * Clips are re-encoded with a one-second GOP so the compositor can seek to an
 * exact frame. Seeks inside a longer GOP decode the whole GOP, and the renderer
 * seeks on almost every frame of a 22-minute episode.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'plates');
const MANIFEST = path.join(OUT, 'manifest.json');
const FPS = 30;

/* Where the finished renders live. Override with --src to point at a copy. */
const argv = process.argv.slice(2);
const srcArg = argv.indexOf('--src');
const SRC = srcArg >= 0 ? argv[srcArg + 1] : 'G:\\YT-arbejde';

const SEQUENCES = ['SH02', 'SH03', 'SH04', 'SH08'];
const VIDEOS = [
  ['G:\\YT-arbejde\\v2_bibliotek\\3D_SH02_cold_open_drop_v2.mp4', 'drop'],
  ['G:\\YT-arbejde\\v2_bibliotek\\3D_SH03_motor_cu_v2.mp4', 'motorcu'],
];

/* Four stills from the finished set. They are the tightest framing in the whole
 * library — the airframe fills better than half the frame — and they are already
 * composed with the subject left of centre, which is where the HUD panel wants
 * it. They carry the hero and macro beats; the animated passes carry the wide
 * ones. */
const STILLS = [
  ['G:\\YT-arbejde\\v2\\final\\v2_hero_a.png', 'hero_a'],
  ['G:\\YT-arbejde\\v2\\final\\v2_hero_b.png', 'hero_b'],
  ['G:\\YT-arbejde\\v2\\final\\v2_propwash.png', 'propwash'],
  ['G:\\YT-arbejde\\v2\\final\\v2_bearings.png', 'bearings'],
];

/* Neither binary is taken from input and no shell is involved: the program name
 * is a literal at each call site and the arguments go in as an array, so nothing
 * here can be interpolated into a command line. */
function probe(file) {
  const out = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,nb_frames,duration,r_frame_rate',
    '-of', 'default=nw=1', file,
  ], { encoding: 'utf8' });
  if (out.status !== 0) {
    throw new Error(`ffprobe failed on ${file}: ${out.stderr?.slice(-300) || ''}`);
  }
  const text = out.stdout || '';
  // ffprobe's default writer prints one key=value pair per line, so the fields
  // are read straight out of a map rather than matched with a built pattern.
  const fields = {};
  for (const line of text.split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const get = (key) => fields[key] ?? null;
  const frames = Number(get('nb_frames')) || 0;
  return {
    width: Number(get('width')),
    height: Number(get('height')),
    frames,
    duration: Number(get('duration')) || frames / FPS,
  };
}

fs.mkdirSync(OUT, { recursive: true });

const manifest = { fps: FPS, generatedAt: new Date().toISOString(), clips: {} };

/* The frame sequences. Each becomes <id>.mp4 at 30 fps, CRF 18: visually
 * transparent on carbon, and small enough that the whole library is a few
 * hundred megabytes instead of the three gigabytes of PNGs. */
for (const id of SEQUENCES) {
  const dir = path.join(SRC, 'SixThings_EP01_F1', id);
  if (!fs.existsSync(dir)) {
    console.log(`${id}: source missing, skipped`);
    continue;
  }
  const frames = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort();
  if (!frames.length) {
    console.log(`${id}: no frames, skipped`);
    continue;
  }

  const out = path.join(OUT, `${id}.mp4`);
  const first = Number(/\d+/.exec(frames[0])[0]);
  const enc = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-start_number', String(first),
    '-i', path.join(dir, 'f_%04d.png'),
    '-frames:v', String(frames.length),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-g', String(FPS), '-keyint_min', String(FPS), '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    out,
  ], { encoding: 'utf8' });
  if (enc.status !== 0) throw new Error(`ffmpeg failed on ${id}: ${enc.stderr?.slice(-300) || ''}`);

  const p = probe(out);
  manifest.clips[id] = { ...p, source: path.relative(SRC, dir), kind: 'sequence' };
  console.log(`${id}: ${frames.length} frames -> ${(fs.statSync(out).size / 1048576).toFixed(1)} MB, ${p.duration.toFixed(2)} s`);
}

/* The two finished video passes. Re-encoded rather than remuxed so they share
 * the sequence clips' seek density. */
for (const [file, id] of VIDEOS) {
  if (!fs.existsSync(file)) {
    console.log(`${id}: source missing, skipped`);
    continue;
  }
  const out = path.join(OUT, `${id}.mp4`);
  const enc = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', file,
    '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-r', String(FPS),
    '-g', String(FPS), '-keyint_min', String(FPS), '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    out,
  ], { encoding: 'utf8' });
  if (enc.status !== 0) throw new Error(`ffmpeg failed on ${id}: ${enc.stderr?.slice(-300) || ''}`);

  const p = probe(out);
  manifest.clips[id] = { ...p, source: path.relative(SRC, file), kind: 'video' };
  console.log(`${id}: ${p.frames} frames -> ${(fs.statSync(out).size / 1048576).toFixed(1)} MB, ${p.duration.toFixed(2)} s`);
}

/* The stills are copied rather than re-encoded: a PNG has no generation loss and
 * the compositor can draw an image as easily as a video frame. */
const IMG = path.join(OUT, 'img');
fs.mkdirSync(IMG, { recursive: true });
for (const [file, id] of STILLS) {
  if (!fs.existsSync(file)) {
    console.log(`${id}: source missing, skipped`);
    continue;
  }
  const out = path.join(IMG, `${id}.png`);
  fs.copyFileSync(file, out);
  manifest.clips[id] = { kind: 'still', source: path.relative(SRC, file), file: `img/${id}.png` };
  console.log(`${id}: still -> ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\nmanifest: ${path.relative(process.cwd(), MANIFEST)}`);
console.log(`clips: ${Object.keys(manifest.clips).join(', ')}`);

