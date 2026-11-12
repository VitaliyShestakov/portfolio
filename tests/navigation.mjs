/* Browser regression checks for shared anchor navigation and scroll tracking. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from './browser.mjs';

const base = (process.env.PORTFOLIO_BASE_URL ?? 'http://127.0.0.1:8777').replace(/\/$/, '');
const browser = await connect();
const evaluate = expression => browser.evaluate(expression);
const checks = [];
let navigationRun = 0;
const check = (value, label) => { assert.ok(value, label); checks.push(label); };
async function until(expression, label, timeout = 3500) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out: ${label}\n${JSON.stringify(await evaluate(status()), null, 2)}`);
}
function status(id = 'projects') {
  return `(() => {
    const header=document.querySelector('.header').getBoundingClientRect();
    const target=document.getElementById(${JSON.stringify(id)});
    const marker=target.querySelector('.section-index') ?? target;
    const rect=marker.getBoundingClientRect();
    return {gap:rect.top-header.bottom,visible:rect.bottom>header.bottom && rect.top<innerHeight,
      current:[...document.querySelectorAll('.section-nav [aria-current]')].map(a=>a.hash),
      y:scrollY,atEnd:scrollY+innerHeight>=document.documentElement.scrollHeight-2,hash:location.hash};
  })()`;
}
async function fresh(width, lang = 'ru', theme = 'dark', motion = 'reduce', hash = '') {
  await browser.viewport(width, width < 641 ? 844 : 900);
  await browser.media(theme, motion);
  const page = `${base}/portfolio/?lang=${lang}&navigation-test=${++navigationRun}`;
  await browser.navigate(`${page}${hash}`);
  await evaluate('localStorage.clear()');
  await browser.navigate(`${page}&ready=1${hash}`);
  await evaluate('document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))');
}
async function assertSection(id, label) {
  await until(`(() => {const s=${status(id)};return s.current.length===1 && s.current[0]==='#${id}' && (Math.abs(s.gap-24)<2 || (s.atEnd && s.visible));})()`, label);
  check(await evaluate('document.querySelectorAll(".section-nav [aria-current]").length===1'), label);
}
async function clickSection(id, label) {
  await evaluate(`document.querySelector('.section-nav a[href="#${id}"]').click()`);
  check(await evaluate(`document.querySelector('.section-nav [aria-current]')?.hash==='#${id}'`), `${label}: immediate highlight`);
  await assertSection(id, `${label}: aligned and selected`);
}
try {
  for (const width of [360,390,768,1440,1920,2560]) {
    for (const lang of ['ru','en']) {
      for (const theme of ['light','dark']) {
        await fresh(width, lang, theme);
        check(await evaluate('!document.querySelector(".section-nav [aria-current]")'), `No selection before projects: ${width}/${lang}/${theme}`);
        for (const id of ['projects','experience','stack','contact','stack','experience','projects']) {
          await clickSection(id, `${width}/${lang}/${theme}/${id}`);
        }
        const entries = await evaluate('history.length');
        await clickSection('projects', `Repeat: ${width}/${lang}/${theme}`);
        check(await evaluate('history.length') === entries, 'Repeated selection does not duplicate history');
        // User scrolling within each region updates the header without changing the URL.
        for (const id of ['projects','experience','stack','about','contact']) {
          await evaluate(`(() => {const s=document.getElementById('${id}');scrollTo({top:s.getBoundingClientRect().top+scrollY+parseFloat(getComputedStyle(s).paddingTop)-document.querySelector('.header').getBoundingClientRect().height+120,behavior:'instant'})})()`);
          const expected = id === 'about' ? 'stack' : id;
          await until(`document.querySelector('.section-nav [aria-current]')?.hash==='#${expected}'`, `Manual scroll: ${width}/${lang}/${theme}/${id}`);
          check(await evaluate('location.hash==="#projects"'), 'Manual scrolling preserves the URL');
        }
        await evaluate('scrollTo({top:0,behavior:"instant"})');
        await until('!document.querySelector(".section-nav [aria-current]")', 'Return above projects clears the selection');
      }
    }
    console.log(`Navigation ${width}px: RU/EN × light/dark passed`);
  }

  for (const width of [390,1440]) {
    for (const hash of ['#projects','#experience','#stack','#contact']) {
      await fresh(width, 'ru', 'dark', 'reduce', hash);
      await assertSection(hash.slice(1), `Direct anchor ${width}/${hash}`);
    }
    await fresh(width, 'en', 'light', 'reduce', '#experience-beauty');
    await until('document.querySelector("#experience-beauty details").open && Math.abs(document.querySelector("#experience-beauty").getBoundingClientRect().top-document.querySelector(".header").getBoundingClientRect().bottom-24)<2', 'Deep-linked career entry opens before positioning');
    check(await evaluate('document.querySelector(".section-nav [aria-current]")?.hash==="#experience"'), 'Deep link selects Experience');

    await fresh(width);
    await evaluate('document.querySelector(".hero-buttons .button-secondary").click()');
    await assertSection('projects', 'Hero projects action shares the navigation offset');
    for (const project of ['terra','citadel','tayyab','beauty','otis']) {
      await evaluate(`document.querySelector('#project-${project} [data-experience-link]').click()`);
      await until(`document.querySelector('#experience-${project} details').open && document.activeElement.id==='experience-${project}-title' && Math.abs(document.querySelector('#experience-${project}').getBoundingClientRect().top-document.querySelector('.header').getBoundingClientRect().bottom-24)<2`, 'Card opens and positions the selected role');
      check(await evaluate('document.querySelector(".section-nav [aria-current]")?.hash==="#experience"'), 'Role link selects Experience');
      await evaluate(`document.querySelector('#experience-${project} .timeline-product-link').click()`);
      await until(`Math.abs(document.querySelector('#project-${project}').getBoundingClientRect().top-document.querySelector('.header').getBoundingClientRect().bottom-24)<2`, 'Return link positions the project card');
      check(await evaluate('document.querySelector(".section-nav [aria-current]")?.hash==="#projects"'), 'Project return link selects Projects');
    }
    await clickSection('projects', 'History origin');
    await clickSection('stack', 'History destination');
    await evaluate('history.back()');
    await until('location.hash==="#projects"', 'History back updates hash');
    await assertSection('projects', 'History back restores alignment');
    await evaluate('history.forward()');
    await until('location.hash==="#stack"', 'History forward updates hash');
    await assertSection('stack', 'History forward restores alignment');

    await fresh(width, 'ru', 'dark', 'no-preference');
    await evaluate('document.querySelector(".hero-buttons .button-secondary").click()');
    await assertSection('projects', 'Animated hero transition');
    const samples = await evaluate(`new Promise(resolve=>{
      document.querySelector('.section-nav a[href="#stack"]').click();
      const result=[];const end=performance.now()+250;
      function sample(){result.push(document.querySelector('.section-nav [aria-current]')?.hash);if(performance.now()<end)requestAnimationFrame(sample);else resolve(result)}sample();
    })`);
    check(samples.every(hash => hash === '#stack'), 'Smooth scrolling keeps the requested item selected');
    await assertSection('stack', 'Smooth transition settles at the correct heading');
    await evaluate(`document.querySelector('.section-nav a[href="#projects"]').click();dispatchEvent(new WheelEvent('wheel'));scrollTo({top:0,behavior:'instant'})`);
    await until('scrollY===0 && !document.querySelector(".section-nav [aria-current]")', 'Wheel input interrupts navigation and restores scroll tracking');
    await evaluate('new Promise(resolve=>setTimeout(resolve,200))');
    check(await evaluate('scrollY===0'), 'Interrupted smooth scrolling does not restart');

    // Recompute the destination when the layout changes during a transition.
    await evaluate('window.Portfolio.navigateTo("#experience")');
    await browser.viewport(width === 390 ? 1440 : 390, 900);
    await assertSection('experience', 'Resize during navigation preserves alignment');
    await evaluate('window.Portfolio.toggleLanguage()');
    await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    await evaluate('window.Portfolio.navigateTo("#projects")');
    await assertSection('projects', 'Language change uses updated geometry');
  }

  await fresh(1440);
  await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'k',modifiers:4,windowsVirtualKeyCode:75});
  await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'k',modifiers:4,windowsVirtualKeyCode:75});
  await evaluate('document.querySelector("#command-search").value="experience";document.querySelector("#command-search").dispatchEvent(new Event("input"))');
  await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',windowsVirtualKeyCode:13});
  await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',windowsVirtualKeyCode:13});
  await assertSection('experience', 'Command palette uses shared navigation');
  check(await evaluate('document.activeElement.id==="experience-title"'), 'Command palette moves keyboard focus to the heading');
  check(await evaluate('window.Portfolio.navigateTo("#missing-section")===false'), 'Unknown anchor safely falls back');
  assert.deepEqual(browser.errors, [], 'Navigation raises no browser errors');
  await mkdir('.playwright',{recursive:true});
  await writeFile('.playwright/navigation-report.json',JSON.stringify({checks},null,2));
  for (const width of [390,1440]) {
    await fresh(width);
    await clickSection('projects', 'Final screenshot alignment');
    await browser.screenshot(`.playwright/navigation-projects-${width}.png`);
  }
  console.log(`Passed ${checks.length} navigation checks.`);
} finally { await browser.close(); }
