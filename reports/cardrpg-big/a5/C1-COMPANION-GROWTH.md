# Companion growth previews

GameplayV4 Companions now shows the next level or star rank, currency and shard cost, actual Health/Attack/Defense changes, and newly unlocked skills before spending. The preview runs the existing public transaction on a copy. Clicking runs it against the current account again; unavailable training shows its reason. OFF retains the original buttons. No rules, prices, saves or combat change.

Source `994d840566ffe97433bc1522cfa8e9411351ea42`: typecheck, lint, 1,760 web tests, 1,192 rules tests (+2 expected failures/11 skipped), 421 E2E tests and build all pass on the original first source-suite attempt. Six focused tests cover immutable previews, actual spend, skill unlocks, affordability, route lock, stale funds and selected companions.

Separate ON/OFF artifacts pass 60 browser checks across 1280×720, 1440×900 and 1024×600 in both existing looks. Enter levels Mochi; Space adds a star. Previewed costs/stats/skills equal the public command; other cats stay unchanged. Poor/capped/active-route states reject unavailable training. All 36 targeted captures have zero horizontal overflow and visible controls; minimum scoped text contrast 6.858. These are synthetic edge fixtures, not new earned-account or cadence evidence.

Original focused-test expectations incorrectly required a zero Defense change to appear and assumed 60 shards instead of the actual 20. Browser attempt1 compared state after explicitly dismissing discovery cards with a snapshot from before dismissal. Its corrected harness checks full state after acknowledgement (only pending discovery events cleared), then verifies selecting Soot changes no state. Original scripts, failure logs and captures remain; production and artifacts were not changed during browser verification.

[Source-bound audit](c1-growth-preview/audit.json) verifies every log, runtime/tool hash, fixture and artifact. Exact package diff and all original rule hashes reuse the previous OFF165-cell/8,250-route digest; no repeat combat sample. Baseline-v1 and13historical sims remain exact. No fresh acceptance seed was used.

[Contact sheet](c1-growth-preview/contact.jpg) · [Offline game](c1-growth-preview/artifact/index.html), 20,924,425bytes, SHA-256 `6c09ce3c5cc1725f54eb91bb4f6b8b4429cb219bd3cee6825593f2bb84b9d4e7`. Representative captures from all three widths were personally inspected. Alternate Look is accessed through explicit reviewer mode. This is not the Z screenshot pack or a startup measurement.

B1/B2/display/cadence/startup/Z remain open; the previous 749.2second reward gap and907.7combat seconds remain MISS. No B/protected edits, model helpers, merge, deploy, main push or on-chain action.
