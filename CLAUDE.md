# Token-saving rules

From a 7-day audit of session logs (script: `token-audit.mjs`).

1. **Keep sessions short.** About 62% of cost came from turns with context over 150k tokens. After ~2 hours or when context gets large, write a progress summary to a file and start a new session (or /compact). One batch per session.
2. **Use subagents sparingly.** About 16% of cost was subagent work. Only for broad searches or independent tasks, with a short prompt naming exact file paths. Sonnet for routine work, Opus only for planning or hard bugs.
3. **Keep tool output small.** Read files with offset/limit or grep first. Filter build/test output, e.g. `| tail -n 40` or `grep -E "error|fail"`.

## Lantern Cat Café · UniHack 2026 retrospective

For the second independent review, use the [full-project brief](docs/retrospectives/unihack-2026/PROMPT-CLAUDE.md). Record your own observations at the contest tag before comparing with the [whole-game visual audit](docs/retrospectives/unihack-2026/TOAN-CANH-HINH-ANH.md), including the full cast, arenas, interface, effects and items.

Read the [closeout and character-production findings](docs/retrospectives/unihack-2026/KET-DU-AN.md). Reusable skills are available for [character concept-to-animation review](.agents/skills/duyet-concept-cho-hoat-hoa/SKILL.md) and [evidence-based hackathon retrospectives](.agents/skills/hau-kiem-hackathon-theo-bang-chung/SKILL.md).

For a fresh score, start with the [scoring method and independent reviewer worksheet](docs/retrospectives/unihack-2026/PHUONG-PHAP-CHAM.md). It records the international references, Team1's published weights and how to handle missing evidence.

After recording your own ratings, compare them with [Codex's completed scorecard](docs/retrospectives/unihack-2026/DIEM-HAU-KIEM.md). The scorecard distinguishes release behavior, team process and the pitch estimate.

For the team's competition review, start with the [Vietnamese postmortem](docs/retrospectives/unihack-2026/README.md). It includes three visual comparisons from the published game and its Git history. The [GitHub and architecture review](docs/retrospectives/unihack-2026/GITHUB.md) covers all remote branches and includes the release-specific findings. The [evidence ledger](docs/retrospectives/unihack-2026/EVIDENCE.md) identifies the contest tag, records the read-only checks and gives three questions for Claude's second review.
