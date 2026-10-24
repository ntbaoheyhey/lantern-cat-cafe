# Performance: bundle size and first load

Measured 2026-10-24 on `main` plus the `manualChunks` change in `apps/web/vite.config.ts`. Sizes are gzip level 9 of the built files (`vite preview` does not compress, so real transfer on Vercel, which serves gzip/brotli, will be about this or smaller). The browser was Chromium at 390 x 844, cold cache, no throttling.

## Chunks

| Chunk | Before (raw / gzip) | After (raw / gzip) |
| --- | --- | --- |
| `index` (app code) | 660.3 kB / 196.0 kB (includes React, wagmi, viem) | 79.8 kB / 22.5 kB |
| `react` | (inside `index`) | 218.7 kB / 67.4 kB |
| `web3` (wagmi, viem, ox, TanStack Query, noble/scure) | (inside `index`) | 363.8 kB / 107.0 kB |
| `phaser` | (inside `createGame`) | 1,194.4 kB / 315.1 kB |
| `createGame` (our game code) | 1,202.6 kB / 318.3 kB (includes Phaser) | 8.3 kB / 3.4 kB |
| CSS | 30.0 kB / 6.4 kB | 30.0 kB / 6.4 kB |
| `index.html` + runtime | 1.8 kB / 0.7 kB | 2.8 kB / 1.2 kB |

## First load (cold cache)

Everything requested until the network was idle:

| | Raw | gzip |
| --- | --- | --- |
| Before | 1,894.7 kB | 521.4 kB |
| After | 1,897.8 kB | 523.0 kB |

**No gain on a first visit.** The total is about 1.6 kB gzip (0.3%) larger because of an extra runtime chunk and per-chunk overhead. Load time to network idle on this machine was 1.1 to 1.6 s both before and after, within run-to-run noise on localhost, so I make no timing claim. Slow 4G throttling was not measured.

Both versions already fetched Phaser (the game code is loaded with a dynamic `import()`) during the first load, so the split does not defer it. Phaser is by far the largest piece (about 60% of the transfer) and the only chunk over 500 kB.

## What the split does buy

Browsers cache each hashed file separately. Before, any change to the game code changed the 318 kB `createGame` file, and any change to app code changed the 196 kB `index` file, so a returning player re-downloaded most of the 521 kB after every deploy. After the split, the large vendor files (`phaser`, `react`, `web3`: about 490 kB gzip) keep their hashes until a dependency is upgraded, so a typical deploy re-downloads only `index` + `createGame` + CSS, about 32 kB gzip. That is the benefit, and the only one.

## Not done, and options if first load matters

- The warning limit (`chunkSizeWarningLimit: 1500`) is unchanged from before; the Phaser chunk is just under it. It was not raised.
- Deferring Phaser until after first paint (render the page shell and HUD first, load the game after) would improve perceived load but changes app behavior, so it is out of scope here.
- Phaser could be replaced by a lighter renderer or a custom build, which is a large change and not recommended this late.
- Build still prints a Rolldown notice that `ox` references `node:worker_threads` in a Tempo module. It is externalized, never reached in the browser, and harmless.

## Reproduce

```sh
pnpm --filter @taskbar-hero/web build
pnpm --filter @taskbar-hero/web exec vite preview --port 4399
```

Then load `http://localhost:4399/` in a 390 px wide browser and sum the gzip size of every `/assets/*` file requested. The numbers above come from a Playwright script doing exactly that.
