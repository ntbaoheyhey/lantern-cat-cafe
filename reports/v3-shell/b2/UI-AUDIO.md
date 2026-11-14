# Screen-by-screen sound pass

795/802 activations (99.13%) request a mapped cue across 54 states. 0 audio errors. Longest measured music gap: 3.54 ms.

Independent real UI fixture for each enabled, pointer-reachable interactive element. Hover/release/scroll excluded from activation coverage. Local Anvil snapshots isolate wallet/market operations; no public transactions.

Every raw state JSON and the actual output/music render are hashed in UI-AUDIO.json. Native mixer tests measure real bus output at zero and 25% volume, isolate settings and verify reload persistence.

## Unmapped activations

- cafe-hub: Your next goal (locator.waitFor: Timeout 12000ms exceeded.)
- cafe-hub: Season (locator.waitFor: Timeout 12000ms exceeded.)
- market-buy: 0x980ae68520a095572cdec1aeeec9b50158a57e40a2bd393776053bb6c084417f (Control changed between isolated fixtures: A||0x980ae68520a095572cdec1aeeec9b50158a57e40a2bd393776053bb6c084417f|0)
- wallet-deed: Fusion (locator.waitFor: Timeout 12000ms exceeded.)
- wallet-withdraw: Market (locator.waitFor: Timeout 12000ms exceeded.)
- wallet-ornament-forge: Orbit (locator.waitFor: Timeout 12000ms exceeded.)
- wallet-offline: Deed perks (locator.waitFor: Timeout 12000ms exceeded.)

## Verification

- `tests/s6-settings-browser.log`: 15 real mixer/output assertions.
- `tests/s6-accept-types.log`: all workspace types.
- `tests/s6-accept-suite.log`: full local suite; 2,532 web and 724 server tests pass. Existing expected rule failures/skips remain disclosed.
- `tests/s6-lifecycle-unit.log`: pending loop lifecycle, concurrent receipts, dismissal and late signing.
