/* Renders one frame at an arbitrary absolute time, for visual review. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = path.join(__dirname, 'renderer', 'index.html');
const OUT = path.join(__dirname, 'preview');
const TIMING = path.join(__dirname, '..', 'SixThings_EP01', 'EP01', 'audio', 'sixthings_ep01_p1_timing.csv');

fs.mkdirSync(OUT, { recursive: true });

const rows = fs.readFileSync(TIMING, 'utf8').trim().split(/\r?\n/);
const head = rows[0].split(',');
const ix = (n) => head.indexOf(n);
const scenes = rows.slice(1).map((l) => {
  const c = l.split(',');
  return { scene: c[ix('scene')], duration: Number(c[ix('duration_s')]), start: Number(c[ix('start_s')]) };
});

// --shots "S01:2,S01:10,S01:20"  (scene:seconds-within-scene)
const spec = process.argv[2] || 'S01:2';
const shots = spec.split(',').map((s) => {
  const [sc, t] = s.split(':');
  return { sc: sc.trim().toUpperCase(), t: Number(t) };
});

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

for (const sh of shots) {
  const s = scenes.find((r) => r.scene.replace('P1-', '') === sh.sc);
  if (!s) { console.log('unknown scene', sh.sc); continue; }
  const beatCount = 6;
  const beatDur = s.duration / beatCount;
  const beatIndex = Math.min(5, Math.floor(sh.t / beatDur));
  const tLocal = Math.min(sh.t - beatIndex * beatDur, beatDur);
  await page.evaluate(async (sp) => { await window.renderFrame(sp); }, {
    scene: s.scene, beatIndex, tLocal, beatDur, sceneDur: s.duration, totalT: s.start + sh.t,
  });
  const name = path.join(OUT, `${sh.sc}_${String(sh.t).replace('.', 'p')}.png`);
  await page.screenshot({ path: name, type: 'png' });
  console.log('wrote', name);
}
await browser.close();
