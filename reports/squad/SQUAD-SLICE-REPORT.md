# Stage 1 squad combat delivery · 2026-11-05

**A playable local combat slice is delivered; the requested 8+ overall quality bar is not met.**
Three independent cats, real enemy groups, nine activated abilities, three passives, three
waves and Yarn Giant run through the same deterministic core in the app and offline demo.
The five Stage-1 mechanical gates pass with the evidence below. Art remains provisional,
burst is too forgiving at the boss, and there has been no human playtest.

Prototype - Squad Combat. Candidate build, not live. No server grants. Not merged. Not deployed.

## Delivery and scope

Review stack after #286: [#287](https://github.com/ntbaoheyhey/taskbar-hero/pull/287) → [#288](https://github.com/ntbaoheyhey/taskbar-hero/pull/288) → [#289](https://github.com/ntbaoheyhey/taskbar-hero/pull/289) → [#290](https://github.com/ntbaoheyhey/taskbar-hero/pull/290) → [#291](https://github.com/ntbaoheyhey/taskbar-hero/pull/291). All are drafts.

Final source tip: `41a6aa38c0cc65d229502c4bdaa0cfced702cd16`.

- Worktree: `/Users/bao/taskbar-hero-squad`; branch `ai/codex-squad-slice-2026-11-05`.
- Base: published draft #286, `0b925536685512a0672a784fcfffe80097a0a821`, the newest gameplay-2
  stack tip. The named `ai/codex-gameplay-2-2026-11-05` ref is an earlier layer, not the tip.
  The old gameplay2 worktree was dirty, so a new worktree was used without changing it.
- Runtime: `1604c70fa3851882324510d0d6cd9b12031631b4`. Later proof/demo commits change no
  app, rules or art. `delivery.json` records the final refs, draft numbers and demo hash.
- Open `docs/squad/index.html` by double-clicking. It is a self-contained offline compilation
  of the actual app/core/presenter, not a parallel animation. See `docs/squad/README.md`.
- Local app: `pnpm demo`, then `http://127.0.0.1:5391/?demo&squad=1`. Add `&squadDebug=1`
  in development for seed, wave, boss, charge and speed controls; production excludes them.
- One agent, no workers/subagents/schedulers. No installed Codex skills used. Repository
  Playwright/Vitest/axe tools, Vite, Python procedural art and lossless cwebp were used directly.
- Remote main remained `340f88b`. The main checkout was never checked out, reset, stashed or
  changed by this task. Its local HEAD was already different when inspected; it was not reset.
  PRs #244/#252/#257, contracts, migrations and database state were not changed. No wallets,
  signatures or real funds were used. Both Vercel config roots disable the five review refs.

## Stage-1 gate from the design, verbatim

> Groups have real targets/HP; front-line contact and ranged impacts are visible; full auto works; active targeting changes outcomes; two compositions are viable.

| Exact gate clause | Status | Evidence |
|---|---|---|
| Groups have real targets/HP | Met | Persistent actor IDs/targets/HP; four/five/six authored enemies and eight-target training; rules tests and group screenshots. |
| front-line contact and ranged impacts are visible | Met, with art/readability limits | Guardian closes to the contact point then returns; event-time impacts, curved flasks, threads and area strikes in 21 actual-engine strips. Captures cannot establish human comprehension. |
| full auto works | Met in the measured seeds | Both presets finish all 20 patrol seeds; sustain boss 18/20 and burst boss 20/20. |
| active targeting changes outcomes | Met in the measured policies | Healer/thread/boss priority shortens all four preset/encounter conditions; sustain boss wins rise 18/20 → 20/20. |
| two compositions are viable | Met for two presets using the same three cats | Both complete patrol and boss; they are not equally strong, and these are loadout/tactic presets rather than two distinct class rosters. |

Additional requested checks:

