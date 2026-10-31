# Implementation plan (draft, phases are independent)

Rule for every phase: branch from latest `main`, one draft PR, keep all existing art untouched, no new dependencies, Tier 3 files (contracts, auth, supabase, economy numbers) only in Phase 4 and only after sign-off. Demo source of truth for layout: `docs/proposals/rune-skill-system/demo/index.html`.

| Phase | Content | Owner | Needs sign-off | Depends on |
|---|---|---|---|---|
| 1 Read-only transparency | Codex tab generated from existing registries; real chest odds + "1 in N" + simulator (uses `lootcheck`/`sim`); stat/caps page; class stat bars | Codex (data adapter), Antigravity (UI) | No | Redesign shell (AGR0) |
| 2 Planner and previews | Build planner, skill previews (placeholder SVG), passive grid UI on mock data behind `?dev=lab` | Antigravity, Codex tests | No (mock data) | Phase 1 |
| 3 Content registries | `v2/skills`, `v2/runes`, `v2/workshop`, `v2/meta` tables + tests + docs generator + balance sims | Codex | Yes (numbers) | Sign-off |
| 4 Gameplay wiring | Skills in combat, passives into stats, runes on gear, materials in loot, server claims, migration | Claude CLI / Codex | Yes (Tier 3) | Phase 3 |
| 5 Meta | Companions, quests, achievements, events | Codex, Antigravity | Yes | Phase 4 |
| A Art lane (parallel) | Antigravity generates images, Codex processes and wires them; see `art/` | Antigravity + Codex | Style bible approval | none |

Dependency graph: Redesign shell -> P1 -> P2; sign-off -> P3 -> P4 -> P5; Art lane A feeds P1-P5 (placeholders work without it).

Test plan: unit tests per registry (weights sum, caps respected, no negative costs), `sim` run of 100k kills per drop source compared to published odds (within 95% band), ui-audit at 1280x720 and 1600x900, keyboard-only walkthrough, `prefers-reduced-motion` check.

Prompts: `/mnt/project-files/taskbar-hero/PASTE-ALL-runes.txt` (logic and UI phases). Art prompts to be written when the user asks.
