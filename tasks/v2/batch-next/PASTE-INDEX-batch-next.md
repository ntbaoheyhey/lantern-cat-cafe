# Batch next: paste order (Codex and Antigravity), LIVING DRAFT

Full prompts: `PASTE-ALL-batch-next.txt` (new blocks CXC1, AGC1, CXP1, AGP1). Older blocks are named by id and live in the files listed at the top of that file. One mission per tool at a time; draft PRs only.

## Step 0 (Claude, when you say go)
Merge-check PR #233 (AGR0) and #230 (CXR0). Everything UI waits for #233.

## Round 1 (paste now, in parallel)
- Codex A: CXN2 hardening tests (assumes CXN1 is covered by merged #225; Claude checks the report first)
- Codex B: CXC1 Avalanche proof script + docs
- Antigravity A: AGR1 Landing + Class + Home (after #233 merged)
- Antigravity B: AGR2 Bag (after #233 merged)

## Round 2
- Codex A: CXN3 cut-over truth
- Codex B: CXP1 Pets logic (preview-only)
- Antigravity A: AGR3 Forge + Market
- Antigravity B: AGR4 Hero + Help + modals

## Round 3
- Codex A: CXR1 tests for new screens (after AGR1-4 merged)
- Codex B: free slot: AGR5-prep fixes or CXL2 if numbers are signed
- Antigravity A: AGC1 On-chain proof panel
- Antigravity B: AGP1 Pets screen (after CXP1)

## Round 4
- AGN2 security docs, then AGN3 live play-through (needs your "go" and the live gate), AGN4 submission pack, CXR2 fixes pass, AGR5 Boss/Map, AGL2.

## Parallel graph
#233 ─┬─ AGR1 ─┐
      ├─ AGR2 ─┼─ CXR1 ─ CXR2
      ├─ AGR3 ─┤
      └─ AGR4 ─┘
CXN2 ─ CXN3 ─ AGN2 ─ AGN3 ─ AGN4
CXC1 ─ (AGC1 optional dep)      #233 ─ AGC1
CXP1 ─ AGP1                      #233 ─ AGP1
Priority: score first (CXN*, CXC1, AGC1, AGN*), UI/creativity next (AGR*, AGP1), complex systems last.

## Claude-CLI-ready (hand over as ONE big task each when the CLI arrives, about 7 Nov)
- B1: Phase 4 wiring + server claims for skills/drops (Tier 3, needs your signed numbers).
- B2: rune sockets + upgrade tree (after B1).
- B3: quests / events (only if time).
- B4: integration sweep: merge-verify all draft PRs, fix conflicts, one release-candidate checklist.
- Also fine for the CLI: CXN2/CXN3 if Codex has not done them by then.

## You decide later
Sign the demo numbers (design.md section 6) before CXL2/B1; whether pets get real bonuses (needs B1).
