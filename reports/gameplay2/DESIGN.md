# Cat Cafe Quest — gameplay pass 2
Candidate build, not live. All interactive adventure mechanics are local Sample rules behind `features.cafeAdventure=false`; explicit guest opt-in only. Main V2 economy receives only a claim-cadence correction. No new mechanic grants Relics, server materials, keys, or tradable items.

Core loop: see a new corner → Gather / Study / Explore → compare a find or craft a missing set piece → prepare Insight and a challenge tier → read the household boss → counter, recover, pounce → keep a journal memory and open the next room. Unattended play safely gathers and braces. Nothing owned can be stolen or broken.

Goal ladders: short (<1 minute): first find in 8s, a new route every 16s, craft a chosen missing piece for 8 patches. Medium (~10 minutes): learn three boss cues, complete a four-piece set, clear several rooms and choose mastery. Long (multiple visits): all five-room bestiary entries and twelve set pieces, eight achievements, capped three-tour bonus, or harder tiers with a favorite loadout. These are target experiences; measured timelines are in the report.

Second ten minutes: return to a capped away summary; inspect the next incomplete collection; swap A/B for a survival or damage wall; craft current-room gear; try an optional harder boss; after three clears preview a tour, retain equipment/mastery/collection, restart rooms and undo immediately if desired. No calendar countdown, login, streak loss or purchases.

| Package | Five-line design (intent; rule; choice; safety; evidence) |
|---|---|
| W1 Cadence | Reduce empty waiting; normal claims 30→18s with 10s first claim; Sample opportunities every16s and auto-Gather after8s; no synthetic server grants; real three-seed traces plus guard tests. |
| W3 Boss | Teach a recognizable cycle; 3s tells /2s recovery and final2s tells, phases at67/34%; Dodge/Break/Interrupt and cooldown Pounce; 55s enrage,90s limit,3s retry, no key cost; five-seed style/build matrix. |
| W2 Encounters | Make route choice situational; rotating bag of scout/swift/armored/splitter/thief/treasure/hazard/cafe; swift/hazard risk differs, armor rewards Ember, splitter guarantees a Study item, hazard doubles Insight, cafe adds mastery; lucky bonus capped6/tour and only local; each modifier tested. |
| W4 Builds | Give gear a purpose; four slots, four affixes, Plain/Fine/Bright, Ember/Moss/Star at2/3/4 pieces; damage+Pounce vs HP+regen vs gathering+quality; at most48 items,999 patches and3 stitch levels, two protected loadouts; compare full-kit DPS/EHP and simulation. |
| W6 Goals | Keep a reason to return visible; Now/Next/Later chip,8 once-only goals,45 creature entries plus12 set entries; player chooses which collection to pursue; no timer expiry; progress/caps tested and screenshots. |
| W9 Feedback | Make the new verbs legible; anticipation/impact/settle and shape+word cues; keyboard1/2/3/P; existing motion budget with calm reduced-motion and hidden pause; axe and three desktop sizes. |
| W5 Mastery | Keep progress without runaway scaling;40XP/level,5 levels and freely chosen damage/HP/gathering perk; optional tour after3 clears grants5% damage, capped15%; preview Keep/Restart and immediate undo; save and reducer tests. |
| W7 Return | Reward returning without guilt; one local patch/120s,2h time cap and30 patches maximum; dismissible truthful summary; no offline combat/items or server rewards; backward/invalid clock and hidden tests. |
| W8 Difficulty | Let the player set pressure;1/1.25/1.55 boss HP and1/1.15/1.35 damage; first-clear Bright chance +0/+10/+20 points; tier locked in battle, assist after2 losses with10%HP/15%damage reduction and opt-out; adversarial free-quality test. |
| W10 Art | Give encounters their own identity; native24px creatures and16/24px icons; original geometry and locked palette, upper-left light; no external art inputs or generator; deterministic `--check` and provenance hashes. |

Exact numbers live in `packages/game-rules/src/config.ts`; decisions explain changes. Work is one-agent and self-graded. Default server replay remains unchanged. A local Sample is reviewable gameplay, not a substitute for future server design approval.
