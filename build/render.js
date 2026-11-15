/* Frame driver for 6 Things EP01.
 *
 * Renders on the ABSOLUTE episode timeline, not per scene: frame f maps to
 * t = f / fps, and the timing CSV says which scene that t belongs to. Scene
 * gaps (0.70 s of silence in the audio) hold the outgoing scene's last state,
 * so the picture and the full MP3 stay locked together with no drift and no
 * black flashes.
 *
 * Resumable: existing PNGs are skipped, so a crash costs one frame.
 *
 *   node render.js --fps 30                 render every scene
 *   node render.js --only S01 --probe       render 8 sample frames and stop
 *   node render.js --only S01,S02 --fps 30  render a subset
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RENDERER = path.join(__dirname, 'renderer', 'index.html');
const FRAMES = path.join(__dirname, 'frames');
const TIMING = path.join(ROOT, 'SixThings_EP01', 'EP01', 'audio', 'sixthings_ep01_p1_timing.csv');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const FPS = Number(args.fps || 30);
const SCENE_GAP = 0.70;

function readTiming() {
  const rows = fs.readFileSync(TIMING, 'utf8').trim().split(/\r?\n/);
  const head = rows[0].split(',');
  const ix = (n) => head.indexOf(n);
  return rows.slice(1).map((line) => {
    const c = line.split(',');
    return {
      scene: c[ix('scene')],
      duration: Number(c[ix('duration_s')]),
      start: Number(c[ix('start_s')]),
    };
  });
}

function plan(rows, fps) {
  const last = rows[rows.length - 1];
  const total = last.start + last.duration;
  const totalFrames = Math.round(total * fps);
  const scenes = rows.map((r, i) => {
    const f0 = Math.round(r.start * fps);
    const f1 = i === rows.length - 1 ? totalFrames : Math.round((r.start + r.duration + SCENE_GAP) * fps);
    return { ...r, f0, f1, short: r.scene.replace('P1-', '') };
  });
  return { scenes, total, totalFrames };
}

async function main() {
  const rows = readTiming();
  const { scenes, total, totalFrames } = plan(rows, FPS);
  console.log(`timeline ${total.toFixed(3)} s  fps ${FPS}  frames ${totalFrames}`);

  let todo = scenes;
  if (args.only) {
    const want = String(args.only).split(',').map((s) => s.trim().toUpperCase());
    todo = scenes.filter((s) => want.includes(s.short));
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--allow-file-access-from-files',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--disable-dev-shm-usage',
      '--force-device-scale-factor=1',
      '--font-render-hinting=none',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const url = pathToFileURL(RENDERER).href;
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);

  let done = 0, skipped = 0;
  const t0 = Date.now();

  for (const s of todo) {
    const dir = path.join(FRAMES, s.short);
    fs.mkdirSync(dir, { recursive: true });
    const beatCount = 6;

    let idx = 0;
    for (let f = s.f0; f < s.f1; f++) {
      const name = path.join(dir, `f${String(f).padStart(6, '0')}.png`);
      idx++;
      if (fs.existsSync(name) && fs.statSync(name).size > 2000) { skipped++; continue; }
      if (args.probe && idx > 8) break;

      const tAbs = f / FPS;
      let tScene = tAbs - s.start;
      tScene = Math.min(Math.max(0, tScene), s.duration);
      const frac = tScene / s.duration;
      let beatIndex = Math.min(beatCount - 1, Math.floor(frac * beatCount));
      const beatStart = (beatIndex / beatCount) * s.duration;
      const beatDur = s.duration / beatCount;
      const tLocal = Math.min(tScene - beatStart, beatDur);

      await page.evaluate(async (spec) => {
        await window.renderFrame(spec);
      }, {
        scene: s.scene,
        beatIndex,
        tLocal,
        beatDur,
        sceneDur: s.duration,
        totalT: tAbs,
      });

      await page.screenshot({ path: name, type: 'png', optimizeForSpeed: true });
      done++;
      if (done % 40 === 0) {
        const el = (Date.now() - t0) / 1000;
        const rate = done / el;
        const left = (s.f1 - f) / rate;
        process.stdout.write(
          `  ${s.short} frame ${idx}  ${rate.toFixed(1)} fps  eta ${(left / 60).toFixed(1)} min\n`
        );
      }
    }
    console.log(`  ${s.short} done  ${s.f1 - s.f0} frames  (${((s.f1 - s.f0) / FPS).toFixed(2)} s)`);

    if (args.encode && !args.probe) {
      const clips = path.join(__dirname, 'clips');
      fs.mkdirSync(clips, { recursive: true });
      const out = path.join(clips, `${s.short}.mp4`);
      const r = spawnSync('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', String(FPS),
        '-start_number', String(s.f0),
        '-i', path.join(dir, 'f%06d.png'),
        '-frames:v', String(s.f1 - s.f0),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        out,
      ], { stdio: 'inherit' });
      if (r.status !== 0) throw new Error(`ffmpeg failed for ${s.short}`);
      const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
      console.log(`  ${s.short} clip  ${out}  ${mb} MB`);
      if (!args.keep) {
        for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
        fs.rmdirSync(dir);
      }
    }
    if (args.probe) break;
  }

  await browser.close();
  const el = (Date.now() - t0) / 1000;
  console.log(`rendered ${done} new, skipped ${skipped} existing, ${el.toFixed(0)} s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
