# Demo handoff

IN PROGRESS: merged A+B on codex/v3-demo-2026-11-14; full live and file:// smoke running.
Typecheck PASS; full unit suite PASS; combat parity PASS 2/2.
Integration/source head so far: b7fcbe16d8b703c880256d992a62d2d1494b369b (pushed).
Next: finish 1280x720 and 1440x900 smoke, source commit, final build/REFERENCE, Desktop copy, artifact commit and push.
A evidence head: 66f68bfe31a5e3d51952a2a7f55cba98453f46c6
B evidence head: 106c8a3540db45fe8f1557cbd3389241029b9bee
SOLO paused at Q9 S4; do not resume during demo work.
PIDS: supervisor 46445; Vite launcher 46884; Vite server 46897; local Anvil 46472.
The API fixture is hosted by supervisor 46445. Ports: web 5994, API 5997, Anvil 8546.
Stop the complete owned fixture with `kill 46445`; it shuts down its own children.
The earlier supervisor 45396 was replaced during loopback/CORS setup and is no longer running.
Live: http://localhost:5994 redirects to the fixture's required http://127.0.0.1:5994 origin.
Restart: `nohup node tools/v3-demo/start-live.mjs > reports/v3-demo/vite.log 2>&1 &` from the demo worktree; read fresh PIDs in live-processes.json.
Static builder: `node tools/cardrpg-a6/build.mjs --v3-demo`.
Static mode: folder (about 249 MB including original audio and cinematics); file:// works and HTTP is also supported.
Smoke: `node tools/v3-demo/smoke.mjs [--static] [--1440]`; read the matching reports/v3-demo/*-smoke.json.
Observed before formal runs: real campaign victory at round 16, multiple voiced ultimates, and real +1 enhancement.
Packaging fix: reuse existing A enemy portraits for the twelve public portrait URLs omitted by B's rig directories.
Do not change game rules, continue Q9, or touch A/B branches.
