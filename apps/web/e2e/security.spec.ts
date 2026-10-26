import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]));
const views = [
  [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'], [320, 568, 'light'],
  [1280, 720, 'dark'], [390, 844, 'dark'],
] as const;
for (const mode of ['classic', 'v2']) for (const [width, height, colorScheme] of views) {
  test(`CSP ${mode} ${width}x${height} ${colorScheme}: painted canvas, zero violations`, async ({ page }) => {
    const violations: string[] = [];
    const errors: string[] = [];
    page.on('console', m => {
      if (/violat(?:es|ion).*?(?:policy|directive)|refused to.*?(?:policy|directive)/i.test(m.text())) violations.push(m.text());
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', e => errors.push(e.message));
    await page.exposeFunction('recordCspViolation', (directive: string) => violations.push(directive));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', e => {
        void (window as unknown as { recordCspViolation(d: string): Promise<void> }).recordCspViolation(`${e.effectiveDirective}: ${e.blockedURI}`);
      });
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    });
    // Vite preview does not implement vercel.json. Inject the exact production response headers
    // on the built HTML response so Chromium really evaluates Report-Only (a meta tag cannot).
    await page.route('http://localhost:**/*', async route => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
    });
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme });
    const response = await page.goto(`http://localhost:${mode === 'classic' ? 4173 : 4174}/`);
    expect(response?.headers()['content-security-policy-report-only']).toBe(headers['Content-Security-Policy-Report-Only']);
    if (mode === 'v2') {
      await page.getByTestId('class-picker-choose-button').click();
      await page.getByTestId('class-picker-confirm-button').click();
      await expect(page.getByTestId('class-picker')).toHaveCount(0);
    }
    const canvas = page.locator(mode === 'classic' ? '.strip canvas' : '.v2-stage-canvas canvas');
    await expect(canvas).toBeVisible();
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => {
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      return data.some((value, i) => i % 4 === 3 && value > 0);
    })).toBe(true);
    // Navigate the classic market as well as the initial Phaser screen.
    if (mode === 'classic') {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.getByRole('tab', { name: 'Market', exact: true }).click();
    }
    await page.waitForLoadState('networkidle');
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
    if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: path.resolve(process.cwd(), `../../reports/s2-security/csp-${mode}-${width}-${colorScheme}.png`) });
    console.log(`CSP ${mode} ${width}x${height} ${colorScheme}: canvas painted; violations=${violations.length}; console/page errors=${errors.length}`);
  });
}
