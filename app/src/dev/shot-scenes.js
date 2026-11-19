// Fixed scenes for the screenshots (loaded only when ?shot= is set). Each scene sets photos, layout, grade, caption
// and crops by hand, waits for fonts and decoded photos, renders once, then sets window.__shotReady = true.

import { ensureCoverAssets, renderCover } from '../engine/render.js';

const SCENES = {
  // Shot 1: 1920 x 1080, Key Art Nine, Sunset Strip, Poster Ink on, eight distinct photos.
  'cover-keyart': {
    layoutId: 'keyArtNine', gradeId: 'sunsetStrip', size: [1920, 1080],
    caption: { title: 'HEATWAVE', subtitle: 'Coastline Nights', tagline: 'IN STORES SOMEWHERE SOON' },
    photos: ['woman-palms', 'lady-motel', 'man-neon', 'pool-neon', 'coupe-desert', 'speedboat', 'moto-causeway', 'couple-pier'],
    panels: [
      // hero, then the small wide column (bright scenes + one close-up), the tall row (portraits), the big right panel
      { photo: 0, zoom: 1, fx: 0.5, fy: 0.3 },
      { photo: 4, zoom: 1.1, fx: 0.5, fy: 0.45 }, { photo: 0, zoom: 2.1, fx: 0.44, fy: 0.27 }, { photo: 5, zoom: 1.1, fx: 0.5, fy: 0.45 },
      { photo: 1, zoom: 1, fx: 0.5, fy: 0.3 }, { photo: 3, zoom: 1.15, fx: 0.45, fy: 0.36 }, { photo: 6, zoom: 1, fx: 0.5, fy: 0.4 }, { photo: 7, zoom: 1.1, fx: 0.5, fy: 0.35 },
      { photo: 2, zoom: 1.1, fx: 0.55, fy: 0.35 },
    ],
  },
  // Shot 3: 1080 x 1350, tilted snapshots over a neon sky.
  'cover-tall': {
    layoutId: 'tiltedSnapshots', gradeId: 'neonNight', size: [1080, 1350],
    caption: { title: 'SALT & SIRENS', subtitle: 'Harbor Run', tagline: 'ONE NIGHT ON THE WATERFRONT' },
    photos: ['couple-pier', 'speedboat', 'pool-neon', 'man-neon', 'lady-motel'],
    panels: [
      { photo: 0, zoom: 1, fx: 0.5, fy: 0.38 }, { photo: 1, zoom: 1, fx: 0.5, fy: 0.4 },
      { photo: 2, zoom: 1, fx: 0.5, fy: 0.4 }, { photo: 3, zoom: 1.1, fx: 0.5, fy: 0.35 }, { photo: 4, zoom: 1, fx: 0.5, fy: 0.3 },
    ],
  },
  // Shot 4: 1080 x 1080 from ONE photo, five smart crops in Strip Five, Golden Hour.
  'cover-one': {
    layoutId: 'stripFive', gradeId: 'goldenHour', size: [1080, 1080],
    caption: { title: 'GOLDEN HOUR', subtitle: 'One Photo, Five Shots', tagline: 'FIVE CROPS · ONE SNAPSHOT' },
    photos: ['woman-palms'],
    panels: [
      { photo: 0, zoom: 1, fx: 0.1, fy: 0.5 }, { photo: 0, zoom: 1.3, fx: 0.36, fy: 0.32 }, { photo: 0, zoom: 1.0, fx: 0.47, fy: 0.3 },
      { photo: 0, zoom: 2.2, fx: 0.5, fy: 0.32 }, { photo: 0, zoom: 1, fx: 0.9, fy: 0.5 },
    ],
  },
  // Shot 2: the editor with photos in the tray, Hero + Four (supercar hero, four framed photos), Poster Ink on,
  // one framed panel selected, step 3 lit.
  editor: {
    layoutId: 'heroFour', gradeId: 'sunsetStrip', size: [1920, 1080], selected: 2, editor: true,
    caption: { title: 'SALT & SIRENS', subtitle: 'Harbor Run', tagline: 'EVERY STREET HAS A PRICE' },
    photos: ['supercar-boulevard', 'woman-palms', 'pier-fisher', 'couple-pier', 'lady-motel', 'coupe-desert', 'speedboat', 'moto-causeway'],
    panels: [
      { photo: 0, zoom: 1.05, fx: 0.48, fy: 0.5 }, { photo: 1, zoom: 1.1, fx: 0.5, fy: 0.3 }, { photo: 2, zoom: 1.1, fx: 0.42, fy: 0.4 },
      { photo: 3, zoom: 1, fx: 0.5, fy: 0.38 }, { photo: 4, zoom: 1.1, fx: 0.5, fy: 0.3 },
    ],
  },
};

export async function runShotScene(name, studio) {
  const scene = SCENES[name] ?? SCENES['cover-keyart'];
  const { state } = studio;
  await studio.addSamplePhotos(scene.photos);
  state.layoutId = scene.layoutId;
  state.gradeId = scene.gradeId;
  state.ink = { on: true, strength: 0.8 };
  state.caption = { ...scene.caption };
  state.size = { w: scene.size[0], h: scene.size[1] };
  // Trial renders: &layout=<id>&grade=<id>&size=WxH override the scene (crops are re-filled if the layout changes).
  const q = new URLSearchParams(location.search);
  if (q.get('size')) { const [w, h] = q.get('size').split('x').map(Number); state.size = { w, h }; }
  if (q.get('grade')) state.gradeId = q.get('grade');
  state.panels = scene.panels.map((p) => ({ ...p }));
  if (q.get('layout')) { state.layoutId = q.get('layout'); studio.autoFill(); }
  state.selected = scene.selected ?? -1;
  state.step = 3;
  await ensureCoverAssets(state);
  studio.syncControls();
  studio.refresh();
  document.getElementById('export-status').textContent =
    `${state.photos.length} photos ready. Drag the pink panel to reframe it, then Export PNG.`;
  if (!scene.editor) {
    const c = document.createElement('canvas');
    c.width = state.size.w; c.height = state.size.h;
    const t0 = performance.now();
    renderCover(state, c.width, c.height, c.getContext('2d'));
    window.__renderMs = Math.round(performance.now() - t0);
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
