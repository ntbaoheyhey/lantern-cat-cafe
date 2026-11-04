import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
const root = '/Users/bao/taskbar-hero-single', web = resolve(root, 'apps/web');
const out = '/Users/bao/taskbar-hero-ui-ledger/reports/ui/cards/SINGLE-POLISH';
mkdirSync(out, { recursive: true });
const require = createRequire(resolve(web, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const { preview } = await import(pathToFileURL(require.resolve('vite')).href);
const port = 5340;
const sock = createServer(); await new Promise((ok, fail) => { sock.once('error', fail); sock.listen(port, '127.0.0.1', ok); }); await new Promise(ok => sock.close(ok));
const report = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), productIdenticalToMain: true, samples: [] };
const save = () => writeFileSync(resolve(out, 'keyboard-performance.json'), JSON.stringify(report, null, 2)+'\n');
let browser, server;
try {
 server = await preview({ root: web, envDir: false, build: { outDir: 'dist-v2/e2e-5301' }, preview: { port, strictPort: true } });
 browser = await chromium.launch();
 for (const width of [1280, 1600]) for (const reducedMotion of ['no-preference', 'reduce']) {
  const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 720 : 900 }, reducedMotion });
  const row = { width, reducedMotion, errors: [], checks: [], tabOrder: [], typography: [] };report.samples.push(row);save();
  page.on('pageerror', e => row.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') row.errors.push(m.text()); });
  await page.addInitScript(() => {
   localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
   window.__singleShifts=[];
   new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__singleShifts.push(e.value); }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`http://localhost:${port}/#landing`); await expect(page.getByTestId('landing-start')).toBeVisible();
  for(let i=0;i<8;i++) { await page.keyboard.press('Tab'); row.tabOrder.push(await page.evaluate(() => {const e=document.activeElement;return { tag:e.tagName, testId:e.getAttribute('data-testid'), name:e.getAttribute('aria-label')||e.textContent?.slice(0,80), outline:getComputedStyle(e).outline, boxShadow:getComputedStyle(e).boxShadow, focusVisible:e.matches(':focus-visible') };})); }
  await page.getByTestId('landing-start').focus();row.landingFocus=await page.getByTestId('landing-start').evaluate(e=>({outline:getComputedStyle(e).outline,boxShadow:getComputedStyle(e).boxShadow,focusVisible:e.matches(':focus-visible')}));await page.screenshot({path:resolve(out,`landing-focus-${width}-${reducedMotion}.png`)});await page.keyboard.press('Enter');await expect(page.getByTestId('class-picker')).toBeVisible();
  const radios=page.getByRole('radio');await radios.first().focus();await page.keyboard.press('ArrowRight');
  row.checks.push({name:'Class radio arrow selects and focuses next option',passed:await radios.nth(1).evaluate(e=>e===document.activeElement&&e.getAttribute('aria-checked')==='true')});
  const choose=page.getByTestId('class-picker-choose-button'), confirm=page.getByTestId('class-picker-confirm-button');
  await choose.focus();await page.keyboard.press('Enter');await expect(confirm).toBeVisible();
  await page.waitForTimeout(250);
  row.checks.push({name:'Confirmation receives focus after Enter',passed:await confirm.evaluate(e=>e===document.activeElement)});
  await page.screenshot({path:resolve(out,`confirm-${width}-${reducedMotion}.png`)});
  await page.keyboard.press('Escape');await page.waitForTimeout(150);
  row.checks.push({name:'Escape closes confirmation and returns focus',passed:await confirm.count()===0&&await choose.evaluate(e=>e===document.activeElement)});
  if(await confirm.count()) await page.getByRole('button',{name:'Cancel',exact:true}).click();
  row.checks.push({name:'Cancel returns focus to choose',passed:await choose.evaluate(e=>e===document.activeElement)});
  await choose.click();await confirm.click();await expect(page.getByTestId('home-dashboard')).toBeVisible();await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const perf=await page.evaluate(()=>new Promise(resolve=>{const dt=[];let last;let end=performance.now()+5000;const tick=now=>{if(last!==undefined)dt.push(now-last);last=now;if(now<end)requestAnimationFrame(tick);else{const sorted=[...dt].sort((a,b)=>a-b);resolve({fps:1000/(dt.reduce((a,b)=>a+b,0)/dt.length),p95Ms:sorted[Math.floor(sorted.length*.95)],longFrames:dt.filter(x=>x>250).length,cls:window.__singleShifts.reduce((a,b)=>a+b,0)});}};requestAnimationFrame(tick);}));row.performance=perf;
  row.homeAccessibilityTree=await page.locator('body').ariaSnapshot();
  row.liveRegions=await page.locator('[aria-live],[role=status],[role=log],[role=alert]').evaluateAll(es=>es.map(e=>({role:e.getAttribute('role'),live:e.getAttribute('aria-live'),label:e.getAttribute('aria-label'),text:e.textContent?.slice(0,100)})));
  for(const name of ['home','bag','map','forge','market','hero','help']) {
   const nav=page.getByTestId('nav-'+name);await nav.focus();await page.keyboard.press('Enter');await expect(nav).toHaveAttribute('aria-selected','true');
   row.navigationFocus??=[];row.navigationFocus.push({screen:name,...await nav.evaluate(e=>({outline:getComputedStyle(e).outline,boxShadow:getComputedStyle(e).boxShadow,focusVisible:e.matches(':focus-visible'),active:e===document.activeElement}))});
   row.typography.push(await page.evaluate(name=>{const h=document.querySelector('h1,h2'),hud=document.querySelector('[data-testid=hud-gold]');return {screen:name,bodyFont:getComputedStyle(document.body).fontFamily,headingFont:h?getComputedStyle(h).fontFamily:null,numericFont:hud?getComputedStyle(hud).fontFamily:null,overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight};},name));
  }
  save();await page.close();
 }
 report.complete=true;save();console.log(JSON.stringify({complete:true,samples:report.samples.map(r=>({width:r.width,reducedMotion:r.reducedMotion,checks:r.checks,performance:r.performance,errors:r.errors}))}));
 process.exitCode=report.samples.some(r=>r.checks.some(c=>!c.passed)||r.errors.length||r.performance.cls!==0||r.typography.some(t=>t.overflowX||t.overflowY))?1:0;
} finally {save();await browser?.close();if(server)await new Promise(ok=>server.httpServer.close(ok));}
