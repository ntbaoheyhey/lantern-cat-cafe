# CXP1 companion preview numbers and boundaries

SIGNED by Codex under full user authority, 2026-11-01.

Context: sections 10 and 11 authorize twelve original companions and local
progress, with runtime integration reserved for CXG1. The rune demo illustrates
hunting goals, progress bars, adoption, treats and two equipped companions; its
names, art and numbers are not game content. CXP1 introduces no art.

Options considered: use the demo's target-specific counts and treat economy;
leave every pet locked pending backend support; or use the client's existing
acknowledged idle-claim progress for a clearly labelled local preview.

Choice: keep the existing CXP1 original registry and adopt the following values
as **DEMO_PREVIEW only**. This signature approves the preview, not live balance,
server state, drop tables, forge costs or power bonuses.

| Stable ID | Original name | DEMO_PREVIEW unlock count |
| --- | --- | ---: |
| pet.hemwhisk | Hemwhisk | 7 |
| pet.sillskip | Sillskip | 13 |
| pet.thimblepurr | Thimblepurr | 19 |
| pet.kettlepaw | Kettlepaw | 31 |
| pet.crumbcurl | Crumbcurl | 43 |
| pet.bristletoe | Bristletoe | 61 |
| pet.puddleplume | Puddleplume | 79 |
| pet.latchlynx | Latchlynx | 103 |
| pet.pocketmew | Pocketmew | 137 |
| pet.hushspool | Hushspool | 173 |
| pet.eavetuft | Eavetuft | 227 |
| pet.dawnknead | Dawnknead | 283 |

All targets are `claimed-idle-kills`. For unlock count U and observed kills K,
level is min(3, floor(K/U)); zero is locked, one is unlocked. The next absolute
threshold is (level+1)*U, or null at the cap. Percentage is 100*(K-level*U)/U
within the current step, or 100 at the cap. DEMO_PREVIEW display values are
[0.7, 1.3, 2.1], without units or active effects. Their labels live exclusively
in the `preview.*` namespace. The cap of two equipped unique unlocked pets is
also DEMO_PREVIEW. A third equip is rejected; it never silently evicts a pet.

Why: early unlocks make empty/partial/full states easy to review, while wider
later gaps exercise progress and caps. Three equal-sized steps per pet keep the
preview explainable without a treat currency or new economy. These are not
balance simulation results or a promised time-to-unlock. Values were retained
from this branch's independently authored registry, not imported from the demo.

The single kill-count adapter is `apps/web/src/pets/state.ts`. It consumes the
existing GameLoopV2 snapshot plus its synchronous `claimed` event, using
`claimedKills` in `apps/web/src/game/stage/progress.ts`:
`max(0, (after.round-before.round)*after.killsPerRound + after.kills-before.kills)`.
The helper returns zero without a prior snapshot or across a chapter boundary.
Unclaimed adoption deltas expire at a microtask boundary. Equal snapshots,
replayed events, load/refresh, errors and disposed observers grant no extra
counts. Loop-level claim serialization and state epochs handle overlapping
claims/refreshes; the pet adapter adds no API call.

Deliberate limitations: no historical backfill, per-species or boss progress,
account partition, cross-tab/cloud sync, treats, adoption action, or active
passive bonus. Chapters that change during a claim are conservatively omitted.
The loop emits `claimed` only for a positive gains result; rewardless progress
is not inferred. Concurrent tabs can overwrite this local preview; it is not an
authoritative achievement system. Classic has no CXP1 mount. CXP2 owns the UI;
CXG1 must separately authorize and test gameplay and server persistence.

Storage versions 0 and 1 are format identifiers, not DEMO_PREVIEW balance.
The v1 key is `taskbar-hero.pets.DEMO_PREVIEW.v1`; v0 `{version:0,kills,equipped}`
migrates from the v0 key or the current key. The current key wins even when
corrupt (recover empty rather than resurrect stale selection). Keep the legacy
key. Invalid selections are filtered through the same equip rules. Failed
storage reads/writes use memory only.

Reverse: edit this preview registry and decision together, retain stable IDs,
and rerun boundary/store/isolation tests. To reset incompatible local formats,
introduce a new versioned key with an explicit migration; do not change game
saves or reuse these counts for rewards. Remove only the two-line observer mount
to stop new preview accumulation. No backend rollback is needed.
