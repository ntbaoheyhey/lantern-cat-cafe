# Gameplay pass — ACTIVE
Updated 2026-11-04 13:45 UTC. Original deadline 17:45:44 UTC. One agent only.

## Scope and entry points
- Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`, base #278 `f8837d6` / `ai/codex-visual-2026-11-04`.
- Full user request in `reports/gameplay/BRIEF.md`; research `RESEARCH.md`; decisions `docs/decisions/gameplay-2026-11-04.md`.
- Main and desktop cwd are unrelated dirty checkouts; never checkout/reset/stash them. No merges/deploys/Supabase/contracts/wallet/funds. Guest only.
- Ledger `/Users/bao/taskbar-hero-ui-ledger` on `ai/codex-ui-ledger`; add only our report paths.
- Goal active; explicit user resume “tiếp tục nha”. No skills/subagents/schedulers.

## Completed
- Research commit `292b57c`; G1 validated commit `f2ca5c4` replaces prior paused WIP. Three-step nonmodal coach, accurate goal ladders, direct first class choice, early real claim at 10s then normal 30s cadence. Economy simulation 36 class/seed cohorts, duplicate requests, cap checks pass.
- Genuine 10-minute baseline `before-run.json`; harness corrected boss eligibility and reran in `before-corrected-run.json` (~600s). Use corrected run for final comparison; preserve original as exploratory.
- Original Mochi rig: 8-frame idle, nap/equip poses, warm locked palette; gear anchors and hit timing retained. 56 runtime-derived PNG sheets.
- Original 25 household creatures across five chapters, four-frame idle/walk, windup/attack/hit/defeat, 10 boss portraits. Generated TS is runtime source.
- 40 original equipment PNGs; ItemIcon uses palette-locked 32px art, displayed at multiples of 16px size prop. Distinct armour sets/accessories/weapon silhouettes.
- Generators under tools/art/gameplay*. Provenance `reports/gameplay/asset-provenance.md` lists every generated file with exact parameters; manifests have hashes.
- Art focused suite 19 files /130 tests passed; web typecheck passed; full art:check passes.

## Running services
- Local baseline 5390 PID 41659 (visual worktree), candidate 5391 PID 41657 (gameplay). Both started by this task before compaction. Do not kill other listeners.
- Start command if needed: `VITE_GAME_V2=1 VITE_ALLOW_MOCK_AUTH=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= pnpm --filter @taskbar-hero/web exec vite --host 127.0.0.1 --port 5391 --strictPort`.
- Prior task listener 5380 is NOT ours.

## Next
1. Item clarity (rarity shape, three key stats, offence/survival comparison), honest forge bonus-quality cue. Relics have no combat stats: never invent bars/boosts.
2. Boss ground telegraph/read-only phase names/outcome badges. Replay untouched. Global juice limits from config; no invented rewards or pity.
3. Genuine after 10-minute run, matched stills/strips, offline docs/gameplay/index.html, unit/e2e/art/effects/a11y/perf checks.
4. Logical commits and stacked DRAFT PRs based on #278, split logic/art/UI. No push/PR yet. Ledger report with strict scores, metrics, risks and backlog.

Inherited scores 8.3 overall, home8.7/boss8.6/forge8.4 are NOT new candidate scores. Full suite baseline counts 399 E2E/1471 web unit are NOT candidate validation.
