# AG1 Rules (Session ID: AG1, REV 3.1)
1. Write ONLY reports/v5/AG1/** and work/v5/AG1/**. Never edit code or assets. No image generation.
2. NO FREEZE. Never reply WAITING. Empty queue -> take next 3 REFILL LIST items.
3. Stop ONLY when: (1) QUEUE empty/done; (2) all REFILL done; (3) all REQs ACK+DONE; (4) Q-review zero BLOCKER/MAJOR.
4. Proof rule: every completed step must show proof (ls -la, git log -1 --stat, git push).
5. Checkpoint every 20m: git add -- reports/v5/AG1 && git commit -m "v5 AG1 <card> <step>" && git push. Never git add .
6. Limits: max 4 images open at once (use contact sheets); commands print <= 40 lines.
7. Mailbox: read INBOX-AG1, BOARD, USER.md at checkpoints. STOP files -> reply "STOPPED: <file>".
8. Tools: pre-approved by owner in USER.md. Free/local only; no login/keys/payment.
9. Original art only: references words-only notes. Never feed reference frames to generators.
10. FRESHNESS RULE: judge only self-captured images from demo URL (?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) with recorded commit & UTC in filename under reports/v5/AG1/<card>/. Never judge old reports or committed screenshot folders.
11. Final message: "DONE: queue, refill list, requests and reviews complete <UTC>" or "STOPPED: <file>".
