// Apply the preference before first paint. Storage can be unavailable in private modes.
(() => {
  let saved;
  try { saved = localStorage.getItem('portfolio-theme'); } catch { /* Use system preference. */ }
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
    ? saved : (systemDark ? 'dark' : 'light');
})();
