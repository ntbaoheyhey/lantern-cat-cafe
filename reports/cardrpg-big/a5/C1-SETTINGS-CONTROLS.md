# Settings shortcuts belong to review mode

Ordinary offline GameplayV4 now hides the four Settings grants: unlock cats/materials, add stamps, unlock chapters/Tower, and advance fixture day. Reviewers retain them with `?dev=1`. GameplayV4 OFF keeps its existing panel. Live Settings has no grants even in reviewer mode. This is player presentation, not a security boundary.

Only the Settings predicate changes. Relics and Evidence components remain byte-identical, as do every game-rule input and package source. Save export/import and comfort controls remain available.

## Verified

- Typecheck, lint, 1,754 web tests, 1,192 rules tests (+2 expected failures, 11 skipped), 421 E2E tests and build pass on `dc60280cf`.
- Twenty-one targeted captures: before at1280, then ON/OFF at1280/1440/1024; player, reviewer and reviewer Look in each. All grant visibility, save roundtrip and keyboard day-advance assertions pass.
- No horizontal overflow, browser errors or remote requests. Scoped gradient-aware text contrast minimum6.858. [Contact sheet](c1-review-controls/contact.png).
- OFF165cells/8250routes are reused only after exact original rules-source hashes and an empty package diff. Digest remains `47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3`. Baseline-v1 and13historical simulations remain exact.
- ON artifact20,923,753bytes, SHA256 `f27ff7dc954d9f8316e20a316ef62c9db96db0be54c13a58db1145d19b49286a`. [Reviewed preview](c1-review-controls/artifact/index.html). Public A4 demo remains unchanged.

Original red regression1fail/3pass, type-query failure, lazy Settings readiness failure and import-return navigation timeout are retained. Import correctly returns to Home; the corrected browser script reopens Settings before keyboard checks. No runtime correction or source-suite rerun followed these harness repairs.

Some reviewer day-advance captures include the existing first-crew discovery card over the lower panel. The original captures are retained; this is not a claim that every control is simultaneously unobscured. Ordinary player Settings has no grant panel.

[Independent source-bound audit](c1-review-controls/audit.json) verifies every log/capture/artifact hash and unchanged protected source sections. This targeted check is not the Z screenshot pack, balance acceptance or startup measurement. Original30minute cadence749.2s and combat907.7s remain misses. Fresh20001–20500 remains unused. DRAFT only; no merge/deployment.
