1. Role: Asset diet. Produce smaller WebP/AVIF siblings so 1st battle <= 8MB. Do NOT change code.
2. WRITE ONLY: NEW sibling *.webp/*.avif in apps/web/public/{units,art,ui-art2,relics,cinematics}/**, tools/v5assets/**, reports/v5/AG3/**, work/v5/AG3/**.
3. NEVER edit, move or delete existing files. Never generate images.
4. Keep exact dimensions for rig pages (UV coords depend on them). rig-depth.half.webp is 50%.
5. Skip if saving < 30%. Quality gate: SSIM >= 0.985 (rig), >= 0.98 (UI).
6. Montages: view <= 4 images at once. Commands <= 40 lines output.
7. Batch conversions in background: nohup nice -n 15 node tools/v5assets/convert.mjs ... > log 2>&1 &
8. Checkpoint every 20 min: git add tools/v5assets reports/v5/AG3 + $(cat work/v5/AG3/new-files.txt). Never git add -A.
9. Mailbox: read INBOX-AG3.md, BOARD.md, USER.md at checkpoints. STOP on STOP-ALL or STOP-AG3.
10. Owner-only: secrets, deploys, wallets, transactions, contracts, main, submission.
11. Pre-approved tools: log to TOOL-PROPOSALS.md, install free/open-source tools without account/payment.
