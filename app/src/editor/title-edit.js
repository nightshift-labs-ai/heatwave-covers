// Double-click the title on the live preview to edit it in place: an input sits over the title block, Enter or a click
// elsewhere keeps the text, Esc cancels. A double-click outside the title keeps its panel meaning (next photo).

import { layoutFor } from '../engine/layouts.js';

export function bindTitleDoubleClickEdit(canvas, state, { commit }) {
  const host = canvas.parentElement;
  let input = null;

  // Capture phase on the host runs before the canvas's own dblclick (swap photo), so the title can claim the event.
  host.addEventListener('dblclick', (e) => {
    if (e.target !== canvas || input) return;
    const r = canvas.getBoundingClientRect();
    const k = canvas.width / r.width;
    const x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
    const t = layoutFor(state.layoutId, canvas.width, canvas.height).title;
    if (x < t.x || x > t.x + t.w || y < t.y || y > t.y + t.h) return;
    e.stopPropagation();
    e.preventDefault();
    openEditor(t, r, k);
  }, true);

  function openEditor(t, r, k) {
    const hostRect = host.getBoundingClientRect();
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-inline-edit';
    input.maxLength = 24;
    input.value = state.caption.title;
    input.setAttribute('aria-label', 'Edit title');
    const h = Math.max(36, (t.h / k) * 0.42);
    Object.assign(input.style, {
      left: `${r.left - hostRect.left + t.x / k + (t.w / k) * 0.08}px`,
      top: `${r.top - hostRect.top + t.y / k + (t.h / k - h) / 2}px`,
      width: `${(t.w / k) * 0.84}px`,
      height: `${h}px`,
      fontSize: `${h * 0.72}px`,
    });
    host.appendChild(input);
    input.focus();
    input.select();
    let done = false;
    const close = (keep) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      input.remove();
      input = null;
      if (keep && value && value !== state.caption.title) commit(value.toUpperCase());
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // layout / grade / export keys stay off while typing
      if (e.key === 'Enter') close(true);
      else if (e.key === 'Escape') close(false);
    });
    input.addEventListener('blur', () => close(true));
  }

  return { isEditing: () => !!input };
}
