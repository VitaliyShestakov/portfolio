/* Run with a local preview server and an isolated Chrome debug instance. */
import assert from 'node:assert/strict';
import { mkdir, writeFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect } from './browser.mjs';

const base = (process.env.PORTFOLIO_BASE_URL ?? 'http://127.0.0.1:8765').replace(/\/$/, '');
const url = path => new URL(base).pathname.endsWith('/portfolio') && path.startsWith('/portfolio/')
  ? `${base}${path.slice('/portfolio'.length)}`
  : `${base}${path}`;
const browser = await connect();
await browser.send('Network.enable');
await browser.send('Network.clearBrowserCache');
await browser.send('Page.bringToFront');
const report = { layouts: [], stageLayouts: [], checks: [] };
await mkdir('.playwright', { recursive: true });
const evaluate = expression => browser.evaluate(expression);
const check = (condition, label) => { assert.ok(condition, label); report.checks.push(label); };
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const themeSurfaceMetrics = `(() => {
  const context=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
  const rgb=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].slice(0,3).map(c=>c/255)};
  const luminance=channels=>channels.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const style=selector=>getComputedStyle(document.querySelector(selector));
  const app=style('.demo-app'),button=style('.hero-buttons .button-primary'),preview=style('.mobile-showcase');
  const screenBackdrops=[rgb(app.backgroundColor),rgb(preview.getPropertyValue('--preview-glow'))];
  const screenContrast=Math.min(...['.preview-intro h3','.preview-intro p','.preview-step-copy strong','.preview-step-copy > span'].flatMap(selector=>screenBackdrops.map(bg=>contrast(rgb(style(selector).color),bg))));
  const covers=[...document.querySelectorAll('.store-visual')].map(cover=>{
    const css=getComputedStyle(cover),backdrops=[...css.backgroundImage.matchAll(/rgba?\\([^)]+\\)/g)].map(match=>rgb(match[0]));
    const glow=rgb(css.getPropertyValue('--cover-glow')),strength=parseFloat(css.getPropertyValue('--cover-glow-strength'))/100;
    const worstBackdrops=backdrops.flatMap(bg=>[bg,bg.map((c,i)=>c*(1-strength)+glow[i]*strength)]);
    const textContrast=Math.min(...['.store-visual-brand','.store-visual-eyebrow','.store-visual-title','.store-visual-detail'].flatMap(selector=>worstBackdrops.map(bg=>contrast(rgb(getComputedStyle(cover.querySelector(selector)).color),bg))));
    return {id:cover.closest('.project-card').id,luminance:backdrops.map(luminance),textContrast};
  });
  return {theme:document.documentElement.dataset.theme,platform:document.querySelector('.mobile-showcase').dataset.os,screenLuminance:luminance(rgb(app.backgroundColor)),buttonLuminance:luminance(rgb(button.backgroundColor)),buttonContrast:contrast(rgb(button.color),rgb(button.backgroundColor)),screenContrast,covers};
})()`;
async function verifyThemeSurfaces(label) {
  const result=await evaluate(themeSurfaceMetrics);
  const light=result.theme==='light';
  assert.ok(light ? result.screenLuminance>.8 : result.screenLuminance<.08, `${label}: platform screen does not match the theme`);
  assert.ok(!light || result.buttonLuminance>.75, `${label}: CV button uses a dark fill in light mode`);
  assert.ok(result.buttonContrast>=4.5 && result.screenContrast>=4.5, `${label}: button/screen text contrast ${JSON.stringify(result)}`);
  for(const cover of result.covers) {
    assert.ok(cover.luminance.length===2 && cover.luminance.every(value=>light ? value>.75 : value<.08), `${label}: ${cover.id} background does not match the theme`);
    assert.ok(cover.textContrast>=4.5, `${label}: ${cover.id} text contrast ${cover.textContrast}`);
  }
  (report.themeSurfaces ??= []).push({label,...result});
  report.checks.push(`Platform, CV button and project covers match their theme with readable text: ${label}`);
}
async function verifyContactDownload(lang) {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-cv-download-'));
  try {
    await browser.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: directory });
    await click('.contact-cv');
    const name = `Vitaliy-Shestakov-CV-${lang.toUpperCase()}.pdf`;
    let downloaded;
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      try { downloaded = await readFile(join(directory, name)); break; } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.ok(downloaded, `${lang}: CV download did not complete`);
    assert.deepEqual(downloaded, await readFile(new URL(lang === 'en' ? '../resume-en.pdf' : '../resume.pdf', import.meta.url)), `${lang}: wrong PDF downloaded`);
    report.checks.push(`${lang.toUpperCase()} contact CV downloads the correct file bytes and localized filename`);
  } finally {
    await browser.send('Browser.setDownloadBehavior', { behavior: 'default' });
    await rm(directory, { recursive: true, force: true });
  }
}
async function eventually(expression, timeout = 1500) {
  const end = Date.now() + timeout;
  do {
    if (await evaluate(expression)) return true;
    await new Promise(resolve => setTimeout(resolve,25));
  } while(Date.now() < end);
  return false;
}
async function key(key, options = {}) {
  const virtualKey = ({Escape:27,Tab:9,Enter:13,ArrowDown:40,ArrowUp:38})[key] ?? key.toUpperCase().charCodeAt(0);
  const event = { key, windowsVirtualKeyCode: virtualKey, ...options };
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', ...event });
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
  // Native dialog close/focus events are queued until the next animation frame.
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
}
async function fresh(path = '/?lang=ru', theme = 'dark', width = 1440, height = 1000) {
  await browser.viewport(width, height);
  await browser.media(theme);
  await browser.navigate(url(path));
  await evaluate('localStorage.clear()');
  await browser.navigate(url(path));
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
}
const metrics = `(() => {
 const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
 const candidates = [...document.querySelectorAll('h1,h2,h3,p,.header-inner,.hero-buttons,.footer,.case-category,.contact-links>a,.achievement-value,.achievement-label,.contact-cv-copy strong,.contact-cv-format,.contact-channel-copy strong')];
 const clipped = candidates.filter(el => visible(el) && !el.matches('.sr-only') && !el.closest('.case-art,.mobile-showcase,dialog') && el.scrollWidth > el.clientWidth + 2).map(el => ({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,80),client:el.clientWidth,scroll:el.scrollWidth}));
 const header = ['.brand','.section-nav','.header-actions'].map(sel => document.querySelector('.header '+sel).getBoundingClientRect().toJSON());
 const showcase = document.querySelector('.mobile-showcase').getBoundingClientRect();
 const device = document.querySelector('.device-depth').getBoundingClientRect();
 const picker = document.querySelector('.platform-picker').getBoundingClientRect();
 const location = document.querySelector('.hero-location').getBoundingClientRect();
 const availability = document.querySelector('.hero-availability').getBoundingClientRect();
 const overlap = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 const app = document.querySelector('.demo-app').getBoundingClientRect();
 const previewProblems = [...document.querySelectorAll('.preview-intro,.preview-steps,.preview-steps li,.preview-step-art,.preview-step-copy,.preview-step-copy strong,.preview-step-copy > span')].filter(el => visible(el)).filter(el => {
   const rect=el.getBoundingClientRect();
   return el.scrollWidth>el.clientWidth+2 || el.scrollHeight>el.clientHeight+2 || rect.left<app.left-3 || rect.right>app.right+3 || rect.top<app.top-3 || rect.bottom>app.bottom+3;
 }).map(el=>el.className||el.tagName);
 const coverProblems = [...document.querySelectorAll('.project-card')].flatMap(card => {
   const box = selector => card.querySelector(selector).getBoundingClientRect();
   const title = card.querySelector('.store-visual-title');
   const media = box('.store-visual-media');
   const phones = [...card.querySelectorAll('.store-visual-image')];
   return [
     overlap(box('.store-visual-copy'),box('.store-visual-media')) && card.id+' copy/media',
     !overlap(box('.store-visual-image-front'),box('.store-visual-image-back')) && card.id+' missing screen overlap',
     ...phones.filter(phone => { const r=phone.getBoundingClientRect(); const image=phone.querySelector('img'); return r.left<media.left-3 || r.right>media.right+3 || r.top<media.top-3 || r.bottom>media.bottom+3 || getComputedStyle(image).objectFit!=='contain'; }).map(()=>card.id+' phone clipped'),
     title.scrollWidth > title.clientWidth+2 && card.id+' title'
   ].filter(Boolean);
 });
 const contactAligned = innerWidth<=900 || Math.abs(document.querySelector('.contact-cv').getBoundingClientRect().bottom-document.querySelector('.contact-channel:last-child').getBoundingClientRect().bottom)<1;
 const contactProblems = [...document.querySelectorAll('.contact-channel,.contact-cv')].filter(link => {
   const box=link.getBoundingClientRect();
   return box.height<44 || [...link.children].some(child=>{const r=child.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1});
 }).map(link=>link.className);
 const missing = [...document.querySelectorAll('[data-i18n],[data-i18n-aria-label],[data-i18n-placeholder]')].flatMap(el => Object.entries(el.dataset).filter(([key]) => key.startsWith('i18n')).filter(([,key]) => !Object.hasOwn(window.PORTFOLIO_I18N[document.documentElement.lang],key)).map(([,key])=>key));
 return { width:innerWidth, scroll:document.documentElement.scrollWidth, clipped, previewProblems, coverProblems, contactProblems, contactAligned, headerOverlap:overlap(header[0],header[1])||overlap(header[0],header[2])||overlap(header[1],header[2]), locationStacked:location.top >= availability.bottom+5 && Math.abs(location.left-availability.left)<2, device:{left:device.left,right:device.right,top:device.top,pickerBottom:picker.bottom,pickerRightOffset:Math.abs(picker.right-showcase.right),showcaseRightOffset:Math.abs(picker.right-showcase.right)}, missing, lang:document.documentElement.lang, theme:document.documentElement.dataset.theme, resources:performance.getEntriesByType('resource').filter(r=>r.responseStatus>=400).map(r=>r.name) };
})()`;
try {
  // All five requested viewports, both languages and both palettes, under the Pages prefix.
  for (const width of [360, 390, 768, 1440, 1920]) {
    for (const theme of ['light', 'dark']) {
      for (const lang of ['ru', 'en']) {
        await fresh(`/portfolio/?lang=${lang}`, theme, width, width < 641 ? 844 : 1000);
        const result = await evaluate(metrics);
        report.layouts.push(result);
        assert.equal(result.scroll, width, `Horizontal overflow: ${width}/${theme}/${lang}`);
        assert.deepEqual(result.clipped, [], `Clipped text: ${width}/${theme}/${lang}`);
        assert.deepEqual(result.previewProblems, [], `Clipped process content: ${width}/${theme}/${lang}/ios`);
        assert.deepEqual(result.coverProblems, [], `Overlapping cover content: ${width}/${theme}/${lang}`);
        assert.deepEqual(result.contactProblems, [], `Contact controls overflow: ${width}/${theme}/${lang}`);
        assert.ok(result.contactAligned, `Contact card bottoms align: ${width}/${theme}/${lang}`);
        assert.equal(result.headerOverlap, false, `Overlapping header: ${width}/${theme}/${lang}`);
        assert.ok(result.device.left>=-2 && result.device.right<=width+2, `Device outside viewport: ${width}/${theme}/${lang}`);
        assert.ok(result.device.pickerRightOffset<2 && result.device.showcaseRightOffset<2 && result.device.top-result.device.pickerBottom>=18, `Picker/showcase alignment: ${width}/${theme}/${lang}`);
        assert.equal(result.locationStacked,true,`Location is below availability on the left: ${width}/${theme}/${lang}`);
        assert.deepEqual(result.missing, [], 'Missing localized keys');
        assert.deepEqual(result.resources, [], 'Missing resources');
        assert.equal(result.lang, lang);
        assert.equal(result.theme, theme);
        await verifyThemeSurfaces(`${width}/${theme}/${lang}/ios`);
        for(const platform of ['android','web']) {
          await click(`[data-platform=${platform}]`);
          const platformMetrics=await evaluate(metrics);
          await verifyThemeSurfaces(`${width}/${theme}/${lang}/${platform}`);
          assert.equal(platformMetrics.scroll,width,`Platform overflow: ${width}/${theme}/${lang}/${platform}`);
          assert.deepEqual(platformMetrics.clipped,[],`Platform text clipped: ${width}/${theme}/${lang}/${platform}`);
          assert.deepEqual(platformMetrics.previewProblems,[],`Clipped process content: ${width}/${theme}/${lang}/${platform}`);
          assert.deepEqual(platformMetrics.coverProblems,[],`Clipped cover content: ${width}/${theme}/${lang}/${platform}`);
          assert.ok(await evaluate(`document.querySelector('.mobile-showcase').dataset.os==='${platform}' && document.querySelector('[data-platform=${platform}]').getAttribute('aria-pressed')==='true'`));
        }
        await click('[data-platform=ios]');
        report.stageLayouts.push({ width,theme,lang,stage:'architecture' });
        for(const stage of ['data','interface','release']) {
          await click(`[data-capability=${stage}]`);
          const stageMetrics=await evaluate(metrics);
          assert.equal(stageMetrics.scroll,width,`Stage overflow: ${width}/${theme}/${lang}/${stage}`);
          assert.deepEqual(stageMetrics.clipped,[],`Clipped stage content: ${width}/${theme}/${lang}/${stage}`);
          assert.deepEqual(stageMetrics.missing,[],'Stage localization keys missing');
          report.stageLayouts.push({width,theme,lang,stage});
        }
        await click('[data-capability=architecture]');
      }
    }
    console.log(`Layout ${width}px: RU/EN × light/dark passed`);
  }
  report.checks.push('20 responsive language/theme combinations, including /portfolio/');

  for(const [width,height] of [[360,740],[390,844],[768,800],[1280,720],[1366,768],[1440,900],[1920,1080]]) {
    for(const lang of ['ru','en']) {
      await fresh(`/?lang=${lang}`,'dark',width,height);
      const visible=await evaluate('[...document.querySelectorAll(".hero-buttons a,.hero-socials a")].every(a=>{const r=a.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight-8})');
      check(visible,`Hero actions and all contact links fit without scrolling: ${width}×${height}/${lang}`);
      if(width>640) {
        for(const platform of ['ios','android']) {
          await click(`[data-platform=${platform}]`);
          const aligned=await evaluate('Math.abs(document.querySelector(".device-depth").getBoundingClientRect().bottom-document.querySelector(".hero-socials").getBoundingClientRect().bottom)<3');
          check(aligned,`Phone ends at the contact row: ${width}×${height}/${lang}/${platform}`);
        }
      }
    }
  }

  // Hover targets stay tied to the media halves while the overlapping screens move.
  for (const width of [390, 1000, 1440, 1920]) {
    await fresh('/?lang=ru', 'dark', width, width < 641 ? 844 : 1000);
    await browser.media('dark', 'no-preference');
    await evaluate('document.querySelector("#project-terra .store-visual").scrollIntoView({block:"center",behavior:"instant"})');
    await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
    const resting = await evaluate('(() => { const c=document.querySelector("#project-terra");return ["front","back"].map(side=>c.querySelector(".store-visual-image-"+side).getBoundingClientRect().toJSON()); })()');
    for (const [index,side] of ['left','right'].entries()) {
      const hoverPoint = await evaluate(`(() => { const r=document.querySelector('#project-terra .store-visual-media').getBoundingClientRect(); return {x:r.left+r.width*${side==='left'?.25:.75},y:r.top+r.height*.5}; })()`);
      await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:hoverPoint.x,y:hoverPoint.y});
      await new Promise(resolve => setTimeout(resolve, 460));
      const hovered = await evaluate(metrics);
      assert.deepEqual(hovered.coverProblems, [], `Cover screens clip on ${side} hover: ${width}`);
      const state = await evaluate(`(() => {const m=document.querySelector('#project-terra .store-visual-media');const p=m.querySelector('.store-visual-image-${index?'back':'front'}');const other=m.querySelector('.store-visual-image-${index?'front':'back'}');return {side:m.dataset.activePhone,top:p.getBoundingClientRect().top,left:p.getBoundingClientRect().left,z:Number(getComputedStyle(p).zIndex),otherZ:Number(getComputedStyle(other).zIndex)}})()`);
      assert.equal(state.side,side);
      assert.ok(state.z>state.otherZ, `${side} screen moves above its neighbor: ${width}`);
      assert.ok(state.top<resting[index].top-8, `${side} screen lifts: ${width}`);
      assert.ok(side==='left'?state.left<resting[index].left:state.left>resting[index].left, `${side} screen slides outward: ${width}`);
    }
    await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
    check(await evaluate('!document.querySelector("#project-terra .store-visual-media").dataset.activePhone'), `Screen hover resets on pointer exit: ${width}`);
  }
  report.checks.push('Overlapping screens lift, slide outward and swap stacking independently on left/right hover');

  for (const width of [360, 1920]) {
    await fresh('/?lang=ru', 'dark', width, width < 641 ? 844 : 1000);
    for (const platform of ['ios','android','web']) {
      await click(`[data-platform=${platform}]`);
      for (const [pitch,yaw] of [[-10,-20],[14,12]]) {
        await evaluate(`document.querySelector('.device-depth').style.setProperty('--device-x','${pitch}deg');document.querySelector('.device-depth').style.setProperty('--device-y','${yaw}deg')`);
        const rotated = await evaluate(metrics);
        assert.deepEqual(rotated.previewProblems, [], `Process content clips at extreme device angle: ${width}/${platform}/${pitch}/${yaw}`);
        assert.ok(rotated.device.left >= -2 && rotated.device.right <= width + 2, `Device crosses viewport at extreme angle: ${width}/${platform}/${pitch}/${yaw}`);
      }
      await evaluate('document.querySelector(".device-depth").style.removeProperty("--device-x");document.querySelector(".device-depth").style.removeProperty("--device-y")');
    }
  }
  report.checks.push('Process content stays inside devices at supported drag extremes');

  await fresh('/?lang=ru','dark');
  for(const platform of ['ios','android','web']) {
    await click(`[data-platform=${platform}]`);
    await click('.theme-toggle');
    check(await evaluate(`document.querySelector('.mobile-showcase').dataset.os==='${platform}' && document.documentElement.dataset.theme==='light'`), 'Theme switch keeps the selected platform');
    await verifyThemeSurfaces(`live/light/${platform}`);
    await click('.theme-toggle');
    await verifyThemeSurfaces(`live/dark/${platform}`);
  }

  await fresh('/?lang=ru');
  check(await evaluate('document.querySelectorAll(".achievement").length === 4 && [...document.querySelectorAll(".achievement-value")].map(el=>el.textContent.trim()).join("|") === "5+|60+|50+|3"'), 'Four career achievements show experience, releases, interviews and platform count');
  check(await evaluate('document.querySelector("#achievements").textContent.includes("проведённых технических собеседований") && !document.querySelector("#achievements").textContent.includes("crash-free")'), 'Interview achievement names interviews conducted, and crash-free is removed from the strip');
  check(await evaluate('document.querySelectorAll("[data-resume-link]").length === 3 && [...document.querySelectorAll("[data-resume-link]")].every(a=>a.href.endsWith("/resume.pdf") && a.hreflang === "ru")'), 'All three Russian resume actions use the updated Russian PDF');
  check(await evaluate('(() => {const [download,projects]=document.querySelectorAll(".hero-buttons a");return download.classList.contains("button-primary") && download.hasAttribute("download") && download.querySelector("use").getAttribute("href")==="#i-arrow" && projects.classList.contains("button-secondary") && projects.getAttribute("href")==="#projects" && !projects.hasAttribute("target") && projects.querySelector("use").getAttribute("href")==="#i-down"})()'), 'Hero offers a primary CV download with an up-right arrow and a secondary projects link with a down arrow');
  check(await evaluate('document.title.includes("Senior Flutter Developer")'), 'Senior title and metadata');
  check(await evaluate('document.querySelectorAll(".project-card").length === 5'), 'Five complete project cases');
  check(await evaluate('!document.querySelector(".brand img")'), 'Graphic brand mark removed');
  check(await evaluate('!document.querySelector(".header .command-trigger") && document.querySelectorAll(".header-quicklinks a").length===2'), 'Header shortcut replaced with two quick-contact links');
  check(await evaluate('document.querySelector(".header-social-telegram").href==="https://t.me/Shestakov_V" && document.querySelector(".header-social-github").href==="https://github.com/VitaliyShestakov"'), 'Quick links point to the correct profiles');
  check(await evaluate('!document.querySelector(".hero-baseline") && document.querySelector("#achievements").textContent.includes("С 2021 года") && document.querySelector(".achievement-platforms").textContent === "iOS · Android · Web"'), 'Hero baseline is removed and its year/platform details live in achievements');
  check(await evaluate('document.querySelector("#hero-title.hero-title .hero-first-name") && document.querySelector("#hero-title .hero-last-name")'), 'Hero name uses the revised two-line typography');
  check(await evaluate('document.querySelectorAll(".platform-picker .platform-divider").length===2 && [...document.querySelectorAll(".platform-divider")].every(el=>getComputedStyle(el).height==="17px")'), 'Platform picker has two visible separators');
  const before = await evaluate('document.documentElement.dataset.theme');
  await click('.theme-toggle');
  check(await evaluate(`localStorage.getItem('portfolio-theme') !== ${JSON.stringify(before)}`), 'Theme selection persisted');
  await browser.navigate(url("/?lang=ru"));
  check(await evaluate(`document.documentElement.dataset.theme !== ${JSON.stringify(before)}`), 'Theme restored after reload');
  await browser.media('dark');
  check(await evaluate('document.documentElement.dataset.theme === "light"'), 'Manual theme wins over system theme');
  await click('[data-language="en"]');
  check(await evaluate('document.documentElement.lang === "en" && localStorage.getItem("portfolio-language")==="en" && location.search==="?lang=en"'), 'Language selection updates preference and URL');
  check(await evaluate('[...document.querySelectorAll("[data-resume-link]")].every(a=>a.href.endsWith("/resume-en.pdf") && a.hreflang === "en") && [...document.querySelectorAll("[data-resume-link][download]")].every(a=>a.download === "Vitaliy-Shestakov-CV-EN.pdf")'), 'Switching to English updates every resume URL and download name');
  check(await evaluate('document.querySelector(".contact-cv-copy strong").textContent==="Download CV" && document.querySelector(".contact-cv-language").textContent==="EN" && document.querySelector(".contact-cv-format").textContent==="PDF" && !/English version|Russian version/.test(document.querySelector(".contact-cv").textContent)'), 'English contact card names the English CV');
  await verifyContactDownload('en');
  check(await evaluate('document.querySelector("#achievements").textContent.includes("technical interviews conducted") && document.querySelector(".achievement-note").textContent === "Since 2021" && document.querySelector(".career-resume").textContent.includes("Full CV · PDF")'), 'English achievements and PDF label are localized');
  await browser.navigate(url("/"));
  check(await evaluate('document.documentElement.lang === "en"'), 'Language restored without query');
  check(await evaluate('[...document.querySelectorAll("[data-resume-link]")].every(a=>a.href.endsWith("/resume-en.pdf"))'), 'Saved English preference restores English resume URLs');
  await browser.navigate(url("/?lang=ru"));
  check(await evaluate('document.documentElement.lang === "ru"'), 'Explicit language overrides saved choice');
  check(await evaluate('[...document.querySelectorAll("[data-resume-link]")].every(a=>a.href.endsWith("/resume.pdf"))'), 'Explicit Russian preference restores Russian resume URLs');
  check(await evaluate('document.querySelector(".contact-cv-language").textContent==="RU" && document.querySelector(".contact-cv-format").textContent==="PDF" && !document.querySelector(".contact-cv").textContent.includes("Русская версия")'), 'Russian contact card restores the Russian CV');
  await verifyContactDownload('ru');

  check(await evaluate('!document.querySelector(".site-rail") && getComputedStyle(document.querySelector(".header")).position === "sticky"'), 'Sticky top navigation is present');
  check(await evaluate('!document.querySelector(".engineering-scene,.tech-word,.hero-edition,.current-label")'), 'Decorative labels and duplicate status removed');
  check(await evaluate('!document.querySelector("#projects details") && document.querySelectorAll("#experience .contribution-grid li").length===22'), 'Updated contributions live exclusively in career entries');
  check(await evaluate('document.querySelector("#experience-terra-title").textContent === "CRTEX" && document.querySelector("#experience-terra .timeline-role").textContent.includes("Senior Flutter Developer") && document.querySelector("#experience-terra .contribution-grid").textContent.includes("99,95%")'), 'CRTEX senior role includes the approved achievements');
  check(await evaluate('document.querySelector("#experience-terra .contribution-grid").textContent.includes("code review")'), 'Original contribution preserved');
  check(await evaluate('[...document.querySelectorAll(".project-card")].every(card=>card.querySelectorAll(".tags>span").length>=4)'), 'Product cards carry expanded, grounded technology lists');
  check(await evaluate(`document.querySelector('.timeline-track') && !document.querySelector('.current-project-badge,.career-now,.timeline-item.current') && document.querySelector('#experience-terra .contribution').open && document.querySelector('#experience-terra time[datetime="2026-11"]').textContent === 'Ноябрь 2026'`), 'Career timeline shows the completed Terra role through November 2026');
  const beforeExpand=await evaluate(`({projects:[...document.querySelectorAll('.project-card')].map(el=>el.getBoundingClientRect().height),entries:[...document.querySelectorAll('.timeline-item')].map(el=>({id:el.id,height:el.getBoundingClientRect().height,open:el.querySelector('details').open}))})`);
  await click('#experience-beauty summary');
  const afterExpand=await evaluate(`({projects:[...document.querySelectorAll('.project-card')].map(el=>el.getBoundingClientRect().height),entries:[...document.querySelectorAll('.timeline-item')].map(el=>({id:el.id,height:el.getBoundingClientRect().height,open:el.querySelector('details').open}))})`);
  check(afterExpand.entries.find(el=>el.id==='experience-beauty').open, 'Selected contribution expands');
  check(afterExpand.projects.every((height,index)=>Math.abs(height-beforeExpand.projects[index])<.5), 'Opening contribution does not stretch project cards');
  check(afterExpand.entries.every((entry,index)=>entry.id==='experience-beauty'||(entry.open===beforeExpand.entries[index].open && Math.abs(entry.height-beforeExpand.entries[index].height)<.5)), 'Neighboring contributions keep their own state and height');
  await evaluate('document.querySelectorAll(".contribution").forEach(details=>details.open=false)');
  for(const project of ['terra','citadel','tayyab','beauty','otis']) {
    await click(`#experience-${project} summary`);
    check(await evaluate(`document.querySelector('#experience-${project} details').open`), `${project} career contribution opens independently`);
    await click(`#experience-${project} summary`);
  }
  await click('#project-beauty [data-experience-link]');
  check(await eventually('location.hash==="#experience-beauty" && document.querySelector("#experience-beauty details").open && document.activeElement.id==="experience-beauty-title"'), 'Project action opens the matching contribution and moves focus');

  await click('[data-capability=architecture]');
  await evaluate('document.querySelector("[data-capability=architecture]").focus()');
  await key('ArrowRight');
  check(await evaluate('document.activeElement.dataset.capability==="data" && !document.querySelector("#cap-panel-data").hidden'), 'Expertise tabs support arrow-key selection');
  await key('End');
  check(await evaluate('document.activeElement.dataset.capability==="release" && document.querySelector("#cap-tab-release").getAttribute("aria-selected")==="true"'), 'Expertise End key selects the last stage');
  await key('Tab');
  check(await evaluate('document.activeElement.id==="cap-panel-release"'), 'Expertise keyboard focus reaches the active panel');
  await click('[data-language=en]');
  check(await evaluate('!document.querySelector("#cap-panel-release").hidden && document.querySelector("#cap-title-release").textContent==="Build & release"'), 'Language changes preserve and localize the active stage');
  await click('[data-language=ru]');
  await click('[data-capability=architecture]');
  check(await evaluate('[...document.querySelectorAll(".timeline-date > span:last-child")].every(el=>getComputedStyle(el).whiteSpace==="nowrap") && !document.querySelector(".timeline").textContent.includes("Сейчас")'), 'Career date phrases stay together without repeated status');
  check(await evaluate('[...document.querySelectorAll(".hero-socials a")].every(el=>el.querySelector("svg") && parseFloat(getComputedStyle(el).borderRadius)>=8)'), 'Contact actions have integrated icons and button surfaces');
  for(const platform of ['ios','android','web']) {
    await click(`[data-platform=${platform}]`);
    check(await evaluate(`document.querySelector('.mobile-showcase').dataset.os==='${platform}' && [...document.querySelectorAll('[data-platform]')].filter(button=>button.getAttribute('aria-pressed')==='true').length===1`), `${platform} is exclusively selectable`);
    check(await evaluate('document.querySelector(".preview-intro h3").textContent===window.PORTFOLIO_I18N.ru["demo.title"] && document.querySelectorAll(".preview-steps li").length===4 && document.querySelectorAll(".preview-step-art[aria-hidden=true] svg").length===4 && !document.querySelector(".preview-step-art svg text")'), `${platform} shows four illustrated and localized development stages`);
    check(await evaluate(`([...document.querySelectorAll('.preview-release-target')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.dataset.target).join('')==='${platform}')`), `${platform} names its release target`);
    if(platform==='web') {
      check(await evaluate('getComputedStyle(document.querySelector(".preview-steps")).gridTemplateColumns.split(" ").length===2'), 'Web shows the four stages in two columns');
      check(await evaluate('getComputedStyle(document.querySelector(".window-chrome")).display==="flex" && getComputedStyle(document.querySelector(".device-island")).display==="none"'), `${platform} shows window chrome instead of phone controls`);
    } else if(platform==='ios') {
      check(await evaluate('getComputedStyle(document.querySelector(".device-island")).display==="block" && getComputedStyle(document.querySelector(".device-camera")).display==="none"'), 'iOS shows Dynamic Island');
    } else {
      check(await evaluate('getComputedStyle(document.querySelector(".device-island")).display==="none" && getComputedStyle(document.querySelector(".device-camera")).display==="block"'), 'Android shows its camera cutout');
    }
  }
  await click('[data-language=en]');
  check(await evaluate('document.querySelector(".mobile-showcase").dataset.os==="web" && document.querySelector(".preview-intro h3").textContent===window.PORTFOLIO_I18N.en["demo.title"] && [...document.querySelectorAll(".preview-step-copy strong")].every((el,i)=>el.textContent===window.PORTFOLIO_I18N.en[`demo.step${i+1}.title`])'), 'Language switch preserves the frame and translates all illustrated stages');
  await click('[data-language=ru]');
  await click('[data-platform=ios]');
  check(await evaluate('!document.querySelector(".showcase-caption,.demo-navigation,.showcase-source,.web-screen-context a")'), 'Showcase has no bottom tabs or store links');
  await evaluate('document.querySelector(".device-depth").scrollIntoView({block:"center",behavior:"instant"})');
  const dragStart = await evaluate('(() => { const r=document.querySelector(".device-depth").getBoundingClientRect(); return {x:r.left+r.width*.5,y:r.top+r.height*.5}; })()');
  await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragStart.x,y:dragStart.y});
  await browser.send('Input.dispatchMouseEvent',{type:'mousePressed',x:dragStart.x,y:dragStart.y,button:'left',clickCount:1});
  const angleBefore = await evaluate('(() => { const style=getComputedStyle(document.querySelector(".device-depth")); return {x:parseFloat(style.getPropertyValue("--device-x")),y:parseFloat(style.getPropertyValue("--device-y"))}; })()');
  await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragStart.x+65,y:dragStart.y+35,button:'left',buttons:1});
  const angleAfter = await evaluate('(() => { const el=document.querySelector(".device-depth"); const style=getComputedStyle(el); return {dragging:el.classList.contains("is-dragging"),x:parseFloat(style.getPropertyValue("--device-x")),y:parseFloat(style.getPropertyValue("--device-y"))}; })()');
  check(angleAfter.dragging && angleAfter.y > angleBefore.y+3 && angleAfter.x < angleBefore.x-1, 'Dragging the preview changes its 3D angle');
  await browser.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:dragStart.x+65,y:dragStart.y+35,button:'left',clickCount:1});
  check(await evaluate('!document.querySelector(".device-depth").classList.contains("is-dragging")'), 'Dragging releases pointer capture');
  await evaluate('document.querySelector(".device-depth").focus()');
  const keyboardYaw = await evaluate('parseFloat(getComputedStyle(document.querySelector(".device-depth")).getPropertyValue("--device-y"))');
  await key('ArrowRight');
  check(await evaluate(`parseFloat(getComputedStyle(document.querySelector(".device-depth")).getPropertyValue("--device-y")) > ${keyboardYaw}`), 'Arrow keys rotate the focused device');
  await key('Home');
  check(await evaluate('document.querySelector(".device-depth").style.getPropertyValue("--device-y")===""'), 'Home resets keyboard rotation');

  await evaluate('document.querySelector(".brand").focus()');
  await key('k', { modifiers: 4 });
  check(await evaluate('document.querySelector("#command-dialog").open && document.activeElement.id === "command-search"'), 'Command shortcut opens focused search');
  await evaluate('document.querySelector("#command-search").value = "несуществующее"; document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  check(await evaluate('!document.querySelector(".command-empty").hidden && !document.querySelectorAll(".command-result").length'), 'Empty command search state');
  await evaluate('document.querySelector("#command-search").value = "theme"; document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  check(await evaluate('document.querySelectorAll(".command-result").length === 1'), 'Bilingual command search');
  const oldTheme = await evaluate('document.documentElement.dataset.theme');
  await key('Enter');
  check(await evaluate(`!document.querySelector('#command-dialog').open && document.documentElement.dataset.theme !== ${JSON.stringify(oldTheme)}`), 'Command executes theme change');
  await evaluate('document.querySelector(".brand").focus()');
  await key('k', { modifiers: 4 });
  await key('ArrowDown');
  check(await evaluate('document.activeElement.classList.contains("command-result") && document.activeElement.dataset.active === "true"'), 'Arrow key command navigation');
  await key('Tab');
  check(await evaluate('document.activeElement.closest("#command-dialog") !== null'), 'Dialog keyboard focus stays inside');
  await key('Escape');
  check(await evaluate('!document.querySelector("#command-dialog").open && document.activeElement.classList.contains("brand")'), 'Escape closes palette and restores focus');

  await evaluate('document.querySelector(".brand").focus()');
  await key('k', { modifiers: 4 });
  await evaluate('document.querySelector("#command-search").value="experience";document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  await key('Enter');
  await new Promise(resolve => setTimeout(resolve, 50));
  check(await evaluate('location.hash === "#experience" && document.activeElement.id === "experience-title"'), 'Section command moves keyboard focus to destination');
  // Force the clipboard rejection path and verify a usable manual-copy fallback.
  await evaluate('Object.defineProperty(navigator, "clipboard", {configurable:true,value:{writeText:()=>Promise.reject(new Error("blocked"))}})');
  await evaluate('document.querySelector(".brand").focus()');
  await key('k', { modifiers: 4 });
  await evaluate('document.querySelector("#command-search").value="copy";document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  await key('Enter');
  await new Promise(resolve => setTimeout(resolve, 50));
  check(await evaluate('document.querySelector("#email-dialog").open && document.activeElement.selectionStart === 0 && document.activeElement.selectionEnd === document.activeElement.value.length'), 'Clipboard failure provides selected email fallback');
  await key('Escape');
  await evaluate('Object.defineProperty(navigator, "clipboard", {configurable:true,value:{writeText:async value=>{window.copiedEmail=value}}})');
  await evaluate('document.querySelector(".brand").focus()');
  await key('k', { modifiers: 4 });
  await evaluate('document.querySelector("#command-search").value="copy";document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  await key('Enter');
  await new Promise(resolve => setTimeout(resolve, 30));
  check(await evaluate('window.copiedEmail === "shestakovvitaliy87@gmail.com" && document.querySelector("#toast").textContent === window.Portfolio.t("email.copied")'), 'Successful email copy announces localized status');

  // Blocked browser storage must not affect localization, theme or dialogs.
  const { identifier } = await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage unavailable")}})' });
  await browser.navigate(url("/portfolio/?lang=en"));
  check(await evaluate('document.documentElement.lang === "en" && !document.querySelector(".theme-toggle").hidden'), 'Blocked localStorage handled');
  await click('.theme-toggle');
  await click('[data-language="ru"]');
  check(await evaluate('document.documentElement.lang === "ru"'), 'Preferences remain usable without storage');
  await browser.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });

  for (const path of ['/resume.pdf','/resume-en.pdf','/portfolio/resume-en.pdf','/assets/onest-latin.woff2','/portfolio/assets/favicon.svg']) {
    check((await fetch(url(path))).ok, `Resource resolves: ${path}`);
  }

  // No JavaScript: content, project navigation and the PDF stay usable.
  await browser.send('Emulation.setScriptExecutionDisabled', { value: true });
  await browser.viewport(390,844);
  await browser.navigate(url("/portfolio/"));
  check(await evaluate('document.querySelectorAll(".project-card").length===5 && !document.querySelectorAll(".reveal-pending").length'), 'No-JS content remains visible');
  check(await evaluate('document.querySelector(".hero-buttons .button-secondary").getAttribute("href")==="#projects" && document.documentElement.scrollWidth===innerWidth'), 'No-JS navigation and mobile layout');
  check(await evaluate('!document.querySelector(".command-trigger") && !document.querySelector("#command-dialog").open'), 'Unsupported interactions hidden without JS');
  check(await evaluate('[...document.querySelectorAll(".capability-panel")].filter(panel=>panel.getClientRects().length).length===4 && document.querySelector(".capability-tabs").hidden'), 'All expertise stages remain available without JavaScript');
  await browser.send('Emulation.setScriptExecutionDisabled', { value: false });

  await fresh('/?lang=ru', 'dark', 1440);
  check(await evaluate('!document.querySelectorAll(".reveal-pending").length'), 'Reduced motion keeps content visible');
  check(await evaluate('getComputedStyle(document.documentElement).scrollBehavior === "auto"'), 'Reduced motion disables smooth scroll');
  await browser.media('dark','no-preference');
  await browser.navigate(url("/?lang=ru"));
  check(await evaluate('document.querySelectorAll(".reveal-pending").length > 0'), 'Section reveals enabled when motion is allowed');
  await browser.media('dark','reduce');
  await new Promise(resolve => setTimeout(resolve,30));
  check(await eventually('!document.querySelectorAll(".reveal-pending").length'), 'Changing reduced-motion preference clears reveal effects');

  await browser.viewport(390,844);
  const fileURL = new URL('../index.html?lang=en',import.meta.url).href;
  await browser.navigate(fileURL);
  check(await evaluate('document.documentElement.lang === "en" && !!window.Portfolio'), 'Direct file opening loads scripts and localization');
  await fresh('/?lang=en','dark',390,844);
  check(await evaluate('!document.querySelector(".footer-actions,.footer-identity,.footer-middle p") && !document.querySelector(".footer [data-version-link]")'), 'Footer has no role, tagline, archive, source or back-to-top controls');
  check(await evaluate('Math.abs(document.querySelectorAll(".hero-buttons a")[0].getBoundingClientRect().top - document.querySelectorAll(".hero-buttons a")[1].getBoundingClientRect().top) < 1'), 'Mobile primary actions share one aligned row');

  await fresh('/?lang=ru','dark',1440);
  await browser.media('dark','no-preference');
  await browser.navigate(url('/?lang=ru'));
  check(await evaluate('document.documentElement.dataset.motion === "on" && getComputedStyle(document.querySelector(".company-track")).animationPlayState === "running"'), 'Company scroller runs when motion is allowed');
  check(await evaluate('getComputedStyle(document.querySelector(".hero-availability i")).animationName==="availability-dot"'), 'Availability dot pulses when motion is allowed');
  await click('.motion-toggle');
  check(await evaluate('document.documentElement.dataset.motion === "off" && getComputedStyle(document.querySelector(".company-track")).animationPlayState === "paused" && localStorage.getItem("portfolio-motion")==="off"'), 'Motion can be paused and preference persists');
  await browser.navigate(url('/?lang=ru'));
  check(await evaluate('document.documentElement.dataset.motion === "off" && !document.querySelectorAll(".reveal-pending").length'), 'Paused motion preference restored without hidden content');
  await click('.motion-toggle');
  await evaluate('scrollTo({top:900,behavior:"instant"})');
  await new Promise(resolve=>setTimeout(resolve,70));
  check(await evaluate('Number(document.documentElement.style.getPropertyValue("--page-progress")) > 0 && document.documentElement.dataset.scrolled === "true"'), 'Scroll progress and header state track page position');
  await evaluate('scrollTo({top:0,behavior:"instant"})');
  await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:900,y:300});
  await new Promise(resolve=>setTimeout(resolve,70));
  check(await evaluate('document.querySelector(".device-depth").style.getPropertyValue("--device-x") !== ""'), 'Device depth responds to a fine pointer');
  await browser.media('dark','reduce');
  await new Promise(resolve=>setTimeout(resolve,40));
  check(await eventually('document.documentElement.dataset.motion === "off" && !document.querySelectorAll(".reveal-pending").length && document.querySelector(".device-depth").style.getPropertyValue("--device-x") === ""'), 'System reduced motion stops animation and resets depth');
  check(await evaluate('getComputedStyle(document.querySelector(".hero-availability i")).animationName==="none"'), 'Reduced motion stops the availability pulse');

  await fresh('/?lang=ru#experience-citadel','dark',1440);
  check(await evaluate('document.querySelector("#experience-citadel details").open'), 'Career deep link opens its matching contribution');
  await evaluate('scrollTo({top:document.querySelector("#experience-citadel").getBoundingClientRect().top+scrollY-innerHeight*.3,behavior:"instant"})');
  check(await eventually('Number(document.querySelector(".timeline").style.getPropertyValue("--career-progress"))>0 && document.querySelector("#experience-citadel").dataset.active==="true"'), 'Career line and active marker follow the reading position');

  // Readable theme tokens: WCAG normal text contrast against their actual surfaces.
  const contrastExpression = `(() => {
    const style=getComputedStyle(document.documentElement);
    const rgb=hex=>{let value=hex.trim().slice(1);if(value.length===3)value=[...value].map(c=>c+c).join('');return value.match(/.{2}/g).map(v=>parseInt(v,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)};
    const luminance=hex=>rgb(hex).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const x=luminance(style.getPropertyValue(a)),y=luminance(style.getPropertyValue(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    return {ink:ratio('--ink','--bg'),muted:ratio('--muted','--bg'),faint:ratio('--faint','--bg'),accent:ratio('--accent','--bg'),button:ratio('--accent','--accent-ink'),contact:ratio('--muted','--accent-soft')};
  })()`;
  for (const theme of ['light','dark']) {
    await fresh('/?lang=ru',theme);
    const contrast=await evaluate(contrastExpression);
    check(Object.values(contrast).every(r=>r>=4.5), `${theme} text and buttons meet 4.5:1 contrast (${JSON.stringify(contrast)})`);
  }

  await browser.viewport(794,1123);
  await browser.send('Emulation.setEmulatedMedia', { media: 'print' });
  check(await evaluate('getComputedStyle(document.querySelector(".header")).display === "none" && getComputedStyle(document.querySelector(".case-art")).display === "none"'), 'Print hides decorative UI');
  check(await evaluate(`getComputedStyle(document.querySelector('h1 > span'),'::after').content === '" "'`), 'Printed name has a word separator');
  const printed = await browser.send('Page.printToPDF', { printBackground: true, paperWidth: 8.27, paperHeight: 11.7, marginTop: .4, marginBottom: .4, marginLeft: .4, marginRight: .4 });
  await writeFile('.playwright/portfolio-print.pdf',Buffer.from(printed.data,'base64'));
  report.checks.push('A4 print PDF renders');
  await browser.send('Emulation.setEmulatedMedia', { media: '' });

  // QA exports stay outside the source asset tree and production release.
  const previewDirectory = '.playwright/previews';
  await mkdir(previewDirectory, { recursive: true });
  for (const [lang,theme,name] of [['ru','light','preview'],['ru','dark','preview-dark'],['en','light','preview-en'],['en','dark','preview-dark-en']]) {
    await fresh(`/?lang=${lang}`,theme,1440,1000);
    await browser.screenshot(`${previewDirectory}/${name}.png`);
    if(lang==='ru') await browser.screenshot(`${previewDirectory}/layout-desktop${theme==='dark'?'-dark':''}.png`,true);
  }
  for(const [lang,theme,name] of [['ru','light','layout-mobile'],['ru','dark','layout-mobile-dark'],['en','light','layout-mobile-en'],['en','dark','layout-mobile-dark-en']]) {
    await fresh(`/?lang=${lang}`,theme,390,844);
    await browser.screenshot(`${previewDirectory}/${name}.png`,true);
    await browser.screenshot(`${previewDirectory}/preview-mobile-${lang}-${theme}.png`);
  }
  console.log(`Exported desktop/mobile previews: ${previewDirectory}`);
  report.checks.push('Desktop/mobile previews exported for the current portfolio in both themes and languages');
  assert.deepEqual(browser.errors,[],'Uncaught browser exceptions');
  console.log(`Passed ${report.layouts.length} layout combinations and ${report.checks.length} behavior checks.`);
} finally {
  await writeFile('.playwright/report.json',JSON.stringify(report,null,2));
  await browser.close();
}
