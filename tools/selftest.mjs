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
  const gradeNow = () => page.getAttribute('#grade-swatches button.on', 'data-grade');
  await page.click('#undo-btn');
  const undone = await gradeNow();
  await page.keyboard.press('Control+y');
  const redone = await gradeNow();
  check(undone === 'sunsetStrip' && redone === 'neonNight', `Undo button and Ctrl+Y step the grade back and forth (${undone} / ${redone})`);
  // Drop a file onto the preview (it lands in the panel under the pointer), then paste one from the clipboard.
  const trayBefore = await page.locator('#photo-tray img').count();
  const dropped = await page.evaluate(async () => {
    const blob = await (await fetch('samples/pier.jpg')).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'dropped.jpg', { type: 'image/jpeg' }));
    const c = document.getElementById('cover-preview'), r = c.getBoundingClientRect();
    const at = { clientX: r.left + r.width * 0.2, clientY: r.top + r.height * 0.3, bubbles: true, cancelable: true, dataTransfer: dt };
    c.dispatchEvent(new DragEvent('dragenter', at));
    c.dispatchEvent(new DragEvent('drop', at));
    await new Promise((res) => setTimeout(res, 600));
    const pasted = new DataTransfer();
    pasted.items.add(new File([blob], 'pasted.jpg', { type: 'image/jpeg' }));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: pasted, bubbles: true, cancelable: true }));
    await new Promise((res) => setTimeout(res, 600));
    return document.getElementById('export-status').textContent;
  });
  // Right-click a panel: the panel menu opens; picking a photo puts it in that panel and closes the menu.
  const cb = await page.locator('#cover-preview').boundingBox();
  await page.mouse.click(cb.x + cb.width * 0.15, cb.y + cb.height * 0.3, { button: 'right' });
  const menuOpen = await page.isVisible('.panel-menu');
  await page.click('.panel-menu-photos button:nth-child(3)');
  const picked = await page.evaluate(() => document.querySelector('.panel-menu') === null);
  check(menuOpen && picked, 'right-click opens the panel menu and a photo pick closes it');
  const trayAfter = await page.locator('#photo-tray img').count();
  check(trayAfter === trayBefore + 2 && /in the tray/.test(dropped), `drop on a panel + paste add 2 photos (${trayBefore} -> ${trayAfter}; "${dropped}")`);
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
  const all = [];
  page.on('download', (d) => all.push(d.suggestedFilename()));
  await page.click('#export-all');
  await page.waitForFunction(() => (window.__lastExportAll ?? []).length === 3, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  check(all.length === 3 && ['1080x1080', '1080x1350', '1920x1080'].every((s) => all.includes(`heatwave-${s}.png`)), `Export all 3 sizes -> ${all.join(', ')}`);

  // One photo through the real file input: every panel gets its own crop; keys 5 (Strip Five), G (grade), E (export).
  const one = await context.newPage();
  one.on('pageerror', (e) => errors.push(e.message));
  await one.goto(`${base}index.html`);
  await one.setInputFiles('#photo-input', 'app/samples/woman-palms.jpg');
  await one.waitForFunction(() => document.querySelectorAll('#photo-tray img').length === 1);
  // localStorage: the first page's caption, grade and size come back on the second page.
  const keptTitle = await one.inputValue('#caption-title');
  const keptSize = await one.getAttribute('#size-buttons button.on', 'data-size');
  check(keptTitle === 'TEST TITLE' && keptSize === '1920x1080', `settings restored from localStorage (${keptTitle}, ${keptSize})`);
  const gradeBefore = await one.getAttribute('#grade-swatches button.on', 'data-grade');
  await one.keyboard.press('5');
  await one.keyboard.press('g');
  const layoutOn = await one.getAttribute('#layout-tiles button.on', 'data-layout');
  const gradeOn = await one.getAttribute('#grade-swatches button.on', 'data-grade');
  check(layoutOn === 'stripFive' && gradeOn !== gradeBefore, `keys 5 and G pick stripFive and the next grade (${layoutOn} / ${gradeBefore} -> ${gradeOn})`);
  // Shortcut popover: "?" opens it, Esc closes it.
  await one.keyboard.press('?');
  const popOpen = await one.isVisible('#keys-pop');
  await one.keyboard.press('Escape');
  const popClosed = !(await one.isVisible('#keys-pop'));
  check(popOpen && popClosed, `"?" opens the shortcut list and Esc closes it`);
  // Double-click the title on the preview (Strip Five puts it across the middle), type, Enter.
  const pb = await one.locator('#cover-preview').boundingBox();
  await one.mouse.dblclick(pb.x + pb.width / 2, pb.y + pb.height / 2);
  const opened = await one.locator('.title-inline-edit').count();
  if (opened) { await one.fill('.title-inline-edit', 'night drive'); await one.keyboard.press('Enter'); }
  const titleNow = await one.inputValue('#caption-title');
  check(opened === 1 && titleNow === 'NIGHT DRIVE', `double-click the title edits it in place (${titleNow})`);
  const [dl1] = await Promise.all([one.waitForEvent('download'), one.keyboard.press('e')]);
  check(dl1.suggestedFilename() === 'heatwave-1920x1080.png', `key E exports one-photo cover -> ${dl1.suggestedFilename()}`);
  check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
} finally {
  await browser.close();
}
process.exit(failures.length ? 1 : 0);
