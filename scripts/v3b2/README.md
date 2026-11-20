# B2 acceptance checks

Run `pnpm gates:v3b2` for the complete report or `node scripts/v3b2/check-gates.mjs --card S1` for one card. Missing evidence produces FAIL and exit code 1. `--write` refreshes `reports/v3-shell/b2/GATES.md`. The complete gate report always includes every card, even before production starts.

`thresholds.mjs` transcribes Revision 2 of the user's 13 November request. Its independent literal test fixture must never be regenerated from the implementation or relaxed to match measured results. Decimal byte budgets are conservative. CPU and economy runtime upper bounds are strict; the other stated inclusive bounds remain inclusive.

Evidence adapters live alongside each gate in `check-gates.mjs`. Production scripts write the named JSON reports. Records that point to evidence use `{path, sha256}` with repository-relative paths; changing the bytes invalidates the gate. Test records additionally carry actual `exitCode` and `passed` values. Economy config and report citations are checked against the bytes in Git HEAD. Do not manufacture passing measurements, set approval flags to bypass missing artifacts, or count an empty array as a successful universal check.

Units: audio time in seconds, LUFS and dBTP as measured floats, coverage/silence/market share as fractions, pitch separation in semitones, UI duration in milliseconds where named, economy amounts from the shared rules configuration. Screenshots retain exact viewport dimensions in their records. Reference images and decoded reference audio must never enter this directory or Git.

PARTIAL is only a freeze-state qualification for V, U3, S5 and E3 under the explicit conditions in the request. It does not turn FAIL measurements into PASS, and a PARTIAL card must not be marked done. Future sync dates cannot pass before their specified UTC times.
