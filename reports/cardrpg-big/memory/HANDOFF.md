# Lane A active continuation handoff
REFERENCE: PROMPT.md; RULES.md; STATE.md

Read canonical RULES+STATE and PROMPT lines26–37,146–158,188–218 first. This is active work after the user resumed; no automatic restart scheduler was installed. Earlier baseline handoff is preserved in archive/handoff-before-look-l0-reviewfix.md.

Canonical memory: /Users/bao/taskbar-hero-cardrpg-big/reports/cardrpg-big/memory.
Delivery: /Users/bao/taskbar-hero-cardrpg-big-delivery, branch codex/cardrpg-big-delivery-2026-11-07, draft358. Published3934ffe2; local followups f2a43ad1,b173715f,089201e3. These only fix opted-in review-control contrast/unknown-card question backing and add evidence tools. No rules/3D ownership change.
Baseline9a5f6ebb/23937000bytes,14videos/204captures and report publication b092ed0c/ledger a2728798 are complete. Do not rerun them. Nine visual scores still miss8.5; no quality promotion. B360 auto-closed by GitHub containment after prior fast-forward; no mergeAPI/mainpush/deploy. Future adoption uses a rebased copy of B published commits on an A-owned branch; preserve original B branch.

## Active work (verify processes before resuming)
REFERENCE: STATE.md NEXT; delivery reports/cardrpg-big/look-ui

Old maina1ae7ea4177e056eebba62561d6e9f97b438e5f5a68622ece26bd995a21ed010 functional runner PID64887 remains alive; no duplicate. Receipt functional-l0/functional.json. Gallery fails selectedtab1.07885contrast; lab fails default24MB. Keep all logs. Do not overwrite docs/cardrpg3/index.html until this runner finishes.
New candidate /tmp/cardrpg-a-look-l0-contrastfix/index.html is f1234525fb744d0b318c2ea65727256cfb71fc6cc31c2380cf6fac93941a0f56/24026508bytes; source b173715f, runtimeDirtyfalse. New audit script089201e3 does not change HTML. Rebuild main after source commit/finaloldrunner to refresh input hashes; expected sameHTMLhash. Do not accept fca3496c intermediate, which lacks questionbadgefix.
Current gate driver PID67508 / execsession50694: validation/look-l0-reviewfix.json; fullunit1731web/1020rulesPASS, E2Equeued. Final type/lint/offline types session3960 updates separate final logs. Preserve retries; no baseline pass relabel.
New three-size UI real-toggle+contrast shell execsession55241: LOOK_META_OUT look-ui/l0-reviewfix/{width}, BIG_ARTIFACT /tmp/cardrpg-a-look-l0-contrastfix/index.html. Legacy a1ae30togglesPASS but1440had3activecontrastfails2.1089–2.3301; summary initially missed them. Raw failures retained; new badge gives opaque token backing.
New default-entry browser execsession48789 queued under lock; dist /tmp/cardrpg-a-look-l0-reviewfix-flagoff-dist, output look-ui/flagoff-reviewfix. Prepare already passed. Compare actual new11JS/modules against baseline flagoff saved receipt; generate comparison.json.

## Next acceptance steps
REFERENCE: tools/cardrpg-big/{delivery-functional,audit-look-checkpoint,lab-check}.mjs

After UI captures, create look-ui/l0-size-exception.json matching f123hash+bytes, limitBytes32000000, reason and promptReference (B LOOK brief sections2/6, tracked at publishedf3091a44), beforeAfter:[{path,sha256},...] using exactnewhash off/on captures. Default24MBmiss remains reported; exception requires before/after evidence, not a blanket raised gate.
Run BIG_FUNCTIONAL_SHA=f123... BIG_FUNCTIONAL_GATES=reports/cardrpg-big/validation/look-l0-reviewfix.json BIG_FUNCTIONAL_OUT=reports/cardrpg-big/look-ui/functional-l0-reviewfix BIG_ARTIFACT=<newHTML> BIG_PYTHON=/tmp/cardrpg-big-resume-tools/bin/python BIG_LAB_SIZE_EXCEPTION=reports/cardrpg-big/look-ui/l0-size-exception.json node tools/cardrpg-big/delivery-functional.mjs. Ten groups use short atomic locks,7secondhandoffs. Do not launch before exactexception exists. Scripts require all5gateexits0.
Build main with BIG_LOOK_V2=1 BIG_PYTHON=/tmp/cardrpg-big-resume-tools/bin/python node tools/cardrpg-big/build.mjs after oldrunnerdone. Keep baseline-v1.html exact9a5f6ebb. Run audit-look-checkpoint.mjs; verify sourceinputs,5logs,10receipts,204screens,30togglecaptures,allactivecontrast0 and flagoffgraph/protectedpaths. Do not falsifycounts if actualdiffers.
Write L0 checkpoint/report coverage; copy report+STATE/HANDOFF toledger; publish only after5gates. Read B-OUTBOX atboundary and beforePR, not polling. Answer any next sharedrequest in nextcommit. A CHECKPOINT includes exactHTMLhash so B maymeasureit. Final full25unit/86action/10config matrix onlyLOOK B/finalL7artifact,notL0.

## Constraints
REFERENCE: RULES.md; sync/coord/cardrpg-big/OWNERSHIP.md

Singleagent,no subagents/modelworkers/imagegeneration. Aports5910–5913, B5920–5923; /tmp/cardrpg-big-locks/timing.lock atomic ownership/finallyrelease;6.5shandoffs;nice10non-timingheavywork. Kill only verified ownPIDs,neverbyname. No editBworktree. Sync only A-OUTBOX append-only onai/codex-cardrpg-big-sync; readB atboundaries. Commit/push memory after eachfinishedstep; mirrorledgeronpush. Preserve unrelatedledger/main edits.
