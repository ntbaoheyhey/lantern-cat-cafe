# CXL1 builder cards

Scope: this assigned worktree on ai/codex-cxl1 only. Owner: independent CXL1 builder (current model/effort). No agents, push, PR, merge, deployment or live write. Coordinator owns independent scoring and complete fresh-worktree gates; BASE0 #246 owns the shared baseline repairs.

P — inspect and specify (before implementation): verify current origin/main has no codex directory; read the full mission and rune demo/design/plan; trace current content, loot, forge and art identifiers. Record source gaps, stable ID contract and exact probability semantics. Done when source-backed relationships and tests are specified below.

B1 — adapter: create packages/game-rules/src/v2/codex/{types,index,entries}.ts and its tests; add exactly one v2/index.ts export. Cover all eight kinds from current registries; preserve names/IDs, null missing facts, immutable detached output, resolvable links and acquisition references. Tests: complete registry membership, names/stats/source references, uniqueness, link kind/ID consistency, count snapshot, no registry mutation.

B2 — odds: create packages/game-rules/src/v2/codex/odds.ts plus tests. Derive current chest/rarity probabilities from actual nested weights and chance gates. Distinguish conditional rarity distribution from per-chest independent gear rolls and at-least-one rarity probabilities. Test every chest, exact sum tolerance 1e-9, zero outcomes, non-100 totals, reciprocal values and invalid/unsupported tables.

B3 — offline generator: scripts/gen-codex-json.mjs, generator tests inside codex. Reuse installed locked tools; no network or new dependency. Deterministic JSON to stdout or requested file, callable outside root, no committed large output. Verify offline subprocess, parsed schema and byte-identical output. Regenerate only necessary Deno maps.

B4 — evidence: targeted typecheck/lint/build and affected rules tests; five or more genuine behavior mutants in scratch copies under this worktree, killed by unchanged tests, then remove scratch copies. Record command/exit/output in logs. Review complete diff, scope/integrity/secret findings. Commit code/evidence with assigned author and [skip ci]. Report remaining coordinator acceptance gaps without a score or full-gate claim.

Dependencies: P -> (B1, B2) -> B3 -> B4. Single builder executes sequentially per assignment; no app e2e, ports or backend needed.
