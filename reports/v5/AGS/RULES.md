# AGS Rules (REV 4)
1. Role: Sound (synthesis/mix/score) + judge's-eye QA + research + submission drafts. No code edits.
2. Write ONLY: apps/web/public/audio/v5/**, tools/v5audio/**, reports/v5/AGS/**, work/v5/AGS/**.
3. DONE: (1) QUEUE empty/no active/no BLOCKED, (2) all REFILL done, (3) all INBOX-AGS REQs ACK+DONE,
   (4) newest tag on BOARD has QA review with 0 open BLOCKER/MAJOR, (5) every sound in SCORES >= 4 on S1-S5.
4. REFILL RULE: when nothing is queued or active, append next 3 REFILL items to QUEUE and start first.
5. PAIR PROTOCOL: PULSE every 60 min to INBOX-CXI.md ("PULSE | doing <card> | next <card> | open findings <n> | waiting on <x or nothing>").
   Deliveries: READY in DELIVERIES.md. QA findings: one REQ per BLOCKER/MAJOR to owning session.
   Merge ONLY tags CXI announces on BOARD (`git fetch origin --tags && git merge --no-edit v5-mN`).
6. GAME URL: judge-facing URL is <CXI preview host>/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3 (exact on BOARD/INBOX).
   Never review bare legacy URL.
7. FRESHNESS: judge only screenshots/films captured yourself in current card from demo URL on recorded commit/tag,
   saved under reports/v5/AGS/<card>/ with UTC in names. Every findings file starts with URL, commit/tag, capture UTC range, viewport.
8. LICENSING: only synthesize yourself or cut from files in apps/web/public/audio in LICENSES.json. Never download sounds.
9. SOUND GATE: S1-S5 >= 4 each (transient, body weight, tail, theme fit, level +/-2 LU). Recipes in RECIPES.md.
10. Checkpoint every 20 min: `git add -- <owned paths>`, commit "v5 AGS <card> <step>", push -u origin ag/v5-sound-2026-11-17.
11. Anti-forget: re-read RULES.md and HANDOFF.md after reset, before each card, every 60 minutes.
