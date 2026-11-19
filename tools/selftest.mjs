// Smoke test of the editor in headless Chromium (Playwright from env PW_NODE_MODULES), against the static server
// at SHOOT_BASE (default http://127.0.0.1:8811/). Loads samples, picks a layout, drags and zooms a panel, edits the
// caption, switches size, exports each size and checks the downloaded PNG's name and pixel size. Exit 1 on failure.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';

const require = createRequire(`${process.env.PW_NODE_MODULES}/`);
const { chromium } = require('playwright');
const base = process.env.SHOOT_BASE ?? 'http://127.0.0.1:8811/';
mkdirSync('out', { recursive: true });
const failures = [];
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failures.push(what); };

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}index.html`);
  await page.click('.btn-samples');
  await page.waitForFunction(() => document.querySelectorAll('#photo-tray img').length >= 10);
  check(true, 'samples load into the tray');
  await page.click('#layout-tiles button[data-layout="heroAndSix"]');
  const box = await page.locator('#cover-preview').boundingBox();
  const x = box.x + box.width * 0.75, y = box.y + box.height * 0.3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 20, { steps: 5 });
  await page.mouse.up();
  const sel = await page.evaluate(() => document.querySelector('.drag-pill').hidden === false);
  check(sel, 'click selects a panel and shows the drag pill');
  await page.mouse.wheel(0, -300);
  const zoom = +(await page.inputValue('#crop-zoom'));
  check(zoom > 1.05, `wheel zooms the selected panel (zoom ${zoom.toFixed(2)})`);
  await page.fill('#caption-title', 'TEST TITLE');
  await page.click('#grade-swatches button[data-grade="neonNight"]');
  for (const size of ['1080x1080', '1080x1350', '1920x1080']) {
    await page.click(`#size-buttons button[data-size="${size}"]`);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-png')]);
    const path = `out/selftest-${size}.png`;
    await dl.saveAs(path);
    const png = readFileSync(path);
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    check(dl.suggestedFilename() === `heatwave-${size}.png` && `${w}x${h}` === size, `export ${size} -> ${dl.suggestedFilename()} ${w}x${h}`);
  }
  const ms = await page.evaluate(() => window.__lastExport?.ms);
  console.log(`last export render: ${ms} ms`);

  // One photo through the real file input: every panel gets its own crop; keys 4 (Strip Five), G (grade), E (export).
  const one = await context.newPage();
  one.on('pageerror', (e) => errors.push(e.message));
  await one.goto(`${base}index.html`);
  await one.setInputFiles('#photo-input', 'app/samples/woman-palms.jpg');
  await one.waitForFunction(() => document.querySelectorAll('#photo-tray img').length === 1);
  await one.keyboard.press('4');
  await one.keyboard.press('g');
  const layoutOn = await one.getAttribute('#layout-tiles button.on', 'data-layout');
  const gradeOn = await one.getAttribute('#grade-swatches button.on', 'data-grade');
  check(layoutOn === 'stripFive' && gradeOn === 'neonNight', `keys 4 and G pick stripFive / neonNight (${layoutOn} / ${gradeOn})`);
  const [dl1] = await Promise.all([one.waitForEvent('download'), one.keyboard.press('e')]);
  check(dl1.suggestedFilename() === 'heatwave-1920x1080.png', `key E exports one-photo cover -> ${dl1.suggestedFilename()}`);
  check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
} finally {
  await browser.close();
}
process.exit(failures.length ? 1 : 0);
