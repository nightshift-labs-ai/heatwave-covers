// HEATWAVE Cover Studio, Nightshift Labs' entry (Node 22, standard library only). The app is this directory's app/
// folder: plain static files a desktop browser loads offline (app/index.html and its ES modules, no library, no
// network request). It turns your own photos into a multi-panel sunset crime-epic poster: pick a layout, a colour
// grade and Poster Ink (painterly strokes + ink outlines + deep-shadow halftone), edit the caption, export a PNG.
// This program hands the app in: it copies app/ and screenshots/ to /output and writes /output/dossier.json with the
// vendored make.fun library. The logic below is the kit starter's, unchanged and deterministic (same input bytes,
// same dossier bytes).
// Screenshots (M7): 1-cover-1920.jpg (Key Art Slash Plus, Sunset Strip, no Poster Ink: crisp photo grade with deep
// shadows, Sky glow on, a rooftop hero in sunglasses looking out of frame under a sunset sky, a speedboat by the
// towers in a new top-middle panel, a neon marina and a neon close-up for cool contrast, the moto, seven distinct
// photos, title over the art), 2-editor.jpg (the editor with Key Art Slash, the Poster extras toggles and tag fields,
// undo/redo), 3-cover-1080x1350.jpg (Key Art Slash, Neon Night, six photos), 4-cover-1080.jpg (Key Art Slash from
// ONE photo in five crops, Golden Hour); exports 1080x1080, 1080x1350, 1920x1080 PNG.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
