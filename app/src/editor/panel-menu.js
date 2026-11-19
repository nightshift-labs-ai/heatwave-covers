// Per-panel menu: right-click a panel on the live preview to pick its photo from the tray, reset its crop or clear it.
// Every pick is one undo step (hooks.commit runs before the change).

import { hitTestPanel } from './panels.js';

export function bindPanelMenu(canvas, state, { commit, changed }) {
  const host = canvas.parentElement;
  let menu = null;

  canvas.addEventListener('contextmenu', (e) => {
    const r = canvas.getBoundingClientRect();
    const k = canvas.width / r.width;
    const { index } = hitTestPanel(state, (e.clientX - r.left) * k, (e.clientY - r.top) * k, canvas.width, canvas.height);
    if (index < 0) return;
    e.preventDefault();
    state.selected = index;
    changed();
    const hostRect = host.getBoundingClientRect();
    openMenu(index, e.clientX - hostRect.left, e.clientY - hostRect.top);
  });
  document.addEventListener('pointerdown', (e) => { if (menu && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  function openMenu(index, x, y) {
    closeMenu();
    menu = document.createElement('div');
    menu.className = 'panel-menu card';
    menu.setAttribute('role', 'menu');
    const head = document.createElement('h3');
    head.textContent = `Panel ${index + 1}`;
    menu.appendChild(head);
    if (state.photos.length) {
      const grid = document.createElement('div');
      grid.className = 'panel-menu-photos';
      state.photos.slice(0, 16).forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = `Use ${p.name}`;
        b.className = state.panels[index]?.photo === i ? 'on' : '';
        b.style.backgroundImage = `url("${p.url}")`;
        b.addEventListener('click', () => act(() => { state.panels[index] = { photo: i, zoom: 1, fx: 0.5, fy: 0.38 }; }));
        grid.appendChild(b);
      });
      menu.appendChild(grid);
    }
    menu.appendChild(item('Reset crop', () => { const s = state.panels[index]; if (s) Object.assign(s, { zoom: 1, fx: 0.5, fy: 0.38 }); }));
    menu.appendChild(item('Clear panel', () => { state.panels[index] = { photo: -1, zoom: 1, fx: 0.5, fy: 0.38 }; }));
    host.appendChild(menu);
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    menu.style.left = `${Math.max(4, Math.min(x, host.clientWidth - mw - 4))}px`;
    menu.style.top = `${Math.max(4, Math.min(y, host.clientHeight - mh - 4))}px`;
  }

  function item(label, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-mini panel-menu-item';
    b.setAttribute('role', 'menuitem');
    b.textContent = label;
    b.addEventListener('click', () => act(fn));
    return b;
  }

  function act(fn) {
    commit();
    fn();
    closeMenu();
    changed();
  }

  function closeMenu() {
    if (menu) { menu.remove(); menu = null; }
  }
}
