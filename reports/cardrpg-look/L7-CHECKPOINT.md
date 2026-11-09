# L7 — isolated viewer and audited final measurements

REFERENCE: docs/cardrpg-look/index.html; validation/l7/audit.json; validation/l7/freeze.json; CARDRPG-LOOK-REPORT.md

Source `c754dbbadc1462c55212aa801aa8bb593414941d`, artifact `39645d319c264bac0c1011d0e5370de335281ebf6e1df64de67978e34bcb4133`, 31,493,122bytes/1937hashed inputs. All25models×4angles,9stageviews and6desktop configurations personally reviewed. Offline viewer restores account/screen state and disposes its scenes; actual skill gallery exposes86actions/25owners,0.25x/effect-only. Original loading-overlay failure is preserved under attempts/overlay-1.

Five source gates passed; explicit demo-tools TypeScript passed; E2E: 421 passed in one suite. Final matrix completed once on this artifact:860valid cases/1720casts across10configurations. Raw frames independently recomputed; actual requested quality verified. Lifecycle measured20natural replays of one encounter after a baseline fight, not20different encounters. Five silent25second gallery videos have six personally viewed sample frames each; no continuous viewing claim.

Timing isolation remains unverified: lane A retained an A5-H0 page without explicitly suspending ambient rendering between shared-lock leases. Numeric comparisons describe this run, not isolated-device acceptance; see validation/l7/timing-context.json. All raw measurements remain intact.

Missed or unverified targets:

- Original 24 MB target exceeded; explicit visual justification recorded for up to 32 MB.
- Exact startup byte parity +93 bytes.
- Cold-open maximum 133.4 ms exceeds the historical 117 ms ceiling.
- Literal retained-heap flatness is not established: final delta +641,528bytes. The recorded 2MiB tolerance passes and GPU object counts remain constant; neither finding proves an absence of leaks.
- Exclusive timing isolation is unverified because A5-H0 retained an unsuspended page between shared-lock leases. Budget numbers remain observations under these conditions.
- First/repeat ≤50ms: 4/1720 applicable cast windows miss the budget.
- CPU4 Balanced/Low p95 ≤33ms: 4/1032 applicable cast windows miss the budget.
- The separate gallery matrix also records a 666.6ms full-page frame before the first cast. This wider interval includes initialization and casts; it is not counted again as an independent cast failure. See interval table and raw profile below.
- Historical L4 strict1162effect-pair distance decreases remain unresolved.

See the report for full numeric results, per-unit tiers, historical/current evidence boundaries, visual limitations and next fixes. A owns icon/frame wiring and merged delivery. A4P1/P3/P4 optional presentation requests to B remain open as separate compatibility work. No A4 runtime adoption, shared/protected edits, merge or deployment. Draft publication reference is recorded in memory/STATE.md after remote verification.
