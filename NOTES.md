# NOTES (HEATWAVE Cover Studio)

## Status: M9 done (run 10, 21 Nov 2026, 09:40-09:50 EET): no layout collisions on shot 1
An independent panel kept M8's cast grid but kept naming one flaw on shot 1: the seal sat on THE NIGHT OWL tag and
hid OWL, and the review-quote line ran straight into that tag, so the two read as one crowded strip. M9 changes only
the positions of the seal and one tag.

### What changed
- Seal (Key Art Cast only): moved from the panel junction [0.79, 0.577] onto the open sunset sky of the rider panel
  [0.865, 0.665]. There it touches no tag, face or title letter. It sits below THE OLD SALT, left of the palms and
  above the rider.
- THE NIGHT OWL tag: moved from the panel's lower-left [0.69, 0.47] to [0.655, 0.4], just under the woman's chin
  (clear of her face). It no longer shares a row with the quote, so the quote line now ends in open art with clear
  space after it.
- Not changed: photos, grid, title, script, quote text and size, grade, frame. The quote and seal drawing code
  (dressing.js) is untouched, so shots 2-4 can't change (they don't use Key Art Cast).

### A/B at 1024x576 (out/ab/before_1024.jpg = M8, out/ab/m9_1024.jpg = M9; crops before_crop / m9_crop): kept
All 8 role tags can be read in full. The HOT seal is a clean badge on open sky instead of a patch over a tag. The
quote line stands alone above the title. Nothing else moved. The full-size crop confirms the tag sits under the chin
and doesn't touch the face.

### Checks
- Judge-sheet preview: GATE OK. Shots 219.6 / 159.6 / 163.5 / 168.0 KiB, all within the gate sizes.
- Dossier: 1,109,753 B, byte-identical on two runs (<= 1.3 MiB). Name grep over app/: clean.
- Selftest: 22/22. Kit check: 4 passed, 0 failed (17 skipped, 5 checked at submission).

### Known issues / next
- The area where the title meets the lower panels was not changed in M9 (the run allowed only seal, tag and quote
  moves). Next: an A/B that gives the title's right end a little more air, judged at 1024x576.

## Status: M8 done (run 9, 21 Nov 2026, 09:02-09:12 EET): people-first cast cover on shot 1
The six covers ranked above ours on the dev board are all cast covers (7-9 portrait panels, each with a short role
tag, around one big title). M8 turns shot 1 into a cast cover and keeps everything M7 had.

### What changed
- New layout Key Art Cast (`keyArtCast` in app/src/engine/layouts.js; shot 1 only, not in the picker). The rooftop
  hero stays on the left and is still the biggest image. Beside her is a 3 + 3 grid of portraits: woman-palms,
  man-neon, couple-pier, then neon-closeup, lady-motel, pier-fisher. Under the title, the neon marina night stays as
  the cool accent, and the rider (moto-causeway) sits bottom-right. That makes 8 people panels, 9 distinct photos
  and no vehicle or scenery panel apart from the night accent. The seal moved to the junction of the mid row and the
  bottom-right panel.
