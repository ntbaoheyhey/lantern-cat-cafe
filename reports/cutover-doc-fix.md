STATUS: DONE

CX6: aligned the Founder cut-over instructions with the draft batch API. Branch
`ai/codex-cutover-doc-fix` starts directly from `origin/main` at
`337977751204b5ea59d8f0cabfb91fb4cd4a391f`; neither Founder branch is a parent.
Work used an isolated worktree because the original checkout had unrelated edits.
Blocker: none.

What was done:
- Rewrote steps 2 and 3 with the actual draft filename (explicitly not on main yet),
  privileged batch call, four parameters, result counters, loop to remaining = 0,
  strict cutoff and idempotent reruns.
- Kept D8 contents, caps and cutoff as placeholders. Documented the D8 approval
  and live-application-before-C15-merge gate. No D8 value or cut-over date chosen;
  the pre-existing proposed contents and schedule elsewhere were not changed.
- Added the manual dashboard count transition from 14 to 15 v2 functions.
- Documented rollback and aligned section 5's rerun result and section 6's cutoff.
  Removed the old optional wipe SQL from step 2; any wipe needs separate approval.

Gate/source checks (read-only, all exit 0):
```text
$ git show 235298d:reports/v29-founder.md
STATUS: DONE
C15 DRAFT ONLY. MERGE GATE: D8 user OK + apply_migration before merge.
$ git show 0ca1264:reports/v29-rehearsal.md
STATUS: DONE
STACKED ON ai/codex-v29-founder-grant @ 235298d29595ee5c1851ff80cdb687a5fdcdb172: merge that first
$ git show 235298d:supabase/migrations/20261110000000_v2_founder_batch.sql
create function public.v2_grant_founder_batch(
  p_cutoff timestamptz,
  p_contents jsonb,
  p_caps jsonb default '{}'::jsonb,
  p_limit integer default 500
) returns jsonb
```
Reports and migration were read in full using git show; above are output excerpts.
Also read `git show origin/main:scripts/verify-pr.sh` to establish check scope.
`git ls-tree -r --name-only origin/main supabase/migrations` contained the v2
base migration and no Founder batch file. HEAD and origin/main both resolved to
337977751204b5ea59d8f0cabfb91fb4cd4a391f before editing.

Actual checks from the task worktree's repository root:
```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 9.1s using pnpm v10.28.0
EXIT 0

$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/cx6-cutover-doc-fix/taskbar hero
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
EXIT 0 (no drift)

$ git diff --check
EXIT 0 (no output)

$ python3 - <<'PY' [inline documentation assertions]
PASS: correct draft path and not-on-main label
PASS: obsolete migration removed
PASS: D8 contents/caps/cutoff placeholders
PASS: live-before-merge gate
PASS: batch call has all four parameters
PASS: strict cutoff throughout
PASS: loop / result / idempotency
PASS: rollback documented
PASS: dashboard 14 to 15
PASS: no migration on main
PASS: base is origin/main
EXIT 0
```
The inline assertions inspected the document's step 2/3 text and the git base/tree;
they did not execute SQL or introduce a repository test.

full suite skipped: docs only

Acceptance (card goal, gate, allowlist, forbidden paths and self-check reread):
- PASS: read both named Founder reports and migration using git show, without
  checking out, merging, or using either branch as a parent.
- PASS: steps 2/3 describe the correct signature, call, counters and loop.
- PASS: strict created_at < p_cutoff; equality excluded; reruns are no-ops.
- PASS: D8 must approve contents, caps and cutoff; placeholders used, no choices made.
- PASS: migration marked not on main yet and applied live BEFORE merge to main.
- PASS: rollback line and 14-to-15 dashboard count line included.
- PASS: only docs/cutover-v2.md and reports/cutover-doc-fix.md changed; no
  supabase/** edits or test changes. Generated maps have no drift.
- PASS: required docs-only install, generation/drift and card-specific checks.
- PASS: commit author checked against the card's exact identity.
- PASS: task branch pushed; no PR, Actions, merge or live operation performed.

Files touched (`git diff --stat origin/main...HEAD`):
```text
 docs/cutover-v2.md         |  53 ++++++++++----------
 reports/cutover-doc-fix.md | 120 +++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 145 insertions(+), 28 deletions(-)
```

Final allowlist/author checks:
```text
$ git fetch origin +main:refs/remotes/origin/main && git diff --name-only origin/main...HEAD
docs/cutover-v2.md
reports/cutover-doc-fix.md
EXIT 0; every path allowed
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
EXIT 0; exact required author
```

NOT verified: pnpm typecheck, pnpm lint, pnpm test, pnpm build and web E2E
(docs-only exception); live migration/grants, production function counts,
D8 approval, cut-over timing and production rollback. Prior branch report test
results are source context, not checks run for CX6.

Needed to continue: nothing for this documentation card. Operational execution
still requires the USER's D8 approval, backup and live application of the draft
migration before the Founder migration merges, as documented.
