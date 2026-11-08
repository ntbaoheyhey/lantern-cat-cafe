# Hit-envelope25 results

All three registered arms completed384TRAIN1–50pairs. Exact-once source overlays and first-seed full replay checks passed. No runtime change or acceptance sampling.

|Arm|Worst gain pp|Cells>12pp|Before ≥95%wins|After ≥95%wins|Mean before / after|
|---|---:|---:|---:|---:|---|
|control|88|68|84|105|57.44% / 64.75%|
|hard35|48|19|272|289|95.15% / 96.79%|
|hard45|86|34|116|133|76.81% / 81.07%|
|soft25|0|0|384|384|100.00% / 100.00%|

All candidates fail the prospectively registered expansion rule. Soft25 has no marginal gain because both builds always win; it does not solve balance. Hard35/hard45 lower boss pressure but retain large residuals and increase saturated cells. Reject all three, with no wider follow-up or production adoption.

Current24 main-stat survival cliffs remain open. A separate semantic fix for committed boss patterns is registered as26; it does not inherit any cap or claim numeric closure.

[All pairs and control](results.json) · [method](REGISTERED-METHOD.md). Control outcomes are reused from22;25did not rerun them.