- Role tags (our own wording, in our existing tag style, at each panel's lower-left or upper-left, off the faces):
  THE CLOSER, THE TIPSTER, THE BROKER, THE NEWLYWEDS, THE ALIBI, THE NIGHT OWL, THE OLD SALT, THE FIXER. They are
  set in the shot scene's caption.tags. The editor still keeps 3 tags.
- No photos added (duo-causeway and hero-duo were not needed). main.ts header line for shot 1 updated.
- Kept as before: the HEATWAVE title, the Coastline Nights script, the quote, the band and the billing line, ink 0
  (crisp), Sky glow, and warm and cool scenes side by side. Shots 2-4 untouched.

### A/B at 1024x576 (out/ab/before_1024.jpg = M7, out/ab/m8b_1024.jpg = M8): kept
At the judge's size M8 reads at once as a cast cover: 8 faces, each with a readable tag, and the hero still dominant.
Every portrait face is readable. Nothing regressed: the title, script and dressing are unchanged, and the
neon/purple panels (man-neon, neon-closeup, the marina) still sit against the sunset ones. The first try hid THE
ALIBI and clipped THE NIGHT OWL under the quote line. Fix: THE ALIBI moved to the top-left of its panel and the
close-up was re-cropped (zoom 1.3) so the face moved right, away from the tag. THE NIGHT OWL moved up, right of the
quote's end.

### Checks (this run)
GATE OK. Shots: 217.2 KiB 1280x720 / 159.1 KiB 1280x800 / 163.5 KiB 864x1080 / 168.5 KiB 960x960. Dossier is
1,106,251 B and byte-identical across two runs. Name grep clean. selftest 22/22. Kit check after the final commit.

### Known issues
- The quote's sparkle slightly nicks the THE NIGHT OWL tag. The tag still reads.
- The outer frame is still the light cream border. There was no time to make it dark or edge to edge.
- The rider's face is small. He reads as a figure, not a portrait.

### Next
- Dark or edge-to-edge outer frame on shot 1 (keyart border colour per layout).
- Give the rider panel a true portrait (e.g. hero-duo or duo-causeway) and move the night accent's tag-free space
  so the seal sits fully on scenery.

## Status: M7 done (run 8, 19 Nov 2026, 21:03-21:13 EET): one more story beat on shot 1, contrast kept
Short run on shot 1 at the dev judge's size (1024x576; the judge sees only shot 1). Everything M5 has is kept: the
rooftop hero, the HEATWAVE title and script, all dressing, the crisp no-ink look, Sky glow, and the neon marina night
panel at its M5 size and position. Shots 2-4 are untouched. (The M6 try, a bigger re-slot with a man close-up, a
couple and a speedboat, was not kept: it shrank the marina to a sliver under the HEAT pill and put the speedboat
partly under the title, so the cover went all warm.)

### What changed
- New layout variant Key Art Slash Plus (engine/layouts.js, `keyArtSlashPlus`; shot 1 only, not in the layout
  picker, so the editor and shot 2 keep plain Key Art Slash). It is Key Art Slash with a seventh slanted panel cut
  from the hero's empty right-hand sky at top-middle (art x 0.452-0.6, y 0-0.42), between the hero and the marina.
  It sits clear of the title, script, quote line, seal (on its bottom-right corner, at the same junction as before)
  and the HEAT pill. The hero polygon gets a notch but keeps the same bounding box, so its crop is unchanged and
  it stays the biggest image. Panels 1-5 are byte-for-byte the M5 polygons.
- Shot 1 (dev/shot-scenes.js, `cover-keyart`): layout `keyArtSlashPlus`; the new panel shows the daytime speedboat
  by the towers (`speedboat`, already in app/samples, credited; zoom 1.2, fx 0.5, fy 0.55). Seven distinct photos.
  No photos were added this run. No tag sits on a face or rider (the tags are unchanged; the new panel has none).
- main.ts header line about shot 1 now names Key Art Slash Plus and the speedboat panel.

### A/B at 1024x576 (out/ab/before_1024.jpg = M5, out/ab/m6_tried_1024.jpg, out/ab/after_m7_1024.jpg): KEPT
Read in that order. M7 reads as M5 plus one beat: the white speedboat on the water under the high-rises reads as
one clear subject in its own panel; the neon marina night (red car, white-suit figure) is the same size and as
visible as in M5, so the warm/cool contrast is intact; the hero's face, hair and aviators are untouched (her hair
ends well left of the new panel); the title, script, quote, seal and pill are where they were. Unlike M6 nothing
shrinks or slides under the title. Cost: a slice of the hero's sunset sky. Readable story panels go from 3 to 4
(plus the hero). The speedboat panel is warm-graded by Sunset Strip, so it adds a beat more than it adds blue.

### Checks (this run)
- Judge-sheet preview: GATE OK.
- Shots: 1 = 1280x720, 226,731 B (221.4 KiB); 2 = 1280x800, 162,895 B; 3 = 864x1080, 167,377 B; 4 = 960x960,
  172,510 B. All <= 256 KiB, long side <= 1280, short side >= 480.
- Dossier: 1,110,550 B, byte-identical on two runs (rm before each), <= 1.3 MiB.
- Name grep over app/: prints nothing.
- Selftest: 22/22 ok, no page errors (app/src changed).
- Kit check: 4 passed, 0 failed, 17 skipped, 5 checked at submission.

