# Read-ahead notes — not implementation or completion evidence

Prepared while CXU5 exact-head tests run. Execution order remains A then B then C.

## CXU3
- Existing v2 runtime host is apps/web/src/layout/forge/ForgePanel.tsx, not only classic forge/ForgeTab.tsx. It has Craft/Salvage/Relic, real recipes, existing confirmation and callback contracts. Scope note must include this host.
- MarketTab reads balances, approval, activeListingCount and paginated getListings; wallet-free mode currently returns a short connect message. Keep existing read/write set, Fuji network checks, approval/list/buy/cancel/receipt semantics. Redesign with selected-row detail, sort/filter and accessible empty/wallet state; no invented listings or fake transaction proof.
- Proposal forge-great-success is unimplemented rules, not current odds. User authorizes design choices but server activation is forbidden. UI must show the current registry odds/costs.

## CXC2
- Existing scripts/onchain-proof.mjs explicitly reports no totalSupply(uint256) getter in deployed RelicNFT. Do not show a fabricated all-time minted total from recent logs or wallet balances. Resolve an evidence-backed full-history source or show the precise unavailable limitation.
- NFT has RelicForged(player,relicId,rarity,nonce); Market has Listed/Bought/Cancelled and activeListingCount/nextListingId/getListings/relicNFT.
- Public reads must be pinned to chain 43113 and requested NFT/Market addresses; guests need no signing. Use existing viem client, lazy UI, bounded log range and cached refresh >=30 seconds. CXC2 follows CXU4 Help host, not #244.

## Content/art
- Actual merged art pipeline is docs/decisions/art-pipeline.md and docs/art/{STYLE,PROVENANCE,MANIFEST}. The prompt spelling docs/design/art-pipeline.md and reports/art/ are not present on current main.
- tools/art supplies standard-library PNG snap/palette/atlas checks; new icons 32x32, 48 cafe-night-v1 colors, binary alpha, original silhouettes. Add requested reports/asset-provenance.md without rewriting historical provenance.
- T012 is 12 stats/15 items/7 skills, a pure local preview with no grant/persistence/combat endpoint. Preserve the shared default-OFF switch and no backend activation.

Saved AGR3 audit (Nov3): /Users/bao/taskbar-hero/.worktrees/agr3 has6 dirty frontend files, base1fb25ed. Preserve that worktree. Its marketText adds mock-derived power148/112/74/31 and invented odd/even Weapon/Armor categories; DO NOT ship these as facts or copy those tables. Reuse structure only after removing fabricated metadata. MarketTab also introduces useMemo below connection guards, which risks hook-order failure on wallet transitions. Verify/fix that before considering reuse; keep the original wagmi/viem call contract and add connection-transition coverage.
