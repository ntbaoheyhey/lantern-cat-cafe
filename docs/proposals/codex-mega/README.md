# Codex mega prompt v3 (Codex with full authority, living draft)

`PASTE-ALL-codex-mega.txt` is the single prompt to paste into Codex. It covers:
- **Orchestration:** an orchestrator plans small task cards and a dependency graph, then runs subagents in parallel on the best model at the highest effort.
- **Authority:** Codex has full authority over design, economy, features and art (original art only), with design notes in `docs/design/decisions.md`.
- **Merging:** Codex merges its own PRs through a strict merge gate, then re-tests main and the live site after each merge.
- **Production safety:** anything that needs the backend, contracts or the DB updated stays behind a flag that defaults off.
- **User steps:** steps only the user can do (secrets, live migrations or deploys, Vercel env, real-fund wallet tests, repo public, submission, mainnet) go into `reports/NEEDS-USER.md`.
