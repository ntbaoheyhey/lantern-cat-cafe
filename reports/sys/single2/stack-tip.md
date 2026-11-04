# SINGLE2 integration — NEVER MERGE

Branch `ai/codex-stack-tip` is an integration proof, never a PR to main.
Exact initial tip: `d31cb2a3961e49fea4aab7ebbef216dc4277cda2`. Base: `340f88b92405ceb6b5421b207307fdbb283b2ca3`.

Merged in order: #262 a9afaad → #263 4b0e69a → #264 949cc44 → #265 7d0d08e → #266 f2a0588 → #268 afd0699 → #269 85a6919.
All seven were clean Git merges. **No conflict resolution or intent override was required.** Each merge message ends `[skip ci]`.
#267 and #270 are deliberately separate refresh drafts. No integration PR will be opened to main.

Pass 1: frozen-lockfile install, typecheck, lint and build all exited0. No runtime source fix was necessary. Full diff and subsequent A/B evidence are recorded separately.

## STACKFIX integration

Expanded confirmation scanning found inherited Salvage row opacity contrast failures. New draft #271 removes that opacity and adds a regression that fails 4/4 before the repair and passes after it. The tip fast-forwards to `68ab4c12cfdb24b107480fa34b3c1c82dd105089`; no conflict. Immutable `ai/codex-stack-tip-base` retains d31cb2a only to keep the two-file STACKFIX review visible. Neither integration branch is a release PR. Final A/B gates are running on 68ab4c1.
