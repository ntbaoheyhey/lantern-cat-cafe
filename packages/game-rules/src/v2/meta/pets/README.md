# Companion preview rules

DEMO_PREVIEW: this module is a local preview. Every unlock threshold, level
step, per-level display value and selection limit is a preview placeholder,
approved only for this local preview in
[the CXP1 decision](../../../../../../docs/decisions/pets-preview.md).
The thresholds and all companion names/flavour were authored for this mission;
no proposal-demo table or third-party content was copied. No art is included.

Import this module directly through
`@taskbar-hero/game-rules/src/v2/meta/pets`. It is deliberately absent from the
shared v2 barrel so server/power modules do not acquire a registry dependency.
The client isolation test rejects pet references outside the preview store and
its single mount boundary.

`petProgress(killCounts, defs)` returns a record keyed by pet id. Missing or
invalid counts are empty. At the unlock threshold, level becomes one. Each
additional threshold-sized step increases level until `perLevel.length`.
`nextAt` is an absolute kill count; it becomes `null` at the cap. `pct` measures
progress within the current step and is full at the cap. DEMO_PREVIEW: the
registry currently has three display levels with values `[0.7, 1.3, 2.1]`.
These are label values with no units or application to gameplay.

DEMO_PREVIEW: selection permits at most two unlocked pets and rejects duplicate,
unknown and locked ids. `bonusKey` values belong to the `preview.*` namespace;
they are labels, not stat keys. No pet code calls combat, drop or forge rules.

The client stores a browser-local aggregate for `claimed-idle-kills`. The single
read boundary is `apps/web/src/pets/state.ts`: it observes existing v2 snapshots
and the existing `claimed` event and delegates the count delta to the existing
`claimedKills` helper. There is no per-species or lifetime kill counter to read.
Loads do not backfill progress; chapter transitions and backwards resets are
ignored. No animation, timer estimate, boss result or currency value awards pet
progress. This deliberately undercounts history rather than inventing it.
Only the acknowledged claim emitted synchronously with a state adoption consumes
that adoption's delta. An unclaimed refresh delta expires at the microtask boundary,
so a later claim cannot reuse it, including when a refresh overtakes a claim.

Storage uses `taskbar-hero.pets.DEMO_PREVIEW.v1` with
`{version: 1, killCounts, equipped}`. A legacy
`taskbar-hero.pets.DEMO_PREVIEW.v0` payload `{version: 0, kills, equipped}` migrates
to the current key; the old key remains recoverable. A current-key v0 payload
also migrates. Invalid JSON, schema, counts or future versions produce empty
state; invalid selections are sanitized. Storage access failures leave an
in-memory store. Progress is device/browser-local, shared across demo/account
switches on that browser, with no server synchronization or rewards.

The CXP2-facing API is documented at the top of `apps/web/src/pets/state.ts`:
`usePetsState(store?)` subscribes React; `getPetsStore()` exposes the singleton's
`equip`, `unequip`, `getSnapshot` and `subscribe`. An injected `PetsStore` makes
isolated tests possible. Types are re-exported there; read `PET_DEFS` and
`petProgress` directly from this rules module. UI never grants counts.
