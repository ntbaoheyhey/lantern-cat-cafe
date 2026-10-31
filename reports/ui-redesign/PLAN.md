# Implementation plan (living draft)

Rule for every phase: branch from latest `main`, one draft PR, do not touch Tier 3 (contracts, auth, supabase, `packages/game-rules`, economy numbers). Keep existing tests green. No new dependencies. Git author must be `ntbaoheyhey` noreply email.
Files owned by other open UI threads (Boss panel scroll fix, landing audit) are skipped until those PRs merge.

## Dependency graph
P0 tokens+shell -> (P1 Home, P2 Bag, P3 Map, P4 Forge, P5 Market, P6 Hero+Help) in parallel -> P7 polish, states, art, QA.

| Phase | Owner | Depends on | Zone |
|---|---|---|---|
| P0 Tokens and shell (rail, HUD, routing) | Claude (Sonnet, medium) | none | `apps/web/src/theme.css`, `App.tsx`, `Panel.tsx`, `layout/` shell |
| P1 Landing + class picker + Home | Antigravity | P0 | landing, `classpicker/`, stage |
| P2 Bag | Codex | P0 | `inventory/`, `layout/bag/` |
| P3 Map (boss) | Antigravity | P0 + boss scroll PR merged | `map/`, `boss/` |
| P4 Forge | Codex | P0 | `forge/` |
| P5 Market | Codex | P0 | `market/` |
| P6 Hero sheet + Help | Antigravity | P0 | `layout/character/`, `HelpTab` |
| P7 Shared states, icons, QA at 1280/1600 | Claude verifies; Antigravity screenshots | P1-P6 | `notice/`, `art/` |

## Paste prompts

### P0 (Claude lane, not pasted)
Tokens plus app shell only; I do this after you approve the direction.

### Common header (put at top of every prompt below)
```
Repo ntbaoheyhey/taskbar-hero. Git setup first: git config user.email must be 108352255+ntbaoheyhey@users.noreply.github.com and user.name ntbaoheyhey. Base on latest origin/main after the P0 shell PR is merged. Design source of truth: reports/ui-redesign/index.html (open it, flip through screens) and reports/ui-redesign/BRIEF.md. Rebuild only your zone to match the mockup at 1280x720 and 1600x900 (desktop only). Use tokens from apps/web/src/theme.css; no new dependencies; do not change game rules, contracts, auth, schema, economy numbers, or files outside your zone (a one-line note is fine for adjacent test/helper updates). Keep existing tests passing, add tests for new components, run pnpm build and the web tests. Take before/after screenshots at both sizes into reports/ui-redesign/<phase>/. Open a draft PR to main, do not merge, then report: what changed, what is not verified, screenshots.
```

### P1 Antigravity: landing, class picker, Home
```
[Common header] Phase P1. Zone: the landing page, apps/web/src/layout/classpicker/, and the Home stage layout. Build the Landing, Class picker and Home screens as in the mockup: hero scene + Play as guest + Connect wallet (secondary) + proof strip; three class cards with one primary Start button; Home with scene centre, hero card, next goal, recent loot and event log. Keep all existing behaviour (guest play, wallet connect, class save).
```

### P2 Codex: Bag
```
[Common header] Phase P2. Zone: apps/web/src/inventory/ and apps/web/src/layout/bag/. Build the Bag screen: 8-column slot grid with visible empty slots, filter chips (All, Weapons, Armor, Materials, Relics), right detail panel with Equip / Forge / List actions and a compare block. Rarity shown by frame colour AND a text pill. Keep bulk-equip and every existing action working; update tests that assert old markup.
```

### P3 Antigravity: Map (boss)
```
[Common header] Phase P3. Start only after the "Fix Boss panel nested scroll UI" PR is merged. Zone: apps/web/src/map/ and apps/web/src/boss/. Build the Map screen: chapter path with done/current/locked/boss nodes and a right fight card (recommended power, your power, daily attempts, rewards, past runs, Fight). No nested scrolling.
```

### P4 Codex: Forge
```
[Common header] Phase P4. Zone: apps/web/src/forge/. Build the Forge screen: left gear picker, centre preview + result reveal (flash, no modal), right materials and a plain chances table. Do not change forge odds or costs (read them from game-rules). Keep reduced-motion support.
```

### P5 Codex: Market
```
[Common header] Phase P5. Zone: apps/web/src/market/. Build the Market screen: filter chips, sortable Relic table, right panel with token id, contract, price, Buy and a Routescan link, plus Your listings with an empty state. Relics only. No contract or ABI changes.
```

### P6 Antigravity: Hero sheet + Help
```
[Common header] Phase P6. Zone: apps/web/src/layout/character/ and the Help tab (apps/web/src/layout/HelpTab.*). Build the Hero sheet (paper-doll slots, stats, power breakdown, change class) and the Help screen (topic list, search, answer pane) as a screen instead of a modal.
```

### P7 Antigravity: shared states and QA
```
[Common header] Phase P7. After P1-P6 merge. Zone: apps/web/src/layout/notice/ and shared components. Build modal, toast, offline banner and empty states as in the mockup; then screenshot every screen at 1280x720 and 1600x900 and list visual bugs. Fix only cosmetic ones.
```

## Optional connectors / MCP
- Figma: only if you want to edit the design visually and hand frames to Codex/Antigravity. Not required; HTML mockups already work as the spec.
- Image generation tool (any): for pixel sprites, backgrounds, a Relic banner. Needs your licence check (original content only) and a 16-colour palette rule. Optional.
- tbhindex.com is behind Cloudflare, so I cannot read it. If you want it used as reference, paste 2-3 screenshots into the project folder.
