# L1 portrait adapter preparation
REFERENCE: ../L1-ADOPTION.md; checks.json; ../../memory/PROMPT.md ADDENDUM LOOK

Verbatim preparation record copied from /Users/bao/taskbar-hero-cardrpg-portrait-prep at local49096d5353a167d0726f9c4718b93ae1ba1efb16; relative REFERENCE paths refer to that worktree.

This WIP is isolated from draft358 and from the accepted L0 artifact. No B worktree or unpublished asset has been copied or modified. The adapter uses the observed partial manifest contract only; it must be rechecked against the published L1 contract before adoption.

## Implemented and checked
REFERENCE: ../../../../../apps/web/src/game/cardrpg/depth/look-portraits.ts; checks.json

Optional manifest and URL globs resolve repository-root paths to Vite/offline blob URLs inside the lazy card-RPG entry. A complete 1x/2x pair supplies src/srcSet; missing pair, missing cat, absent manifest and LOOK-off preserve the classic source and clear srcSet. Selection happens on each render, not once at module load.
CompanionCard covers Collection, Team, invitation featured/reveal/results and battle rewards; Prepare, Field guide and miniature loading images also receive density props. Existing B-owned Battle.tsx still calls portrait(id), safely obtaining the 1x source; its tiny HUD image is below the source resolution at DPR2. No B-owned file edited. Skill icons/frames stay untouched until L6 contract arrives.
Three targeted test files pass22tests, including an actual CompanionCard React render under the real look flag subscription, repeated on/off source updates, missing-cat fallback and account equality. Web typecheck/lint pass. First typecheck failed solely because sparse checkout omitted tools/cardrpg-big2; original log retained. This is not five-gate acceptance.

## Ready for published adoption
REFERENCE: ../../../../../tools/cardrpg-big/look-portrait-check.mjs

Browser harness requires exact LOOK_PORTRAIT_SHA and rejects a missing binding before launching a browser (negative guard checked). It verifies real Look A/B clicks on Collection/Team, all three heroes, actual currentSrc, decoded bitmap256x320/512x640, srcSet removal on OFF, missing-Marigold fallback, contain sizing, account/route preservation, no remote requests/errors, and saves crops/fullscreen hashes. Run separately at1024x600,1280x720,1440x900 andDPR1/2 through with-timing-lock.mjs with6.5s handoffs.
Harness syntax passes; real browser execution is NOT YET because no published L1 images have been adopted. Whole-face/crown visibility requires visual review of those actual crops. It does not claim sharpness, timing, art scores or compressed-model support. After adoption build a new main hash and run five gates, default-startup comparison and ten-group functional pack before A CHECKPOINT. L0 f123 receipts remain immutable.
