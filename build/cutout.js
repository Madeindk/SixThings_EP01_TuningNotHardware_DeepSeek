/* Renders the E-mode quad cut-out once, with a transparent background. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = path.join(__dirname, 'renderer', 'cutout.html');
const OUT = path.join(__dirname, 'renderer', 'assets', 'quad_cutout.png');

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(PAGE).href, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__cutoutDone === true', { timeout: 120000 });
await page.screenshot({ path: OUT, type: 'png', omitBackground: true });
await browser.close();
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes');
