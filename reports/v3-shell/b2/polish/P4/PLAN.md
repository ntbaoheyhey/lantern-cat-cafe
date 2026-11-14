# Adaptive music implementation plan

Planning only while opening48 completes its suites. Production is unchanged.

- Read `m.visualBattle`, the same displayed actor state as the field; do not read future damage from `m.battle` while an impact is pending.
- A living ally strictly below 30% HP enables an intensity layer. A living boss with its existing enraged phase also enables it. Dead units, ordinary enemies and hidden battles do not.
- Author short original mono percussion loops at the existing battle and boss tempos. Keep both browser formats inside the unchanged 16,000,000-byte shipping budget; record synthesis provenance.
- Start each companion loop on the base score clock. Fade its gain on state transitions. Keep the music bus, ducking, volume, mute and pause controls shared.
- On navigation, cancel pending loads and remove the outgoing intensity source with its parent score. Do not add any gameplay rule or timing change.
- Verify the strict HP boundary, deaths, healing, ordinary enemy phases, boss phases, navigation, delayed decode and mute/pause. Capture actual browser routing and audible output from controlled battle fixtures without direct playback injection.
- Preserve a before/after receipt: no adaptive source before P4, then measured gain and output from healthy/danger/recovery/enrage states. Refresh mix, source-map and full B suites before acceptance.

The current source is locked until opening48 finishes. This plan makes no acceptance or quality claim.
