# ART1: reproducible cafe-night art pipeline

SIGNED by Codex under full user authority, 2026-11-01.

Context: existing art is mainly TypeScript pixel matrices and SVG, with one social PNG. The rune proposal has 163 planned rows, six demo pets and an expandable palette. The mission requires twelve pets, deterministic new raster processing, truthful provenance and preservation of existing art. The current chapter registry puts Kitchen second and Basement fourth, contrary to older prose. The UI reference retains the existing art.

Options considered: introduce an external image library and generator workflow; recolour/re-export every historical source; or add a standard-library pipeline for future originals and inspect historical sources without rewriting them.

Choice: Python 3.9+ standard library only; strict 8-bit static PNG input; center-sampled nearest-neighbour snap; ordered 48-colour cafe-night-v1 palette; explicit binary alpha; trim/pad with source offsets; deterministic sheets and JSON atlas; bounded lossless PNG optimization. [STYLE.md](../art/STYLE.md) records every hex and size. [Tool contracts](../../tools/art/README.md) define supported formats, determinism and error behavior. No dependency, font or external asset added.

Why: the existing plum, tabby, brass and lilac ramps remain recognizable. Fixed palette membership is more reproducible than the proposal's computed extra shades. Code-native historical art retains its actual palettes and sizes. The codec is small enough to audit and tested against independently encoded filters and transparency cases. Unknown historical tools/prompts/seeds stay unknown; git commits establish presence, not a retroactive authorship guarantee.

Manifest choice: reconcile every proposal ID with current art. Add every current gear/material/class/monster/boss/recipe/relic/chapter Compendium mapping, all five chapters' four node states and decor, and twelve pet reservations with portrait/locked/idle slots. Pet reservation IDs are art keys, not gameplay IDs or names; CXP1 supplies the binding before ART2 wiring. No demo pet display names are adopted. Neutral placeholders are honest missing-art status, not delivered art. Keep seven rail items; proposed nav images are sub-tab glyphs.

Canonical provenance is [PROVENANCE.md](../art/PROVENANCE.md). The brief's spelling is supported by the lowercase link label [provenance.md](../art/PROVENANCE.md). No lowercase sibling or case-colliding symlink is created on macOS. Future authors use the canonical path directly.

How to reverse: leave existing art untouched, remove the additive tools/docs after migrating any downstream consumers, or version the palette/atlas contract and regenerate only new assets with reviewed before/after output. Update the catalog adapters when registries change. A richer codec may replace this implementation only with a new dependency decision and equivalent deterministic/mutation evidence. A future design choice can bind or rename reserved art keys through explicit aliases without changing stored gameplay IDs.

Limits: historical provenance cannot be recreated from missing evidence. Full UI render/motion checks and the mission gate remain coordinator-owned. ART1 adds no production rendering or backend-dependent behavior; no feature flag is needed.
