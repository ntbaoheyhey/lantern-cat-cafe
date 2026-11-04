// Local, dependency-free runner around a pinned temporary axe-core distribution.
// App package manifests and installed dependencies are never changed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [rootText, dist, portText, outText, mode = 'all'] = process.argv.slice(2);
const root = resolve(rootText), web = resolve(root, 'apps/web'), port = Number(portText), out = resolve(outText);
assert.ok(port >= 5300 && port <= 5399);
assert.match(dist, /^dist-v2\/e2e-53\d\d$/);
const provenance = JSON.parse(readFileSync(new URL('./logs/axe-tool-provenance.json', import.meta.url)));
const axe = readFileSync(provenance.path, 'utf8');
assert.equal(createHash('sha256').update(axe).digest('hex'), provenance.scriptSha256);
const require = createRequire(resolve(web, 'package.json'));
const { chromium } = require('@playwright/test');
const { preview } = await import(pathToFileURL(require.resolve('vite')).href);
const report = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), tool: provenance, scans: [] };
process.on('exit', code => console.log('exit=' + code));
mkdirSync(out, { recursive: true });
const socket = createServer();
await new Promise((ok, fail) => { socket.once('error', fail); socket.listen(port, '127.0.0.1', ok); });
await new Promise(ok => socket.close(ok));
let server, browser;
try {
  server = await preview({ root: web, envDir: false, build: { outDir: dist }, preview: { port, strictPort: true } });
  browser = await chromium.launch();
  for (const width of [1280, 1600]) {
    const page = await browser.newPage({ viewport: { width, height: width * 9 / 16 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    async function scan(label) {
      await page.evaluate(() => document.fonts.ready);
      if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ content: axe });
      const result = await page.evaluate(async () => {
        const report = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return { violations: report.violations, incomplete: report.incomplete.map(row => ({ id: row.id, impact: row.impact, nodes: row.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), passes: report.passes.length };
      });
      report.scans.push({ width, label, ...result, consoleErrors: [...errors] });
      writeFileSync(resolve(out, 'axe.json'), JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify({ width, label, violations: result.violations.map(row => row.id), incomplete: result.incomplete.map(row => row.id), consoleErrors: errors }));
    }
    if (mode !== 'motion' && mode !== 'main') {
      await page.goto(`http://localhost:${port}/feature-fixture/e2e/fixtures/feature-samples.html`);
      for (const category of ['Runes', 'Companions', 'Skills']) {
        await page.getByRole('tab', { name: category, exact: true }).click();
        await page.getByRole('list').getByRole('button').last().click();
        await scan('samples-' + category);
      }
    }
    if (mode !== 'samples') {
      if (mode !== 'main') {
      await page.goto(`http://localhost:${port}/motion-fixture/e2e/fixtures/motion-view.html`);
      await page.getByRole('button', { name: 'Play sample cues', exact: true }).click();
      await scan('motion-final');
      }
      await page.goto(`http://localhost:${port}/#landing`);
      await scan('first-visit-help');
      await page.getByRole('button', { name: 'Start playing', exact: true }).click();
      await scan('landing');
      await page.getByTestId('landing-start').click();
      await scan('class');
      await page.getByTestId('class-picker-choose-button').click();
      await page.getByTestId('class-picker-confirm-button').click();
      await page.getByTestId('home-dashboard').waitFor();
      for (const screen of ['home', 'bag', 'map', 'forge', 'market', 'hero', 'help']) {
        await page.getByTestId('nav-' + screen).click();
        await scan(screen);
      }
    }
    await page.close();
  }
  const failures = report.scans.filter(row => row.violations.length || row.consoleErrors.length);
  assert.deepEqual(failures.map(row => ({ width: row.width, label: row.label, violations: row.violations.map(x => x.id), errors: row.consoleErrors })), []);
  report.complete = true;
  writeFileSync(resolve(out, 'axe.json'), JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser?.close();
  if (server) await new Promise(ok => server.httpServer.close(ok));
}
