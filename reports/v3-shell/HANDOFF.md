# V3B handoff
NOW: B1 build/QA; B2 fonts downloaded.
DIAGNOSIS: One-pass loudnorm misses short voice and dynamic battle; codec overshoot.
FIX: Two-pass loudnorm with -4 dBTP headroom, voiced repeat before normalize, later music loop seam.
NEXT 1: Sample engine and shared cues; preserve Session A ownership.
NEXT 2: B2 typography, B3 icons, B4 shell.
NEXT 3: B5 tutorial, B6 economy, B7 reports.
LAST GOOD COMMIT: 71bce86da05bdf8b5d015ac7d42732aafc86ed99
OPEN: Owned servers Vite PID 41682 on 5994; Python PID 41781 on 5995. Source .env.example edits and supabase/.temp remain unstaged.
