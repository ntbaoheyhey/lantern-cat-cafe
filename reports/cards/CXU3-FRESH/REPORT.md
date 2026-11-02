# CXU3 — active Forge/Market redesign

Builder on codex/cxu3-forge-market, base2847e9a. Saved AGR3 layout is structural input only; original dirty worktree remains unchanged. Invented Relic power/Weapon-Armor categories were removed. Its altered transaction functions were rejected: main's reads/writes, explicit Fuji chain IDs, digit-only amount validation, client requirement, receipt-success checks and approval order are preserved. Market presentation is a separate component with pure bigint sorting/filtering and selection/detail actions. No conditional hooks are introduced by wallet transitions.

Forge keeps current rule-derived costs/rarity. The craft result uses its existing item ID for a one-shot CSS reveal; parent rerenders do not restart it. Existing art and callbacks stay unchanged. No backend/provider/flag/contract/dependency changes.

Working-tree install/typecheck/focused tests are running; no current formal score, PR, merge or live claim. Additional browser/mutation/full gates remain required.

Saved input cleanup: initial typecheck rejected stale Forge block-reason options, unsupported frame children, nonexistent item.name and ItemIcon props. Main's complete calculation/validation/handler/header block was restored, including the omitted bag-full guard. Frame/icon layering now uses supported primitives and item labels come from the registry. All original market transaction calls, chain IDs and receipt checks are retained; the discarded draft omitted them. Stale failed market reads hide trading details as in main. Builder checks rerun on corrected working code; no grade claimed.
