// Simple static file server for IRS app
// Usage: node server.js [port]
// Serves from current directory; supports SPA fallback to index.html for root

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8',
  '.md': 'text/markdown; charset=UTF-8',
  '.java': 'text/plain; charset=UTF-8'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=UTF-8' });
  res.end(body);
}

function safeJoin(base, target) {
  const p = path.resolve(base, target.replace(/\0/g, ''));
  if (!p.startsWith(base)) return null; // path traversal protection
  return p;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = safeJoin(ROOT, rel.slice(1));
  if (!filePath) return send(res, 400, 'Bad request');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Minimal SPA fallback: if not found and request looks like a top-level path -> serve index.html
      if (!path.extname(rel)) {
        const fallback = path.join(ROOT, 'index.html');
        fs.readFile(fallback, 'utf8', (e2, html) => {
          if (e2) return send(res, 404, 'Not found');
          return send(res, 200, html, 'text/html; charset=UTF-8');
        });
        return;
      }
      return send(res, 404, 'Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    // Stream for efficiency
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': type });
    stream.pipe(res);
    stream.on('error', () => { send(res, 500, 'Server error'); });
  });
});

server.listen(PORT, () => {
  console.log(`IRS static server running at http://localhost:${PORT}`);
});
