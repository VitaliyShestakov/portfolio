// Generate to .cache/cv; replacing the published CVs remains an explicit step.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { root } from './lib/site.mjs';
import { connect } from '../tests/browser.mjs';

const language = process.argv[2] ?? 'ru';
assert.ok(['ru', 'en'].includes(language), 'Usage: node scripts/export-cv.mjs ru|en');
execFileSync('python3', [resolve(root, 'content/cv/build_resume_en.py')], { stdio: 'inherit' });
const directory = resolve(root, '.cache/cv');
await mkdir(directory, { recursive: true });
const browser = await connect();
try {
  await browser.viewport(1000, 1300);
  await browser.navigate(pathToFileURL(resolve(directory, `Vitaliy-Shestakov-CV-${language.toUpperCase()}-photo.html`)).href);
  await browser.send('Emulation.setEmulatedMedia', { media: 'print' });
  const layout = await browser.evaluate(`(() => ({
    pages:[...document.querySelectorAll('.page')].map(page=>{
      const content=page.querySelector('.page-content').getBoundingClientRect(),footer=page.querySelector('.footer').getBoundingClientRect();
      return {clearance:footer.top-content.bottom,overflow:content.bottom>footer.top-10};
    }),
    portraitLoaded:document.querySelector('.portrait').complete && document.querySelector('.portrait').naturalWidth>0,
    links:document.querySelectorAll('a[href]').length,
    text:document.querySelector('main').innerText
  }))()`);
  assert.equal(layout.pages.length, 2, 'CV must have two pages');
  assert.ok(layout.pages.every(page => !page.overflow), 'CV content exceeds the page');
  assert.ok(layout.portraitLoaded, 'CV portrait failed to load');
  assert.deepEqual(browser.errors, [], 'CV browser errors');
  const pdf = await browser.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, generateTaggedPDF: true });
  const name = language === 'en' ? 'resume-en' : 'resume';
  await writeFile(resolve(directory, `${name}.pdf`), Buffer.from(pdf.data, 'base64'));
  await writeFile(resolve(directory, `${name}-layout.json`), JSON.stringify(layout, null, 2));
  console.log(`CV ready for review: ${resolve(directory, `${name}.pdf`)}`);
} finally { await browser.close(); }
