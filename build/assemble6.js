/* Assembles the renderer6 clips into the episode and muxes the narration. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIPS = path.join(__dirname, 'clips6');
const OUTDIR = path.join(__dirname, 'out6');
const AUDIO = path.resolve(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'andrew', 'sixthings_ep01_p1_full.mp3');
const TIMING = path.resolve(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'sixthings_ep01_p1_timing.csv');
const FINAL = path.resolve(__dirname, '..', 'SixThings_EP01', 'EP01', 'out', 'SixThings_EP01_TuningNotHardware.mp4');

fs.mkdirSync(OUTDIR, { recursive: true });

const rows = fs.readFileSync(TIMING, 'utf8').trim().split(/\r?\n/);
const order = rows.slice(1).map((l) => l.split(',')[0].replace('P1-', ''));

const missing = order.filter((s) => !fs.existsSync(path.join(CLIPS, `${s}.mp4`)));
if (missing.length) {
  console.error('missing clips:', missing.join(', '));
  process.exit(1);
}

const listFile = path.join(__dirname, 'concat6.txt');
fs.writeFileSync(listFile, order.map((s) => `file 'clips6/${s}.mp4'`).join('\n') + '\n', 'utf8');

const silent = path.join(OUTDIR, 'video_silent.mp4');
let r = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', listFile,
  '-c', 'copy', silent,
], { stdio: 'inherit', cwd: __dirname });
if (r.status !== 0) process.exit(1);

const scratch = path.join(OUTDIR, 'muxed.mp4');
r = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-i', silent,
  '-i', AUDIO,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-shortest', '-movflags', '+faststart',
  scratch,
], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);

// One delivery encode: smaller file, no visible loss on flat graphics.
r = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-i', scratch,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-c:a', 'copy', '-movflags', '+faststart',
  FINAL,
], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);

console.log('wrote', FINAL, (fs.statSync(FINAL).size / 1048576).toFixed(1), 'MB');
