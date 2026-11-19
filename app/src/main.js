// HEATWAVE Cover Studio: boots the editor (photo tray, live preview with per-panel crop, layout / grade / ink /
// caption / size controls, Export PNG) and keeps the 3-step strip lit as you go.
import { loadPhotoFiles, loadPhotoUrl, autoFillPanels } from './photos.js';
import { bindPreviewPointer, drawSelectionOverlay, zoomPanel, hitTestPanel } from './editor/panels.js';
import { bindTitleDoubleClickEdit } from './editor/title-edit.js';
import { bindPanelMenu } from './editor/panel-menu.js';
import {
  buildLayoutTiles, syncLayoutTiles, buildGradeSwatches, syncGradeSwatches, bindInkControls, bindCaptionFields,
  bindPosterExtras, syncPosterExtras, bindSkyGlow,
  buildSizeButtons, syncSizeButtons, renderPhotoTray,
} from './editor/controls.js';
import { renderCover, exportCoverPng, ensureCoverAssets } from './engine/render.js';
import {
  createStudioState, pushHistory, pushSnapshot, snapshotState, undo, redo, saveStudioSettings, loadStudioSettings,
} from './state.js';
import { LAYOUTS, LAYOUT_ORDER, COVER_SIZES } from './engine/layouts.js';
import { GRADES, GRADE_ORDER } from './engine/grades.js';

const SAMPLE_PHOTOS = [
  'supercar-boulevard', 'woman-palms', 'lady-motel', 'man-neon', 'motel-rain', 'flamingo-boardwalk', 'pier-fisher',
  'marina-skyline', 'pool-neon', 'coupe-desert', 'speedboat', 'moto-causeway', 'couple-pier', 'hero-rooftop',
  'marina-night', 'neon-closeup', 'boulevard', 'pier',
];

