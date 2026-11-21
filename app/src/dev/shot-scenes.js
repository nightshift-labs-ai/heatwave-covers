// Fixed scenes for the screenshots (loaded only when ?shot= is set). Each scene sets photos, layout, grade, caption
// and crops by hand, waits for fonts and decoded photos, renders once, then sets window.__shotReady = true.

import { ensureCoverAssets, renderCover } from '../engine/render.js';
import { pushHistory } from '../state.js';

const SCENES = {
  // Shot 1: 1920 x 1080, Key Art Slash, Sunset Strip, Poster Ink off (ink: 0; crisp at judge size), six distinct photos: the rooftop hero
  // (sunglasses, looking out of frame, sunset sky), the neon marina night in the second-largest panel, a sunset sky
  // (under the seal and the title's end), the neon close-up in the free middle-right panel, the marina skyline under
  // the title, the motorbike cropped so the rider sits right of the third tag and above the band, and (Key Art Slash
  // Plus, M7) the daytime speedboat on blue water in the new top-middle panel between the hero and the marina.
  'cover-keyart': {
    layoutId: 'keyArtCast', gradeId: 'sunsetStrip', size: [1920, 1080], ink: 0,
    caption: {
      title: 'HEATWAVE', subtitle: 'Coastline Nights', tagline: 'ONE COASTLINE · SIX STORIES · NO CURFEW',
      tags: ['THE CLOSER', 'THE TIPSTER', 'THE BROKER', 'THE NEWLYWEDS', 'THE ALIBI', 'THE NIGHT OWL', 'THE OLD SALT', 'THE FIXER'],
    },
    photos: ['hero-rooftop', 'woman-palms', 'man-neon', 'couple-pier', 'neon-closeup', 'lady-motel', 'pier-fisher', 'marina-night', 'moto-causeway'],
    panels: [
      { photo: 0, zoom: 1, fx: 0.4, fy: 0.3 },
      { photo: 1, zoom: 1.1, fx: 0.5, fy: 0.3 }, { photo: 2, zoom: 1.1, fx: 0.5, fy: 0.3 },
      { photo: 3, zoom: 1.1, fx: 0.5, fy: 0.35 }, { photo: 4, zoom: 1.3, fx: 0.42, fy: 0.42 },
      { photo: 5, zoom: 1.1, fx: 0.5, fy: 0.3 }, { photo: 6, zoom: 1.1, fx: 0.5, fy: 0.3 },
      { photo: 7, zoom: 1, fx: 0.5, fy: 0.5 }, { photo: 8, zoom: 1.6, fx: 0.55, fy: 0.45 },
    ],
  },
  // Shot 3: 1080 x 1350, Key Art Slash in Neon Night: the couple on the pier as the hero, the fisher and the neon man
  // as the two faces in the middle row, the marina skyline, the neon pool and the rainy motel along the bottom.
  'cover-tall': {
    layoutId: 'keyArtSlash', gradeId: 'neonNight', size: [1080, 1350], ink: 0, // M10: Poster Ink off, clean photos like shot 1
    caption: {
      title: 'SALT & SIRENS', subtitle: 'Harbor Run', tagline: 'ONE NIGHT ON THE WATERFRONT',
      quote: '"LOUD, SALTY AND GORGEOUS" — BAYSIDE BEAT', tags: ['THE SWEETHEARTS', 'DOCK NINE · 2 AM', 'THE NIGHT MANAGER'],
    },
    photos: ['couple-pier', 'pier-fisher', 'man-neon', 'marina-skyline', 'pool-neon', 'motel-rain'],
    panels: [
      { photo: 0, zoom: 1.15, fx: 0.5, fy: 0.36 }, { photo: 1, zoom: 1.3, fx: 0.4, fy: 0.36 }, { photo: 2, zoom: 1.3, fx: 0.55, fy: 0.3 },
      { photo: 3, zoom: 1.1, fx: 0.5, fy: 0.45 }, { photo: 4, zoom: 1.1, fx: 0.5, fy: 0.45 }, { photo: 5, zoom: 1.1, fx: 0.5, fy: 0.4 },
    ],
  },
  // Shot 4: 1080 x 1080 from ONE photo: Key Art Slash's hero and four slanted panels, each its own crop of the same
  // face photo (full figure, face close-up, hands, the sign behind), in warm Golden Hour.
  'cover-one': {
    layoutId: 'keyArtSlash', gradeId: 'goldenHour', size: [1080, 1080], ink: 0, // M10: Poster Ink off, clean photos like shot 1
    caption: {
      title: 'MOTEL MIRAGE', subtitle: 'One Photo, Five Shots', tagline: 'FIVE CROPS · ONE SNAPSHOT',
      quote: '"ONE FACE, FIVE ALIBIS" — THE DUNE DISPATCH', tags: ['THE GUEST', 'ROOM 12 · CHECK-OUT NOON', 'THE REGULAR'],
    },
    photos: ['lady-motel'],
    panels: [
      { photo: 0, zoom: 1, fx: 0.5, fy: 0.3 }, { photo: 0, zoom: 2.6, fx: 0.52, fy: 0.12 }, { photo: 0, zoom: 2.2, fx: 0.4, fy: 0.3 },
      { photo: 0, zoom: 2.2, fx: 0.88, fy: 0.16 }, { photo: 0, zoom: 2.4, fx: 0.62, fy: 0.12 },
    ],
  },
  // Shot 2: the editor at 1280 x 800 with Key Art Slash in the preview (the supercar as the hero this time), Poster
  // Ink on, the Poster extras toggles and the quote / tag fields filled in, the hero selected, Undo live.
  editor: {
    layoutId: 'keyArtSlash', gradeId: 'sunsetStrip', size: [1920, 1080], selected: 0, editor: true,
    caption: {
      title: 'NIGHT DRIVE', subtitle: 'Desert Highway', tagline: 'EVERY STREET HAS A PRICE',
      quote: '"FAST, WARM AND RECKLESS" — THE MIRAGE TIMES', tags: ['THE DRIVER', 'ROUTE 9 · 11 PM', 'THE LOOKOUT'],
    },
    photos: ['supercar-boulevard', 'woman-palms', 'coupe-desert', 'speedboat', 'moto-causeway', 'flamingo-boardwalk'],
    panels: [
      { photo: 0, zoom: 1.1, fx: 0.42, fy: 0.55 }, { photo: 1, zoom: 1.2, fx: 0.5, fy: 0.28 }, { photo: 2, zoom: 1.1, fx: 0.5, fy: 0.4 },
      { photo: 5, zoom: 1.5, fx: 0.56, fy: 0.26 }, { photo: 3, zoom: 1.2, fx: 0.5, fy: 0.55 }, { photo: 4, zoom: 1.1, fx: 0.5, fy: 0.45 },
    ],
  },
};

