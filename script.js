(() => {
  const toggle = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let manualChoice = false;
  try { manualChoice = ['light', 'dark'].includes(localStorage.getItem('portfolio-theme')); } catch { /* Storage is optional. */ }

  function updateTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeMeta.content = dark ? '#131c1a' : '#f6f6f1';
  }

  toggle.hidden = false;
  updateTheme(document.documentElement.dataset.theme);
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    manualChoice = true;
    updateTheme(next);
    try { localStorage.setItem('portfolio-theme', next); } catch { /* Keep the theme for this visit. */ }
  });
  media.addEventListener('change', event => {
    if (!manualChoice) updateTheme(event.matches ? 'dark' : 'light');
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('nav a')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
  }
})();
