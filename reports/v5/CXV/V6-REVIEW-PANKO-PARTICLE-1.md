# Panko particle1 temp sheet — V6 independent review
Request path /Users/bao/th-v5-ag2/apps/web/public/vfx/v5/temp/panko-particle-1.webp; ACK sent. Verdict: promising material, geometry/wiring BLOCKER; no production approval.
Own capture2026-11-17T12:43:51.342Z–12:43:57.087Z; runtimeb064f41fc+V-A working patch; source AGV temp/uncommitted, not falsely assigned a producer commit.
URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1 .
Exact sourceSHA256 0f1298e2e72b76966e28f44656858ce76111884f60a42caa52b6a15ac7f7d416;1024x1024 raw sheet. Existing panko-particle-1 manifest declares1x1,add,target,size128.
Own evidence work/v5/CXV/films/V6-panko-particle-1/review.json and review-small.jpg;16 runtime samples,4 textured draws each,plus-lighter,zero page errors.
The raw picture visibly contains a4x4 collection of distinct pieces. With the current1x1 declaration, each mote draws all16 pieces, so four motes become64 fragments in overlapping square grids. This is a producer packaging mismatch, not an approved runtime appearance.

| G | Raw fresh composite | Existing-metadata runtime | Finding |
|---|---:|---:|---|
| G1 light ramp |4|2|Useful amber/cream edge detail; multiplied sheet area floods bright yellow over the target.|
| G2 organic matter |4|3|Irregular porous crumb/fold surfaces are substantially better; tiny repeated grids lose that detail.|
| G3 motion |1|3|Static ingredient collection; runtime travel exists, but whole-sheet motion exposes the grid.|
| G4 not an icon |4|2|Individual fragments have broken silhouettes; collection-as-one-mote reads as a tiled stamp.|
| G5 hero fit |4|4|Warm bakery fragments suitPanko; avoid the flame-shaped pieces for the primary crumb to keep Soot distinct.|

Exact fix: choose one porous chunky crumb, crop its cell with transparent margins and export a single128px or256px particle matching1x1. Alternatively explicitly publish a particle-variation atlas with a supported per-particle cell selector; do not silently label the collection a temporal16-frame animation. Keep the remaining fragments as separately named variations if needed. Send the processed file and metadata for a fresh runtime check. Keep white confined to small tips/pores, not broad flame tongues.
