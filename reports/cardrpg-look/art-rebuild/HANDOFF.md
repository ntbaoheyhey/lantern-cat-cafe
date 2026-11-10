# Lane B puppet handoff

ACTIVE 2026-11-10T16:46:06.885541+00:00; P1/P2/P3 complete, P4 first six-cat batch next. PROMPT.txt controls.
Branch codex/cardrpg-art-r1-2026-11-09; draft #427; no native runner. P2 commit d7c067cb7.
P3 final sources scene.ts/card-staging.ts; puppet-only simple fan + normalized heights + lower closer camera.
P3 evidence p3/final, before-a6 and comparison.webp; p3/REVIEW.md gives scope. Earlier p3/before was wrong legacy shell, excluded.
P3 4 captures, 0outside/faceHP/UIerrors; ult push1.054, impact shake, reduced motion verified. Type/lint17testsPASS.
P2 scores Mochi7.8/Soot7.6/Yarn8.0; P3 normal7.8/boss8.0. Evidence tracked~101MB/120MB cap; keep future reviews compact.
P4 batch1 Mochi/Soot/Clover/Panko/Mallow/Cinnamon (exact12catids confirmed catalog.ts). Existing configs for all six.
Build remaining4 with /Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/art-rebuild/puppet/build.py ID. Original concepts unchanged.
Pipeline output assets/cardrpg-look/v3-puppets; masters ~/art/look-v3/puppets; runtime look-puppet.ts/look-puppet-rig.ts.
Disposable preview /Users/bao/.codex/worktrees/cardrpg-b-puppet-preview/taskbar-hero-cardrpg-b2; contains B merge + copies of current P3 sources. Never push it or modify actual A6 worktree.
Actual P2 artifact /tmp/cardrpg-v5-puppet-p2-a6.html. Latest P3 artifact preview/docs/cardrpg-look/v5-p3-preview.html (26.71MB combined lean).
Build with LOOK_ART=v3 LOOK_LEAN=1, LOOK_OUTPUT containing v5, explicit LOOK_RECEIPT; tools/cardrpg-look/build.mjs from preview sets root by import path.
Review tools puppet/review.mjs (ART_A6=1), composition.mjs, battle.mjs (PUPPET_PREVIEW_ROOT, ART_ARTIFACT, ART_OUT).
Default classic OFF; lookV2+lookArt=v3 defaults puppet. No native regeneration. Preserve all earlier artifacts.
Pre-existing native dirty work in STATE.md stays excluded from commits; provenance/FIXLOG have old native hunks (stage new appends only).
One agent; heavy jobs nice10 under run-lock.mjs 19min cap +6.5s fairness gap. Ports5920–5923 only.
Check STOP-B/INBOX and fetch/show A6-OUTBOX between items. Never end with unfinished queue except R6.
