# Card RPG session coordination


 Branch ai/codex-cardrpg-sync holds only the folder coord/cardrpg/. Setup: `git fetch origin ai/codex-cardrpg-sync`; if it exists, add worktree /Users/bao/taskbar-hero-cardrpg-sync on it; if not, create it as an orphan-free branch from the base SHA, add coord/cardrpg/README.md (copy of this section), push. If your push is rejected because the other session created it first, delete your local branch, fetch and use the remote one.
 Files (each file has ONE writer; no file is written by both):
  - coord/cardrpg/A-OUTBOX.md (A writes, append-only) / coord/cardrpg/B-OUTBOX.md (B writes, append-only). Entry format:
      ## <UTC ISO time> <A|B> #<n> <TYPE> [re: <other side #n>]
      <body, max ~25 lines, link files/commits by SHA>
    TYPE is one of: STATUS, CONTRACT (A only: new contract version), FIXTURE (A only), REQUEST (need something from the other side), ANSWER, BLOCKER, HANDOFF (branch tip ready to integrate), DONE.
  - coord/cardrpg/A-STATUS.json / B-STATUS.json (each writes its own): {"time","phase","branch","head","contractVersionConsumed|Published","openRequests":[...],"next"}.
  - coord/cardrpg/CONTRACT.md (A writes): human summary of contract.ts version, changelog, what changed for B.
  - coord/cardrpg/UI-NEEDS.md (B writes): what B needs from the contract (fields, events, enums), screen list and which fixture each screen uses.
 Protocol:
  - Always `git pull --rebase` before writing; commit only your own files; push; on rejection, pull --rebase and push again (max 5 tries). Commit message "sync(A|B): #<n> <TYPE>".
  - Read the other side's OUTBOX and STATUS at every phase boundary and at least every ~45 minutes of work (fetch, read, continue). Do NOT busy-wait or sleep-poll. If you need an answer you can't proceed without, switch to other owned work and check again at the next boundary.
  - Answer every REQUEST addressed to you within your next boundary (ANSWER entry, or "won't do + why").
  - The contract is versioned (CONTRACT_VERSION constant in contract.ts, semver). A never makes a breaking change without bumping the minor version AND an outbox CONTRACT entry listing exactly what to change. B pins the version it consumes in B-STATUS.json.
  - If the other side is silent for more than 90 minutes at a checkpoint you need, proceed with the latest fixtures/contract, record the assumption in your outbox and report, and keep going. Never stop and wait for hours.
 Checkpoints (times relative to when YOU start; the user starts both sessions within minutes of each other):
  - C0 (by ~0:45): both posted STATUS #1 with base SHA, worktree, plan. B posts UI-NEEDS.md v0 (screens it expects: hub, collection, card detail, inventory+equipment, gacha banner+odds+history+pity, forge/enhance/salvage, quests/daily, codex, battle reward screen). A posts research outline.
  - C1 (by ~2:30): A publishes contract.ts v0.1 + fixtures (at least: starter account, mid-game account with full inventory across all rarities, gacha banner with odds+pity, one equipped team, one battle reward payload) and CONTRACT.md. B meanwhile works only on battle layout/camera/perf/effects (needs nothing from A).
  - C2 (by ~5:30): A publishes contract v0.x feature-complete + balance-sim summary; B has every meta screen rendering A's fixtures with real A rules functions (imported from game-rules, no reimplementation of rules in the UI). Both post HANDOFF with branch tips.
  - C3 (by ~8:00): A freezes (only bug fixes B requests); A posts HANDOFF final. B builds the integration branch (B's branch + A's branch merged; ownership guarantees no textual conflicts; if any appear, B stops and posts BLOCKER, A fixes on its side), runs the full test suite, builds docs/cardrpg/index.html, and posts DONE.
  - C4 (by ~9:30): both write their reports; B writes the combined summary.
 Contract rules: contract.ts contains only types, enums, constants and pure function signatures exported from game-rules (view-model inputs, events, state shapes, rarity/odds tables). UI never computes game outcomes; it calls game-rules. Rendering-only data (colors, model IDs, effect IDs, camera presets) stays in B's code, keyed by A's stable IDs.

