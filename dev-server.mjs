import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';

// fileURLToPath is important on Windows. Using URL.pathname would produce
// paths such as /C:/Users/... which caused every request to return 404.
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const rootResolved = resolve(root);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url ?? '/', 'http://localhost');

    if (u.pathname.startsWith('/api/')) {
      res.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        error: 'Cloudflare API is not running in the static dev server. Frontend demo fallback remains active.'
      }));
    }

    const pathname = decodeURIComponent(u.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let file = resolve(rootResolved, relativePath);

    // Prevent directory traversal.
    if (file !== rootResolved && !file.startsWith(rootResolved + sep)) {
      throw new Error('Bad path');
    }

    try {
      const s = await stat(file);
      if (s.isDirectory()) file = join(file, 'index.html');
    } catch {
      // SPA fallback: routes such as /spieler/matscho63 use index.html.
      file = join(rootResolved, 'index.html');
    }

    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(data);
  } catch (error) {
    console.error(error);
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(4173, '0.0.0.0', () => {
  console.log('EPL dev server: http://localhost:4173');
});
