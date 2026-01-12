'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = process.cwd();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize(path.posix.join('/', target));
  return path.join(base, targetPath);
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body);
  else res.end();
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': type });
  });
  stream.on('error', (err) => {
    if (err.code === 'ENOENT') return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/health') return send(res, 200, { 'Content-Type': 'text/plain; charset=utf-8' }, 'ok');

    if (pathname === '/') pathname = '/index.html';

    const fsPath = safeJoin(root, pathname);

    if (!fsPath.startsWith(root)) {
      return send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
    }

    fs.stat(fsPath, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
        return send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
      }
      if (stat.isDirectory()) {
        const indexFile = path.join(fsPath, 'index.html');
        fs.stat(indexFile, (err2, stat2) => {
          if (!err2 && stat2.isFile()) return serveFile(res, indexFile);
          return send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
        });
      } else {
        serveFile(res, fsPath);
      }
    });
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
  }
});

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';
server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