// A scene's ink number as the studio's ink state: 0 is off (the slider keeps its default 0.8), anything else is on.
function inkSetting(strength) {
  const s = Math.min(1, Math.max(0, strength));
  return s > 0 ? { on: true, strength: s } : { on: false, strength: 0.8 };
}

export async function runShotScene(name, studio) {
  const scene = SCENES[name] ?? SCENES['cover-keyart'];
  const { state } = studio;
  await studio.addSamplePhotos(scene.photos);
  pushHistory(state); // setting up the scene is an edit like any other: Undo is live in the editor shot
  state.layoutId = scene.layoutId;
  state.gradeId = scene.gradeId;
  // Poster Ink: each scene sets its own strength (0 = off; 0.8 when the scene says nothing).
  state.ink = inkSetting(scene.ink ?? 0.8);
  // Scenes without a quote or tags keep the studio's defaults (the same words the engine falls back to).
  state.caption = { ...state.caption, ...scene.caption };
  if (scene.dressing) state.dressing = { ...state.dressing, ...scene.dressing };
  state.size = { w: scene.size[0], h: scene.size[1] };
  // Trial renders: &layout=<id>&grade=<id>&size=WxH override the scene (crops are re-filled if the layout changes).
  const q = new URLSearchParams(location.search);
  if (q.get('size')) { const [w, h] = q.get('size').split('x').map(Number); state.size = { w, h }; }
  if (q.get('grade')) state.gradeId = q.get('grade');
  // &ink=0 turns Poster Ink off, &ink=<strength> (0..1) sets it, for A/B renders.
  if (q.has('ink')) state.ink = inkSetting(Number(q.get('ink')) || 0);
  // Sky glow: on unless the scene or &glow=0 turns it off (for A/B renders).
  state.skyGlow = q.has('glow') ? q.get('glow') !== '0' : scene.skyGlow !== false;
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
