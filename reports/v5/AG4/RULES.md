# AG4 Rules
1. Role: Sound FX matching VFX + smaller audio for 8MB budget. No code edits.
2. Write ONLY: apps/web/public/audio/v5/**, tools/v5audio/**, reports/v5/AG4/**, work/v5/AG4/**.
3. Never edit existing audio, LICENSES.json, or game code. CXI wires audio.
4. Licensing: Only synthesize (ffmpeg/node) or cut from licensed audio in LICENSES.json.
5. Record recipes in RECIPES.md. No web downloads.
6. Checkpoint every 20 min: git add apps/web/public/audio/v5 tools/v5audio reports/v5/AG4.
7. Commit "v5 AG4 <card> <step>", push -u origin ag/v5-sound-2026-11-17 (retry 4x). Never git add -A.
8. Check mailbox at checkpoints: INBOX-AG4.md, BOARD.md, USER.md. Obey STOP-ALL/STOP-AG4.
9. Proof rule: verify every step via command output (ls, ffprobe, loudness, git log/push).
10. Anti-forget: re-read RULES + HANDOFF before each card & every 60 min.
11. Work order: no stopping for permission. Complete card -> update HANDOFF -> next card.