| Requirement | Result and limit |
|---|---|
| Three cats, 2 cooldown skills + ultimate + passive each | Implemented and tested. Basic attacks remain independent. Nine activated and three passive effects captured. |
| Five normal enemy roles + elite | Implemented: guard, flanker, ranger, healer, charger and elite; own HP/status/target. |
| Three waves, persistent HP, recovery and settlement | Implemented. HP persists between waves; a new encounter restores the team. Fish are cosmetic and settle once per encounter. |
| Yarn Giant distinct mechanics | Sweep, targetable binding thread, exposed knot, bounded adds, break/resistance, phase-two Cross Stitch and enrage. Cause/suggestion plus retry on defeat. |
| Boss neither coin flip nor trivial | Partially met. Sustain has pressure and active improvement; burst beats every tested seed with no deaths and is easier than intended. |
| Every effect has anticipation/motion/impact/reaction/residue | Implemented and inspected at selected timestamps for 9 skills + 6 enemy attacks + 3 boss moves, plus 3 passives. Several cast poses still share a rig. |
| Art judged at native display size, original provenance | Met for the study/provenance workflow; final art quality target not met. Guardian first, then matching roster. No external/reference-game images or model inputs. |
| 1280×720, 1440×900, 1920×1080 | Arena and all 3 ultimate buttons fit in all audited scenes; target list scrolls within the side panel. Max 11 actors sampled. No horizontal overflow. |
| Keyboard and axe | Target buttons, dialog and 1/2/3 ultimate actions tested; 10 audited views/lifecycle cases, zero axe violations. This is not a screen-reader user study. |
| Determinism and logs | Fixed 50ms core; equal event logs at 50/60/144Hz and long hitch; command round-trip and resolved-event replay tests pass. |
| Default off / no economy or replay integration | Met. Explicit demo context, lazy separate entry, no real save keys, requests or server grant adapters. Legacy entry byte-identical to base. |
| JS and image budgets | Met: +20,624 B gzip JS; 1,944,554 B unique new image files including proof, of which 93,212 B are runtime art. Offline HTML duplicates embedded images/fonts/code and is reported separately in demo-build.json. |
| Hidden pause, idle and calm motion | Measured below. Synthetic visibility events prove lifecycle behavior, not OS battery/background scheduling. |
| Overall self-review >=8 | Not met: 7.9/10; art 7.7. No human playtest, enjoyment or retention claim. |

## Numerical balance evidence

160 deterministic runs: two presets × two policies × 20 seeds × patrol/boss. Seeds 1–20
are shared across conditions. Active marks healer, then binding thread, then boss; ultimate
auto policy stays identical in both arms. Winning time excludes lost runs. First-death counts
include a run only when a hero dies; total deaths may exceed the number of lost runs.

| Encounter | Preset | Policy | Wins | Mean winning seconds | Total hero deaths | First deaths by role |
|---|---|---|---:|---:|---:|---|
| patrol | hearthkeepers | auto | 20/20 | 71.82 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| patrol | hearthkeepers | active | 20/20 | 54.14 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| patrol | lanternbreakers | auto | 20/20 | 48.95 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| patrol | lanternbreakers | active | 20/20 | 38.71 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| boss | hearthkeepers | auto | 18/20 | 108.65 | 13 | {'guardian': 0, 'witch': 2, 'alchemist': 4} |
| boss | hearthkeepers | active | 20/20 | 83.1 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| boss | lanternbreakers | auto | 20/20 | 71.6 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |
| boss | lanternbreakers | active | 20/20 | 54.67 | 0 | {'guardian': 0, 'witch': 0, 'alchemist': 0} |

Patrol active priority improves mean clear time by 24.6% for Hearthkeepers (71.82→54.14s)
and 20.9% for Lanternbreakers (48.95→38.71s). Boss active improves the winning means
108.65→83.10s and 71.60→54.67s; the sustain comparison also changes which runs win.
All 20 sustain-auto boss runs entered enrage; 13 heroes died across six runs, and two runs
lost. The other boss conditions had no deaths/enrage. This points to sustain/burst tuning
work, not equal difficulty. All raw runs, per-role totals, causes and commands are in balance.json.

A separate public-UI active run selected binding threads and fired all three manual ultimate
keys, winning at 77.3s. This is a single-agent demonstration; it is not the controlled policy
experiment or evidence of a human player's experience.

## Performance and budgets

Machine: Apple M3 Pro, Darwin arm64, 36 GiB RAM, Node v24.22.2, headless Chromium.
Normal production public-UI samples used 18s after warmup; idle used 5s. No review hook was
present. RAF cadence is a browser-frame proxy, and CDP TaskDuration is renderer busy time,
not total system CPU, hardware GPU timing or battery use.

