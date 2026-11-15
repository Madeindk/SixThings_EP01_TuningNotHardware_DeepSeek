/* Assembles the episode: concatenates the per-scene clips and muxes the
 * narration.
 *
 * The clips are rendered on the absolute timeline already (each scene's clip
 * includes the 0.70 s of silence that follows it), so a plain concat reproduces
 * the full track's length exactly and stays in sync with the MP3.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIPS = path.join(__dirname, 'clips');
const OUTDIR = path.join(__dirname, 'out');
const AUDIO = path.resolve(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'andrew', 'sixthings_ep01_p1_full.mp3');
const TIMING = path.resolve(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'sixthings_ep01_p1_timing.csv');

fs.mkdirSync(OUTDIR, { recursive: true });

const rows = fs.readFileSync(TIMING, 'utf8').trim().split(/\r?\n/);
const scenes = rows.slice(1).map((l) => {
  const c = l.split(',');
  return { scene: c[0], duration: Number(c[3]), start: Number(c[5]) };
});

const order = scenes.map((s) => s.scene.replace('P1-', ''));
const missing = order.filter((s) => !fs.existsSync(path.join(CLIPS, `${s}.mp4`)));
if (missing.length) {
  console.error('missing clips:', missing.join(', '));
  process.exit(1);
}

const listFile = path.join(__dirname, 'concat.txt');
fs.writeFileSync(listFile, order.map((s) => `file 'clips/${s}.mp4'`).join('\n') + '\n', 'utf8');

const silent = path.join(OUTDIR, 'video_silent.mp4');
let r = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', listFile,
  '-c', 'copy', silent,
], { stdio: 'inherit', cwd: __dirname });
if (r.status !== 0) process.exit(1);

const final = path.join(OUTDIR, 'SixThings_EP01_TuningNotHardware.mp4');
r = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-i', silent,
  '-i', AUDIO,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
  '-shortest', '-movflags', '+faststart',
  final,
], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);

const mb = (fs.statSync(final).size / 1024 / 1024).toFixed(1);
console.log(`wrote ${final}  ${mb} MB`);
