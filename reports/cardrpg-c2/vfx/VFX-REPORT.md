# V4 — painted VFX report

All 86 audited IDs have original painted sources, eight named PNG/PSD layers, four-phase timelines, rendered before/after clips, and completed visual review. The three pilots retain the user's 12 November approval. Final source/export acceptance: 2026-11-12T11:58:52.208582+00:00.

Runtime download: **5,783,929 bytes / 6,000,000 bytes**, including all 86 WebP atlases and 86 timeline JSON files; 216,071 bytes of headroom. The 2048px archival keys are resampled exports of original image-tool output, not native-2048 claims. Source PNGs/PSDs stay outside Git at `/Users/bao/art/vfx-2026-11-12/`. Exact built-in imagegen prompts and source hashes: [ASSET-LOG.md](ASSET-LOG.md). No generated character art or external-game references were used.

Mac profile: Apple M3 Pro / ANGLE Metal, 1280×720, DPR 1. Retained per-skill playback range 60.00–120.10 fps; worst per-skill render p95 2.20ms. These are isolated rendered-scene profiles, not whole-game guarantees. 44 profiles are headless; the remaining profiles predate the user's headless-only instruction. Every browser check in this resumed session stayed headless.

Visual scores use readability/beauty/style/timing 8/8/9/8; pilots retain their approved 8. Individual observations: [V3-REVIEW.md](V3-REVIEW.md). Clips, key frames, layers and scrub previews: [review gallery](../../../docs/vfx/index.html). Reduced motion removes shake/flash and shortens decorative tails; contact remains synchronized to the rules' impact boundary.

Full-card validation on the final 86-effect build: **4,420 package unit passes + 33 Node script passes; 435/435 E2E, zero skips/flakes; typecheck/lint pass; 33/33 word budgets, maximum 24 words.** Two expected failures and 11 inherited research skips remain disclosed in the unit suite. The first run hit the existing crew-advice 5-second timeout; its focused retry and the full package retry passed with package concurrency 1 / maxWorkers 2, unchanged assertions and timeouts. All 21 formation screenshots passed geometric checks; the refreshed preparation, first-wave and boss captures were personally inspected. Verification logs: projectless session11 `work/c2/v3-*`.

## Coverage and open items

Eight passive stat modifiers have no combat-log cast: mallow-passive, sorrel-passive, biscuit-passive, inkcap-passive, cinnamon-passive, brioche-passive, velvet-passive, marigold-passive. Their paintings/timelines are accepted as isolated art previews, explicitly labeled in the gallery; no fictional heal/damage event was added. All other 78 IDs use actual rules-event fixtures, including the four active passive triggers. Final designer Spine event retiming remains dependent on delivery of those files. Current placeholder/Spine slots and the live socket adapter remain intact.

All visible cards score at least 8. B4 combat/economy acceptance is reported separately; good-looking video does not establish balance. No rate-limit style substitution was used.

