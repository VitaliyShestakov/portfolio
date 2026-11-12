import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './lib/site.mjs';

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
};
export function createSiteServer(directory) {
  return createServer(async (request, response) => {
    const fail = (code, message) => { response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(message); };
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return fail(405, 'Method not allowed'); }
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      // Exercise both root hosting and the repository's GitHub Pages prefix locally.
      if (pathname === '/portfolio') pathname = '/';
      else if (pathname.startsWith('/portfolio/')) pathname = pathname.slice('/portfolio'.length);
      const file = resolve(directory, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
      const local = relative(directory, file);
      if (local === '..' || local.startsWith(`..${sep}`) || local.split(sep).some(part => part.startsWith('.'))) return fail(404, 'Not found');
      const info = await stat(file);
      if (!info.isFile()) return fail(404, 'Not found');
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      if (request.method === 'HEAD') return response.end();
      createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch (error) {
      fail(error instanceof URIError ? 400 : 404, 'Not found');
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const directory = resolve(root, option('--dir', '.'));
  const port = Number(option('--port', process.env.PORT ?? '8000'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port');
  await stat(resolve(directory, 'index.html'));
  const server = createSiteServer(directory);
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/ (${directory})`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}
