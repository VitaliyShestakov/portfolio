/* Optional interactions progressively enhance the complete static portfolio. */
(() => {
  'use strict';
  const app = window.Portfolio;
  if (!app) return;
  const { t } = app;
  // Split the stationary media area so overlapping screens never fight for hover.
  for (const media of document.querySelectorAll('.store-visual-media')) {
    function selectPhone(event) {
      if (event.pointerType === 'touch') return;
      const bounds = media.getBoundingClientRect();
      const side = event.clientX < bounds.left + bounds.width / 2 ? 'left' : 'right';
      if (media.dataset.activePhone !== side) media.dataset.activePhone = side;
    }
    media.addEventListener('pointerenter', selectPhone);
    media.addEventListener('pointermove', selectPhone);
    media.addEventListener('pointerleave', () => { delete media.dataset.activePhone; });
    media.addEventListener('pointercancel', () => { delete media.dataset.activePhone; });
  }
  // Dialog controls only appear when the browser supplies native modal behavior.
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const commandDialog = document.querySelector('#command-dialog');
  const emailDialog = document.querySelector('#email-dialog');
  const search = document.querySelector('#command-search');
  const results = document.querySelector('#command-results');
  const empty = document.querySelector('.command-empty');
  let commandOrigin = document.querySelector('.brand');
  const returnFocus = new WeakMap();
  let filtered = [];
  let selected = 0;
  let toastTimer;

  function openDialog(dialog, trigger = document.activeElement) {
    if (document.querySelector('dialog[open]')) return;
    returnFocus.set(dialog, trigger);
    dialog.showModal();
  }
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      const previous = returnFocus.get(dialog);
      if (!document.querySelector('dialog[open]') && previous?.isConnected && !previous.closest('dialog:not([open])')) previous.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }


  // Published screenshots open at their original aspect ratio. The links keep
  // working as image URLs when JavaScript or native dialogs are unavailable.
  const gallery = document.querySelector('#app-gallery');
  const galleryData = JSON.parse(document.querySelector('#app-screens').textContent);
  const galleryImage = document.querySelector('#gallery-image');
  const galleryTitle = document.querySelector('#gallery-title');
  const galleryStore = document.querySelector('#gallery-store');
  const galleryPosition = document.querySelector('#gallery-position');
  let selectedApp = 'terra';
  let selectedScreen = 0;

  function showGalleryScreen() {
    const app = galleryData[selectedApp];
    selectedScreen = (selectedScreen + app.screens.length) % app.screens.length;
    const screen = app.screens[selectedScreen];
    galleryTitle.textContent = app.name;
    galleryImage.src = screen.src;
    galleryImage.alt = t(screen.alt);
    galleryStore.href = app.store;
    galleryPosition.textContent = `${selectedScreen + 1} / ${app.screens.length}`;
  }

  document.querySelectorAll('[data-gallery]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectedApp = trigger.dataset.gallery;
      selectedScreen = Number(trigger.dataset.galleryIndex) || 0;
      showGalleryScreen();
      openDialog(gallery, trigger);
    });
  });
  gallery.querySelectorAll('[data-gallery-step]').forEach(button => {
    button.addEventListener('click', () => {
      selectedScreen += Number(button.dataset.galleryStep);
      showGalleryScreen();
    });
  });
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectedScreen += event.key === 'ArrowRight' ? 1 : -1;
    showGalleryScreen();
  });
  document.addEventListener('portfolio:languagechange', () => {
    if (gallery.open) showGalleryScreen();
  });

  function announce(message) {
    const toast = document.querySelector('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.visible = 'true';
    toastTimer = setTimeout(() => { delete toast.dataset.visible; }, 2600);
  }
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('shestakovvitaliy87@gmail.com');
      announce(t('email.copied'));
    } catch {
      openDialog(emailDialog, commandOrigin);
      const field = emailDialog.querySelector('input');
      field.focus();
      field.select();
    }
  }

  const commands = [
    { key: 'nav.projects', symbol: '↗', href: '#projects', aliases: 'проекты work projects' },
    { key: 'nav.experience', symbol: '↗', href: '#experience', aliases: 'опыт experience journey' },
    { key: 'nav.stack', symbol: '↗', href: '#stack', aliases: 'стек flutter dart tools stack' },
    { key: 'nav.contact', symbol: '↗', href: '#contact', aliases: 'контакты contact telegram' },
    { key: 'command.theme', symbol: '◐', action: app.toggleTheme, aliases: 'тема theme light dark светлая тёмная' },
    { key: 'command.language', symbol: '↔', action: app.toggleLanguage, aliases: 'язык language english русский ru en' },
    { key: 'command.resume', symbol: '↓', resume: true, aliases: 'резюме resume résumé cv pdf' },
    { key: 'command.email', symbol: '@', action: copyEmail, aliases: 'почта email mail copy' },
  ];

  function setSelected(index, { focus = false, scroll = true } = {}) {
    if (!filtered.length) return;
    selected = (index + filtered.length) % filtered.length;
    const buttons = [...results.querySelectorAll('button')];
    buttons.forEach((button, i) => { button.dataset.active = String(i === selected); });
    if (focus) buttons[selected].focus({ preventScroll: true });
    if (scroll) buttons[selected].scrollIntoView({ block: 'nearest' });
  }
  function execute(command) {
    commandDialog.close();
    if (command.action) {
      command.action();
      return;
    }
    if (command.resume) {
      location.href = new URL(app.getResumeHref(), location.href).href;
      return;
    }
    if (command.href.startsWith('#')) {
      returnFocus.delete(commandDialog);
      app.navigateTo(command.href, { focus: true });

    } else {
      location.href = new URL(command.href, location.href).href;
    }
  }
  function renderCommands() {
    const query = search.value.trim().toLocaleLowerCase();
    filtered = commands.filter(command => `${t(command.key)} ${command.aliases}`.toLocaleLowerCase().includes(query));
    results.replaceChildren();
    empty.hidden = filtered.length !== 0;
    for (const [index, command] of filtered.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'command-result';
      const symbol = document.createElement('span');
      symbol.textContent = command.symbol;
      symbol.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = t(command.key);
      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      button.append(symbol, label, arrow);
      button.addEventListener('click', () => execute(command));
      button.addEventListener('focus', () => setSelected(index, { scroll: false }));
      results.append(button);
    }
    setSelected(0, { scroll: false });
  }
  function openCommands() {
    if (commandDialog.open) { commandDialog.close(); return; }
    commandOrigin = document.activeElement && document.activeElement !== document.body
      ? document.activeElement : document.querySelector('.brand');
    search.value = '';
    renderCommands();
    openDialog(commandDialog, commandOrigin);
    search.focus();
  }
  search.addEventListener('input', renderCommands);
  commandDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(selected + (event.key === 'ArrowDown' ? 1 : -1), { focus: true });
    } else if (event.key === 'Enter' && event.target === search && filtered.length) {
      event.preventDefault();
      execute(filtered[selected]);
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      if (document.querySelector('dialog[open]') && !commandDialog.open) return;
      event.preventDefault();
      openCommands();
    }
  });
  document.addEventListener('portfolio:languagechange', () => {
    if (commandDialog.open) renderCommands();
  });
})();
