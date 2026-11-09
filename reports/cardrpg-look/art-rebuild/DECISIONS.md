# Art decisions

## 2026-11-09 R0
- Latest Art Rebuild prompt supersedes idle waiting: art proceeds while a local no-model script watches S6.
- Built-in image generation is available and expressly allowed; use original concepts/painted layers only, no external imagery/API calls.
- R0 reuses immutable #421 delivered runtime for honest baseline, records artifact hash and shot pins before art changes.
- Preserve existing Full Run samples; reference them when production trees are unchanged, never resample to erase misses.
- Stack R0 on #421 through existing reporting descendants. Preserve dirty waiting state in the requested wip branch.
- New lookArt switch is B-owned; no runtime/default flags changed during R0.
