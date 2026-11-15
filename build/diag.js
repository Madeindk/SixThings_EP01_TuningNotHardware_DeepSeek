/* Diagnostics: are the bundled fonts actually loading, and do the E/F layers
 * have the geometry the style lock specifies? */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = path.join(__dirname, 'renderer', 'index.html');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('requestfailed', (r) => console.log('[reqfail]', r.url().slice(-70), r.failure()?.errorText));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

const info = await page.evaluate(() => {
  const f = (n) => document.fonts.check(n);
  return {
    bc900: f('900 100px BC'),
    bc800: f('800 100px BC'),
    it: f('500 40px IT'),
    jm: f('400 18px JM'),
    fontCount: document.fonts.size,
    loaded: [...document.fonts].map((x) => `${x.family} ${x.weight} ${x.status}`),
  };
});
console.log(JSON.stringify(info, null, 2));

// render an E sign card and inspect geometry
const geo = await page.evaluate(async () => {
  await window.renderFrame({ scene: 'P1-S03', beatIndex: 0, tLocal: 3, beatDur: 16, sceneDur: 97, totalT: 3 });
  const r = (id) => {
    const e = document.getElementById(id);
    const b = e.getBoundingClientRect();
    return { id, display: getComputedStyle(e).display, w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y) };
  };
  const disp = document.getElementById('display');
  return {
    stageE: getComputedStyle(document.getElementById('stageE')).display,
    counter: r('counter'), display: r('display'), quad: r('quadcut'), label: r('label'), mini: r('mini'),
    displayFont: getComputedStyle(disp).fontFamily,
    displaySize: getComputedStyle(disp).fontSize,
    displayText: disp.textContent,
  };
});
console.log(JSON.stringify(geo, null, 2));

// F frame: measure how many bright pixels the HUD panel has
await page.evaluate(async () => {
  await window.renderFrame({ scene: 'P1-S01', beatIndex: 4, tLocal: 4, beatDur: 8.2, sceneDur: 49.5, totalT: 36 });
});
const f = await page.evaluate(() => {
  const p = document.getElementById('panel');
  const b = p.getBoundingClientRect();
  const cnv = document.getElementById('gl');
  return { panel: { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y) }, inner: p.innerHTML.length, canvas: { w: cnv.width, h: cnv.height } };
});
console.log(JSON.stringify(f, null, 2));

await browser.close();
