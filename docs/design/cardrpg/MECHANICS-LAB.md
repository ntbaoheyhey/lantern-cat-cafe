# Mechanics lab · automatic experiments, default off
REFERENCE: packages/game-rules/src/cardrpg/depth/{battle,policies,boons}.ts; depth/auto-extras/index.ts; docs/design/cardrpg/{RESEARCH,PATTERNS,RESEARCH-ADDENDUM-AUTO}.md

The existing fight uses a seeded, one-action-lookahead controller. It scores health, shields, statuses, kills and ally rescue, with deterministic tie breaking. Enemies announce a committed target and intent; every third round has a signature action. Rows, five flavours, status stacks, charge, cooldowns, gear and thirty capped boons already affect outcomes. Players choose their three cats, rows and gear before Fight; playback has no skill/target/energy input. Adding another action economy would repeat a rejected direction.

| Existing research comparison | Supported lesson used here |
| --- | --- |
| AFK Journey · AFK/AFK2 | Clear roles and visible class-equipment progression make preparation legible; no imported formation formula. |
| Epic Seven · E7 | Character animation supports attachment; avoid adding progression chores to obtain interesting fights. |
| Summoners War · SW/SW2 | Equipment and set targets create preparation choices; show when the prepared combination pays off. |
| Raid · RAID | Set thresholds reward a planned composition; keep proc limits and their reasons visible. |
| Cookie Run: Kingdom · CRK | Roles/toppings and a home fantasy connect collection with a squad; cafe motifs stay original. |

These are source-scoped lessons from the existing five squad-RPG rows, not claims that each title implements our reactions or exact auto policy. Source links and evidentiary limits are in RESEARCH.md and sources.json. No new art or live-balance facts were copied.

| Addition | What the viewer sees / preparation decision | Additive rule size and verification |
| --- | --- | --- |
| Tea cloud | An ally first applies Scald; a different tide/garden cat lands HP damage on that foe. A teal steam fan and “Tea cloud · +18 shield” appear around the lowest-health living ally. Pair a Scald applier with a tide/garden attacker. | About25 lines; once per team per round, shield capped at60% maxHP. No RNG and no extra action. Test ally attribution, zero damage, dead/terminal states, cap, round reset and deterministic target tie. |
| Front relay | A rear cat actually heals/shields a front cat; two rising light ticks and “+6 charge” explain the handoff. Keep support in the rear and a cat whose ultimate matters in front. | About15 lines; once per team per round, charge<=100. Test rows, self/nonproductive support, dead targets, cap and reset. |
| Intent lens | Compact tell shows the committed target, current phase, matching flavour advantage and the existing counter hint. Choose rows/flavours before Fight. | About20 read-only lines; no outcome change. Test flag-off empty and byte-identical battle before/after reading. |

All three controls start unchecked behind `autoExtras:false` in an isolated demo “Mechanics lab”. A lab fight grants no rewards and never edits the full-game account or save. It uses the real seeded battle/controller and the same scene/presentation budgets. Options lock at Fight. Watch and Skip share `actAutoExtras`; captured choices can be replayed with the same options and fresh encounter-local memory. Reduced motion removes travel/shake, not explanatory labels.

No existing rules/barrel/config/contract/save file changes. Off dispatches directly to existing act/enemyAct. Verification records full-final-state SHA256 pairs (not log-only hashes), plus50-seed training and held-out cells for starter and reaction teams across all3chapters/first encounters and bosses, each extra alone and together. Record wins, actions, rounds and proc counts; no tuning on held-out seeds. Lane A must repeat item/economy sims with the experiments enabled after integration; these results do not authorize promotion. The user decides whether any extra becomes default-on.
