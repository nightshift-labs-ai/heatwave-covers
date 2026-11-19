// Photos: read from the person's own machine (never uploaded), auto-fill them into the panels, and with ONE photo
// give every panel a different smart crop so it reads like many shots.

import { layoutFor } from './engine/layouts.js';

let nextId = 1;

// Read image files chosen in the file input (or dropped) into decoded photos.
export async function loadPhotoFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  return Promise.all(list.map((f) => loadPhotoUrl(URL.createObjectURL(f), f.name)));
}

// Load and decode one image URL (an object URL or a sample under samples/).
export async function loadPhotoUrl(url, name = url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return { id: nextId++, name, img, w: img.naturalWidth, h: img.naturalHeight, url };
}

// Different crops of one photo: zoom 1.0 .. 2.2 around a walk of focus points (faces sit high, so y stays near 0.38).
export function smartCropsForOnePhoto(count) {
  const focus = [[0.5, 0.38], [0.32, 0.3], [0.68, 0.42], [0.45, 0.62], [0.6, 0.25], [0.25, 0.55], [0.75, 0.6], [0.5, 0.2], [0.4, 0.45]];
  const crops = [];
  for (let i = 0; i < count; i++) {
    const [fx, fy] = focus[i % focus.length];
    crops.push({ photo: 0, zoom: +(1 + (1.2 * ((i * 3) % count)) / Math.max(1, count - 1)).toFixed(2), fx, fy });
  }
  crops[0].zoom = 1;
  return crops;
}

// Put the photos into the layout's panels in order; portrait photos go to the tallest free panels first.
// With one photo every panel gets its own smart crop.
export function autoFillPanels(state) {
  const geo = layoutFor(state.layoutId, state.size.w, state.size.h);
  const n = geo.panels.length;
  if (!state.photos.length) { state.panels = []; return; }
  if (state.photos.length === 1) { state.panels = smartCropsForOnePhoto(n); return; }
  const order = geo.panels.map((p, i) => i).sort((a, b) => geo.panels[b].h / geo.panels[b].w - geo.panels[a].h / geo.panels[a].w);
  const photos = state.photos.map((p, i) => i).sort((a, b) => state.photos[b].h / state.photos[b].w - state.photos[a].h / state.photos[a].w);
  const panels = new Array(n);
  order.forEach((panelIndex, k) => {
    const photo = photos[k % photos.length];
    const repeat = Math.floor(k / photos.length);
    panels[panelIndex] = { photo, zoom: repeat ? 1.6 + 0.2 * repeat : 1, fx: 0.5, fy: 0.38 };
  });
  state.panels = panels;
}