| Skill ID | Self-score | Duration ms | Runtime bytes | Mac fps | Fixture |
|---|---|---|---|---|---|
| mochi-1 | 8 | 1173 | 55,861 | 119.64 | Rules event |
| mochi-2 | 8 | 1200 | 64,006 | 119.30 | Rules event |
| mochi-3 | 8 | 1200 | 67,602 | 120.00 | Rules event |
| mochi-4 | 8 | 1677 | 70,226 | 119.96 | Rules event |
| mochi-passive | 8 | 1200 | 69,852 | 119.39 | Rules event |
| soot-1 | 8 | 1173 | 72,218 | 120.01 | Rules event |
| soot-2 | 8 | 1200 | 60,538 | 120.00 | Rules event |
| soot-3 | 8 | 1200 | 63,355 | 119.99 | Rules event |
| soot-4 | 8 | 1712 | 72,489 | 120.00 | Rules event |
| soot-passive | 8 | 1200 | 57,893 | 119.98 | Rules event |
| clover-1 | 8 | 1173 | 70,573 | 120.00 | Rules event |
| clover-2 | 8 | 1200 | 66,925 | 120.00 | Rules event |
| clover-3 | 8 | 1200 | 61,665 | 120.02 | Rules event |
| clover-4 | 8 | 1682 | 67,460 | 120.00 | Rules event |
| clover-passive | 8 | 1200 | 62,415 | 119.83 | Rules event |
| panko-1 | 8 | 1173 | 81,794 | 120.00 | Rules event |
| panko-2 | 8 | 1200 | 69,125 | 120.09 | Rules event |
| panko-3 | 8 | 1200 | 74,920 | 120.00 | Rules event |
| panko-4 | 8 | 1697 | 73,237 | 120.00 | Rules event |
| panko-passive | 8 | 1200 | 59,404 | 119.91 | Rules event |
| enemy:button-guard:basic | 8 | 1189 | 91,608 | 120.00 | Rules event |
| enemy:button-guard | 8 | 1189 | 75,526 | 119.90 | Rules event |
| enemy:sock-skipper:basic | 8 | 1189 | 53,646 | 120.00 | Rules event |
| enemy:sock-skipper | 8 | 1189 | 70,722 | 119.98 | Rules event |
| enemy:spool-ram:basic | 8 | 1189 | 69,491 | 119.99 | Rules event |
| enemy:spool-ram | 8 | 1189 | 63,402 | 120.00 | Rules event |
| enemy:needle-moth:basic | 8 | 1182 | 53,400 | 119.91 | Rules event |
| enemy:needle-moth | 8 | 1182 | 55,495 | 119.99 | Rules event |
| enemy:teacup-healer:basic | 8 | 1182 | 59,880 | 120.00 | Rules event |
| enemy:teacup-healer | 8 | 1182 | 84,644 | 119.91 | Rules event |
| enemy:kettle-knight:basic | 8 | 1182 | 53,998 | 120.10 | Rules event |
| enemy:kettle-knight | 8 | 1182 | 62,639 | 120.00 | Rules event |
| enemy:binding-thread:basic | 8 | 1182 | 57,287 | 120.00 | Rules event |
| enemy:binding-thread | 8 | 1182 | 76,479 | 120.00 | Rules event |
| enemy:practice-cushion:basic | 8 | 1182 | 77,206 | 120.00 | Rules event |
| enemy:practice-cushion | 8 | 1182 | 61,370 | 120.00 | Rules event |
| enemy:yarn-giant:basic | 8 | 1164 | 76,354 | 120.00 | Rules event |
| enemy:yarn-giant | 8 | 1164 | 67,111 | 120.00 | Rules event |
| enemy:rain-spool:basic | 8 | 1164 | 55,580 | 120.00 | Rules event |
| enemy:rain-spool | 8 | 1164 | 69,611 | 119.99 | Rules event |
| enemy:pantry-crown:basic | 8 | 1164 | 76,736 | 120.00 | Rules event |
| enemy:pantry-crown | 8 | 1164 | 75,262 | 60.00 | Rules event |
| mallow-1 | 8 | 1173 | 73,142 | 119.98 | Rules event |
| mallow-2 | 8 | 1200 | 72,718 | 60.00 | Rules event |
| mallow-3 | 8 | 1200 | 66,262 | 60.00 | Rules event |
| mallow-4 | 8 | 1697 | 66,137 | 60.00 | Rules event |
| sorrel-1 | 8 | 1173 | 59,801 | 60.00 | Rules event |
| sorrel-2 | 8 | 1200 | 54,750 | 60.00 | Rules event |
| sorrel-3 | 8 | 1200 | 66,573 | 60.00 | Rules event |
| sorrel-4 | 8 | 1697 | 63,568 | 60.00 | Rules event |
| biscuit-1 | 8 | 1173 | 60,652 | 60.00 | Rules event |
| biscuit-2 | 8 | 1200 | 55,532 | 60.00 | Rules event |
| biscuit-3 | 8 | 1200 | 69,465 | 60.00 | Rules event |
| biscuit-4 | 8 | 1697 | 56,761 | 60.00 | Rules event |
| inkcap-1 | 8 | 1173 | 74,591 | 60.00 | Rules event |
| inkcap-2 | 8 | 1200 | 64,985 | 60.00 | Rules event |
| inkcap-3 | 8 | 1200 | 61,521 | 60.00 | Rules event |
| inkcap-4 | 8 | 1697 | 68,159 | 60.00 | Rules event |
| cinnamon-1 | 8 | 1173 | 81,518 | 60.00 | Rules event |
| cinnamon-2 | 8 | 1200 | 71,985 | 60.00 | Rules event |
| cinnamon-3 | 8 | 1200 | 59,485 | 60.00 | Rules event |
| cinnamon-4 | 8 | 1697 | 69,184 | 60.00 | Rules event |
| brioche-1 | 8 | 1173 | 89,410 | 60.00 | Rules event |
| brioche-2 | 8 | 1200 | 66,714 | 60.00 | Rules event |
| brioche-3 | 8 | 1200 | 50,664 | 60.00 | Rules event |
| brioche-4 | 8 | 1697 | 53,055 | 60.00 | Rules event |
| velvet-1 | 8 | 1173 | 78,022 | 60.00 | Rules event |
| velvet-2 | 8 | 1200 | 63,690 | 60.00 | Rules event |
| velvet-3 | 8 | 1200 | 70,229 | 60.00 | Rules event |
| velvet-4 | 8 | 1697 | 69,866 | 60.00 | Rules event |
| marigold-1 | 8 | 1173 | 69,016 | 60.00 | Rules event |
| marigold-2 | 8 | 1200 | 75,577 | 60.00 | Rules event |
| marigold-3 | 8 | 1200 | 66,771 | 60.00 | Rules event |
| marigold-4 | 8 | 1697 | 68,803 | 60.00 | Rules event |
| mallow-passive | 8 | 1200 | 65,093 | 60.00 | Art preview |
| sorrel-passive | 8 | 1200 | 60,585 | 60.00 | Art preview |
| biscuit-passive | 8 | 1200 | 75,048 | 60.00 | Art preview |
| inkcap-passive | 8 | 1200 | 60,545 | 60.00 | Art preview |
| cinnamon-passive | 8 | 1200 | 67,845 | 60.00 | Art preview |
| brioche-passive | 8 | 1200 | 65,024 | 60.00 | Art preview |
| velvet-passive | 8 | 1200 | 63,245 | 60.00 | Art preview |
| marigold-passive | 8 | 1200 | 71,081 | 60.00 | Art preview |
| enemy:pollen-scout:basic | 8 | 1182 | 57,960 | 60.00 | Rules event |
| enemy:crumb-sentinel:basic | 8 | 1182 | 92,747 | 60.00 | Rules event |
| enemy:pollen-scout | 8 | 1182 | 61,139 | 60.00 | Rules event |
| enemy:crumb-sentinel | 8 | 1155 | 76,006 | 60.00 | Rules event |
