# Integrated controls checkpoint
REFERENCE: ../../memory/PROMPT.md lines146–150, ../../../cardrpg-big/validation/integration-controls.json, lab/checks.json, reveal/checks.json, invitations/checks.json

Runtime source 289ffa0e7a1d0e6c324bc8526fa093e64d579b56 includes A and published B2c/B3/B5/B4/E1/E2. The measured HTML is /tmp/cardrpg-big-integration-controls-index.html, 23,376,725 bytes, SHA-256 85592fae2f4ca0bd35d2b92ce1f4cfe729362d38b54cdaee1ff5c43fa5af7557. The script checks every source and asset hash before the run. The shared timing lock covers the browser pack.

## Acceptance
REFERENCE: ../../validation/integration-controls.json, lab/checks.json, reveal/checks.json, invitations/checks.json

- Typecheck, lint, build, unit and E2E pass. Web tests1722, rules1020 with2 inherited expected failures and11skips, E2E421.
- Lab21captures across1024×600,1280×720 and1440×900 pass. Horizontal overflow0px, errors0, remote requests0, minimum tab contrast10.1397.
- Rare entrances8cases/24captures pass the existing canvas/fairness bounds, includingCPU4. Whole result and action visibility are covered by the separate reveal-fit follow-up.
- Invitations4configurations/36captures pass, errors0 and remote requests0.
- Mochi1× video is25.000s at1280×720,5,452,632bytes,0errors. Its account is restored exactly. The record lists18 action starts. See ../../video/mochi/captures.json.
- These screenshots include capture overhead. Controlled performance remains in separate raw-frame receipts.

## Sequential visual inspection
REFERENCE: ../../video/mochi/review/first-ten-seconds.png, lab/1024-gallery-stage.png

Twenty frames sampled every0.5s cover the first10s of Mochi's video. They show the dash toward the opponent, amber trail, circular guard effects and group lantern motif. The characters occupy a small portion of the wide stage and thin bright effects lose contrast against the rug. The inspected1024gallery screen keeps its controls inside the viewport, with the drawer covering the right side of the preview. Hide controls exposes the complete stage for playback. The full12hero/boss/ultimate review remains open.
