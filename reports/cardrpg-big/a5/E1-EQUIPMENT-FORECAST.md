# Equipment boss comparison

Gameplay v4 Equipment now compares the current crew with the actual proposed equipment transaction against a named, unlocked boss. Both sides use the same challenge band, full health, current rows and standing plan, without route rewards. A transfer removes the piece from its donor, including transfers to a benched companion. Already equipped pieces and unchanged crews show “Same crew in this matchup.” Previewing never changes the save; Equip revalidates the real transaction.

The existing 20-seed worker returns Risky / Even / Favoured and a named risk, without displaying a win percentage. Players can select another unlocked boss or legal band. A blocked worker leaves the stats and set comparison available. Gameplay v4 OFF retains the original equipment flow. No combat rule, account field, price, saved-state version or dependency changed.

## Measured prototype

- Eight focused tests pass after retaining the original seven-pass/one-failure attempt. That failure exposed a false difference when re-equipping the same piece reinserted its slot key; the preview now recognizes the already equipped item after validating the command.
- Separate ON/OFF builds pass 36 browser checks and 24 targeted captures at 1280×720, 1440×900 and 1024×600 across both looks. Keyboard selection, boss/band changes, exact Equip transactions, active-route rejection, transfers, cache reuse and unchanged preview state are checked against source fixtures.
- Every capture has zero horizontal overflow; minimum scoped text contrast is 6.424:1. The 1024 transfer, 1280 alternate-look threshold and blocked-worker screens were personally inspected. Alternate Look uses explicit reviewer mode, so its developer controls are expected.
- Uncached CPU1 delivery peaks at 79.9 ms, below 400 ms. CPU4 page-throttled delivery peaks at 49.6 ms. These are separate observations, not evidence that throttling makes computation faster: independent worker CPU throttling has not been established.
- Two native-worker lifecycle scenarios pass: real calculations with delayed message delivery cannot overwrite a newer selection; an actual `worker-src 'none'` CSP denial produces the fallback without mutating state. All workers terminate on replacement or unmount; no page errors or remote requests were recorded.

[Prototype audit](e1-equipment-forecast/prototype-audit.json) binds source overlays, fixtures, original logs, screenshots and artifacts. Synthetic edge fixtures do not establish earned progression or balance.

## Contextual diagnostic and remaining limits

[Contextual40](b1/display-context-40/RESULTS.md) retains all 384 fourth-slot contexts, 50 gear rolls per case and 24,000 unique forecasts. Chapter rank correlations are 0.738 / 0.754 / 0.729; every opposite sign, tie and negative pair remains in the lossless receipts. Forecast TRAIN1–20 overlaps outcome TRAIN1–50, so this is exploratory support for a qualitative UI, not independent acceptance or a calibrated probability. The static display correlations 0.644 / 0.547 / 0.432 still miss chapters 2 and 3; this UI does not replace that gate.

Runtime source `c0543531a` has been adopted. Full source gates, exact rebuilt-artifact equality and source-bound closure are pending. Original ON prototype is 20,927,337 bytes, SHA-256 `0a2c5f1d00ebc7f09fe2d8e928c10f461edbcab9f73f602641e4834a0bc33db8`; public demo remains unchanged until Z.

Fresh acceptance20001–20500 remains unused. No startup, retention, full screenshot-pack or human playtest claim. B1/B2 balance, reward cadence, startup and Z remain open.
