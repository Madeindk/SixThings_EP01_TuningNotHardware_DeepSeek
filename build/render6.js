/* Frame driver for the renderer6 build.
 *
 * Same timeline contract as build/render.js: frame f maps to t = f / fps on the
 * ABSOLUTE episode timeline, so picture and narration share one clock. Scenes are
 * rendered in order, encoded to a clip, and the PNGs are deleted unless --keep.
 *
 * The renderer is served over http (build/server.js) because Chrome refuses font
 * fetches over file://.
 *
 *   node render6.js --fps 30 --encode
 *   node render6.js --only S03 --fps 30 --encode
 *   node render6.js --only S03 --probe
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { serve } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES = path.join(__dirname, 'frames6');
const CLIPS = path.join(__dirname, 'clips6');
const TIMING = path.join(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'sixthings_ep01_p1_timing.csv');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const FPS = Number(args.fps || 30);
const SCENE_GAP = 0.70;

const rows = fs.readFileSync(TIMING, 'utf8').trim().split(/\r?\n/);
const head = rows[0].split(',');
const ix = (n) => head.indexOf(n);
const timing = rows.slice(1).map((l) => {
  const c = l.split(',');
  return { scene: c[ix('scene')], duration: Number(c[ix('duration_s')]), start: Number(c[ix('start_s')]) };
});

const last = timing[timing.length - 1];
const TOTAL = last.start + last.duration;
const TOTAL_FRAMES = Math.round(TOTAL * FPS);

const scenes = timing.map((r, i) => {
  const f0 = Math.round(r.start * FPS);
  const f1 = i === timing.length - 1 ? TOTAL_FRAMES : Math.round((r.start + r.duration + SCENE_GAP) * FPS);
  return { ...r, f0, f1, short: r.scene.replace('P1-', '') };
});

let todo = scenes;
if (args.only) {
  const want = String(args.only).split(',').map((s) => s.trim().toUpperCase());
  todo = scenes.filter((s) => want.includes(s.short));
}

console.log(`timeline ${TOTAL.toFixed(3)} s  fps ${FPS}  frames ${TOTAL_FRAMES}`);

const { server, port } = await serve(Number(args.port || 8811));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--disable-dev-shm-usage',
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
  ],
});

const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/build/renderer6/index.html`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 180000 });

let done = 0;
let skipped = 0;
const t0 = Date.now();
const allIssues = [];

for (const s of todo) {
  const dir = path.join(FRAMES, s.short);
  fs.mkdirSync(dir, { recursive: true });

  let idx = 0;
  for (let f = s.f0; f < s.f1; f++) {
    const name = path.join(dir, `f${String(f).padStart(6, '0')}.png`);
    idx++;
    if (fs.existsSync(name) && fs.statSync(name).size > 2000) { skipped++; continue; }
    if (args.probe && idx > 6) break;

    const tAbs = f / FPS;
    const tScene = Math.min(Math.max(0, tAbs - s.start), s.duration);
    const beatIndex = Math.min(5, Math.floor((tScene / s.duration) * 6));
    const beatDur = s.duration / 6;
    const tLocal = Math.min(tScene - beatIndex * beatDur, beatDur);

    const issues = await page.evaluate(async (spec) => {
      window.__issues.length = 0;
      await window.renderFrame(spec);
      return window.__issues.slice();
    }, { scene: s.scene, beatIndex, tLocal, beatDur, sceneDur: s.duration, totalT: tAbs });

    if (issues.length) allIssues.push([`${s.short}@${tAbs.toFixed(2)}`, issues]);

    await page.screenshot({ path: name, type: 'png', optimizeForSpeed: true });
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      const rate = done / el;
      console.log(`  ${s.short} ${idx} frames  ${rate.toFixed(1)} fps  eta ${((s.f1 - f) / rate / 60).toFixed(1)} min`);
    }
  }

  console.log(`  ${s.short} done  ${s.f1 - s.f0} frames`);
  if (args.probe) break;

  if (args.encode !== false && !args.probe) {
    fs.mkdirSync(CLIPS, { recursive: true });
    const out = path.join(CLIPS, `${s.short}.mp4`);
    const r = spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(FPS),
      '-start_number', String(s.f0),
      '-i', path.join(dir, 'f%06d.png'),
      '-frames:v', String(s.f1 - s.f0),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      out,
    ], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`ffmpeg failed for ${s.short}`);
    console.log(`  ${s.short} clip  ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
    if (!args.keep) {
      for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
      fs.rmdirSync(dir);
    }
  }
}

await browser.close();
server.close();

const el = (Date.now() - t0) / 1000;
console.log(`rendered ${done} new, skipped ${skipped} existing, ${el.toFixed(0)} s`);
if (allIssues.length) {
  const flat = allIssues.flatMap(([where, list]) => list.map((s) => `${where} ${s}`));
  console.log(`\nLAYOUT AUDIT: ${flat.length} issue(s)`);
  console.log(flat.slice(0, 40).join('\n'));
  fs.writeFileSync(path.join(__dirname, 'layout-issues.txt'), flat.join('\n'), 'utf8');
} else {
  console.log('\nLAYOUT AUDIT: clean');
}
