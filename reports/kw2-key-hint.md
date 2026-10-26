STATUS: DONE (part 1 only; part 2 waits for U9)

## What was done
- New `boss/BossKeyHint.tsx`: `keySources()` reads name/cap from MATERIALS (`catKey`) and `idle.dailyKeys`, `idle.clearedChapterKeyChance`, `boss.firstClearKeys` from V2_CONFIG (nothing typed). `BossKeyHint` renders "Cat Keys: n / max" plus "Where keys come from" list (daily, rare drop 1 in N, first-clear only when `boss.firstClearKeys > 0`).
- `BossGatePanel.tsx`: renders the hint only when status is `no_key`. Existing sentence, keys chip, aria-describedby, live-region text untouched. `bossGate.ts` untouched.
- `HelpTab.tsx`: "Cat Keys and bosses" gets a `help-key-sources` list (daily, rare drop); the existing first-clear paragraph is kept as is.
- CSS in `boss.css`, `HelpTab.css` (theme tokens). `docs/play-v2.md` keys section updated.
- Tests: `BossKeyHint.test.tsx` (4), `HelpTab.keys.test.tsx` (2), using `withConfigV2({ boss: { firstClearKeys: 1 } })`.
- Optional e2e `apps/web/e2e/ui/kw2-key-hint.spec.ts` (no_key and ready at 1280x720 and 390x844, no horizontal scroll). Not in the card's allowlist text (card calls an e2e spec optional); drop it if CL-V wants strict.
- Screenshots (SCREENSHOTS=1): reports/kw2-key-hint/{no_key,ready}-{1280x720,390x844}.png

## Checks (real output)
- pnpm install --frozen-lockfile: Done
- pnpm gen:deno && git diff --exit-code -- supabase/functions: wrote 18 Edge Function import maps; DENO_OK
- pnpm typecheck: all Done
- pnpm lint: all Done
- pnpm test: web 85 files / 1088 tests passed; game-rules 330 passed (2 expected fail, 11 skipped); others passed
- pnpm build: built, Done
- cd apps/web && pnpm test:e2e: 111 passed (2.4m) (run with SCREENSHOTS=1; other specs' rewritten screenshots were reverted)
- Existing BossGatePanel.test.tsx, bossGate.test.ts, HelpTab.test.tsx unchanged and passing.

## Acceptance
- count test: PASS; sources list: PASS; first-clear hidden by default, shown under withConfigV2: PASS
- Existing tests unchanged: PASS; sentences/aria/live region kept: PASS
- Contrast: PASS by token choice (--key #ff8fb1, --muted #c3aed0, --text #fff3e0 on --surface-2 #3a2c4a, all above 4.5:1); no contrast tool was run: NOT VERIFIED numerically. Dark theme only (project has no light theme tokens).
- Screenshots: PASS

## NOT verified
- Part 2 (U9 findings), numeric contrast ratios, light theme.
