# Taskbar Hero — offline candidate demo

2026-11-04. One agent, no delegation or scheduler. D0–D5 delivery for the local demo request; this is a candidate, not a release. No merge to main or deployment was performed. [Draft PR #274](https://github.com/ntbaoheyhey/taskbar-hero/pull/274): **Demo: runnable stack-tip preview (do not merge)**.

## Identity and opening commands

| Item | Exact identity |
| --- | --- |
| Final demo branch head | `7436dd6468dc4dfc2b78116a009ec9e00ec4a8e0` on `ai/codex-demo-2026-11-04` |
| Runtime and packaged artifacts, tested from a fresh clone | `b241eb6fc2f01f0ffb6ffa72ecf83d05569381c1` |
| Source stack | `1eefc3ef6d828b06710c8be18feb08e90b099e3e` |
| #270 documentation, merged locally into demo branch | `932b6f7e4dcfbd33e4ff81e9bd967d50cab9b6fd` |
| Initial local integration commit | `7af383e43235d7a3ec8a7f4c31f861d68230dc89` |
| Remote main / retained live baseline | `340f88b92405ceb6b5421b207307fdbb283b2ca3` |

The final demo commit changes **reports only** relative to the fresh-clone tested commit. Runtime, scripts, dependency lockfile, screenshots, static HTML and production bundle are identical. No test result is represented as a new run on changed product code.

Run the actual game on this Mac:

```sh
cd ~/taskbar-hero-demo && pnpm demo
```

Open **http://localhost:5199**. Stop with Ctrl+C. Node 22.12+ and pnpm 10.28.0 are required; missing dependencies are installed with the frozen lockfile. A first install needs cache or internet. Runtime is offline and uses only local assets, without backend, wallet, RPC or remote fonts. All owned verification servers are stopped, leaving port 5199 free.

Double-click `/Users/bao/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html`, or:

```sh
open ~/taskbar-hero-demo/docs/demo/taskbar-hero-demo/index.html
```

This is a **guided screenshot click-through, not a playable game**. It embeds all eight real captures and works from `file://` with networking disabled. Next/Previous, keyboard arrows, Home/End, navigation-rail hotspots and capture zoom work. No setup is required.

The included production bundle is playable without installing Node packages:

```sh
cd ~/taskbar-hero-demo && python3 -m http.server 5199 --bind localhost --directory docs/demo/dist
```

Open the same local URL. The existing root-relative asset paths require this directory to be the server root. [README](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-demo-2026-11-04/docs/demo/README.md) begins with the required REFERENCE line. [DRAFT walkthrough](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-demo-2026-11-04/docs/demo/WALKTHROUGH.md) includes the Vietnamese/English opening guide, exact three-minute click path mapped to all six supplied rubric categories, real/mocked table and 90-second recording plan. A new video was not requested or produced.

## What works and what is mocked

- The real candidate Home/Hunt, Bag, Forge, Boss/Map, Market preview and Help render at 1280×720 and 1440×900. React/Phaser, original repository art and shared gameplay rules run locally.
- Tour sample provides labeled level-20 progress, equipment and materials. Boss sample supplies the prerequisites for a local victory. Fresh guest starts with an unchosen class and ordinary initial state; its first reward is earned through the natural claim loop.
- Crafting actually creates an item and spends local sample materials. The boss sample resolves via local rules. Neither is a blockchain transaction or authenticated backend operation.
- MockGameApiV2 replaces the server; demo saves use an isolated namespace. Wallet discovery, automatic reconnection, signing, RPC transport and stored authentication are disabled. The dedicated Vite config ignores inherited `VITE_*` variables and `.env*` files.
- Market ownership/listings and fresh chain proof are unavailable. Help displays documented Fuji chain **43113**, RelicNFT `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`, and RelicMarket `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. No fresh bytecode, events, balances or transaction claims are made.
- Rune, skill and companion previews remain **Sample / Unavailable** and **default-OFF**. No economy values or original game rules were changed.

## Executed proof

Evidence is committed under the demo branch's [reports/demo/](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-demo-2026-11-04/reports/demo). [VERIFICATION.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-demo-2026-11-04/reports/demo/VERIFICATION.json) summarizes the actual runs.

| Check | Actual result |
| --- | --- |
| Existing web tests plus six offline regressions | **1,473/1,473 passed**, 129 files; performed before committing the identical runtime tree |
| Repository typecheck and lint | Both passed across workspace packages |
| Clean clone | `/private/tmp/taskbar-hero-demo-clean.TgyZFs`, initially clean at `b241eb6` |
| Frozen install in clean clone | Passed in 5.8 s; 505 packages; 0 downloads, using existing pnpm cache |
| Warm `pnpm demo` startup | **1,897 ms** to HTTP 200; hostile inherited VITE placeholders ignored |
| Busy port | Expected exit 1 with clear EADDRINUSE guidance; existing owned server stayed alive |
| Clean-clone playable browser checks | **29/29 passed**, both requested viewports, deviceScaleFactor 2 |
| Included production bundle | Build passed and reproduced versioned dist byte-for-byte; **29/29 browser checks passed** |
| External network / wallet / console | **0 external requests, 0 wallet requests, 0 console errors** in both playable runs |
| Natural first reward | 29,698 ms after the checkpoint in the clean development run; 29,666 ms in production; no test-clock changes |
| Double-click HTML in Chromium | **34/34 passed** with browser networking disabled, both requested viewports |
| Additional static WebKit observation | 5 interactions/safety observations passed; Playwright WebKit, not native Safari |
| Screenshots | 8 PNGs at scale 2, all 8 manifest hashes verified |

The screenshots were captured before the runtime commit, from the offline working tree based on `7af383e`; that runtime was subsequently committed unchanged as `b241eb6`. The manifest retains that original capture provenance. Fresh-clone checks verify the committed implementation. The historical 399/399 stack suite was **not rerun** and is not counted as new demo proof. No live-chain or backend test is claimed.

Earlier corrections are disclosed in the handoff: an initial fixture assertion used a nonexistent field; static layout needed address wrapping; the walkthrough verification needed accessible item labels, the actual detail region and exact button capitalization. Failed walkthrough receipts remain under `walkthrough/`, `walkthrough-final/` and `walkthrough-verified/`; the final `walkthrough-pass/` and clean-clone receipts pass. Failed checks were not counted as successful. The initial Git push returned a GitHub Internal Server Error; a normal retry succeeded.

## File sizes and limitations

| Payload | Bytes |
| --- | ---: |
| Self-contained HTML | 3,315,929 |
| Production dist | 3,339,319 |
| Eight scale-2 PNGs | 2,472,965 |
| Screenshot manifest | 8,184 |
| Entire `docs/demo/`, including docs and all duplicated assets | **9,152,836** |
| Requested budget | 25,000,000 |

The ES-module production bundle cannot be opened directly with `file://`; the browser's null-origin module/CSS failure was reproduced and recorded in `file-bundle-probe.json`. The self-contained screenshot fallback is the double-click deliverable. Screenshots cannot execute gameplay. System fonts replace the usual remote Google Fonts. First installation is not guaranteed on an empty offline dependency cache. Native Safari gameplay, live authentication, real transactions and new release capacity are not proven. No unresolved in-scope runtime failure remains in the executed demo checks.

## Publication and boundaries

The demo branch is published as draft #274; it contains the unmerged stack and must not be merged as a release. The ledger receives this report, its handoff and compact publication receipts. Vercel `git.deploymentEnabled` excludes the demo and ledger branch names at both repository and `apps/web` roots; other deployment settings are preserved. Read-only GitHub deployment-record checks are retained in `publication-state.json`; no Vercel capacity probe or deployment command was run.

Remote main remains `340f88b`; the main checkout remains `6144d42` and was never checked out, reset or stashed. #244, #252 and #257 remain open drafts at their prior heads and were not modified. #269 edge source was not deployed. No Supabase deploy, migration, live DB write, wallet signing, real funds, secret input, third-party art, contest submission or broad process kill occurred. Existing unrelated ledger files were preserved. There are no background agents, schedulers or running demo servers left by this task.