### Known issues
- The speedboat panel is small at judge size (about 140x200 px at 1024x576) and warm-graded; it reads, but less
  strongly than the right-column panels.
- Key Art Slash Plus exists only for 16:9 (it spreads Key Art Slash's square and tall specs unchanged) and is not
  offered in the editor's layout picker.

### Next
- Try a second daytime beat that is truly sea-blue (e.g. duo-causeway or the speedboat with a per-panel cool
  grade) in a clear zone, without touching the marina panel; A/B at 1024x576 again.
- Consider offering Key Art Slash Plus in the picker (the selftest counts 8 layout tiles, so update it then).

## Status: M5 done (run 6, 19 Nov 2026, 19:42-20:16 EET): crisp shot 1 + a cinematic hero
Short run on shot 1's ART at judge size (768x432). Key Art Slash, the HEATWAVE title, the dressing and Sky glow are
unchanged. Shots 2-4 are untouched (M3b files).

### What changed
- **Step 1: crisp look (gap 2). KEPT: shot 1 has no Poster Ink now.**
  - Ink is chosen per shot scene (`ink: <0..1>` in app/src/dev/shot-scenes.js; 0 = off, 0.8 when a scene says nothing).
    `&ink=0|<strength>` overrides it for trial renders, like `&glow=`. Only `cover-keyart` sets `ink: 0`. Shots 2-4
    keep 0.8, and the editor shot still shows the Poster Ink toggle. Poster Ink is unchanged as an editor feature.
  - **No-ink lift that keeps shadows** (`liftKeepShadows` in engine/ink.js, used by `panelArt` for every no-ink
    render, not only shots). The old gamma lift to a mean of 0.44 made the ink-0 trial milky. The new one fades the
    lift out below about 0.25 and pushes the toe down, so hair and shadows stay deep. Mid-tones and highlights get the
    same lift as before.
  - Trials (out/ab/, 1280x720 JPEG of the 1920 export, read next to before.jpg and rival #1 at 768x432):

    | shot 1 trial | std | bright (>215) | dark (<40) | read at 768x432 |
    |---|---|---|---|---|
    | before (M4, ink 0.8) | 77 | 0.15 | 0.25 | halftone dots in the hero's hair, soft man and moto panels |
    | ink 0.8 (re-render) | 77 | 0.15 | 0.25 | byte-size identical to M4's file (207.3 KiB) |
    | ink 0.35 | 75 | 0.15 | 0.23 | still painterly-soft |
    | ink 0, old lift | 74 | 0.15 | 0.20 | sharp, but milky and pastel |
    | **ink 0, new lift (kept)** | 75 | 0.15 | 0.21 | sharp faces, no dots, dark hair and shadows, skies still glow |
    | rival #1 | 76 | 0.11 | 0.27 | |

    The dark fraction drops with ink off because ink lines and halftone added dark pixels. The new lift keeps the
    shadows that are in the photo.
- **Step 2: cinematic hero and readable panels (gaps 1 and 4). KEPT.**
  - 3 of the operator's 5 photos in briefs' assets_s268 were added to app/samples/ (all .jpg, no text, letters, logos or
    watermarks, fictional people): **hero-rooftop**, **marina-night** and **neon-closeup**. They are in the sample list
    (`SAMPLE_PHOTOS`, now 18) and in CREDITS.md. duo-causeway and hero-duo were not used (see below).
  - New shot-1 cast (six distinct photos):

    | slot | photo | why |
    |---|---|---|
    | 0 hero | hero-rooftop | a woman in aviators looking out of frame under a blazing sunset sky (fx 0.4) |
    | 1 big top-right | marina-night | cool magenta night: red car, white-suit figure, boats |
    | 2 under the seal | coupe-desert | sky and palms |
    | 3 middle-right | neon-closeup | a tense face in cyan and magenta neon |
    | 4 under the title | marina-skyline | scenery |
    | 5 bottom-right | moto-causeway | re-cropped (zoom 1.25, fx 0.55, fy 0.5) so the rider sits right of THE FIXER tag, above the band |

  - A/B (out/ab/cmp_step2.jpg): the hero now reads as a film still, not a headshot. Three visible panels each show one
    clear subject, and two of them are cool night and neon against the warm hero. Shot 1: std 75, bright 0.13, dark
    0.24, 212.7 KiB.
  - Hero A/B (out/ab/cmp_hero.jpg): **hero-duo** (fx 0.3) lost to hero-rooftop. Its two faces are smaller and look into
    the lens, THE CLOSER tag touches the man's hair, and the title hides the red car. It was not copied into the repo.
  - **duo-causeway** was not used. It is a portrait frame, and in the only open small slot (5) both faces land under
    THE FIXER tag.
  - No photo is on more than two shots: coupe-desert and moto-causeway are on shots 1 and 2, marina-skyline on 1 and 3.
    woman-palms and supercar-boulevard left shot 1 but are still on shot 2.
- **Step 3: cool contrast per panel (gap 3). Tried, REVERTED.**
  - Built a per-panel grade:
    - `slot.gradeId`, falling back to the cover's grade, used in the panel's grade, Sky glow palette, ink paper and
      cache key
    - a 'Panel grade' chip row in the right-click panel menu, one undo step
    - a selftest hash check that a panel without its own grade renders exactly as before
    - an `&pgrade=` override
  - Trials, read at 768x432 (out/ab/cmp_step3*.jpg, cmp_pgrade.jpg, cmp_teal.jpg):

    | variant | std / bright / dark | read |
    |---|---|---|
    | Neon Night on marina + close-up | 76 / 0.13 / 0.26 | the red car turns purple and the face becomes a flat blue duotone |
    | Neon Night on marina only | 76 / 0.13 / 0.25 | indigo marina, but the car is purple |
    | Miami Teal on marina | 74 / 0.13 / 0.22 | teal block, but the car goes maroon and the panel looks muddy |
    | Miami Teal on both | not measured | the face turns green-teal |

    None was clearly better than step 2: its photo choice already gives a magenta-violet night panel and a neon face.
    So the code was restored with git. The trial diff is kept locally at out/ab/step3_panel_grade_trial.diff (out/ is
    not in git).

### Checks (this run)
- selftest: 22 of 22 pass (after the step 1 and step 2 code changes; the tray now loads 18 samples).
- dossier.json: 1,097,742 bytes (1.05 MiB of 1.3 MiB), byte-identical across two runs. main.ts still cannot start under
  `ulimit -v 3000000`, so it ran without the limit, as in every run before.
- Shot gate: 212.7 / 159.1 / 163.5 / 168.5 KiB. All are ≤ 256 KiB, with the long side ≤ 1280 and the short side ≥ 480.
  The sheet tool prints GATE OK, and shot 1 reads at cell size.
- The name grep over app/ prints nothing.
- Kit `check`: run after the NOTES commit (see the final report of this run).

### Known issues
- The hero photo's top edge sits just above her hair. The sky is beside her, not above her head, and the zoom cannot
  go below 1 to show more.
- `liftToMeanLuminance` in engine/ink.js is no longer called (the no-ink path uses `liftKeepShadows`). It is left
  exported; remove it in a later clean-up.
- Shot 2 (the editor) still shows Poster Ink on, and woman-palms / supercar-boulevard in its preview. That is
  deliberate: it shows the ink feature.
- The moto rider in slot 5 sits close to THE FIXER tag's right edge (about 0.01 of the cover width apart).

### Next
- A per-panel grade that keeps the photo's own hues (e.g. a blend of the gradient map with the photo, or a cool tint
  only on the shadows) would give a cool panel without the purple car. Start from the trial diff.
- Shot 4's pale motel walls under Sky glow (a wall test), and re-taking shot 2 so it shows the Sky glow toggle.

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
Current set (M7; shots 2-4 from M3b):
| shot | content | file |
|---|---|---|
| 1-cover-1920.jpg | exported 1920x1080: Key Art Cast, Sunset Strip, no Poster Ink (crisp grade, deep shadows), Sky glow on, rooftop hero in aviators (biggest), 3 + 3 portrait grid and the rider, 8 people each with a role tag, neon marina night accent under the title, 9 distinct photos (M8), seal on the rider panel's open sky and NIGHT OWL tag clear of the quote (M9) | 1280x720, 219.6 KiB |
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
