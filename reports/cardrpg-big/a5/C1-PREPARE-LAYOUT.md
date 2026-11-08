# Prepare decisions in the first viewport

The original Home02 screenshots showed formation below the720px viewport: forecast, scouting and star panels appeared before the player's choice. The retained pre-change browser reproduces it. Gameplay V4 now puts formation first, with the encounter outlook beside it at1280/1440 and below it at1024. Standing plans remain in the crew panel; some secondary controls still require vertical scrolling at smaller sizes.

Source `d8eebe8c7`. Original first-attempt typecheck, lint,1771web tests,1192rule tests(two expected failures/eleven skipped),421E2E tests and build PASS. The prototype passes18grouped browser scenarios/18captures across3widths, bothlooks and ON/OFF. Two old-layout captures reproduce the original problem. All five formation buttons and Fight are inside the viewport; horizontal overflow0px, minimum scoped contrast6.858:1. Keyboard placement, last-front guard, standing-plan roundtrip, real forecast and unchanged-account assertions pass.

Two separate native-worker scenarios PASS: changing row/plan terminates obsolete workers and ignores delayed real results; actual worker-src CSP denial keeps formation and Fight available with the fallback. The current result is delivered only after the stale-result assertion. Personal review covered1280earned,1024alternate and1440practice.

The adopted ON and OFF builds are byte-identical to their tested isolated prototypes. ON20,927,769bytes, SHA-256 `e9c74c38a3bbde96c9d3a5e2ad2780ef4a8e53e068dd11041ea8c0d6d7b954e4`. [Playable preview](c1-prepare-layout/prototype-on/index.html). [Source-bound audit](c1-prepare-layout/audit.json) verifies original logs/captures, unchanged rule hashes and full package diff for the prior8250route OFF digest, baseline-v1 and13historical simulations. No new combat, saved-state, economy, dependency or event-schema changes.

This is targeted UI evidence, not the Z screenshot pack or a human playtest. Alternate Look is entered explicitly withdev=1. Original Home02 reward cadence/dead-time remainMISS; no new improvement is claimed from this layout change. Fresh acceptance seeds remain unused. Public game/guide remain A4.
