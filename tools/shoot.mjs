// Takes the screenshots listed in shots.json with headless Chromium (Playwright from env PW_NODE_MODULES).
// Uses the static server already running at SHOOT_BASE (default http://127.0.0.1:8811/); starts no server.
// kind "export": open the ?shot= scene, wait for window.__shotReady, click Export PNG, catch the download, then draw
// that exact PNG scaled down into a JPEG, stepping quality down from 0.92 until it fits the budget.
// kind "page": a 1280 x 800 page screenshot with the same quality loop.
// Usage: node tools/shoot.mjs [shot-name ...]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const require = createRequire(`${process.env.PW_NODE_MODULES}/`);
const { chromium } = require('playwright');
const base = process.env.SHOOT_BASE ?? 'http://127.0.0.1:8811/';
// SHOOT_LIST / SHOOT_DIR: an alternative shot list and output folder (trial shots go to out/ and leave screenshots/ alone).
const shots = JSON.parse(readFileSync(process.env.SHOOT_LIST ?? 'shots.json', 'utf8'));
const outDir = process.env.SHOOT_DIR ?? 'screenshots';
const only = process.argv.slice(2);
mkdirSync('out', { recursive: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const shot of shots) {
    if (only.length && !only.includes(shot.name)) continue;
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', (e) => console.log(`[${shot.name}] page error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') console.log(`[${shot.name}] console: ${m.text()}`); });
    await page.goto(`${base}index.html${shot.query}`);
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 120000 });
    let jpeg;
    if (shot.kind === 'page') {
      for (let q = 92; q >= 40; q -= 4) {
        jpeg = await page.screenshot({ type: 'jpeg', quality: q });
        if (jpeg.length <= shot.budget) break;
      }
    } else {
      const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-png')]);
      const pngPath = `out/${shot.name.replace(/\.jpg$/, '')}.png`;
      await download.saveAs(pngPath);
      const b64 = readFileSync(pngPath).toString('base64');
      const dataUrl = await page.evaluate(async ({ b64, w, h, budget }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.imageSmoothingEnabled = true;
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, 0, 0, w, h);
        let url = '';
        for (let q = 0.92; q >= 0.4; q -= 0.04) {
          url = c.toDataURL('image/jpeg', q);
          if (((url.length - 23) * 3) / 4 <= budget) break;
        }
        return url;
      }, { b64, w: shot.w, h: shot.h, budget: shot.budget });
      jpeg = Buffer.from(dataUrl.split(',')[1], 'base64');
      const info = await page.evaluate(() => ({ exportMs: window.__lastExport?.ms, renderMs: window.__renderMs }));
      console.log(`${shot.name}: export render ${info.exportMs} ms, scene render ${info.renderMs} ms`);
    }
    writeFileSync(`${outDir}/${shot.name}`, jpeg);
    console.log(`${shot.name}: ${jpeg.length} bytes (${(jpeg.length / 1024).toFixed(1)} KiB)`);
    await context.close();
  }
} finally {
  await browser.close();
}
