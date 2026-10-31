# Research: public repos with Claude Code rules and workflows

Date: 2026-10-31. Stars and dates come from the GitHub search API on that day (stars, forks, last push). Licences were read from the API where marked; "n/c" means not checked, so check before copying anything. Ideas below are summarised in our own words; no repo text is copied. Content notes come from each repo's README (fetched read-only), not from running the code.

## Ranked list (usage = stars; relevance = fit for this project)

| # | Repo | Stars | Last push | Licence | Worth learning |
|---|------|-------|-----------|---------|----------------|
| 1 | affaan-m/ECC | 293k | 2026-10-30 | MIT | Big harness: many skills, subagents, hooks that check things outside the prompt. Takeaway: install a minimal profile only; hooks enforce, prompts only ask. |
| 2 | addyosmani/agent-skills | 112k | 2026-10-31 | MIT | Six-phase lifecycle Define, Plan, Build, Verify, Review, Ship, each a slash command. Takeaways: spec with acceptance criteria first, small dependency-ordered tasks, thin tested slices, evidence (test output) before "done", fresh-context review for risky choices. Best fit for our orchestrator. |
| 3 | Fission-AI/OpenSpec | 73k | 2026-10-30 | MIT | Spec-driven: propose (folder with proposal, specs, design, task list), human review, apply, archive. Takeaway: one folder per change, plain-markdown requirements with concrete scenarios. We already do this with `tasks/v2/`. |
| 4 | shanraisshan/claude-code-best-practice | 68k | 2026-10-31 | MIT | Keep CLAUDE.md under ~200 lines, push detail into path-scoped rules files, enforce behaviour in settings/hooks not prose, subagents isolate heavy exploration, skill descriptions are triggers with a Gotchas section, keep context well under half full, `/clear` between tasks. |
| 5 | rtk-ai/rtk | 85k | 2026-10-31 | Apache-2.0 CLI, BUSL-1.1 engine | Filters shell output before the agent reads it (up to ~90% on bash output). Takeaway: same idea as our "tail / grep" rule; optional tool, may hide needed detail. Skip for now. |
| 6 | hesreallyhim/awesome-claude-code | 57k | 2026-10-31 | NOASSERTION | Curated index of skills, commands, hooks, status lines. Use as a catalogue, not a template. |
| 7 | bmad-code-org/BMAD-METHOD | 55k | 2026-10-30 | NOASSERTION | Role-based agile agents (planner, architect, dev, QA) with stories. Heavy for one person; borrow only "story with acceptance test". |
| 8 | VoltAgent/awesome-claude-code-subagents | 26k | 2026-10-31 | MIT | Subagent file = frontmatter (name, description, tools, model) + role prompt. Read-only reviewers get read tools only; Opus for deep reasoning, Sonnet for daily work, Haiku for quick lookups. Matches our model rule. |
| 9 | google/elephant-goldfish-model | 6.7k | 2026-10-31 | n/c | Skills for designing and reviewing software with agents (Claude, Codex, Gemini, Antigravity). Look at it for review checklists. Not opened in depth. |
| 10 | stellarlinkco/myclaude | 2.7k | 2026-05-04 | AGPL-3.0 | The closest match to our setup: Claude plans, gathers context and verifies; a wrapper runs Codex or Gemini for editing and tests. Entry commands per task size. AGPL: read ideas only, never copy code. |
| 11 | catlog22/Claude-Code-Workflow | 2.1k | 2026-06-18 | MIT | JSON-driven multi-agent workflow with CLI orchestration of several agents. Not opened in depth. |
| 12 | mco-org/mco | 543 | 2026-10-07 | MIT | CLI that runs several coding agents in parallel and compares results. Idea: run a second agent as reviewer. Not opened in depth. |

Not recommended: repos in the Claude Code topic with very high stars but unrelated purpose (job search, video, diagrams, UI skins). Also skipped: `morluto/rea`, because the project memory says the REA study stopped and owner permission is unverified.

Caveats: star counts are popularity, not quality. I opened READMEs for #1, #2, #3, #4, #5, #8, #10 only; the rest are listed from API metadata and descriptions. Several repos are very new (2026), so practices may still shift.

## Ideas we adopt (own wording)

1. **Plan, then build, then verify, with evidence.** A task is done only when test output or a screenshot is attached (agent-skills, OpenSpec).
2. **One folder or file per change** with goal, allowed files, acceptance checks (OpenSpec). We already have `tasks/v2/`.
3. **Small CLAUDE.md, details elsewhere.** Keep the always-loaded file short; put lane prompts in separate files (best-practice).
4. **Enforce with tools, not prose.** Hard stops (contracts, auth, secrets, migrations, `.github`) are best backed by a hook or a path check in `verify-pr.sh`, not only a sentence (ECC, best-practice). Proposed as a follow-up, not done here.
5. **Orchestrator keeps context clean.** Delegate big reads and executions to Codex, Antigravity or a subagent and take back only conclusions (best-practice, myclaude).
6. **Fresh-context review for risky merges** (agent-skills): a second pass by a different lane before merging economy or contract-adjacent changes.
7. **Model by job:** Opus for planning and hard bugs, Sonnet for routine, Haiku for lookups (VoltAgent). Same as our existing rule.
8. **Skill/command descriptions are triggers** and need a "gotchas" section (best-practice). Use when we turn the bootstrap into slash commands later.

## Ideas we skip

- Installing large packs (ECC, BMAD): too heavy, too many moving parts for a solo contest build.
- Output-compression proxies (rtk and similar): our three token rules already cover it; hidden output risks missing errors.
- Copying any AGPL code (myclaude).

## Decisions for the owner

1. Approve replacing the current 7-line `CLAUDE.md` with `CLAUDE.proposed.md` after you have tried the bootstrap prompt once.
2. Add `AGENTS.md` for Codex from `AGENTS.proposed.md`.
3. Roles (decided by you): CLI Claude orchestrates and also codes important builds on `cli/*` branches in its own worktree; the cloud coordinator does no coding, only verifies and merges. The proposal follows this.
4. Whether to add hooks later (path guard for hard stops). Needs a `.claude/settings.json` change, which this PR does not make.
