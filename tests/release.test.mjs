import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRelease } from '../scripts/build.mjs';
import { createSiteServer } from '../scripts/serve.mjs';
import { checkSite, root } from '../scripts/lib/site.mjs';

let temporary, release, server, base;
before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'portfolio-release-test-'));
  release = await buildRelease(join(temporary, 'site'));
  server = createSiteServer(release.output);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});

test('release contains only the site and its actual asset dependencies', async () => {
  const files = (await readdir(release.output, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name));
  assert.equal(files.length, release.files.length);
  assert.ok(release.files.every(file => !/^(?:v[123]\/|output\/|content\/|scripts\/|tests\/|\.playwright\/|\.git\/)/.test(file)));
  await checkSite(release.output);
  for (const file of release.files) assert.deepEqual(await readFile(join(release.output, file)), await readFile(join(root, file)), `${file}: release changed source bytes`);
});

test('all public assets resolve under root hosting and the /portfolio/ prefix', async () => {
  for (const prefix of ['', '/portfolio']) {
    for (const file of release.files.filter(file => !file.startsWith('.'))) {
      const response = await fetch(`${base}${prefix}/${file}`);
      assert.equal(response.status, 200, `${prefix}/${file}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(join(release.output, file)));
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    }
    const page = await fetch(`${base}${prefix}/?lang=en#projects`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /^text\/html/);
  }
});

test('the preview serves useful MIME types, HEAD responses and genuine missing-file errors', async () => {
  for (const [file, type] of [['styles.css', 'text/css'], ['script.js', 'text/javascript'], ['assets/onest-latin.woff2', 'font/woff2'], ['resume-en.pdf', 'application/pdf']]) {
    const response = await fetch(`${base}/${file}`, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  for (const file of ['missing.js', 'v1/', 'v2/', 'v3/', 'tests/browser.mjs', '.git/config', '%ZZ']) {
    const response = await fetch(`${base}/${file}`);
    assert.ok([400, 404].includes(response.status), file);
  }
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
});