| Sample at 1280×720 | p50 / p95 ms | Renderer task % | JS heap start → end bytes |
|---|---:|---:|---:|
| Eight-enemy group, production | 16.7 / 16.7 | 5.970 | 11,002,336 → 11,727,400 |
| Boss, production | 16.7 / 16.8 | 5.796 | 12,032,040 → 12,956,132 |
| Eight-enemy calm, production | 16.7 / 16.7 | 5.844 | 10,549,176 → 12,382,940 |
| Paused/idle, production | 16.7 / 16.7 | 0.223 | 8,897,676 → 8,983,392 |
| Forced maximum, full effects | 16.7 / 16.7 | 5.144 | 12,162,540 → 15,678,936 |
| Forced maximum, calm effects | 16.7 / 16.8 | 6.448 | 10,632,308 → 10,283,964 |

Maximum fixture: 3 heroes + Yarn + 7 adds (8-enemy cap), 25×HP, forced real casts over
20s after warmup. All 9 hero skills, six enemy attacks and Cross Stitch occur; peak 11 actors,
10 casts, 16 residue effects, 12 labels, shared four-bright-effect cap. No long tasks, errors
or requests. p95 <25ms and heap <128MiB gates pass. The heap endpoints do not establish
long-run leak freedom. Synthetic hidden intervals advance 0ms; resume advances 300ms
without catching up. Zone stripes, countdowns, victim outlines and status icons remain in calm mode.

Production JS totals: 729,576 B base → 750,200 B, +20,624 B gzip across all chunks,
including lazy chunks, versus +150,000 B allowed. Unique runtime + proof image files total
1,944,554 B versus 2,000,000 B allowed. Lossless screenshot packing reduces duplicate
strips without resizing/quantizing art. The offline document is about 3.37 MB because it
embeds code, fonts and duplicated base64 images; that is a separate review artifact, not
additional production JS. Exact bytes/hash are in demo-build.json. No low-end or battery study.

## Verification and isolation

| Suite | Base passing | Final passing |
|---|---:|---:|
| Game rules | 482 | 546 |
| Web | 1498 | 1509 |
| Backend mocks | 581 | 581 |
| Auth | 24 | 24 |
| Chain | 32 | 32 |
| API contract | 16 | 16 |
| Script tests | 11 | 11 |
| Full Playwright E2E | 413 | 421 |

Rules retain 11 inherited skips and two expected failures; none were introduced or expanded.
Typecheck, lint, production build and all 47 art-generator file checks pass. Base unit worker
contention initially caused four timeouts; the full bounded-worker rerun passed without test
changes. Later legacy reload E2Es exposed a real readiness race: tests now wait for actual
modern navigation, and the isolation check waits for the real heading rather than networkidle.
No assertions, screenshot tolerances or timeouts were weakened. Raw failed and successful
attempts are preserved under logs/. Final full E2E: delivery-full-e2e.log, 421/421 in 2.3m.

New rules cover group target selection/priority/taunt, AoE edges, projectile fizzle/retarget,
heal/shield/cleanse ordering, interruption and control resistance, caps/noncompounding buffs,
wave HP and exact settlement, enrage, seed/update-rate determinism, command round-trip and
resolved-event projection. Presentation tests check event-only HP, residue selection and
controller timing. No simulation damage is recomputed by Phaser.

Flag-off E2E inspects the actually requested script graph, not only chunk names. The old
entry body is byte-identical in legacy-entry.tsx and its CSS evaluation order is preserved.
Squad UI never imports the legacy account/store/API graph. Network/storage interception and
source-boundary assertions pass. No squad request endpoint or accepted reward adapter was
added. Generated deno.json import maps changed because the generator inventories source
modules; handlers, migrations, replay validators and contracts did not change or get deployed.

The offline smoke opens file:// at all three sizes, decodes 39 images, checks 21 contracts,
proves default-off debug, completes patrol and boss through public UI, and observes zero
requests/writes/errors. Its completion test accelerates Playwright's foreground clock;
separate fresh-eyes sessions and performance samples use normal wall time. The first
smoke caught an unconstrained gallery image and a smooth-scroll measurement race: image
max-width and explicit instant scrolling fixed them. The final document also has unique
local navigation anchors and displays the below-8 score.

verification.json hashes the authoritative final logs. Compact JSON receipts preserve data;
full raw logs are on this ledger branch rather than bloating the product PRs.

## Subjective review, kept separate from numbers

Previous design review: main 6.0 / Sample 6.6 across six dimensions. This slice uses the
four requested combat/depth/impact/art/readability dimensions, so the overall scores are
not a controlled same-scope before/after comparison. No claim of measured player improvement.

