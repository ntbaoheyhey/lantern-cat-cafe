# A4 P5 — a working cafe between routes
REFERENCE: GAMEPLAY-V4.md section7. Local Gameplay v4 preview; live defaults unchanged.

The Hub offers a next action, elapsed cafe service, the existing daily/weekly quest board and one ordered lesson at a time. Its two-service allowance uses the public idle calculation with a monotonic clock floor, including calendar advances before a claim. Rollback and duplicate claims pay nothing; skipped dates do not grant every absent day's rewards. Returning day7 stops tutorial repetition.

The collection journal keeps first ownership after salvage, completed sets and rewarded routes. Five once-only milestones show the available capped reward before claiming. A full allowance preserves a pending claim; partial awards are explicit. Existing board rewards use the same caps and do not create a second quest source. THC12 migrates earlier saves and retains journal, lessons and clock state. OFF saves remain THC7.

|Style|Accounts through day30|Mean earned paid pulls|First Legendary / chosen reward censored at day30|
|---|---:|---:|---:|
|casual|3|40.00|3 / 3|
|regular|3|40.00|3 / 3|
|heavy|3|40.00|3 / 3|

The deterministic bot starts with a new account and uses actual service, route, quest, milestone, invitation, level, equipment, preset and recipe commands. No levels, unlocks, currencies or rewards are injected. Synthetic increasing time is not a real-time user study. Per-day progress, first-reward days, failed claims and each state digest are in `p5/sim/progression.json`. This9-account functional check is **not** the required P6 30accounts/style×45day economy acceptance; missing rewards remain censored rather than inferred.

Five gates: see `validation/a4-p5-final.json` for exact counts and original logs. Thirty-six captures across1280/1440/1024 and Classic/Look have zero page errors/overflow and minimum sampled contrast7.327:1. Actual fresh-save UI clicks exercise elapsed time, service→quest reward, next lesson and journal. Original1280 and retry1 exposed competing Look CSS specificity and failed contrast. Two scoped fixes produced the verified retry2 captures; all earlier failure logs are retained. Imported full-cap fixtures test deferred once-only claims; they are not represented as earned progression. Full204 pack remains P7-only.

OFF165cells/8,250routes retain47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Original baseline and13 historic sim files remain unchanged. No B-owned or protected changes. Battle presentation requests stay open; no B checkpoint adopted.

Artifact26,215,386bytes; SHA-256206be306a39b7d3623c5f307167a64f91e0353d2f1d2b685111f21ae1b4ed3d8. Cold CPU remains unmeasured; final startup comparison belongs to P7. Full balance and economy P6, final demo/playtest/report P7 remain pending.
