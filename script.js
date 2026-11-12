/* Preferences, localization and section navigation. No network or build step. */
(() => {
  'use strict';

  const root = document.documentElement;
  const dictionaries = window.PORTFOLIO_I18N;
  const themeToggle = document.querySelector('.theme-toggle');
  const languageSwitch = document.querySelector('.language-switch');
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ }
    },
  };
  let language = 'ru';
  let manualTheme = ['light', 'dark'].includes(storage.get('portfolio-theme'));
  const t = key => dictionaries[language][key] ?? key;
  const getResumeHref = () => language === 'en' ? 'resume-en.pdf' : 'resume.pdf';

  function updateResumeLinks() {
    for (const link of document.querySelectorAll('[data-resume-link]')) {
      link.setAttribute('href', getResumeHref());
      link.setAttribute('hreflang', language);
      if (link.hasAttribute('download')) link.download = `Vitaliy-Shestakov-CV-${language.toUpperCase()}.pdf`;
    }
  }

  function updateTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', t(dark ? 'theme.light' : 'theme.dark'));
    document.querySelector('meta[name="theme-color"]').content = dark ? '#101114' : '#F5F5F3';
  }

  function toggleTheme() {
    manualTheme = true;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateTheme(next);
    storage.set('portfolio-theme', next);
  }

  function applyLanguage(next, { persist = false, updateUrl = false } = {}) {
    if (!Object.hasOwn(dictionaries, next)) return;
    language = next;
    root.lang = next;
    for (const element of document.querySelectorAll('[data-i18n]')) {
      const value = dictionaries[next][element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    }
    for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    }
    for (const element of document.querySelectorAll('[data-i18n-alt]')) {
      element.alt = t(element.dataset.i18nAlt);
    }
    for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    }
    for (const button of languageButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.language === next));
    }
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').content = t('meta.description');
    document.querySelector('meta[property="og:title"]').content = t('meta.title');
    document.querySelector('meta[property="og:description"]').content = t('meta.description');
    document.querySelector('meta[property="og:locale"]').content = next === 'en' ? 'en_US' : 'ru_RU';
    updateTheme(root.dataset.theme ?? (systemTheme.matches ? 'dark' : 'light'));
    updateResumeLinks();
    if (persist) storage.set('portfolio-language', next);
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('lang', next);
      try { history.replaceState(null, '', url); } catch { /* file:// may limit history changes. */ }
    }
    document.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: next }));
  }

  const requested = new URLSearchParams(location.search).get('lang');
  const saved = storage.get('portfolio-language');
  applyLanguage(['ru', 'en'].includes(requested) ? requested : (['ru', 'en'].includes(saved) ? saved : 'ru'));
  languageSwitch.hidden = false;
  themeToggle.hidden = false;
  languageButtons.forEach(button => button.addEventListener('click', () => {
    applyLanguage(button.dataset.language, { persist: true, updateUrl: true });
  }));
  themeToggle.addEventListener('click', toggleTheme);
  systemTheme.addEventListener('change', event => {
    if (!manualTheme) updateTheme(event.matches ? 'dark' : 'light');
  });
  document.querySelector('#year').textContent = new Date().getFullYear();

  const header = document.querySelector('.header');
  const links = [...document.querySelectorAll('.section-nav a')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const anchorGap = 24;
  let navigationFrame = 0;
  let historyFrame = 0;
  let pendingNavigation = null;
  let navigationStarted = false;
  let initialNavigationCancelled = false;

  // Layout coordinates exclude reveal/tilt transforms, which must not move anchors.
  function layoutTop(element) {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) {
      top += node.offsetTop;
      if (node !== element) top += node.clientTop;
    }
    return top;
  }
  function contentTop(section) {
    const style = getComputedStyle(section);
    return layoutTop(section) + section.clientTop + parseFloat(style.paddingTop);
  }
  function resolveTarget(hash) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return null; }
    const target = document.getElementById(id);
    return target && (sections.includes(target) || target.id === 'home' || target.matches('.timeline-item,.project-card')) ? target : null;
  }
  function ownerOf(target) {
    return sections.find(section => section === target || section.contains(target)) ?? null;
  }
  function markActive(section) {
    links.forEach((link, index) => {
      if (sections[index] === section) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function destination(target) {
    const top = target.id === 'home' ? 0 :
      (sections.includes(target) ? contentTop(target) : layoutTop(target)) - header.getBoundingClientRect().bottom - anchorGap;
    return Math.max(0, Math.min(top, root.scrollHeight - innerHeight));
  }
  function updateNavigation() {
    navigationFrame = 0;
    const headerBottom = header.getBoundingClientRect().bottom;
    root.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    if (pendingNavigation) {
      const pending = pendingNavigation;
      const top = destination(pending.target);
      // Expanded career entries, fonts or a resize can change the destination in flight.
      if (Math.abs(top - pending.top) > 1) {
        pending.top = top;
        window.scrollTo({ top, behavior: pending.behavior });
      }
      pending.settled = Math.abs(scrollY - top) < 2 ? pending.settled + 1 : 0;
      if (pending.settled >= 2 || performance.now() - pending.started > 2500) pendingNavigation = null;
      else {
        markActive(ownerOf(pending.target));
        queueNavigation();
        return;
      }
    }
    const readingLine = scrollY + headerBottom + anchorGap + 2;
    let active = null;
    for (const section of sections) {
      if (contentTop(section) <= readingLine) active = section;
    }
    if (scrollY > 0 && scrollY + innerHeight >= root.scrollHeight - 2) active = sections.at(-1);
    markActive(active);
  }
  function queueNavigation() {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  }
  function focusTarget(target) {
    const heading = target.querySelector('h2,h3') ?? target;
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
      heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
    }
    heading.focus({ preventScroll: true });
  }
  function navigateTo(hash, { history: historyMode = 'push', focus = false, behavior } = {}) {
    const target = resolveTarget(hash);
    if (!target) return false;
    navigationStarted = true;
    // Expand the exact role before measuring; other disclosures retain their state.
    document.dispatchEvent(new CustomEvent('portfolio:beforenavigate', { detail: { target } }));
    const scrollBehavior = reducedMotion.matches || root.dataset.motion === 'off' || storage.get('portfolio-motion') === 'off'
      ? 'instant' : (behavior ?? 'smooth');
    if (historyMode === 'push' && location.hash !== hash) {
      try { history.pushState(null, '', hash); } catch { location.hash = hash; }
    }
    const top = destination(target);
    pendingNavigation = { target, top, behavior: scrollBehavior, started: performance.now(), settled: 0 };
    markActive(ownerOf(target));
    if (focus) focusTarget(target);
    window.scrollTo({ top, behavior: scrollBehavior });
    queueNavigation();
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
    const hash = link.getAttribute('href');
    if (!resolveTarget(hash)) return;
    event.preventDefault();
    navigateTo(hash, { focus: link.hasAttribute('data-experience-link') || event.detail === 0 });
  });
  function cancelNavigation() {
    initialNavigationCancelled = true;
    if (pendingNavigation) {
      pendingNavigation = null;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    }
    queueNavigation();
  }
  addEventListener('wheel', cancelNavigation, { passive: true });
  addEventListener('touchstart', cancelNavigation, { passive: true });
  addEventListener('pointerdown', cancelNavigation, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key) && !event.target.closest('input,textarea,select,[contenteditable="true"],dialog')) cancelNavigation();
  });
  function restoreHash() {
    cancelAnimationFrame(historyFrame);
    historyFrame = requestAnimationFrame(() => {
      historyFrame = 0;
      if (!location.hash || !navigateTo(location.hash, { history: 'none', behavior: 'instant' })) {
        pendingNavigation = null;
        queueNavigation();
      }
    });
  }
  addEventListener('popstate', restoreHash);
  addEventListener('hashchange', restoreHash);
  addEventListener('scroll', queueNavigation, { passive: true });
  addEventListener('resize', queueNavigation, { passive: true });
  addEventListener('pageshow', queueNavigation);
  document.addEventListener('portfolio:languagechange', queueNavigation);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(queueNavigation);
    observer.observe(header);
    observer.observe(document.body);
  }
  const initialHash = location.hash;
  function initializeNavigation() {
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(() => {
      if (initialHash && location.hash === initialHash && !navigationStarted && !initialNavigationCancelled) {
        navigateTo(initialHash, { history: 'none', behavior: 'instant' });
      }
      queueNavigation();
    }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeNavigation, { once: true });
  else initializeNavigation();
  queueNavigation();

  // Shared interface for navigation, motion and optional interactions.
  window.Portfolio = Object.freeze({
    t,
    getResumeHref,
    navigateTo,
    toggleTheme,
    toggleLanguage: () => applyLanguage(language === 'ru' ? 'en' : 'ru', { persist: true, updateUrl: true }),
  });
})();
