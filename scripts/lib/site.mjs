import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, relative, resolve, sep } from 'node:path';
import vm from 'node:vm';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const runtimeScripts = ['theme.js', 'locales.js', 'script.js', 'experience.js', 'interactions.js'];
const extraFiles = ['.nojekyll', 'resume.pdf', 'resume-en.pdf', 'assets/Onest-OFL.txt', 'assets/apps/sources.json'];
const origin = 'https://portfolio.invalid/';

export async function readLocales(directory = root) {
  const context = { window: {} };
  vm.runInNewContext(await readFile(resolve(directory, 'locales.js'), 'utf8'), context);
  return context.window.PORTFOLIO_I18N;
}

export function references(source, file) {
  const links = [];
  if (extname(file) === '.html' || extname(file) === '.svg') {
    for (const match of source.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/g)) links.push(match[2]);
    for (const match of source.matchAll(/<script\b[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
      const collect = value => {
        if (typeof value === 'string' && value.startsWith('assets/')) links.push(value);
        else if (Array.isArray(value)) value.forEach(collect);
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
      };
      collect(JSON.parse(match[1]));
    }
  }
  if (extname(file) === '.css' || extname(file) === '.svg') {
    for (const match of source.matchAll(/url\(\s*['"]?([^\s'"\)]+)['"]?\s*\)/g)) links.push(match[1]);
  }
  return links.filter(link => link && !link.startsWith('#')).flatMap(link => {
    const url = new URL(link, new URL(file, origin));
    return url.origin === new URL(origin).origin ? [decodeURIComponent(url.pathname).slice(1)] : [];
  });
}

// The release follows actual page/CSS/gallery references, plus dynamic CV links.
export async function siteFiles(directory = root) {
  const pending = ['index.html', ...runtimeScripts, ...extraFiles];
  const files = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (files.has(file)) continue;
    const path = resolve(directory, file);
    const local = relative(directory, path);
    assert.ok(local && local !== '..' && !local.startsWith(`..${sep}`), `Reference escapes site: ${file}`);
    assert.ok((await stat(path)).isFile(), `Missing asset: ${file}`);
    files.add(file);
    if (['.html', '.css', '.svg'].includes(extname(file))) {
      pending.push(...references(await readFile(path, 'utf8'), file));
    }
  }
  return [...files].sort();
}

export async function checkSite(directory = root) {
  const files = await siteFiles(directory);
  const html = await readFile(resolve(directory, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML ids');
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Missing anchor #${match[1]}`);
  const locales = await readLocales(directory);
  assert.deepEqual(Object.keys(locales).sort(), ['en', 'ru']);
  assert.deepEqual(Object.keys(locales.en).sort(), Object.keys(locales.ru).sort(), 'RU/EN keys differ');
  for (const match of html.matchAll(/\bdata-i18n(?:-aria-label|-placeholder|-alt)?="([^"]+)"/g)) {
    for (const lang of ['ru', 'en']) assert.equal(typeof locales[lang][match[1]], 'string', `${lang}: missing ${match[1]}`);
  }
  for (const file of runtimeScripts) new vm.Script(await readFile(resolve(directory, file), 'utf8'), { filename: file });
  for (const file of ['resume.pdf', 'resume-en.pdf']) {
    const pdf = await readFile(resolve(directory, file));
    assert.ok(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')), `${file} is not a PDF`);
  }
  assert.ok(!/\b(?:src|href)="(?:v[123]\/|output\/|\.playwright\/)/.test(html), 'Development artifact in runtime HTML');
  return files;
}
