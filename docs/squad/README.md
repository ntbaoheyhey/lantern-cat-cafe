# The Last Lantern · local squad review

Prototype - Squad Combat. Candidate build, not live.

Double-click `index.html`, then choose **Play the encounter**. The document embeds the
actual React/Phaser app and pure squad rules, original sprites, fonts, 21 effect strips,
three desktop layouts, balance results, numeric decisions and provenance. It works at
`file://` without a server, requests or persistence. Use a desktop window at least 1280×720.
The runtime SHA at the top identifies the source compiled into this review document;
later proof/document-only commits do not change that runtime.

Self-review: **7.9/10 overall; art 7.7/10. The requested 8+ quality bar is not met.**
No human playtest was performed. Burst currently outperforms sustain, including at the boss.

## Run the repository build

```sh
cd /Users/bao/taskbar-hero-squad
pnpm install --frozen-lockfile
pnpm demo
```

Open `http://127.0.0.1:5391/?demo&squad=1` in a guest browser profile. The existing demo
launcher clears server credentials and binds loopback. `squadCombat` is false by default;
`?squad=1` without the explicit demo context does not enter the prototype. The squad entry
does not import the real save/store/API graph. Fish, gear and results are in-memory only.

Add `&squadDebug=1` in development for the collapsed **Local review controls**: seed,
wave 1/2/3, boss, ultimate charge and ×1/×2/×4 speed. Debug is absent from the ordinary
production build. The offline review document also supports `?squadDebug=1#play` for
review fixtures only. Reloading discards everything.

## Five-minute review

1. Start Patrol and watch Rally → Thread Snare → Ember Orb → Milk Flask.
2. In wave two, click Teacup Healer, or Tab to its target button and press Enter.
3. Select Yarn Giant. Free a Binding Thread, then mark the exposed boss. Uncheck Auto
   and press 1/2/3 for a charged ultimate; the same actions have keyboard-focusable buttons.
4. Switch the squad preset; compare single-dummy/group Training and its final breakdown.
5. Expand the effect strips and three layout screenshots. Try Calm effects. Inspect a
   hero's portrait/name for the prototype gear and base stats. The combat log starts closed.

## Reproduce evidence

```sh
pnpm -r test --maxWorkers=4
pnpm typecheck
pnpm lint
pnpm art:check
pnpm --filter @taskbar-hero/web test:e2e --workers=4
node tools/squad-balance.mjs
node tools/squad-demo.mjs
node tools/squad-demo-check.mjs
node tools/squad-stress.mjs
```

`squad-demo.mjs` fetches the repository's existing pinned fonts at build time and checks
their hashes; opening the resulting HTML makes no requests. Tests and art generation use
repository tools directly, not installed Codex skills. `cwebp` is needed only to regenerate
the lossless browser evidence via `tools/squad-proof-images.py`.

For new captures, run a Vite development server on 5394 (or set `SQUAD_DEV_URL`), then use
`squad-audit.mjs`, `squad-effects.mjs` and `squad-fresh-eyes.mjs newcomer|skeptic|active`.
For production performance, build with `VITE_GAME_V2=1 VITE_ALLOW_MOCK_AUTH=1`, serve the
build on loopback 5395 (or set `SQUAD_PRODUCTION_URL`), and run `squad-performance.mjs`.
Run `squad-budget.mjs` against that production build. Run the offline builder again after
updating evidence so its embedded results match. Do not run timing measurements in parallel.

Compact receipts and images live in [reports/squad/](https://github.com/ntbaoheyhey/lantern-cat-cafe/tree/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/squad). Full raw logs, including failed
attempts, and the delivery report live on the ledger branch:
[SQUAD-SLICE-REPORT.md](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/ai/codex-ui-ledger/reports/squad/SQUAD-SLICE-REPORT.md).
The five drafts stack after #286; review in order, with no merge or deployment performed.
