# S8 elapsed observation attribution

The original first30minutes contain 990.29s of combat, including 466.40s in battles recorded as losses. H0 contains 896.67s; the unchanged reduction gate measures -10.44%. All window boundaries and recorded results are retained.

The longest reward-or-celebration gap is 929.86s, from 14.50 to 30.00active minutes (Claim cafe service → window end). Combat occupies 514.41s of that gap.

The first recorded daily-supplies notice appears at 14.64active minutes: “Tonight's supplies are gathered. Missing stars still count.” (hub). The UI predicate requires every daily currency cap to be reached; grantDepth clips each currency to its remaining allowance. This is direct evidence of the cap boundary in the observed session, separate from the loss/action attribution. Raising caps would also affect the already-missing heavy/casual economy ratio, so no cap increase is applied as an untested cadence repair.

|Encounter index|Recorded seed|Enemies|Result|Rounds|Actions|Seconds inside gap|
|---|---:|---|---|---:|---:|---:|
|13|2024383137|teacup-healer, button-guard|party|4|11|27.89|
|14|1133702706|button-guard, sock-skipper|party|3|8|16.32|
|15|30332408|rain-spool|enemy|13|31|81.02|
|16|3882441614|button-guard, button-guard|party|2|6|20.64|
|17|3921343890|sock-skipper, teacup-healer|party|3|9|17.42|
|18|899726880|rain-spool|enemy|12|36|84.00|
|19|1211488677|teacup-healer, sock-skipper|party|4|11|29.64|
|20|2503341991|sock-skipper, button-guard|party|3|7|13.71|
|21|188593055|rain-spool|enemy|12|31|78.72|
|22|4010165288|sock-skipper, needle-moth|party|3|8|23.80|
|23|3742173748|button-guard, sock-skipper|party|3|8|13.72|
|24|126583848|rain-spool|party|12|33|73.25|
|25|1028839662|teacup-healer, sock-skipper|party|3|9|27.86|
|26|563811602|sock-skipper, binding-thread|party|3|9|6.43|

[All windows, battle hashes, actual skill availability and action counts](home/attribution.json). This attribution does not establish which rule caused the difference. Review actual support opportunities and loss intervals before a future TRAIN change; do not change playback speed, drop losses or repeat the hour without a justified change.

- Recorded action counts and losses describe the fixed policy; they do not isolate a cause or a safe tuning change.
- Combat duration is clipped to each window. A battle crossing its boundary remains included.
- Progression can lock ultimates. Earned-route skill availability is separate from the base-stat and matched-power D4 probes.
- This reads the original observation only; no new Home run, selected seed, gate or denominator.
