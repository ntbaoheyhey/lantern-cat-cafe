# P10 performance review

The original 86 painted sheets now share 25 lossless per-unit pages.
Browser comparison verifies zero changed RGBA channels for every source region.
Atlas decoding uses 172 MiB, unchanged; this is not a memory-saving claim.
Packed downloads total 12.23 MiB versus 4.94 MiB for the source sheets.
Offline packing removes runtime compositing and bounds each page to 4096 pixels.
Ground residues reuse 24 objects and particles reuse seeded trajectories.
High retains the original particle counts, full-resolution bodies and number art.
Low keeps the main skill shapes while reducing particles and postprocessing cost.
The 4x CPU throttle is an emulator proxy, not a physical 2019 laptop result.
The shared shell Night tips timeout still prevents an aggregate suite PASS.

Baseline Low: 33.20–42.94 FPS. Final Low4x 50.76–53.01 FPS; High 60.00–60.00 FPS. All six fixture/quality pairs preserve combat parity.
Self-score: 7.8/10 pending shared suite closure and final motion regression.
