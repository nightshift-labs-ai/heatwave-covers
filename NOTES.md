# NOTES (HEATWAVE Cover Studio)

## Status: M1 done (run 1, 19 Nov 2026)
- **Plumbing:** app/ is static ES modules with no library and no network request. The fonts (Anton, Oswald, Kaushan Script, Teko, all OFL) sit under app/fonts/ with their licences. There are 10 sample photos in app/samples/. main.ts keeps the starter's dossier logic byte for byte (only the comments changed) and vendor/ is untouched.
- **Engine (app/src/engine/):**
  - Layouts: keyArtNine, heroAndSix, tiltedSnapshots and stripFive, each in 16:9, 1:1 and 4:5. They re-flow per size and never stretch. Gutters are 12 px per 1080 of the long side x0.85, near-black, with an outer frame.
  - Grades: sunsetStrip, neonNight, goldenHour and miamiTeal. Each is a 256-step LUT gradient map blended with the photo plus a contrast curve, after an auto-levels pass (1-99 percentile stretch, gain capped at 2.4) so night photos use the whole ramp.
  - Poster Ink: 2-pass box blur (r = W/960), then posterize the luminance into 5 bands while keeping hue, then lift dark panels to a mean luminance of 0.47, then halftone dots where luminance < 0.28 (cell W/150) on a lifted "paper" tone, then Sobel ink lines on a half-size smoothed luminance copy (88th percentile, min 72, dilated to W/640), then grain (±4/255) and a vignette (22 %).
  - Lettering: Anton title auto-fit to the block, with a gold→orange→pink gradient, a 0.06 cap-height outline and a 0.08 hard shadow. The subtitle is a neon Kaushan Script overlapping the caps. The tagline is a Teko ribbon. The block sits on a sunset band with a striped halftone sun, or a dark band over the panels. There is also a starburst "NEW / SUMMER 2026" sticker on grid layouts.
  - Render: renderCover draws both the preview and the export. Panel art is cached per (photo, crop, size, grade, ink) key, up to 48 entries. exportCoverPng waits for the fonts and decoded photos, then calls toBlob and downloads heatwave-WxH.png.
- **Editor:**
  - Photos: tray with "Add photos" (multi-file), drop anywhere, paste, Load samples and Auto-fill. With a single photo, every panel gets its own smart crop. Portrait photos go to the tallest panels first.
  - Preview: live and at most 960 px. Click selects a panel (pink 4 px outline, 14 px handles, "Drag to move · Scroll to zoom" pill). Drag pans, the wheel, slider or +/- zoom, and double-click swaps in the next photo. While dragging, the grade-only fast path runs, and ink comes back on pointerup or after 150 ms idle.
  - Right rail: layout tiles (mini drawings), grade chips, ink toggle and strength, title/subtitle/tagline fields, size buttons and Export PNG. The step strip lights 1 → 2 → 3.
  - Keys: undo/redo (Ctrl+Z / Ctrl+Shift+Z), 1-4 for layouts, G cycles the grade, E exports.
- **Tools:**
  - tools/shoot.mjs reads shots.json and uses the server already on SHOOT_BASE. For export shots it clicks #export-png, saves the download to out/, draws that PNG scaled with imageSmoothingQuality 'high', then steps toDataURL JPEG quality down from 0.92 until the file is under budget. Method used: download + rescale (no fallback needed).
  - tools/selftest.mjs is the editor smoke test: samples, select, drag, wheel zoom, all 3 export sizes, one-photo upload through the file input, and keys 4/G/E. Everything passes.

## Numbers (headless Chromium, this machine)
- First (uncached) 1920x1080 keyArtNine render with Poster Ink: 185-227 ms. A cached re-render for export takes about 5 ms. A 1080x1350 snapshots cover takes about 70 ms and a 1080x1080 strip about 120 ms.
- Shots: 1-cover-1920.jpg 1280x720 209.6 KiB (budget 230), 2-editor.jpg 1280x800 159.3 KiB, 3-cover-1080x1350.jpg 864x1080 164.8 KiB, 4-cover-1080.jpg 960x960 165.8 KiB (budget 170 each).
- dossier.json: 1,029,891 bytes, byte-identical across two runs. Kit `check`: 4 passed, 0 failed.

## Known issues / bugs
- Night photos with low luminance contrast (pool-neon) can still go flat under sunsetStrip when they sit in very small panels. In shot 1 such photos go in the tall row slots, not the small wide column.
- The drop-zone highlight can flicker during a drag, because `dragleave` fires on child elements.
- Changing the layout re-runs auto-fill, so hand-set crops are lost (undo brings them back).
- Under `ulimit -v 3000000`, Node 22 cannot start main.ts: its TypeScript-stripping WebAssembly cannot reserve memory. main.ts was run without the limit; it is small.
- The state is not saved to localStorage yet.

## Next (M2)
- Layouts 5-6 (gridFour, fullBleedInset), grade 5 (noirHeat), "Export all 3 sizes", double-click title edit on the preview, per-panel menu (photo, reset crop), localStorage with a size cap and a status line, an editable sticker text, and numbered panel labels.
- Polish lettering and ink from the sheet: halftone density on dark backgrounds, edge noise in busy small panels, night-photo contrast.
- Re-shoot and re-check the sheet (`judge_sheet_preview.py`).
