/* Motion and the interactive engineering-process mockup. Neither requires a third-party library. */
(() => {
  'use strict';
  const app = window.Portfolio;
  if (!app) return;
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const showcase = document.querySelector('.mobile-showcase');
  const device = showcase.querySelector('.device-depth');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionButtons = [...document.querySelectorAll('.motion-toggle')];
  const timeline = document.querySelector('.timeline');
  const careerEntries = [...timeline.querySelectorAll('.timeline-item')];
  const visibleProjects = new Set();
  const projectCards = [...document.querySelectorAll('.project-card')];
  let requestedMotion = true;
  try { requestedMotion = localStorage.getItem('portfolio-motion') !== 'off'; } catch { /* Motion works without storage. */ }
  let frame = 0;
  let pointerFrame = 0;
  let drag = null;
  let revealObserver;
  let revealsStarted = false;
  const allowed = () => requestedMotion && !reduced.matches;


  function revealContent() {
    document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
    revealObserver?.disconnect();
  }
  function startReveals() {
    if (revealsStarted || !allowed() || !('IntersectionObserver' in window)) return;
    revealsStarted = true;
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove('reveal-pending');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: .06 });
    document.querySelectorAll('.section-heading,.project-card,.timeline-item,.capability-explorer,.team-panel').forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${index % 3 * 55}ms`);
      element.classList.add('reveal-ready', 'reveal-pending');
      revealObserver.observe(element);
    });
  }
  function resetDepth() {
    if (drag) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    device.style.removeProperty('--device-x');
    device.style.removeProperty('--device-y');
    hero.style.removeProperty('--device-travel');
    hero.style.removeProperty('--hero-travel');
  }
  function updateScroll() {
    frame = 0;
    const length = root.scrollHeight - innerHeight;
    root.style.setProperty('--page-progress', String(length > 0 ? Math.min(1, scrollY / length) : 0));
    root.dataset.scrolled = String(scrollY > 24);
    const railStart = timeline.getBoundingClientRect().top + 28;
    const railLength = careerEntries.at(-1).offsetTop;
    const readingLine = innerHeight * .43;
    timeline.style.setProperty('--timeline-length', `${railLength}px`);
    timeline.style.setProperty('--career-progress', String(railLength > 0 ? Math.max(0,Math.min(1,(readingLine - railStart) / railLength)) : 0));
    let activeEntry = careerEntries[0];
    for (const entry of careerEntries) {
      if (entry.getBoundingClientRect().top <= readingLine) activeEntry = entry;
    }
    careerEntries.forEach(entry => {
      const active = String(entry === activeEntry);
      if (entry.dataset.active !== active) entry.dataset.active = active;
    });
    if (allowed()) {
      hero.style.setProperty('--hero-travel', `${Math.min(80, scrollY * .1)}px`);
      hero.style.setProperty('--device-travel', `${Math.min(18, scrollY * .025)}px`);
      visibleProjects.forEach(card => {
        const rect = card.getBoundingClientRect();
        const offset = Math.max(-6,Math.min(6,(innerHeight * .5 - rect.top - rect.height * .5) / innerHeight * 10));
        card.style.setProperty('--art-travel', `${offset}px`);
      });
    }
  }

  function queueScroll() {
    if (!frame) frame = requestAnimationFrame(updateScroll);
  }
  function updateMotionLabels() {
    for (const button of motionButtons) {
      button.hidden = reduced.matches;
      button.setAttribute('aria-pressed', String(!allowed()));
      button.setAttribute('aria-label', app.t(allowed() ? 'animation.pause' : 'animation.resume'));
      button.querySelector('use').setAttribute('href', allowed() ? '#i-pause' : '#i-play');
    }
  }
  function applyMotion() {
    root.dataset.motion = allowed() ? 'on' : 'off';
    updateMotionLabels();
    if (allowed()) startReveals();
    else {
      revealContent();
      resetDepth();
      document.querySelectorAll('.capability-panel').forEach(panel => panel.getAnimations?.().forEach(animation => animation.cancel()));
      projectCards.forEach(card => card.style.removeProperty('--art-travel'));
    }
    queueScroll();
  }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    requestedMotion = !requestedMotion;
    try { localStorage.setItem('portfolio-motion', requestedMotion ? 'on' : 'off'); } catch { /* Optional preference. */ }
    applyMotion();
  }));
  reduced.addEventListener('change', applyMotion);
  document.addEventListener('portfolio:languagechange', updateMotionLabels);
  document.addEventListener('visibilitychange', () => { root.dataset.pageVisible = String(!document.hidden); });
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(queueScroll).observe(document.body);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      hero.classList.toggle('is-visible', entries[0].isIntersecting);
    }, { rootMargin: '100px' }).observe(hero);
  } else hero.classList.add('is-visible');

  hero.addEventListener('pointermove', event => {
    if (drag || !allowed() || !finePointer.matches || pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - .5;
      const vertical = (event.clientY - bounds.top) / bounds.height - .5;
      device.style.setProperty('--device-x', `${4 - vertical * 4}deg`);
      device.style.setProperty('--device-y', `${-10 + horizontal * 8}deg`);
      pointerFrame = 0;
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', resetDepth);
  finePointer.addEventListener('change', resetDepth);

  // Dragging the device is direct manipulation; decorative motion settings do not disable it.
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  device.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    const style = getComputedStyle(device);
    drag = {
      id: event.pointerId,
      type: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      pitch: parseFloat(style.getPropertyValue('--device-x')) || 0,
      yaw: parseFloat(style.getPropertyValue('--device-y')) || 0
    };
    device.setPointerCapture(event.pointerId);
    device.classList.add('is-dragging');
    event.preventDefault();
  });
  device.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const pitch = clamp(drag.pitch - (event.clientY - drag.y) * .075, -10, 14);
    const yaw = clamp(drag.yaw + (event.clientX - drag.x) * .09, -20, 12);
    device.style.setProperty('--device-x', `${pitch}deg`);
    device.style.setProperty('--device-y', `${yaw}deg`);
    event.preventDefault();
  });
  const endDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    const touch = drag.type === 'touch';
    drag = null;
    device.classList.remove('is-dragging');
    if (device.hasPointerCapture(event.pointerId)) device.releasePointerCapture(event.pointerId);
    if (touch) {
      device.style.removeProperty('--device-x');
      device.style.removeProperty('--device-y');
    }
  };
  device.addEventListener('pointerup', endDrag);
  device.addEventListener('pointercancel', endDrag);
  device.addEventListener('keydown', event => {
    if (event.target !== device || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') {
      device.style.removeProperty('--device-x');
      device.style.removeProperty('--device-y');
      return;
    }
    const style = getComputedStyle(device);
    const pitch = parseFloat(style.getPropertyValue('--device-x')) || 0;
    const yaw = parseFloat(style.getPropertyValue('--device-y')) || 0;
    if (event.key === 'ArrowUp') device.style.setProperty('--device-x', `${clamp(pitch + 2,-10,14)}deg`);
    if (event.key === 'ArrowDown') device.style.setProperty('--device-x', `${clamp(pitch - 2,-10,14)}deg`);
    if (event.key === 'ArrowRight') device.style.setProperty('--device-y', `${clamp(yaw + 2,-20,12)}deg`);
    if (event.key === 'ArrowLeft') device.style.setProperty('--device-y', `${clamp(yaw - 2,-20,12)}deg`);
  });

  // Platform selection changes the frame and release target in the engineering process.
  const platformButtons = [...showcase.querySelectorAll('[data-platform]')];
  showcase.querySelector('.platform-picker').hidden = false;
  for (const button of platformButtons) {
    button.addEventListener('click', () => {
      showcase.dataset.os = button.dataset.platform;
      platformButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      device.style.removeProperty('--device-x');
      device.style.removeProperty('--device-y');
    });
  }
  // Project summaries link to the exact role without closing any other disclosure.
  document.addEventListener('portfolio:beforenavigate', event => {
    const entry = event.detail.target;
    if (!entry.matches('.timeline-item')) return;
    entry.querySelector('.contribution').open = true;
    queueScroll();
  });
  careerEntries.forEach(entry => entry.querySelector('.contribution').addEventListener('toggle', queueScroll));

  // Accessible stages: one panel at a time; all content remains visible without JS.
  const explorer = document.querySelector('.capability-explorer');
  const capabilityButtons = [...explorer.querySelectorAll('[data-capability]')];
  const capabilityPanels = [...explorer.querySelectorAll('[data-capability-panel]')];
  function selectCapability(index, { focus = false, animate = true } = {}) {
    const next = (index + capabilityButtons.length) % capabilityButtons.length;
    capabilityButtons.forEach((button, position) => {
      const selected = position === next;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      const panel = capabilityPanels[position];
      panel.hidden = !selected;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.tabIndex = selected ? 0 : -1;
      panel.getAnimations?.().forEach(animation => animation.cancel());
      if (selected && animate && allowed() && typeof panel.animate === 'function') {
        panel.animate([{ opacity: .3, transform: 'translateY(7px)' },{ opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' });
      }
    });
    if (focus) capabilityButtons[next].focus();
    queueScroll();
  }
  capabilityButtons.forEach((button, index) => button.addEventListener('click', () => selectCapability(index)));
  explorer.querySelector('.capability-tabs').addEventListener('keydown', event => {
    const current = capabilityButtons.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = current + 1;
    else if (event.key === 'ArrowLeft') next = current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = capabilityButtons.length - 1;
    else return;
    event.preventDefault();
    selectCapability(next, { focus: true });
  });
  explorer.classList.add('is-enhanced');
  explorer.querySelector('.capability-tabs').hidden = false;
  selectCapability(0, { animate: false });
  if ('IntersectionObserver' in window) {
    const projectObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleProjects.add(entry.target);
        else visibleProjects.delete(entry.target);
      });
      queueScroll();
    }, { rootMargin: '80px' });
    projectCards.forEach(card => projectObserver.observe(card));
  }
  root.dataset.pageVisible = String(!document.hidden);
  applyMotion();
})();
