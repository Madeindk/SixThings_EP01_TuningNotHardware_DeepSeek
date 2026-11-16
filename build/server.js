/* Minimal static server for the renderer.
 *
 * The previous renderer had to inline fonts as data URIs because Chrome refuses
 * font fetches over file://. Serving the repo over http removes that whole class
 * of problem: ES modules, fonts and importmaps all behave exactly as they do in
 * a browser. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.csv': 'text/csv; charset=utf-8',
};

export function serve(port = 8731) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/build/renderer6/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('no'); return; }

    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404).end('missing: ' + p); return; }

      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';

      /* Range support: Chrome will not seek inside a video it cannot range-request,
       * and the compositor seeks every frame of every plate. */
      const range = req.headers.range;
      if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
        if (m) {
          let start = m[1] === '' ? st.size - Number(m[2]) : Number(m[1]);
          let end = m[1] === '' ? st.size - 1 : (m[2] === '' ? st.size - 1 : Number(m[2]));
          start = Math.max(0, Math.min(start, st.size - 1));
          end = Math.max(start, Math.min(end, st.size - 1));
          res.writeHead(206, {
            'Content-Type': type,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${st.size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
          });
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }

      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': st.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port })));
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  serve(Number(process.argv[2] || 8731)).then(({ port }) => console.log('serving on', port, 'root', ROOT));
}