export async function bootHeatwaveStudio() {
  const state = createStudioState();
  const $ = (id) => document.getElementById(id);
  // Screenshot scenes (?shot=) start from the defaults and never write settings, so shots stay reproducible.
  const shotMode = new URLSearchParams(location.search).has('shot');
  const restored = !shotMode && loadStudioSettings(state, { layouts: LAYOUTS, grades: GRADES, sizes: COVER_SIZES });
  let saveTimer = 0;
  const canvas = $('cover-preview');
  const status = $('export-status');
  const pill = document.querySelector('.drag-pill');
  const zoom = $('crop-zoom');
  let queued = 0;
  // `settled`: the state as last drawn (not mid-drag). A change made by a control pushes it, so undo goes back to it.
  let settled = snapshotState(state);
  let lastCaptionEdit = 0;

  // Live preview: the cover at <= 960 px on its long side, plus the selection overlay and the drag pill.
  function refresh(fast = false) {
    const s = Math.min(960 / state.size.w, 960 / state.size.h);
    const w = Math.round(state.size.w * s), h = Math.round(state.size.h * s);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    renderCover(state, w, h, ctx, { fastPanel: fast ? state.selected : -1 });
    const p = drawSelectionOverlay(ctx, state, w, h);
    placePill(p, w, h);
    syncSteps();
    if (!fast) settled = snapshotState(state);
    syncHistoryButtons();
    if (!fast && !shotMode) { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveStudioSettings(state), 300); }
  }
  function syncHistoryButtons() {
    $('undo-btn').disabled = !state.history.length;
    $('redo-btn').disabled = !state.future.length;
  }
  function stepHistory(back) {
    if (back ? undo(state) : redo(state)) { syncControls(); refresh(); }
  }
  function scheduleRefresh() {
    if (queued) return;
    queued = requestAnimationFrame(() => { queued = 0; refresh(false); });
  }
  function placePill(p, w, h) {
    pill.hidden = !p;
    if (!p) return;
    const r = canvas.getBoundingClientRect(), host = canvas.parentElement.getBoundingClientRect();
    const k = r.width / w;
    pill.style.left = `${r.left - host.left + (p.x + p.w / 2) * k}px`;
    pill.style.top = `${r.top - host.top + (p.y + p.h / 2) * k}px`;
  }
  function syncSteps() {
    document.querySelectorAll('.step-strip li').forEach((li) => {
      const n = +li.dataset.step;
      li.classList.toggle('done', n < state.step);
      li.classList.toggle('active', n === state.step);
    });
  }
  function syncControls() {
    $('caption-title').value = state.caption.title;
    $('caption-subtitle').value = state.caption.subtitle;
    $('caption-tagline').value = state.caption.tagline;
    syncPosterExtras($('poster-extras'), state);
    $('ink-toggle').checked = state.ink.on;
    $('sky-glow').checked = state.skyGlow !== false;
    document.querySelector('.ink-strength').value = state.ink.strength;
    syncLayoutTiles($('layout-tiles'), state);
    syncGradeSwatches($('grade-swatches'), state);
    syncSizeButtons($('size-buttons'), state);
    syncZoom();
    renderPhotoTray($('photo-tray'), state, putPhotoInSelectedPanel);
  }
  function syncZoom() {
    const slot = state.panels[state.selected];
    zoom.value = slot ? slot.zoom : 1;
    zoom.disabled = !slot;
  }
  function onChange(kind) {
    // Typing in a caption field within 1.2 s of the last keystroke stays one undo step.
    const now = performance.now();
    if (kind !== 'caption' || now - lastCaptionEdit > 1200) pushSnapshot(state, settled);
    if (kind === 'caption') lastCaptionEdit = now;
    if (kind === 'layout') { autoFillPanels(state); state.selected = -1; state.step = Math.max(state.step, 3); }
    if (kind === 'grade' || kind === 'ink' || kind === 'skyGlow' || kind === 'size') state.step = Math.max(state.step, state.photos.length ? 3 : 1);
    syncControls();
    scheduleRefresh();
  }

  async function addPhotos(photos) {
    if (!photos.length) return;
    pushHistory(state);
    state.photos.push(...photos);
    autoFillPanels(state);
    state.step = Math.max(state.step, 2);
    status.textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} ready. Pick a layout, then export.`;
    await ensureCoverAssets(state);
    syncControls();
    refresh();
  }
  async function addSamplePhotos(names) {
    const photos = await Promise.all(names.map((n) => loadPhotoUrl(`samples/${n}.jpg`, n)));
    state.photos.push(...photos);
    return photos;
  }
  function putPhotoInSelectedPanel(i) {
    let target = state.selected;
    if (target < 0) target = state.panels.findIndex((p) => !p || p.photo < 0);
    if (target < 0) target = 0;
    pushHistory(state);
    state.panels[target] = { photo: i, zoom: 1, fx: 0.5, fy: 0.38 };
    state.selected = target;
    syncControls();
    refresh();
  }

  // Photo input, drag-and-drop anywhere on the page, paste from the clipboard.
  $('photo-input').addEventListener('change', async (e) => { await addPhotos(await loadPhotoFiles(e.target.files)); e.target.value = ''; });
  const drop = $('drop-zone');
  // Drop highlight: a depth counter, because dragenter/dragleave also fire for every child element crossed.
  let dragDepth = 0;
  const carriesFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');
  const setOver = (on) => { drop.classList.toggle('over', on); document.body.classList.toggle('dragging-files', on); };
  document.addEventListener('dragenter', (e) => { if (!carriesFiles(e)) return; dragDepth++; setOver(true); });
  document.addEventListener('dragleave', (e) => { if (!carriesFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) setOver(false); });
  document.addEventListener('dragover', (e) => { if (carriesFiles(e)) e.preventDefault(); });
  document.addEventListener('drop', async (e) => {
    if (!carriesFiles(e)) return;
    e.preventDefault();
    dragDepth = 0; setOver(false);
    const photos = await loadPhotoFiles(e.dataTransfer.files);
    if (!photos.length) { status.textContent = 'That was not an image. Drop JPG, PNG or WebP photos.'; return; }
    // Dropped on a panel of the preview: the first photo goes into that panel.
    const r = canvas.getBoundingClientRect();
    const target = e.target === canvas ? hitTestPanel(state, (e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height), canvas.width, canvas.height).index : -1;
    await addPhotos(photos);
    if (target >= 0) {
      state.panels[target] = { photo: state.photos.length - photos.length, zoom: 1, fx: 0.5, fy: 0.38 };
      state.selected = target;
      syncControls(); refresh();
      status.textContent = `Dropped into panel ${target + 1}. Drag it to reframe.`;
    }
  });
  // Paste: image files or image items (a copied screenshot); text pastes into the caption fields are left alone.
  document.addEventListener('paste', async (e) => {
    const items = [...(e.clipboardData?.items ?? [])].filter((it) => it.kind === 'file' && it.type.startsWith('image/'));
    if (!items.length) return;
    e.preventDefault();
    const photos = await loadPhotoFiles(items.map((it) => it.getAsFile()).filter(Boolean));
    await addPhotos(photos);
    if (photos.length) status.textContent = `Pasted ${photos.length} photo${photos.length > 1 ? 's' : ''}. ${state.photos.length} in the tray.`;
  });
  document.querySelector('.btn-samples').addEventListener('click', async () => {
    const fresh = SAMPLE_PHOTOS.filter((n) => !state.photos.some((p) => p.name === n));
    await addPhotos(await Promise.all(fresh.map((n) => loadPhotoUrl(`samples/${n}.jpg`, n))));
  });
  document.querySelector('.btn-autofill').addEventListener('click', () => { pushHistory(state); autoFillPanels(state); syncControls(); refresh(); });

  // Right-click a panel: its menu (pick the photo, reset crop, clear).
  bindPanelMenu(canvas, state, { commit: () => pushHistory(state), changed: () => { syncControls(); refresh(); } });
  // Double-click the title on the preview: edit it in place (one undo step).
  bindTitleDoubleClickEdit(canvas, state, {
    commit: (title) => {
      pushSnapshot(state, settled);
      state.caption.title = title;
      syncControls(); refresh();
      status.textContent = `Title set to “${title}”.`;
    },
  });
  // Panel crop: drag / wheel on the preview, slider and +- buttons under it.
  bindPreviewPointer(canvas, state, { refresh, commit: () => pushHistory(state), changed: syncZoom });
  zoom.addEventListener('input', () => { zoomPanel(state, state.selected, +zoom.value); refresh(true); });
  zoom.addEventListener('change', () => refresh(false));
  const nudge = (f) => { const s = state.panels[state.selected]; if (!s) return; pushHistory(state); zoomPanel(state, state.selected, s.zoom * f); syncZoom(); refresh(); };
  document.querySelector('.zoom-in').addEventListener('click', () => nudge(1.15));
  document.querySelector('.zoom-out').addEventListener('click', () => nudge(1 / 1.15));
  document.querySelector('.reset-crop').addEventListener('click', () => {
    const s = state.panels[state.selected]; if (!s) return;
    pushHistory(state); Object.assign(s, { zoom: 1, fx: 0.5, fy: 0.38 }); syncZoom(); refresh();
  });

  buildLayoutTiles($('layout-tiles'), state, onChange);
  buildGradeSwatches($('grade-swatches'), state, onChange);
  buildSizeButtons($('size-buttons'), state, onChange);
  bindInkControls($('ink-toggle'), document.querySelector('.ink-strength'), state, onChange);
  bindCaptionFields({ title: $('caption-title'), subtitle: $('caption-subtitle'), tagline: $('caption-tagline') }, state, onChange);
  bindPosterExtras($('poster-extras'), state, onChange);
  bindSkyGlow($('sky-glow'), state, onChange);

  $('export-png').addEventListener('click', async () => {
    status.textContent = `Rendering ${state.size.w} × ${state.size.h}…`;
    const { ms, name } = await exportCoverPng(state, state.size.w, state.size.h);
    window.__lastExport = { ms, name };
    state.step = 3;
    syncSteps();
    status.textContent = `Saved ${name} (rendered in ${ms} ms).`;
  });
  // Export all 3 sizes: the same photos, crops and caption re-flowed to square, portrait and wide, one PNG each.
  $('export-all').addEventListener('click', async () => {
    const names = [];
    let total = 0;
    for (const s of COVER_SIZES) {
      status.textContent = `Rendering ${s.w} × ${s.h} (${names.length + 1} of ${COVER_SIZES.length})…`;
      const { ms, name } = await exportCoverPng(state, s.w, s.h);
      names.push(name); total += ms;
      await new Promise((r) => setTimeout(r, 250)); // browsers drop downloads fired in the same tick
    }
    window.__lastExportAll = names;
    state.step = 3;
    syncSteps();
    status.textContent = `Saved ${names.join(', ')} (${total} ms).`;
  });
  // Shortcut help popover: the Keys button in the header or "?"; Esc or a click elsewhere closes it.
  function showKeys(open) {
    $('keys-pop').hidden = !open;
    $('keys-btn').setAttribute('aria-expanded', String(open));
  }
  $('keys-btn').addEventListener('click', (e) => { e.stopPropagation(); showKeys($('keys-pop').hidden); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.keys-help')) showKeys(false); });
  // Undo / redo: buttons under the preview, Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z.
  $('undo-btn').addEventListener('click', () => stepHistory(true));
  $('redo-btn').addEventListener('click', () => stepHistory(false));
  // Keyboard: outside text fields 1-8 pick a layout (1 = Key Art Slash), G cycles the grade, E exports, ? shows the list.
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'y')) {
      if (e.target.closest('input[type=text]')) return; // the field's own text undo
      e.preventDefault();
      stepHistory(key === 'z' && !e.shiftKey);
      return;
    }
    if (e.key === 'Escape') { showKeys(false); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea')) return;
    if (e.key === '?') { showKeys($('keys-pop').hidden); return; }
    if (LAYOUT_ORDER[+key - 1]) { state.layoutId = LAYOUT_ORDER[+key - 1]; onChange('layout'); }
    else if (key === 'g') { state.gradeId = GRADE_ORDER[(GRADE_ORDER.indexOf(state.gradeId) + 1) % GRADE_ORDER.length]; onChange('grade'); }
    else if (key === 'e') $('export-png').click();
  });
  window.addEventListener('resize', () => refresh());

  const studio = { state, refresh, addSamplePhotos, syncControls, autoFill: () => autoFillPanels(state) };
  await ensureCoverAssets(state);
  syncControls();
  refresh();
  if (restored) status.textContent = 'Layout, grade, caption and size restored from your last visit. Photos are never saved: add them again.';
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    const { runShotScene } = await import('./dev/shot-scenes.js');
    await runShotScene(shot, studio);
  }
  return studio;
}

bootHeatwaveStudio();
