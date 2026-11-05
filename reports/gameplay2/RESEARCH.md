# Gameplay pass 2 research
2026-11-05. Candidate build, not live. One author, no independent player panel. Sources are design evidence, not retention promises. No reference-game assets downloaded or used.

## What changed in the question
The previous research covered onboarding, readability and first reward. This pass asks whether the next ten minutes contain different decisions, and whether returning changes what a player can do. Three separate ten-minute normal-clock guest walks use actual MockGameApiV2 seeds 11, 29 and 47; idle, active and min-max policies. Raw receipts retain every claim, attempted action, state sample and page error. These are scripted play styles, not human boredom measurements. The original driver left the boss result open after defeat; later actions could fail behind that result. Those failures remain in the receipts and are not counted as meaningful decisions. A corrected driver closes the result explicitly for comparable follow-up runs.

## Sources and specific design applications
| Source | One-line takeaway and application |
|---|---|
| [Pecorella, The Math of Idle Games III](https://www.kongregate.com/en/pages/the-math-of-idle-games-part-iii) | Prestige should change the next climb while bounding growth; tours retain the kit/journal and add a capped, previewed bonus. This is part III, beyond the prior pass's part I. |
| [Stout, Enemy Attacks and Telegraphing](https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing) | An attack poses a readable question and the player needs a matching tool; named Dodge/Break/Interrupt cues precede impact, with explicit recovery. |
| [Stout, Boss Battle Design and Structure](https://www.gamedeveloper.com/design/boss-battle-design-and-structure) | Bosses teach, escalate and acknowledge victory; three phases tighten tells while a result distinguishes Perfect, Clear and Close call. Search abstract read; not a full video study. |
| [Supergiant, Hades Superstar update](https://www.supergiantgames.com/blog/hades-superstar-update-patch-notes/) | Weapon aspects and selectable challenge conditions support different run plans; local sets alter pounce, sustain or gathering, with tier choices locked during fights. |
| [Eleventh Hour, Crafting Changes 0.8.4](https://forum.lastepoch.com/t/crafting-changes-coming-to-eternal-legends-update-0-8-4/45597) | Directed crafting combines control with uncertainty; guarantee set/slot, disclose quality/affix odds, offer safe stitching beside a non-destructive gamble. No mechanics or numbers copied. |
| [Apple, Design for Game Center, transcript](https://developer.apple.com/videos/play/wwdc2020/10145/) | Order achievements with progression, show honest partial completion, and use clear descriptions; our short checklist teaches patrol, counters, crafting, sets and tours. |
| [GDC, Achievement Design community study](https://gdcvault.com/play/1013729/Achievement-Design-Lessons-From-an) | Achievements can obstruct play; rewards remain tiny and goals never require wasteful or adversarial behavior. Public abstract only. |
| [Rusty's Retirement developer store description](https://store.steampowered.com/app/2666510/Rusty_s_Retirement/) | Automation and Focus Mode support multitasking; unattended encounters safely Gather, with no streak loss or mandatory reactions. Text only; no artwork opened. |
| [GDC, Designing for Presence Without Intrusion](https://gdcvault.com/play/1035099/Thriving-Players-Summit-Designing-for) | Cozy/idle systems should support attention rather than demand it; session goals persist and away rewards have explicit caps. Public abstract only. |
| [MDN, Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Visibility gives the client a clear pause boundary; stop the Sample interval and motion while hidden, then calculate bounded local catch-up. |

The sources do **not** establish that successful cozy games universally demand a decision every 20–40 seconds. That interval is the user's measurable product target. We implement opportunities that can be ignored safely, not an attention tax. Midgame walls should reveal a route through: a complete Moss set for survival, Ember and recovery Pounce for enrage, or Study before a fight. Daily-style goals are per-save, not a midnight deadline. Randomness uses a rotating encounter bag so surprise does not produce long droughts.

## Ranked problems (impact 1–5 / effort S–L)
| Rank | Observed problem and evidence | Impact / effort | Upgrade |
|---:|---|---|---|
| 1 | Normal claim cadence leaves approximately 30s gaps after the first reward; before timeline receipts. | 5/S | W1: 18s accepted claims, anchored after the first claim. |
| 2 | First boss defeats the unequipped idle cat; before idle receipt and result screenshot. | 5/L | W3: isolated Sample boss teaches counters; starter kit can clear room one hands-free. Default server boss unchanged. |
| 3 | Baseline boss is an outcome replay, with no active tactical response. | 5/L | W3: deterministic counter and recovery loop, default-off. |
| 4 | Active baseline repeatedly returns to the same equip/craft action, few new verbs. | 5/M | W2: eight encounter types with situational route payoffs. |
| 5 | Baseline has no coherent 2/3/4-piece play-style ladder. | 5/L | W4: three sets with behavior-changing thresholds. |
| 6 | Long-term progress is mainly room access and gear power. | 4/M | W6: persistent bestiary, set collection, achievements and completion. |
| 7 | Forge gives limited agency beyond recipe and slot. | 4/M | W4: chosen set/slot; safe upgrade vs explicit-odds Spark with item-bound pity. |
| 8 | Build comparison has no reason to keep two purposeful loadouts. | 4/M | W4: damage/effective-HP comparison and protected saved kits. |
| 9 | Post-defeat result must be closed before navigation meaningfully resumes; driver stalled. | 4/S | Explain and test Back to exploring; retain original driver failure evidence. |
| 10 | A second visit has little visible local identity or persistent build commitment. | 4/M | W5/W7: mastery choice, kept collection, capped away summary. |
| 11 | Challenge preference is not an explicit room-by-room choice. | 3/M | W8: Cozy/Spirited/Daring, visible assist and first-clear quality reward. |
| 12 | Initial Sample tiers boosted all loot without taking risk (fresh code audit). | 5/S | Restrict quality premium to first boss-clear loot; ordinary/crafted quality is tier-independent. |
| 13 | Initial Sample odds displayed floating-point noise (first-look/workshop.png). | 4/S | Shared probability helper, rounded percentages, exact affix disclosure. |
| 14 | Initial Sample creature names reused mismatched old sprites (first-look/patrol.png). | 3/M | W10: original palette-locked patrol creatures and shape-coded icons. |
| 15 | Initial Sample tab images were captured before React settled; keyboard/axe proof missing. | 4/M | W9: wait for page headings; all screens/resolutions, keyboard, axe, hidden/reduced-motion gates. |

Boredom inference: repeating an unavailable craft or watching 30s without a new claim is a plausible friction point, not a measured emotion. Backlog: human playtests/retention, server-authoritative new bosses/items, narrative branches, more mastery tiers, audio, mobile, cloud saves. None is claimed as shipped.
