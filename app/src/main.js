// HEATWAVE Cover Studio: boots the editor, keeps the live preview in sync, exports the PNG.
import { loadPhotoUrl } from './photos.js';
import { renderCover, exportCoverPng, ensureCoverAssets } from './engine/render.js';
import { createStudioState } from './state.js';

export async function bootHeatwaveStudio() {
  const state = createStudioState();
  const canvas = document.getElementById('cover-preview');
  const status = document.getElementById('export-status');

  function refresh() {
    const s = Math.min(960 / state.size.w, 960 / state.size.h);
    const w = Math.round(state.size.w * s), h = Math.round(state.size.h * s);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    renderCover(state, w, h, canvas.getContext('2d'));
    document.querySelectorAll('.step-strip li').forEach((li) => {
      const n = +li.dataset.step;
      li.classList.toggle('done', n < state.step);
      li.classList.toggle('active', n === state.step);
    });
  }

  async function addSamplePhotos(names) {
    const photos = await Promise.all(names.map((n) => loadPhotoUrl(`samples/${n}.jpg`, n)));
    state.photos.push(...photos);
    return photos;
  }

  function syncControls() {
    document.getElementById('caption-title').value = state.caption.title;
    document.getElementById('caption-subtitle').value = state.caption.subtitle;
    document.getElementById('caption-tagline').value = state.caption.tagline;
  }

  document.getElementById('export-png').addEventListener('click', async () => {
    status.textContent = 'Rendering…';
    const { ms, name } = await exportCoverPng(state, state.size.w, state.size.h);
    window.__lastExport = { ms, name };
    state.step = 3;
    refresh();
    status.textContent = `Saved ${name} (rendered in ${ms} ms).`;
  });

  const studio = { state, refresh, addSamplePhotos, syncControls };
  await ensureCoverAssets(state);
  refresh();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    const { runShotScene } = await import('./dev/shot-scenes.js');
    await runShotScene(shot, studio);
  }
  return studio;
}

bootHeatwaveStudio();
