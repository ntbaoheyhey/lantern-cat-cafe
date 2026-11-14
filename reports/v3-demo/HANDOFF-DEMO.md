# Demo handoff

COMPLETE: all demo gates passed. Artifact commit `5e421e1a0ec158b819b627a05a93b36b5c396c0b` was pushed to origin at 2026-11-14T03:25:17Z. The server is left running for review. This final handoff record does not change the verified artifact.

## Version and scope

- Worktree: `/Users/bao/taskbar-hero-cardrpg-a6`
- Branch: `codex/v3-demo-2026-11-14`
- Build/source commit: `a81b75f456a2c4dbce3cfdfa17644874cf8c117f` (the REFERENCE commit).
- Artifact commit: `5e421e1a0ec158b819b627a05a93b36b5c396c0b` — `V3DEMO: playable demo from A+B` (pushed).
- A evidence head: `66f68bfe31a5e3d51952a2a7f55cba98453f46c6` (runtime `53fbf0da1`).
- B evidence head: `106c8a3540db45fe8f1557cbd3389241029b9bee` (runtime `6a61d6acf`).
- A/B branches contain only their evidence-save commits after the supplied runtime heads. Their non-report files are unchanged.
- Integration is confined to the demo branch. No PR was opened or modified, no main merge/push, and no public contract deployment.
- SOLO remains PAUSED FOR DEMO at Q9 S4. Do not resume it as part of this demo task.

## Play now

- Live: http://localhost:5994 (redirects to http://127.0.0.1:5994 for the guest wallet origin).
- Saved artifact: `/Users/bao/taskbar-hero-cardrpg-a6/docs/cardrpg-v3-demo/index.html`
- Desktop copy: `/Users/bao/Desktop/TaskbarHero-REVIEW/v3-demo-2026-11-14/`
- Guide: `docs/cardrpg-v3-demo/CHAY-DEMO-VI.md` (14 lines, Vietnamese).
- Open the saved `index.html` in Chrome with its `assets/` folder alongside it, or run `npx serve docs/cardrpg-v3-demo` from the worktree.

## Running processes

Leave the fixture running for review. Verified owned processes: supervisor `46445`; Vite launcher `46884`; Vite server `46897`; local Anvil `46472`.
Ports: web `5994`, local API `5997`, Anvil RPC `8546`. The API is hosted by supervisor `46445`.

Stop the complete owned demo fixture: `kill 46445` (the supervisor shuts down its own children).
Restart from `/Users/bao/taskbar-hero-cardrpg-a6`: `nohup node tools/v3-demo/start-live.mjs > reports/v3-demo/vite.log 2>&1 &`.
Read the fresh PIDs in `reports/v3-demo/live-processes.json` after restarting. The older supervisor `45396` was replaced during setup and is no longer running. Do not stop other runners or use killall/pkill.

## Verification

- Typecheck PASS; full unit suite PASS (4,830 passed, 2 existing expected failures, 11 existing skips); combat parity PASS 2/2.
- Live 1280x720 and 1440x900: PASS, zero console/page errors.
- Static file:// 1280x720 and 1440x900: PASS, zero console/page errors, zero network attempts/outbound requests, zero missing assets.
- Every flow reaches victory with voiced ultimates, keeps rewards, upgrades gear +1, opens Bag, Team and Wallet. Audio unlocks after the first click.
- Eight checkpoint screenshots per run and `shots/contact-sheet.png`; all images at most 1280 px on either axis.
- Desktop files match the repo artifact; Desktop open check PASS. REFERENCE lines match in HTML and the guide.
- Detailed evidence: `TEST-EVIDENCE.md` and the four unprefixed `*-smoke.json` files. `initial-*`, `probe-*`, and `*-failure.png` retain resolved historical failures.

## Known demo gaps

- Saved demo is a folder, about 249 MB with all shipped audio/cinematics. Keep `assets/` beside `index.html`.
- Live wallet/economy uses B's disposable local Anvil/API fixture. No public chain or funded real wallet is required. Chain state resets when the fixture restarts.
- Static gameplay and forge work offline; the wallet panel opens, but chain balances/actions and guest sign-in require the live fixture.
- The offline account resets on reload; use menu Saves to export/import progress.
- Q9 S4 bark cadence is paused and unaccepted. No balance, gate, feature, or polish work was added.

Rebuild: `node tools/cardrpg-a6/build.mjs --v3-demo`.
Smoke: `node tools/v3-demo/smoke.mjs [--static] [--1440]`.