| Pass | Depth | Ability/impact | Art | Readability | Mean |
|---|---:|---:|---:|---:|---:|
| First-time-player perspective | 8.0 | 7.8 | 7.7 | 8.0 | 7.88 |
| Skeptical judge, three minutes | 7.8 | 8.0 | 7.7 | 8.1 | 7.90 |
| Active player | 8.3 | 8.0 | 7.7 | 8.0 | 8.00 |
| Frame-by-frame effects | 8.0 | 8.1 | 7.7 | 8.1 | 7.98 |

Four separate running-build passes, same author. Mean 7.94 rounded to **7.9/10**. See
FRESH-EYES.md and fresh-eyes/*.json for times, screenshots and commands. Frame review uses
21 real-engine fixture strips/87 selected native frames. They are not continuous recordings.
Fix/review iterations corrected sword clipping, controls below the viewport, impact residues
crowding out hits, and separately applied brightness caps. These repairs do not justify
inventing a pre-fix score or claiming 8+. Shared cast poses, sparse enemy animation and small
status glyphs remain visible limitations.

## Decisions, assets and deferred work

All runtime tunables are in packages/game-rules/src/squad/config.ts, re-exported by config.ts.
The 436-line decisions document contains final before/after/reason rows and tuning history;
its numeric table is embedded in the demo. Defense uses diminishing returns; modifiers add
by kind then cap once; statuses/crit/guard resolve in a documented order. Enemy routine
attacks are offset, one heavy windup is allowed, and all adds consume the eight-enemy cap.
Targeted hostile projectiles fizzle after target death; support flasks retarget a living ally;
ground AoE retains its selected footprint. Tactic and gear data change priority, healing,
piercing and guarded-break behavior without expanding the real item catalogue.

asset-provenance.md, tools/art/squad-manifest.json and proof-images.json record every new
sprite/capture, date, command/parameters, bytes and hashes. Exact generation prompt: none.
Python integer geometry uses the locked Evening Atelier palette with binary alpha. Guardian
was judged first at native size and in a crowded scene, then Witch/Alchemist followed.
Portraits come from the same rigs. Projectile/impact/zone shapes are original versioned
Phaser geometry rather than external sprites. No model, copied/traced art or reference-game
input was used. Human-quality final art is still pending.

Open issues, in priority order:

1. Art/impact polish remains below 8. Several skills reuse arm poses; enemy animation needs
   more expressive unique frames. Status glyphs and overlapping melee actors need human review.
2. Burst outperforms sustain and makes Yarn forgiving; future tuning should preserve the
   measured targeting advantage while creating distinct strengths, not merely raise every HP.
3. Evidence is one agent, one machine, short windows and 20 fixed seeds per condition.
   Accessibility-user comprehension, low-end performance, battery and long-session memory remain untested.

Cut cleanly: compact idle view, skill variants, alternate classes and Vacuum Beast. No
half-wired runtime is in the drafts. Earlier local iteration history is retained on the
unpublished codex/squad-local-history-2026-11-05 backup; the review stack contains only
finished runtime and evidence layers.

Stage 2: final sprite/animation polish, readable dense encounters, compact idle presentation.
Stage 3: deeper behavior-changing builds, recruitment/catch-up and loadout choice after the
combat pilot. Stage 4: design a versioned squad save/command/event schema and server replay
validator, legacy-save migration/read compatibility, idempotent reward settlement and limits;
then test in isolation before any feature flag or economy integration. No such integration is
implemented here. Vacuum Beast, Rogue and Archer remain backlog after the core gates.

## Five-person usability pilot and needs from the user

No human playtest was done. Recruit five people unfamiliar with the prototype; treat this
as a small usability sample, not retention research. First session: start patrol with log
closed, name caster/victim/result for the combo, select the wave-two healer, explain a bind,
and retry a defeat with one adjustment. Record success, misinterpretations and time to the
first deliberate target. Returning after 24–48h: explain a preset choice, spend a manual
ultimate on an exposed knot, finish both training modes and freely choose whether to replay.
Record reasons and observed confusion; do not convert five opinions to population claims.

Needs the user: review the offline demo; review drafts in core → art → UI → proof → demo
order after #286; decide go/no-go on planning verified economy integration before 21 November.
Do not merge/deploy merely because mechanical tests pass; the artistic and human-evidence
limitations above are still open. No approval or release action was requested by this task.
