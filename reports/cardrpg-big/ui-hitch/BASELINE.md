# UI hitch baseline — screenshot-free
REFERENCE: memory/PROMPT.md ADDENDUM WAITING-L1 item1; ui-hitch-check.mjs

Artifact f1234525fb744d0b318c2ea65727256cfb71fc6cc31c2380cf6fac93941a0f56. Fresh Chromium, real clicks, natural 1/10 pulls, no screenshots. Measured from page open; table includes frames overlapping first interactive and each stage boundary. Two visible stamp grants are the only fixture. Fight uses allowed Skip to result. One sample per CPU; not a final acceptance.

|Stage|CPU1 max ms|CPU4 max ms|CPU4 >25 / >50|
|---|---:|---:|---:|
|cold-hub|33.3|116.6|6 / 2|
|fixture-settings|33.3|50.0|1 / 0|
|hub|16.8|49.9|2 / 0|
|team|16.8|16.8|0 / 0|
|collection|16.8|50.0|5 / 0|
|equipment|16.8|50.0|3 / 0|
|invitations|16.8|50.1|4 / 1|
|one-pull|16.8|16.8|0 / 0|
|ten-pull|16.8|33.3|1 / 0|
|return-hub|16.8|66.7|6 / 2|
|route-map|16.8|16.8|0 / 0|
|prepare|16.8|16.8|0 / 0|
|fight|16.8|50.0|8 / 0|
|result|16.8|16.8|0 / 0|
|rewards-map|16.8|16.8|0 / 0|

CPU1 4529 frames, MAX33.3ms, 2>25/0>50. CPU4 4537 frames, MAX116.6ms, 36>25/5>50/1>100. Cold CPU4 fails100ms. Six preview scenes created per route. The previous 200ms screenshot run remains a miss; this independent run does not erase it.

Trace is separate diagnostic CPU4: MAX116.7ms, 70>25/11>50, six scenes. task-analysis.json and profile-analysis.json identify a 76.346ms constructor timer (TurnScene/post/effects) and an84.111ms warm-stage task (makeStage/decorate/clone). A72.344ms layout task includes47.793ms Layout. The78.773ms end-of-run serialization task belongs to evidence extraction, after route measurements; retained, not attributed to game. Raw trace.json.gz and RAF/longtask/LoAF arrays retained.

A fix: persistent preview lifetime/deferred paint+idle initialization, isolated imperative canvas, cached reveal clearance and scroll after paint, content-visibility for card grids. B engine internals require an outbox REQUEST. These are currently WIP; no after-pass claimed.
