# NOTES (HEATWAVE Cover Studio)

## Status: M4 done (run 5, 19 Nov 2026, 18:34-18:55 EET): Sky glow on photo panels + shot 1 A/B
Short run on LIGHT, not layout. Key Art Slash, the title, the dressing and the Poster Ink look are unchanged.

### What changed
- **Sky glow** (`engine/sky-glow.js`, wired in `panelArt` in engine/render.js) is a real engine pass for every
  photo panel, not an overlay on one shot.
  - **Mask** (`skyMaskBeforeGrade`). It is taken from the crop before the grade, at the same point as the skin
    mask, so the photo's own sky can still be told apart.
    - Candidates: bright, low-saturation pixels (haze, cream, cloud), bright warm haze, or pale blue.
    - A 4-connected flood fill from the panel's top edge keeps only connected candidates. It stops at luminance
      steps above 0.09, so it does not leak into walls or shirts.
    - The mask fades out over the lower third and is feathered with a two-pass box blur.
    - It is zero on skin and fades beside skin, so faces, hair, palms and buildings keep their colour and ink
      outlines. With no sky (e.g. an all-dark photo), there is no mask.
  - **Skin guard fix.** The RGB skin rule also fired on the hero's pale warm haze (e.g. 234,220,193). That removed
    most of the sky in the first trial. The sky guard now keeps every skin pixel except very bright, washed ones
    (L > 0.84 and saturation < 0.42).
  - **Paint** (`paintSkyGlow`). It runs after the grade and before Poster Ink, so Kuwahara paints the sky into
    strokes and the ink lines stay on top.
    - Per-grade palettes run from the top to the sky's low edge. Sunset Strip and Golden Hour go violet-magenta,
      then pink, then hot orange. Neon Night goes indigo, then violet, then magenta.
    - A soft glow sits at the sky's brightest point (the sun's side).
    - A luminance texture factor (0.64-1.14) keeps the clouds. It is capped so the sun's side stays orange and
      does not tip into the ink's cream highlight clip.
    - Miami Teal and Noir Heat have no palette, so they keep their own skies.
  - **Editor:** a 'Sky glow' toggle sits under the grade chips (`#sky-glow`, the only new id). It is on by default.
    Each flip is one undo step. It is saved in localStorage (boolean only) and is part of the cache key. Shot scenes
    take `&glow=0|1` for A/B renders.
  - **selftest:** 22 checks, all pass (18 before). New:
    - the mask is empty on an all-dark photo
    - 0 of 1,521 skin pixels are masked next to a pale sky (sky 35 %)
    - the toggle is on by default and is one undo/redo step
    - the off state comes back from localStorage
- **Shot 1** was re-exported with Sky glow on. The scene, layout, photos, title, 1280x720 size and JPEG loop are the
  same as before; the file is 207.3 KiB.

### A/B (out/ab/ab_768.jpg, read next to briefs' rival top-4): KEPT
At 768x432 the hero's sky, which was a washed cream third of the cover, now runs violet at the top, through pink, to
hot orange low by the palms. That is the rivals' sunset light. The face is the same and still reads as a face. The
title and dressing are pixel-for-pixel the same layout, and nothing is smeared.

