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

---

# Client action and stage performance (G1)

G1 keeps the v2 authoritative API and all existing StageLayout imports intact. The Bag,
Forge and layout integration belong to G2. No optimistic equipment, rewards, chest,
forge or boss success is rendered by this change.

## Pending API for G2

`useGameSnapshotV2(loop)` remains a `useSyncExternalStore` snapshot. It now includes:

| Field | Meaning | UI integration |
| --- | --- | --- |
| `busy` | Existing action name, or `null` | Disable conflicting actions until it clears. |
| `pending` | `{ action, slot?, itemId?, recipeId?, chapter? }`, or `null` | Match the particular slot/recipe/chapter and show its pending label. |
| `queued` | Accepted equip intents, **including the running equip** | Show “Equipping…” whenever greater than zero; optionally show remaining count. |
| `claimInFlight` | One scheduled/running claim and any required reconciliation read | Show syncing without hiding cached state. |
| `lastError` | Last request error, or `null` after successful adoption | Drive the sync indicator; network availability is a separate browser signal. |

`busy` and `pending` publish synchronously when an action is accepted, before its API
call. `queued` publishes synchronously in `createEquipQueueV2().equip()`, even before
the first equip starts. Thus Equip best can acknowledge the click in the same event
handler, including when another action is finishing. Fields reset on account switch
and loop stop. `queued` belongs to the mounted equip queue, not an additional batch
request. Use the existing queue for all bag equip callbacks.

```tsx
const snapshot = useGameSnapshotV2(loop);
const equipping = snapshot.queued > 0 || snapshot.busy === 'equip';
const crafting = snapshot.pending?.action === 'craft'
  && snapshot.pending.recipeId === recipeId && snapshot.pending.slot === slot;
```

Do not await a result before displaying pending. A duplicate queued or running
`[slot, itemId]` returns the same promise and adds no intent. An already confirmed
equip (including an empty slot) sends no request. Distinct intents stay sequential,
wait behind other actions and recheck the latest state before dispatch. Disposal or
account switch cancels undispatched intents. A direct conflicting action emits one
`refused` event with client code `busy`; known server refusals use their existing
codes. Unexpected errors use `error`. A stale boss response now also produces one
refusal instead of silently reloading. Panels should use the existing loop notice
subscription and avoid adding a second success/error toast for the same outcome.

## Synchronization and ordering

`game/v2/syncStatus.ts` is pure. `useSyncStatusV2(loop?)` subscribes to loop snapshots,
visibility and `online`/`offline` browser events, and removes all listeners on unmount.
`layout/hud/SyncStatus.tsx` is ready for a later `<SyncStatus />` placement in the
status bar. It has a static icon, text, `role="status"`, polite and atomic announcements.
It adds no animation and uses existing theme tokens.

The derivation priority is hidden, offline, syncing, error, live. Hidden means that
rendering and scheduled claims are paused. It never claims network unavailability.
Offline means the browser reports `navigator.onLine === false`; it is a connectivity
hint, not a guarantee that the server is reachable. A visible tab returning online
becomes live or error according to the last result; a visibility return starts one
claim and shows syncing until it finishes. Cached state stays visible throughout.
No background claims or new claim cadence were introduced.

The public server snapshot does **not** expose `progressRev`. `serverTime` is Unix
seconds, and the server captures it at request start; it cannot order equip and claim
responses within a second. The loop therefore tracks action and state adoption
epochs. If a claim is overtaken, it waits for actions and reads state again before
adopting, while emitting that claim's credited gains only once. A reload overtaken
by an action or another adoption also reads again. A strictly older `serverTime`
snapshot is never adopted. Account generations prevent old results from entering
a new account. An extra state read occurs only when requests actually overlap.

Failed/refused actions leave confirmed state on screen. A stale response triggers an
authoritative reload; if that reload also fails, the original refusal remains the
single action notice and the sync indicator retains the load error. This change
adds no automatic mutation retry.

## Stage lifetime

StageCanvas mounts one Phaser game and calls `game.scale.resize` plus `relayout`
when logical width changes. It relies on Phaser's own visibility handler and adds
no second pause listener. Cleanup consumes Phaser's pending destruction through the
public `step` method, even when the renderer has been paused.

StageScene's actor key consists of class, sorted visible equipment descriptors,
chapter and round. Plain claims, lock changes, currency changes, XP and reduced
motion changes do not destroy the actors or cue director. Claims with kills replace
only the compressed cue player; future idle cycles use current stats. Resize only
moves actor homes and redraws existing ground/HP graphics. Reduced motion stops
sprite animations immediately and keeps feedback stationary.

Phaser 3.90's upstream VisibilityHandler does not unregister its document listener
in Game.runDestroy. Keeping the game stable stops accumulation on resize. Repeated
full StageLayout/Mini-mode unmounts are a separate upstream lifetime risk, outside
the resize acceptance measurement; no vendor patch or global listener interception
is included here.

## Reproduce evidence

From the repository root, use pnpm 10.28.0 (`npx -y pnpm@10.28.0` when Corepack is
unavailable). From `apps/web`, run:

```sh
npx -y pnpm@10.28.0 test:e2e --project=stage-layout g1-perf.spec.ts
SCREENSHOTS=1 npx -y pnpm@10.28.0 test:e2e --project=stage-layout g1-visual.spec.ts
```

Playwright's v2 demo build uses the dedicated `g1-perf` Vite mode. Only that mode or
DEV exposes `window.__g1Loop` and `canvas.dataset.stageRebuilds`; normal production
builds eliminate both branches. Production routes, authentication and server code
are unchanged. Baseline was measured on origin/main `21fec3e` with only the same
measurement hooks/test installed. Set `G1_BASELINE=1` only when measuring that
baseline; it records rather than enforces the new leak/rebuild thresholds.

[reports/g1-speed/metrics.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/g1-speed/metrics.json) retains baseline and latest after measurements.
The CDP run collects garbage before each sample, records actual document visibility
listeners and Performance metrics, and exercises 12 alternating resizes plus three
hidden/visible cycles (also resizing while hidden). Visibility events are synthesized
because headless Chromium keeps background tabs visible; native browser/OS tab
switching remains unverified. Canvas count must remain one; document listeners must
stay within one, nodes within 10%, and three plain claims must rebuild zero times.

Pending latency is click event timestamp to the first observable loop busy signal,
not network completion or a G2 pending label. The next animation frame is also
recorded as a scheduling measurement, not proof that a particular label was painted.
A PerformanceObserver records Chromium `event` click entries (minimum reporting
threshold 16ms); absent entries for fast events are allowed, never fabricated.
The original baseline observer also recorded duplicate entries from overlapping
observer lifetimes; these do not affect its click-to-pending timestamps. Queue and
race acceptance are covered independently by deferred-promise unit tests, including
exactly two requests after a double Equip best click with two upgrades.
