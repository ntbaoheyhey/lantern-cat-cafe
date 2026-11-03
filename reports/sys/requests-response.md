# Overnight request dispositions

Sources: `reports/ui/REQUESTS-FOR-SYSTEM.md` on ai/codex-ui-ledger and `~/.taskbar-hero-locks/requests/S1.md`, read 2026-11-04 Vietnam time.

| Request | Disposition |
| --- | --- |
| CXLU1 rune definitions and authoritative ownership/equipped slots | Declined: this night explicitly keeps original-economy data behind its default-OFF flag and prohibits invented scope. Current server state has no rune ownership contract. Preserve Sample/Unavailable; adding an empty ownership field would falsely claim authority. |
| Rune/companion/skill read-only selector when models ship | Declined for the same reason; no authoritative availability model exists. UI's current labelled samples require no server write or model invention. |
| ART2 health-hold verdict | HOLD CLEARED: nonce200 at19:20:48Z and19:31:17Z,628.63seconds apart. UI release separately parked by same-UTC-day Vercel >100 deployment-limit error. Historical 502 cause remains unproven. |
| WalletButton generic wrapper aria-label advisory | Shipped in draft auth hardening head ca26498: wrapper has role="group" and unchanged accessible name Wallet. Unit test asserts the named group, visible error/retry action, zero session and zero verification attempts after mocked nonce502. A/B gate in progress; not merged/live. |

CXS1 is already in main: `docs/security-overview.md` plus the source/evidence matrix. CXS2 is already in main: `docs/submission.md` explicitly DRAFT/not submitted, `reports/submission` media and provenance. #260 integrated CXS2 before current main340f88b. No duplicate security/submission card created and nothing submitted. No economy configuration changed; `CONFIG.features.originalEconomy` remains false.
