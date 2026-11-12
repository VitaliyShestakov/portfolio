import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(join(root,path),'utf8');
const html=await read('index.html');
const context={window:{}};
vm.runInNewContext(await read('locales.js'),context);
const approved=JSON.parse(await read('tests/fixtures/projects.json'));
const apps=JSON.parse(html.match(/<script id="app-screens" type="application\/json">([\s\S]*?)<\/script>/)?.[1]??'null');
const sources=JSON.parse(await read('assets/apps/sources.json'));
const ids={terra:'com.club.terra',citadel:'one.citadel.mobile',tayyab:'co.tayyab.app',beauty:'com.beautyagent',otis:'kz.otisdevteam.otis_security'};
const apple={
  terra:'https://apps.apple.com/ru/app/terra-core/id6467891028',
  citadel:'https://apps.apple.com/app/citadel-one/id1546701475',
  tayyab:'https://apps.apple.com/kz/app/tayyab/id1562092088',
  beauty:'https://apps.apple.com/ru/app/beauty-agent-%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D1%8C-%D0%BA%D0%BB%D0%B8%D0%B5%D0%BD%D1%82%D0%BE%D0%B2/id1451215026',
  otis:'https://apps.apple.com/ru/app/otis-security/id6443658534'
};
assert.equal(Object.keys(apps).length,5);
for(const [key,id] of Object.entries(ids)) {
  const card=html.match(new RegExp(`<article\\b[^>]*\\bid="project-${key}"[^>]*>([\\s\\S]*?)</article>`))?.[1];
  assert.ok(card,`Missing ${key} card`);
  assert.equal((card.match(/class="store-visual-image store-visual-image-/g)??[]).length,2,`${key}: exactly two screenshots in the cover`);
  assert.equal((card.match(/class="store-visual"/g)??[]).length,1,`${key}: one composed cover`);
  assert.equal((card.match(/class="store-visual-media"/g)??[]).length,1,`${key}: one bounded visual region`);
  assert.ok(card.includes('class="store-visual-image store-visual-image-front"') && card.includes('class="store-visual-image store-visual-image-back"'));
  const previews=[...card.matchAll(/class="store-visual-image store-visual-image-(?:front|back)">\s*<img src="([^"]+)"/g)].map(match=>match[1]);
  for(const preview of previews) {
    assert.ok(sources.previews.files[key].includes(preview),`${key}: missing preview provenance`);
    const svg=await read(preview);
    assert.ok(svg.includes('viewBox="0 0 414 900"'),`${preview}: consistent phone canvas`);
    assert.ok(!/<image\b/.test(svg),`${preview}: no embedded store poster`);
  }
  assert.ok(!card.includes('store-visual-source'),`${key}: no store attribution over cover`);
  assert.ok(card.includes(`https://play.google.com/store/apps/details?id=${id}`));
  if(apple[key]) assert.ok(card.includes(apple[key]),`${key}: App Store link missing`);
  else assert.ok(!card.includes('apps.apple.com') && card.includes('<span>Android</span>'),`${key}: Android only`);
  assert.equal(apps[key].store,`https://play.google.com/store/apps/details?id=${id}`);
  assert.ok(apps[key].screens.length>=3);
  for(const screen of apps[key].screens) {
    assert.ok(screen.src.startsWith(`assets/apps/${key}-`));
    assert.ok((await stat(join(root,screen.src))).size>1000,`Missing ${screen.src}`);
    assert.ok(sources.apps[key].files.some(file=>file.file===screen.src && /^https:\/\/(play-lh\.googleusercontent\.com|is1-ssl\.mzstatic\.com)\//.test(file.source)));
  }
  for(const lang of ['ru','en']) {
    const locale=context.window.PORTFOLIO_I18N[lang];
    assert.equal(locale[`project.${key}.description`],approved[lang][`project.${key}.description`],`${lang} ${key} description changed`);
    for(const screen of apps[key].screens) assert.ok(locale[screen.alt],`${lang} ${screen.alt} missing`);
    for(const part of ['eyebrow','title','detail']) assert.ok(locale[`cover.${key}.${part}`]);
  }
}
console.log('10 vector phone previews, original sourced gallery images, store links and unchanged RU/EN project descriptions verified.');
