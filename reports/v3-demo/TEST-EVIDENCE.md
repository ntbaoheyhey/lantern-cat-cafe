# Demo verification

Completed: 2026-11-14T03:22:36Z
Branch: `codex/v3-demo-2026-11-14`
Saved artifact source: `a81b75f456a2c4dbce3cfdfa17644874cf8c117f`. The REFERENCE identifies the source commit before generated files are committed.
The live run used the same merged product sources; the subsequent source change only disabled RPC configuration in the static build transform.

## Required checks

- `pnpm -r typecheck`: PASS, including the final packaging check (`typecheck.log`, `typecheck-final.log`).
- `pnpm test`: PASS, 4,830 passed; 2 existing expected failures and 11 existing skipped tests (`unit.log`).
- Combat determinism/parity: `battle-v3/controls.test.ts`, PASS 2/2 (`parity.log`).
- No game rules, acceptance thresholds, balance, or Q9 behavior were changed for the demo.

## Real browser flows

Fresh accounts, real UI clicks, no save injection or combat mutation. Each flow starts at the landing screen, unlocks audio after the first click, completes practice and a full campaign wave at 3x, displays an ultimate cinematic with voice, reaches victory, keeps rewards, enhances gear from +0 to +1 while spending stamps, opens Bag, Team, and the wallet panel.

| Run | Viewport | Result | Console/page errors | Ultimates | Played ultimate voice cues | Finished UTC |
| --- | --- | --- | --- | --- | --- | --- |
| live-1280 | 1280 x 720 | PASS | 0 | 15 | 30 | 2026-11-14T03:13:52.986Z |
| live-1440 | 1440 x 900 | PASS | 0 | 15 | 30 | 2026-11-14T03:15:31.086Z |
| static-1280 | 1280 x 720 | PASS | 0 | 15 | 30 | 2026-11-14T03:18:42.783Z |
| static-1440 | 1440 x 900 | PASS | 0 | 15 | 30 | 2026-11-14T03:21:47.724Z |

- All four runs reached campaign victory at round 16 using seed 791576452.
- No blank screens, horizontal overflow, or visible broken images in the eight checkpoints per run.
- Both final static runs used `file://` with HTTP(S) requests blocked: zero outbound requests, zero attempted fetches, zero missing packed assets.
- These full static runs are the V3 equivalent of the earlier A6 offline checker, exercising the new entrance/shell and wallet flow.
- The Desktop copy opened to Home with audio ready, zero errors and zero network attempts (`desktop-open.json`).
- All 74 files in the Desktop copy match the repo artifact byte-for-byte (`desktop-copy.json`).
- The 14-line Vietnamese guide starts with the same REFERENCE as the first HTML comment.
- `shots/contact-sheet.png` contains the eight live checkpoints. All 40 screenshots/contact sheets are at most 1280 pixels on either axis. The `*-failure.png` and `probe-*` files are historical evidence, not final results.

## Packaging and historical failures

The existing `tools/cardrpg-a6/build.mjs --v3-demo` builder produced a 249 MB folder with 71 script packs under `assets/`. The original `docs/cardrpg-a6/` artifact is unchanged. A single file would exceed 60 MB. Audio, cinematics and public assets are packed locally; opening `index.html` directly in Chrome or serving the folder both use the same artifact.

Initial static probes found public font/icon URLs; the packaging URL resolver fixed them. Initial full static flows reached victory/forge/wallet with zero console errors but recorded three blocked public RPC attempts. The static-only chain configuration transform removed those attempts. `static-probe.json` and `initial-static-*-smoke.*` retain the earlier failures; the unprefixed four smoke JSON files contain the final passing results.

Known limitations are listed in `MERGE-LOG.md`, `HANDOFF-DEMO.md`, and the Vietnamese guide. No Q9 work was resumed.