| shot 1 | M3b | M4 |
|---|---|---|
| luminance std | 81 | 77 (rival #1: 77) |
| pixels > 215 | 0.20 | 0.15 (rival #1: 0.12) |
| size | 205.8 KiB | 207.3 KiB |

The drop in bright pixels is the cream sky becoming saturated mid-tones. Both numbers are still above the M3a
targets (std ≥ 72, bright ≥ 0.10).

**Shot 4 was not re-taken.** In a trial with Sky glow, the mask caught the motel's pale walls where they touch the
top edge and painted them in magenta patches, which is worse than the current file.

### Checks (this run)
- dossier.json: 1,088,599 bytes (1.04 MiB), byte-identical across two runs. main.ts still runs without the
  `ulimit -v` limit, as before.
- Kit `check`: 4 passed, 0 failed. The kit copy is still level 26 while the site is at 27, so the operator may want
  to re-download it.
- Shot gate: 207.3 / 159.1 / 163.5 / 168.5 KiB. All are ≤ 256 KiB, with the long side ≤ 1280 and the short side
  ≥ 480. The sheet tool prints GATE OK.
- The name grep over app/ prints nothing.

### Known issues
- A narrow cream column of sun glare is left between two palm trunks, left of the hero's head. The trunks are
  warm-lit, so they pass the skin rule, and the fade beside skin keeps the glow off them.
- Pale walls connected to the top edge, like shot 4's motel, are treated as sky and get patchy colour. A wall test
  (straight vertical edges, or a texture limit) would fix this.
- Shot 2 (the editor) was not re-taken, so it does not show the Sky glow toggle yet.
- Sky glow cost was not measured on its own. With it on, shot 1's uncached scene render took 490-725 ms across four
  runs (M3a, without it: 550-630 ms).

## Status: M3b done (run 4, 19 Nov 2026, 16:50-17:04 EET): Poster extras in the editor + shots 2-4 re-taken
Short run: steps 3, 4 and 5 only. Shot 1 is M3a's file, untouched (operator decision SHOT1_STYLE=ink).

### What changed
- **Poster extras** (step 3, cut to the short version): a fieldset in the Caption section (`#poster-extras`, the only
  new id) with five toggles (Stars & quote, Heat pill, Seal, Panel tags, Billing band), the press-quote field and three
  panel-tag fields.
  - State: `state.dressing` (five booleans) plus `caption.quote` and `caption.tags`. The renderer already read
    `state.dressing`, so this run only added the state and the controls (`bindPosterExtras` / `syncPosterExtras` in
    editor/controls.js).
  - Undo: each toggle is one undo step. Quote and tag typing goes through the caption path, so a typing burst within
    1.2 s is one step.
  - localStorage: the dressing toggles, quote and tags are saved with the other settings and checked on load (booleans
    only; quote up to 60 chars; tags up to 28 each).
  - selftest: 18 checks, all pass (16 before). New: flipping the Seal toggle redraws the preview and is one undo/redo
    step; billing off, a new quote and tag 2 come back on the next page.
- **Shots 2-4** (step 4), all in Key Art Slash. Shot scenes now merge the caption over the studio defaults and accept
  an optional `dressing`.
  - The 4:5 layout's second tag moved from y 0.55 to 0.705. The "Harbor Run" script used to cover it.
  - The extras group is compact, so Export PNG stays on screen at 1280x800.
  - Shot 4's crops stay in the upper half of the photo, above its mint car, so no teal reaches the panels.

### Checks (this run)
- dossier.json: 1,077,114 bytes (1.03 MiB), byte-identical across two runs. main.ts still cannot start under
  `ulimit -v 3000000`, so it ran without the limit, as before.
- Kit `check`: 4 passed, 0 failed. The kit copy is still level 26 while the site is at 27, so the operator may want to
  re-download it before submitting.
- Sheet: GATE OK. Shots are 205.8 / 159.1 / 163.5 / 168.5 KiB. All three new covers read at cell size: titles legible,
  faces are faces.
- Shot 1 stats: std 81, bright 0.20, unchanged from M3a (M2: std 64, bright 0.06; rival #1: std 77, bright 0.12).
- The name grep over app/ prints nothing.

### Known issues
- At rail width the tag fields cut long text short (e.g. "THE DRIVE…"). The text is complete; only the box is narrow.
- Shot 4 in Golden Hour still has a faint pale sky in one small lower panel. Sunset Strip would remove it, but shots
  1 and 2 already use that grade.
- Shots 2 and 1 share five photos, and shots 1 and 3 share man-neon. No photo is on more than two shots.
- The seal text ("HOT / SUMMER ’26") has no field yet; only the quote and tags are editable.

## Status: M3a done (run 3, 19 Nov 2026, 16:35-17:00 EET): new shot-1 key art + painterly Poster Ink
Short run: steps 1, 2 and 5 only. The editor fields for the new pieces (step 3) and new shots 2-4 (step 4) are for
the next run; shots 2-4 are unchanged M2 files. Operator decision SHOT1_STYLE=ink: shot 1 stays Poster Ink.

### What changed
- **Key Art Slash** (`keyArtSlash`, engine/layouts.js) is now the first tile, key 1 and the default layout. The other
  7 keep their order on keys 2-8, and the selftest presses 6 for Strip Five.
  - **16:9:** a full-height hero about 58 % wide with a slanted right edge, and five slanted panels beside it: a big
    top panel and two rows of two. **1:1:** the hero on top with four panels below. **4:5:** the hero on top, then
    rows of two and three. Every size has 5-6 photo panels, and none is narrower than about 1/5 of the cover.
  - Panels are polygons, clipped and separated by thin cream frame lines, with a cream outer border. The hit test
    uses point-in-polygon (`insidePoly`), so clicks on slanted edges pick the right panel.
  - **The title sits over the art** (engine/dressing.js `drawKeyArtTitle`):
    - It crosses the hero's lower third and runs into the right panels. It is about 66 % of the cover wide and
      tilted 3°.
    - Fill: a gradient taken from the grade (cream, hot, deep hot). It has a heavy outline, a 6+-step extrude with a
      soft drop shadow, an inner top highlight and 3 sparkle glints.
    - The script sits below and to the right, and its top only reaches the bottom ~15 % of the caps. At sheet size it
      reads "HEATWAVE", not "HFATWAVE".
  - **Dressing.** All of it is drawn by the engine, and all the words are ours:
    - 5 stars and the quote "HOTTER THAN THE ASPHALT" — THE PALM GAZETTE, above the title
    - a HEAT ★★★★☆ pill
    - a HOT / SUMMER ’26 seal on a panel seam
    - 3 tilted white tags: THE CLOSER, CORAL CAUSEWAY · 7:15 PM, THE FIXER
    - a palm-silhouette band with a striped-sun mark and the letter-spaced tagline
    - a billing line of invented credits, a small HW mark and a drawn barcode
  - `state.dressing` (stars / heat / seal / tags / billing) and `caption.quote` / `caption.tags` / `caption.billing`
    are already read by the renderer, but there are no editor controls for them yet (step 3, next run).
- **Painterly Poster Ink** (engine/ink.js). The toggle and the name are the same.
  - Posterize is replaced by a Kuwahara filter on summed-area tables: it paints flat strokes but keeps faces
    continuous-tone, with no bands.
  - The lift to mean luminance 0.47 is gone. An S-curve keeps deep blacks and clips hot highlights to warm cream.
  - Halftone only below a luminance of 0.14, never on skin, with a lighter paper tone.
  - Ink lines are weighted by edge strength: full ink on silhouettes, about 40-60 % on interior detail, and 30 % on
    skin.
  - The grade has a new `keepHighlights` option. Poster Ink uses 0.7, so the gradient map is blended less in the
    highlights and each photo's own sunset sky stays orange and pink.
- **Shot 1** was re-cast with 6 distinct photos:
  - woman-palms as the hero
  - supercar-boulevard in the second-largest panel
  - coupe-desert (a sunset sky, under the title's end)
  - man-neon (a second face, in the free middle-right panel)
  - speedboat and moto-causeway
  - It uses neither the starter's boulevard.jpg nor pier.jpg. No photo is on more than two shots.

### Before / after (shot 1, 1280x720 JPEG of the 1920 export)
| | M2 | M3a |
|---|---|---|
| luminance std | 64 | **81** (target ≥ 72; rival #1: 77) |
| pixels > 215 | 0.06 | **0.20** (target ≥ 0.10; rival #1: 0.12) |
| size | 227.7 KiB | 205.8 KiB |
| photo panels | 10 (4 slivers) | 6 (none under ~1/5 width) |
| title | boxed, 52 % wide, script hides half of it | over the art, about 66 % wide, every letter clear |
Read side by side at sheet size (out/sheet.jpg vs out/sheet_m2.jpg), the new cover won clearly:
- the title is fully readable
- the hero face is painted, smooth and has no dots
- the second face reads
- the car is sharp
- three panels show glowing sunsets
So it was kept.

### Checks (this run)
- dossier.json: 1,062,862 bytes, byte-identical across two runs.
- Kit `check`: 4 passed, 0 failed. It notes that this kit copy is level 26 while the site is at 27, so the operator may
  want to re-download it.
- Sheet: GATE OK, with shots of 205.8 / 169.7 / 159.6 / 155.1 KiB.
- selftest: 16 of 16 pass.
- The name grep is clean.

### Known issues
- The hero's upper sky clips to pale cream (hazy), not orange. The supercar and coupe panels carry the sunset.
- The big Kuwahara pass makes the first uncached 1920 render about 550-630 ms (M2: 215-290 ms). Cached exports still
  take about 5-12 ms.
- Shots 2-4 still show M2's posterized ink. Re-taking them with the new ink and the new layout is step 4, next run.
- Dressing words are fixed defaults until the editor fields land (step 3).

## Status: M2 done (run 2, 19 Nov 2026, 15:14-15:51 EET)
Shot 1 keeps M1's Poster Ink key-art look and layout (operator decision SHOT1_STYLE=ink); it was only made cleaner.

### What M2 added
- **Samples:** 5 new image-model photos (supercar-boulevard, motel-rain, flamingo-boardwalk, marina-skyline,
  pier-fisher), so 15 in app/samples/. They are in the Load samples list and in CREDITS.md.
- **Layouts:** there are now 7, all in 16:9, 1:1 and 4:5, with keys 1-7.
  - **Hero + Four** (`heroFour`): a hero panel about 58 % wide, plus a 2x2 of thin cream-framed photos with a soft
    shadow, two of them tilted 1.4-1.6°. The frames sit on a dusk backdrop tinted by the grade. In 4:5 the hero sits
    on top and the four below it. It works with Poster Ink and every grade; with one photo, every panel gets its own crop.
  - **Grid Four** (`gridFour`): a 2x2 with a centred title badge.
  - **Full Bleed** (`fullBleedInset`): one full-bleed photo plus two framed insets, with the title bottom-left.
- **Grade 5:** Noir Heat (black, blood red, cream).
- **Poster Ink, cleaner:**
  - A skin mask is taken from the crop before the grade. Ink lines on skin are drawn at 40 %, and skin never gets
    halftone dots.
  - Line width and line density follow the panel's short side (sizeK). A 200 px strip gets 1 px lines and keeps the
    top 8 % of edges; a hero panel gets W/640 and keeps 12 %.
  - Halftone only below a luminance of 0.22 (was 0.28), with a lighter paper lift.
  - This deliberately replaces brief section 8's fixed max(2, W/640) line width and 0.28 halftone cutoff, as this
    run's step 3 asked.
- **Shot 1, before and after (both read side by side):** the new one won clearly. There are no dots on the hero's face,
  the supercar fills the big right panel, and the tall row shows four distinct readable faces where M1 had mud. No face
  appears twice (M1 repeated the hero at zoom 2.1). It uses 9 distinct photos.
- **Editor:**
  - Undo/Redo buttons under the preview, plus Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z. Every control change (layout, grade,
    ink, size, caption, panel menu, title edit) is one undo step, and a burst of caption typing within 1.2 s is one
    step. This fixes an M1 bug where undoing a layout change restored the new layout id with the old crops.
  - Drag-and-drop anywhere on the page. A drop onto a preview panel puts the photo in that panel. The highlight no
    longer flickers (depth counter, file drags only).
  - Paste reads image items, such as a copied screenshot.
  - **Export all 3 sizes**: three PNGs from the same state, 250 ms apart.
  - Double-click the title on the preview to edit it in place (`editor/title-edit.js`; Enter keeps the text, Esc
    cancels).
  - **Per-panel menu**: right-click a panel to pick its photo from the tray, reset its crop or clear it
    (`editor/panel-menu.js`).
  - **localStorage** keeps the layout, grade, ink, caption and size, and validates them on load. Photos are never
    stored, and the status line says so. `?shot=` scenes neither read nor write it, so the shots stay reproducible.
  - **Keys popover**: the ⌨ Keys button in the header, or `?`, opens it; Esc or a click outside closes it.
- **Tools:**
  - shoot.mjs takes `SHOOT_LIST` / `SHOOT_DIR`, so trial renders go to out/.
  - Shot scenes take `&layout=&grade=&size=` overrides for trials.
  - selftest.mjs now runs 16 checks and all pass: undo/redo, drop + paste, the panel menu, export-all, the
    localStorage restore, `?` and Esc, and the title double-click.

### Engine and editor from M1 (unchanged unless listed above)
- **Grades:** auto-levels (1-99 percentile, gain ≤ 2.4), then a 256-step LUT gradient map blended with the photo,
  then a contrast curve.
- **Poster Ink pipeline:** box blur W/960, posterize to 5 bands keeping hue, lift to a mean luminance of 0.47,
  halftone, Sobel lines on a half-size copy, then grain and vignette.
- **Lettering:** an Anton gradient title with an outline and hard shadow, a neon Kaushan subtitle, and a Teko tagline
  ribbon. There is a sunset band or dark overlay behind the title, and a "NEW" starburst on the grid layouts.
- **Render:** renderCover draws both the preview and the export. Panel art is cached per (photo, crop, size, grade,
  ink).

## Shots (screenshots/; no photo on more than two shots)
| shot | content | file |
|---|---|---|
Current set (M4; shots 2-4 from M3b):
| shot | content | file |
|---|---|---|
| 1-cover-1920.jpg | exported 1920x1080: Key Art Slash, Sunset Strip, painterly Poster Ink, Sky glow on, 6 distinct photos (M4) | 1280x720, 207.3 KiB |
| 2-editor.jpg | editor 1280x800: Key Art Slash (NIGHT DRIVE), hero selected, 8 layout tiles, grade chips, Poster extras toggles + quote/tag fields, Undo live | 159.1 KiB |
| 3-cover-1080x1350.jpg | exported 1080x1350: Key Art Slash, Neon Night, SALT & SIRENS, 6 photos | 864x1080, 163.5 KiB |
| 4-cover-1080.jpg | exported 1080x1080: Key Art Slash from ONE photo (lady-motel) in 5 crops, Golden Hour, MOTEL MIRAGE | 960x960, 168.5 KiB |

The method is the same as M1: Playwright clicks Export, saves the PNG and redraws it scaled into a JPEG.
M2's set (for history): Key Art Nine / Hero + Four editor / Snapshots in Neon Night / Grid Four in Miami Teal from
flamingo-boardwalk.

## Numbers (headless Chromium, this machine)
- First 1920x1080 Key Art Nine render with Poster Ink (scene render): 215-290 ms. A cached export takes about 5 ms.
  The selftest's last uncached export takes about 160 ms.
- dossier.json: 1,069,203 bytes (1.02 MiB of the 1.3 MiB budget), byte-identical across two runs. Kit `check`:
  4 passed, 0 failed (the rest are checked at submission).
- Judge-sheet preview: GATE OK. The cover reads at 768x432 (hero face, car and four faces readable).

## Known issues / bugs
- Under `ulimit -v 3000000`, Node 22 cannot start main.ts (its TypeScript stripping cannot reserve WebAssembly memory),
  so main.ts was run without the limit, as in M1.
- Changing the layout re-runs auto-fill, so hand-set crops are lost (undo brings them back).
- Fixed late in M2: the preview's pointerdown also started a pan on a right-click; it now reacts to the primary button
  only (the panel menu selects its own panel).
- index.html now has 19 ids (brief section 9 suggested ≤ 14). The extra ones are the feature controls (undo-btn,
  redo-btn, export-all, keys-btn, keys-pop).
- Noir Heat is muddy on night photos with warm light (it reads well on daylight photos).

## Next (M3)
- An editable sticker text and badges in the rivals' style (stars, an "EST." seal, a corner ribbon), numbered panel
  labels, and per-photo face-aware smart crops.
- Saving photos to localStorage as small data URLs under a size cap.
- Halftone density on dark backgrounds in Noir Heat.
