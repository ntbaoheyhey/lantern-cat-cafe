# ORIG2 / T013 — local catalog and original static art

Implemented under full user authority, 2026-11-03, after publication of T011/T012 in PR255. This is required P1 delivery, not gated P2 pet/rune work.

Help gains a lazy Catalog preview tab. It starts OFF from CONFIG.features.originalEconomy=false and uses transient component state for explicit opt-in. The shared flag stays false; switching Help tabs or reloading unmounts/resets the preview. The component uses only the pure calculator and local React state: no inventory, saved progression, currency, purchases, combat, wallet or server writes. The existing seven-entry rail and current gameplay remain authoritative.

The item list/detail view shows15 examples, actual slot filters,5 draft qualities, levels1–6, scaled item bonuses and base-plus-one-item results. It displays the next draft cost or a maximum-level label, never a purchase action. The stat table shows all12 definitions, units and caps; percentages preserve small accessory fractions. The skill list shows7 examples and three ranks with trigger units, per-trigger/per-second output and level-qualified incremental costs. It uses draft base stats only, before mitigation, without treating a preview as owned ranks.

All hooks precede conditional content. ID and numeric selections are checked against known bounds. The stat scroller is keyboard focusable; controls remain available at1280×720 and1600×900. The content is explicitly a local draft, and no backend flag or production setting is activated.

T013 adds34 static32×32 icons (12 stats,15 items,7 skills) authored as coordinate drawings in tools/art/original_icons.py, with no image model or external media. Every file runs the existing snap/lock/trim/pad/optimize/check chain; binary alpha, at most16 opaque colors from cafe-night-v1,2px safe padding and exact static-atlas pixels are independently checked. The atlas uses1px gutters and lookup IDs; fps metadata is not used as animation. Existing quality frames are reused unchanged at integer scales. No existing art is recolored, replaced or removed.

Each icon was inspected at1x/3x on dark/cream backgrounds and in silhouette. Numeric foreground contrast distributions are recorded in the ledger; dark contours and light highlights do not claim3:1 at every pixel. Adjacent text labels supply meaning. Full per-file authoring briefs, actual method/date/hashes and transform order are in reports/asset-provenance.md and tools/art/original-icons.json; canonical catalog/provenance includes the new entries without inventing historical prompts.

Validation includes default-OFF rendering, shared-config/storage/network isolation,12/15/5/7 coverage, fractional formatting, selection guards, correct trigger math, tab-unmount reset, integer atlas lookup, keyboard scrolling and reduced-motion desktop browser cases. Public RPC/wallet functionality is unchanged; this preview does not establish a live balance rollout or funded demo completion.
