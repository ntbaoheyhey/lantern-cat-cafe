import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(resolve('apps/web/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const evidence = [];
mkdirSync('reports/scorecard/base0/hud-repair/screens', { recursive: true });
for (const width of [1280, 1600]) {
  const page = await browser.newPage({ viewport: { width, height: width * 9 / 16 } });
  await page.goto(`file://${resolve('reports/ui-redesign/index.html')}#stage`);
  await page.locator(`[data-w="${width}"]`).click();
  await page.evaluate(() => document.fonts.ready);
  // Keep the reference's native app dimensions rather than the toolbar's scaled preview.
  await page.addStyleTag({ content: 'body{padding:0}.bar,.note{display:none}.vp{border:0}.app{transform:none!important}' });
  for (const screen of ['stage', 'bag', 'map', 'forge', 'market', 'char', 'help', 'states', 'landing', 'class']) {
    await page.locator(`[data-k="${screen}"]`).evaluate(button => button.click());
    await page.evaluate(width => { document.body.style.padding = '0'; document.querySelector('.bar').style.display = 'none'; document.querySelector('.note').style.display = 'none'; const vp = document.querySelector('.vp'); vp.style.border = '0'; vp.style.width = `${width}px`; vp.style.height = `${width * 9 / 16}px`; document.querySelector('.app').style.transform = 'none'; }, width);
    evidence.push(await page.evaluate(({ width, screen }) => ({ width, screen, app: {width:document.querySelector('.app').offsetWidth,height:document.querySelector('.app').offsetHeight}, xpTrack: document.querySelector('.bar-t')?.getBoundingClientRect().toJSON() ?? null }), { width, screen }));
  }
  await page.locator('[data-k="stage"]').evaluate(button => button.click());
  await page.evaluate(width => { document.querySelector('.vp').style.height = `${width * 9 / 16}px`; document.querySelector('.app').style.transform = 'none'; }, width);
  if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: `reports/scorecard/base0/hud-repair/screens/reference-${width}.png` });
  await page.close();
}
await browser.close();
writeFileSync('reports/scorecard/base0/hud-repair/reference.json', JSON.stringify(evidence,null,2)+'\n');
console.log('Reference: all ten screens at 1280×720 and 1600×900; native XP geometry recorded.');
