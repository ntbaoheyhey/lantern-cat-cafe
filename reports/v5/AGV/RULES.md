# AGV RULES (REV 4)
DONE: (1) QUEUE empty/proven; (2) REFILL all done; (3) INBOX-AGV REQ/IMGJOB ACK+DONE; (4) SCORES all CXV pair score >= 4 on G1-G5. Then reply "DONE: queue, refill list, requests and quality gate complete <UTC>".
STOP: STOP-ALL or STOP-AGV present -> commit, push, reply "STOPPED: <file>".
REFILL RULE: When nothing queued or active, append next 3 REFILL items to QUEUE and start first. Empty queue != done.
PAIR PROTOCOL: PULSE CXV hourly to INBOX-CXV.md ("PULSE | doing <card> | next <card> | quota ok/limited | waiting on <x>"). Send texture reviews to CXV ("REQ | REVIEW <set> montage <path> composite <path>"). CXV pair score is final gate.
QUOTA FALLBACK: If image gen 429/503/quota/slow (>2 fails or >10 min): append IMGJOB <id> | <spec> | target apps/web/public/vfx/v5/from-cx/<id>.webp | why to INBOX-CXV.md. Log in GEN-LOG.md. Continue non-gen work. Retry gen in 30 min.
QUALITY GATE: G1 light ramp, G2 organic matter, G3 motion (>=12 frames), G4 not icon, G5 hero fit/painted cosy look.
COMPOSITE: Fresh battle frame captured from http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3 (URL on BOARD wins) with heroes & enemies visible at in-game size. Never empty background or old screenshots.
FRESHNESS: Judge only images captured/generated in current card. Record URL + commit + UTC.
TEXTURE SPEC: 4x4 256px (1024 atlas) for hits/ults; WebP q85 alpha_q90 <= 220KB; vfx/v5 total <= 3.5MB; check.mjs passes.
OWNED PATHS: apps/web/public/vfx/v5/** (except from-cx/**), tools/v5tex/**, tools/v5assets/**, sibling *.webp/*.avif next to existing under apps/web/public/{units,art,ui-art2,relics,cinematics}/**, reports/v5/AGV/**, work/v5/AGV/**.
CHECKPOINT: Every 20 min git add -- <owned paths>, commit "v5 AGV <card> <step>", git push -u origin ag/v5-vfxtex-2026-11-17. Never git add -A.
SHARED KNOWLEDGE: Read /Users/bao/taskbar-hero-mailbox/LEARN/INDEX.md at start and before cards. Save findings as LEARN/AGV-<topic>-<YYYYMMDD>.md and append 1 line to INDEX.md. V5 MOTION-PARAMS and V6 HIT-FEEL go to LEARN/ too.
