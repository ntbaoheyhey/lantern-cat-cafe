# Desktop evidence — v5-m1.6
Application source:6bb96c69d4fd031c5e7a4e5ffe7be26f6d3929eb. The release tag includes the validated application plus reports.
Judge URL:http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3
Production index SHA256:ef21e23aa191d7b670782e9e53f0c198c679eb9e11971a1d023e1dfadcaf048f. Desktop1280×720, fresh browser/cache disabled. Captured2026-11-17T14:55–14:56UTC.

- FIRST HIT PASS:20,501ms from cold navigation to visible enemy HP165→119, including17,700ms for59words across8tutorial cards at200wpm. Ordinary guest controls; no fixture/save injection, tutorial skip or speed change. Console/page/HTTP errors0.
- PRACTICE ROUTE PASS: guest route detour→return to preparation→receipt9,864ms,0errors. This quick regression advances tutorial cards without the reading allowance; use the first-hit result for the judge timing claim.
- RECOVERY PASS: deliberately rejected EncounterV3 download yields a usable sheet in1,138ms; stalled download offers recovery in8,666ms. Reload page and Back to café both fit entirely inside1280×720 without scrolling. Both paths return to café; explicit reload restores the route. No uncaught page errors; rejected-download console errors are expected injected failures, separate from ordinary journeys.
- COLD BYTES OPEN:8,584,126 /9,145,394 /8,659,811B forwave1/wave3/boss; all>8,000,000B,0ordinary errors. No speculative audio/AVIF savings counted.
- SUITES PASS:typecheck/build0;5,227root=77Node+5,150workspace,including2,927web;11skip,2expectedfail. Root suite includes web; no duplicate unchanged rerun.
- AVALANCHE: local receipt explicitly says no transaction sent and links the deployed Fuji items contract. Five registry bytecode checks and an isolatedAnvil experiment are separate from a public player transaction; none is claimed.
- VISUAL PASS: four new1024×576 sheets, measured then viewed once: reject,stall,first-hit,receipt. Header/café remains visible; recovery buttons fit, damage46 is visible, receipt wording is truthful.

Small reproducible evidence:[v7-m16b-validation.json](evidence/v7-m16b-validation.json). Raw captures/logs:work/v5/CXI/{first-hit,route,recovery,transfer}/v7-m16b/ and work/v5/CXI/jobs/v7-m16b-*.
Final-build films:3×30.000s,actual1×gameplay+browseraudio,0errors,three measured1024×576 sheets visually reviewed once. SeeI-E.md/REVIEW-VI.md and evidence/v7-m16b-films.json.
Earlier66–70s numbers measured the complete patrol receipt, not the V7 first-hit target. Prior m1.5 measurements remain in Git history and their labelled evidence directories.
