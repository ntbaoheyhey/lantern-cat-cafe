import { createHash } from 'node:crypto';
import { expect, type Page } from './test';

// Exact versioned variable fonts used by the accepted main340f88b PNGs.
// Google Fonts can return different static subsets for the same stylesheet URL.
// Pin only this visual fixture; preserve the product CSS and original baselines.
const fonts = [
  {
    family: 'DM Sans', weights: [400, 500, 700],
    url: 'https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2',
    sha256: '468d56b6b25b05b70190b6c233d773f6f1770e8579827ce022a57f03fa8002fb',
  },
  {
    family: 'JetBrains Mono', weights: [500, 700],
    url: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwgknk-4.woff2',
    sha256: '2c32b9b3ee358c119e210f6f5195f9bd34894d78a785ff2e95d60e718e400af4',
  },
  {
    family: 'Pixelify Sans', weights: [500, 700],
    url: 'https://fonts.gstatic.com/s/pixelifysans/v3/CHylV-3HFUT7aC4iv1TxGDR9Jn0Ei0tSaJ0.woff2',
    sha256: '0f2216c1b7bf13b775e7b825c15e1c8414f3899cbd4120f275cdc96001a053a0',
  },
];

export async function pinVisualFonts(page: Page) {
  // Fail on unavailable/changed bytes instead of silently accepting a fallback.
  for (const font of fonts) {
    const response = await page.request.get(font.url);
    expect(response.ok(), `${font.family}: versioned font request`).toBe(true);
    const body = await response.body();
    expect(createHash('sha256').update(body).digest('hex'), `${font.family}: baseline font identity`).toBe(font.sha256);
    await page.route(font.url, route => route.fulfill({
      contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body,
    }));
  }
  const css = fonts.flatMap(font => font.weights.map(weight =>
    `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${font.url}') format('woff2');}`,
  )).join('\n');
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: css }));
}
