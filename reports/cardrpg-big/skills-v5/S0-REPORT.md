# S0 baseline
Base A5 closing tip d22f47cb8 / DRAFT406; runtime0e1e15180 unchanged.
The approved spec is copied verbatim to docs/design/cardrpg/SKILLS-V5.md.
The 180 battles reproduce 9.1043% multi-foe damage, 19.3730% multi-ally support,
17.2667 rounds and 4.7778 detonation records per battle. All four skills/baseStats/no gear.
Support counts heal/shield target records, including zero amounts, matching the supplied probe.
The first diagnostic additionally counted buff/dispel targets (18.0387%); preserved in s0-attempt1.json.
Positive-only heal/shield support is 14.1376%; it is disclosed separately, not substituted for the registered metric.
Both diagnostic passes have identical complete battle hashes; no rule change or tuning occurred.
ON 180-battle stream SHA256: c29ec7d2cfb9fbd46aa32b363ade8bc84b3100d558bb646aa4ea04b80f49d031.
ON probe receipt SHA256: 376e28110a8b02e203a6531004877ec893b31d605709a6f0236ba08b27cbd583.
ON 45-route stream SHA256: b85feeb659f013dfd1817d452d233d6c48f8f3e1402e4c5625bf760e49341540 (levels1/6/10 x chapters1/2/3 x seeds1-5).
OFF original165cells/8250routes digest47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3 reused after exact source checks.
Baseline-v1 and13historical simulation byte guards PASS; all original source checks remain bound to unchanged runtime.
Frozen pnpm install PASS. New probe/compat scripts pass Node syntax checks and baseline assertions.
No old C1 source/UI suite or closure rerun; source-identical six-gate evidence retained as directed by R1.
TRAIN only; fresh20001-20500 unused. No B-owned/protected files changed.
