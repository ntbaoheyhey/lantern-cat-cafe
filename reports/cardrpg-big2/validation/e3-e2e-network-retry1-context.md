# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: server/expired-session-feedback.spec.ts >> Expired server session explains guest recovery, saved guest false
- Location: e2e/server/expired-session-feedback.spec.ts:9:3

# Error details

```
Error: apiRequestContext.get: socket hang up (ECONNRESET)
Call log:
  - → GET https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2
    - user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.8078.4 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```

# Test source

```ts
  1  | import { createHash } from 'node:crypto';
  2  | import { expect, type Page } from './test';
  3  | 
  4  | // Exact versioned variable fonts used by the accepted main340f88b PNGs.
  5  | // Google Fonts can return different static subsets for the same stylesheet URL.
  6  | // Pin only this visual fixture; preserve the product CSS and original baselines.
  7  | const fonts = [
  8  |   {
  9  |     family: 'DM Sans', weights: [400, 500, 700],
  10 |     url: 'https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2',
  11 |     sha256: '468d56b6b25b05b70190b6c233d773f6f1770e8579827ce022a57f03fa8002fb',
  12 |   },
  13 |   {
  14 |     family: 'JetBrains Mono', weights: [500, 700],
  15 |     url: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwgknk-4.woff2',
  16 |     sha256: '2c32b9b3ee358c119e210f6f5195f9bd34894d78a785ff2e95d60e718e400af4',
  17 |   },
  18 |   {
  19 |     family: 'Pixelify Sans', weights: [500, 700],
  20 |     url: 'https://fonts.gstatic.com/s/pixelifysans/v3/CHylV-3HFUT7aC4iv1TxGDR9Jn0Ei0tSaJ0.woff2',
  21 |     sha256: '0f2216c1b7bf13b775e7b825c15e1c8414f3899cbd4120f275cdc96001a053a0',
  22 |   },
  23 | ];
  24 | 
  25 | export async function pinVisualFonts(page: Page) {
  26 |   // Fail on unavailable/changed bytes instead of silently accepting a fallback.
  27 |   for (const font of fonts) {
> 28 |     const response = await page.request.get(font.url);
     |                                         ^ Error: apiRequestContext.get: socket hang up (ECONNRESET)
  29 |     expect(response.ok(), `${font.family}: versioned font request`).toBe(true);
  30 |     const body = await response.body();
  31 |     expect(createHash('sha256').update(body).digest('hex'), `${font.family}: baseline font identity`).toBe(font.sha256);
  32 |     await page.route(font.url, route => route.fulfill({
  33 |       contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body,
  34 |     }));
  35 |   }
  36 |   const css = fonts.flatMap(font => font.weights.map(weight =>
  37 |     `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${font.url}') format('woff2');}`,
  38 |   )).join('\n');
  39 |   await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: css }));
  40 | }
  41 | 
```