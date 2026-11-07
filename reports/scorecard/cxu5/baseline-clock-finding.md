# Additional prerequisite finding: forge fixture clock expired

Observed after2026-11-01 17:00 Asia/Ho_Chi_Minh (10:00UTC), source untouched. Current root unit run fails5 cases in supabase/tests/v2/functions-forge.test.ts; isolated recheck reproduces5/17 failures.

Root cause: functions-forge.test.ts:17 and:30 pin clock to Date.UTC(2026,10,1,10); insert helper:40 sends that clock to v2_claim. The schema20261101000000_v2_cat_rpg.sql:23 initializes last_claim_at with database NOW(); the unchanged v2_claim guard:357 rejects p_now below last_claim_at+10seconds. This fixture could pass before10:00UTC and now deterministically returns null; the next line reads result.items.

Proof: logs/clock-proof.log records actual database timestamp after fixed10:00UTC, asserts the old-clock claim returns null, then succeeds with the same data and a diagnostic time11seconds beyond the snapshot. The first diagnostic used1second and correctly remained rejected; logs/clock-proof-r1.log preserves it. Full proof source is clock-proof.test.ts.txt; temporary test was removed. No backend files, guards, expectations, migrations or game rules modified.

Suggested prerequisite repair: derive fixture time from the database snapshot (plus required interval), or seed SQL timestamps consistently with the existing injected clock. Preserve assertions and replay/idempotency guards. CXU5 does not implement this out-of-zone repair.
