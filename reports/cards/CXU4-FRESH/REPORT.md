# CXU4 — active fresh-session gate

Branch ai/codex-cxu4 refreshed with main1b299c4 via merge8f2e3fe, without rewriting history. Only docs/design/decisions.md conflicted; both decision entries were kept. Application code merged cleanly.

Builder is inspecting Hero/Help/shared primitives against the reference. Existing Help strings fixture is retained. A new out-of-order modal cleanup regression is being run against unchanged implementation before any fix. No current score, complete gate, merge or live claim.

Scope: Hero/Character, Help, notices, shared UI and associated tests. No dependency on #244; no backend activation, art replacement, provider change or new rail entry.
