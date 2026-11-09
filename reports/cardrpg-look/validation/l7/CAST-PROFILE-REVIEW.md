# L7 missed cast windows

Artifact `39645d319c264bac0c1011d0e5370de335281ebf6e1df64de67978e34bcb4133`. 860/860 cases; 4 distinct missed cast windows. All 860 cases completed once; counts match the independent raw-frame audit.

Every row uses the original cast boundaries. First/repeat maximum must be ≤50 ms; CPU4 Balanced/Low p95 must be ≤33 ms. The exact thresholds are used before display rounding. Draw and triangle limits are 250 and 150,000. Page initialization is reported separately in the interval audit.

| Raw case / cast | Maximum ms | p95 ms | Frames ≤20 ms | Draws / triangles | Missed budgets |
|---|---:|---:|---:|---:|---|
|[1440x900-dpr1-cpu4-medium-panko-1/repeat](matrix/config-5/batch-12/1440x900-dpr1-cpu4-medium-panko-1.json)|150.0|66.7|78.57%|92 / 99,159|firstRepeat, cpu4BalancedLow|
|[1440x900-dpr1-cpu4-medium-cinnamon-4/first](matrix/config-5/batch-30/1440x900-dpr1-cpu4-medium-cinnamon-4.json)|266.7|33.3|93.62%|94 / 100,893|firstRepeat, cpu4BalancedLow|
|[1440x900-dpr1-cpu4-medium-brioche-4/repeat](matrix/config-5/batch-36/1440x900-dpr1-cpu4-medium-brioche-4.json)|266.6|200.1|67.27%|97 / 106,600|firstRepeat, cpu4BalancedLow|
|[1440x900-dpr1-cpu4-medium-velvet-1/first](matrix/config-5/batch-36/1440x900-dpr1-cpu4-medium-velvet-1.json)|183.3|33.4|83.33%|90 / 98,852|firstRepeat, cpu4BalancedLow|

Long-task and long-animation-frame entries are retained observations, not a CPU sampling trace. A matched scene-loop or Battle tick callback identifies its source location but does not identify the expensive operation. Durations below are observations inside the whole cast unless explicitly marked as overlapping the peak.

- **1440x900-dpr1-cpu4-medium-panko-1/repeat**: slowest frame ends at 13126.9 ms and records 87 draws / 98,003 triangles. 1 long task(s) overlap that frame (155.0 ms); 0 long-animation-frame entry/entries overlap it. During the whole cast, 8 recorded callback(s) match the scene loop, 0 match Battle tick, and 0 remain unattributed. Next diagnostic: collect an isolated CPU trace across this exact action and tier, inspect the matching callbacks and any unattributed work, then identify the expensive operation before changing prewarm or rendering. No new timing run was performed for this analysis.
- **1440x900-dpr1-cpu4-medium-cinnamon-4/first**: slowest frame ends at 12772.5 ms and records 93 draws / 100,549 triangles. 1 long task(s) overlap that frame (267.0 ms); 1 long-animation-frame entry/entries overlap it. During the whole cast, 3 recorded callback(s) match the scene loop, 0 match Battle tick, and 0 remain unattributed. Next diagnostic: collect an isolated CPU trace across this exact action and tier, inspect the matching callbacks and any unattributed work, then identify the expensive operation before changing prewarm or rendering. No new timing run was performed for this analysis.
- **1440x900-dpr1-cpu4-medium-brioche-4/repeat**: slowest frame ends at 14006.1 ms and records 93 draws / 98,458 triangles. 1 long task(s) overlap that frame (460.0 ms); 1 long-animation-frame entry/entries overlap it. During the whole cast, 10 recorded callback(s) match the scene loop, 1 match Battle tick, and 4 remain unattributed. Next diagnostic: collect an isolated CPU trace across this exact action and tier, inspect the matching callbacks and any unattributed work, then identify the expensive operation before changing prewarm or rendering. No new timing run was performed for this analysis.
- **1440x900-dpr1-cpu4-medium-velvet-1/first**: slowest frame ends at 11843.6 ms and records 90 draws / 98,442 triangles. 1 long task(s) overlap that frame (184.0 ms); 1 long-animation-frame entry/entries overlap it. During the whole cast, 4 recorded callback(s) match the scene loop, 0 match Battle tick, and 0 remain unattributed. Next diagnostic: collect an isolated CPU trace across this exact action and tier, inspect the matching callbacks and any unattributed work, then identify the expensive operation before changing prewarm or rendering. No new timing run was performed for this analysis.

- This reads retained raw frames and PerformanceObserver entries, not a new browser run or CPU trace.
- Payload excerpts are supplied only for blob callbacks whose recorded UTF-16 offset matches the scene-loop or Battle tick body. Source locations are hash-bound to the frozen input files. Other callbacks remain unattributed.
- Matched callback locations do not identify expensive operations or root causes.
- Callbacks during a cast are separate from entries overlapping its slowest frame; absent entries do not prove absence of work.
- Cross-lane timing isolation remains unverified. Do not causally attribute stalls to rendering or background load.
- All applicable misses remain counted, including p95 values above the exact 33 ms threshold.

Machine-readable evidence: [cast-profile-audit.json](cast-profile-audit.json). Raw-file and matrix-summary hashes are recorded there.
