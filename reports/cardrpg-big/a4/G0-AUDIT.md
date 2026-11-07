# A4 G0: what the current game lets a player decide
REFERENCE: memory/PROMPT-A4.md; ../../../docs/design/cardrpg/ITEM-TIERS.md; g0/browser/audit.json; g0/before.json.

Baseline: delivery daba7d7c; main demo SHA-256 32a727afc547520fa65eb8dccf4453d1a78b8d5b3403f5a78d91d265f3c3a06d, 26,120,329 bytes. No gameplay change in G0. Automated real-click audit at 1280×720: a new account, three first-session routes, a legally earned day-7 fixture, and a separate level-10/three-star A3 comparison. “First hour” is a compressed path, not sixty elapsed minutes. Unmeasured cells are explicitly pending. Scores below are this agent's sequential design assessment, not a user study.

## Decisions and visibility

| Decision / surface | Effect visible now | Score / 10 | Specific gap |
|---|---|---:|---|
| Claim bounded cafe service / Cafe | Elapsed service description and currencies | 7 | Demo fixture wording obscures normal offline progress |
| Pick chapter, daily route or Tower / Cafe | Chapter rewards and unlocks | 7 | No compact daily plan or weekly milestone loop |
| Pick three collected cats / Team & cards | Cards, roles, power and automatic kits | 7 | “Best team” overweights raw stats; no matchup explanation |
| Place front/back rows / Team & cards | Row headings and selectors | 6 | Changes cannot be made on Prepare; specific opponent pressure is below fold |
| Save three shifts / Team & cards | Team presets | 6 | A shift is not a complete equipment and tactics loadout |
| Discover a combo / Team & cards | Warm table / Night garden activation | 5 | Activation text does not show a counted threshold or contribution after combat |
| Level, ascend and awaken / Companions | Cost, stats, unlock text | 7 | Level-six ultimate dominates gear distinctions |
| Compare and equip four slots / Equipment | Before/after numerical stats and 2/4 set text | 7 | Utility effects missing from power; behavior changes are hard to compare |
| Enhance to +12 / Equipment | Guaranteed next value and cost | 7 | No relative combat-utility indication |
| Choose replacement affix / Equipment | Compatible chosen affix and cost | 7 | Still needs clearer relation to a role or matchup |
| Salvage / Equipment | Threads returned; equipped items protected | 7 | No unified capacity forecast or complete saved loadout |
| Tailor a chosen template / Equipment | Source chapter, cost and mastery gate | 7 | Very long template list; planning a missing piece is awkward |
| Filter/sort gear / Equipment | Slot, rarity, set and sorting | 8 | Materials, consumables and currencies lack a unified source/sink/binding table |
| Choose banner, one or ten invitations / Invitations | Cost, daily limit and account binding | 8 | No deterministic chosen reward beyond pity and unowned preference |
| Inspect odds / Invitations | Base, conditional next draw and item pool | 9 | Add permanent chosen-reward distance beside pity |
| Choose route branch / Night route | Node kind and connectivity | 7 | Enemy roles and counters need to be actionable before commitment |
| Choose story tradeoff / route event | HP, points and charm consequences | 8 | Strong existing between-fight decision to retain |
| Choose charm/skill upgrade / reward, shop, campfire | Description, cap and price | 7 | Some descriptions retain rejected energy/break vocabulary |
| Spend tonic / between encounters | Healing and remaining supplies | 7 | Keep strictly outside battle |
| Commit to battle / Prepare | Team stats, enemy HP/row, five-seed estimate | 5 | Only Fight/Return; opponent intent and counter-picking missing |
| Change a build after defeat / Result | Damage, healing, MVP, biggest hit and return to team | 5 | Does not explain equipment, formation or tactic contribution |
| Inspect journal/field guide / Field guide | Enemy counters, sets and status rules | 5 | Still explains flavour wheel, break pressure and shared energy; v4 must remove these mechanics/copy from its active rules and guide |
| Reserve collectible design / Inventory → Collectibles | Local eligibility and design caps | 4 | No authoritative ledger transition or replay/cap-race enforcement |
| Export/import and settings / Save & settings | Checksum and playback preferences | 8 | New format must preserve legacy saves and OFF behavior |

Screenshots: [Team](g0/browser/day7-team-cards.png), [Prepare](g0/browser/day7-prepare-0-6.png), [Equipment](g0/browser/day7-equipment.png), [Invitations](g0/browser/day7-invitations.png). Visual review of Team and Prepare confirms that the three cats occupy the first viewport while opponent information falls below it. Forty-two captured states report zero horizontal overflow and no browser errors; this is not the full three-size/204-image acceptance pack.

## Fresh measurements

<!-- A4_BEFORE_START -->
| Measure | Fresh G0 BEFORE | Requested v4 gate |
|---|---|---|
| Adjacent tier steps | 26/48 improve by at least 2 pp; 22 ties; 0 reversals | ≥44/48; zero reversals |
| Paired single-piece utility | Train 42.00 pp; heldout 34.00 pp | Heldout ≤12 pp |
| Largest raw-score item share | 9.63% at +12 | ≤10%, plus utility in display |
| Sets, chapter 3 / level 1 | 8.00%–92.00% | 35–75% at matched power |
| Sets, all original cells | 8.00%–100.00% | Distinguish saturation from matched-power set balance |
| Cat participation | 49.15%–83.76% | 55–75% at matched power |
| 45-day heavy/casual earned | pulls 1.0000×; fish 1.8083×; threads 1.9178×; stamps 1.0000×; essence 2.1948× | Every measure ≤3× |
| Startup JavaScript | 3,522,504 bytes / 11 chunks | No growth against current main |

Tier train seeds 1–50, heldout 10001–10050; cat team seeds 50001–50020 / 60001–60020. Fifty paired outcomes mean one win is 2 pp. G0 set/cat fixtures retain historical unnormalized team power for comparison; these are not claimed to satisfy the future matched-power protocol.

| Sample | Level | Chapter | Bare | Common | Rare | Epic | Legendary |
|---|---:|---:|---:|---:|---:|---:|---:|
| train | 1 | 1 | 4/50 | 38/50 | 45/50 | 47/50 | 50/50 |
| train | 1 | 2 | 2/50 | 17/50 | 32/50 | 36/50 | 50/50 |
| train | 1 | 3 | 1/50 | 10/50 | 15/50 | 37/50 | 50/50 |
| train | 6 | 1 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| train | 6 | 2 | 29/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| train | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| held | 1 | 1 | 0/50 | 33/50 | 40/50 | 48/50 | 50/50 |
| held | 1 | 2 | 0/50 | 16/50 | 29/50 | 41/50 | 50/50 |
| held | 1 | 3 | 0/50 | 4/50 | 11/50 | 33/50 | 49/50 |
| held | 6 | 1 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| held | 6 | 2 | 29/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| held | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |

| Level | Chapter 1 bare → best | Chapter 2 bare → best | Chapter 3 bare → best |
|---:|---:|---:|---:|
| 1 | 8.00% → 100.00% | 4.00% → 100.00% | 2.00% → 100.00% |
| 2 | 10.00% → 100.00% | 2.00% → 100.00% | 2.00% → 100.00% |
| 3 | 10.00% → 100.00% | 2.00% → 100.00% | 2.00% → 100.00% |
| 4 | 8.00% → 100.00% | 4.00% → 100.00% | 2.00% → 100.00% |
| 5 | 10.00% → 100.00% | 8.00% → 100.00% | 2.00% → 100.00% |
| 6 | 100.00% → 100.00% | 58.00% → 100.00% | 100.00% → 100.00% |
| 7 | 100.00% → 100.00% | 56.00% → 100.00% | 100.00% → 100.00% |
| 8 | 100.00% → 100.00% | 68.00% → 100.00% | 100.00% → 100.00% |
| 9 | 100.00% → 100.00% | 76.00% → 100.00% | 100.00% → 100.00% |
| 10 | 100.00% → 100.00% | 82.00% → 100.00% | 100.00% → 100.00% |
| 50 | 100.00% → 100.00% | 100.00% → 100.00% | 100.00% → 100.00% |
<!-- A4_BEFORE_END -->

Real x1 timings already observed: day-7 chapter-one boss **177.346 s**, boss death **155.331 s**, cleanup **22.015 s**. Separate A3 comparison **171.794 s**, death **154.151 s**, cleanup **17.643 s**. Three new-save boss defeats took **159.598 / 143.874 / 137.218 s**. Ordinary first-session encounters **52.477–63.705 s** and day-7 ordinary **58.881 s**. This supersedes the old 9–16-second ordinary fixture claim for these actual paths. Every sampled ordinary encounter and boss exceeds the requested v4 target; shorter defeat feedback matters too. Elite and chapter-two/three x1 timing are not measured at G0.

Cold native peak **33.4 ms**, CPU×4 peak **266.7 ms** in the new G0 receipt; the artifact is unchanged, so these are baseline environment observations, not an A4 regression. Full sizes and startup bytes remain in g0/cold/summary.json and g0/startup/checks.json. Source gates pass: typecheck, lint, build, **1,735 web tests / 1,020 rules tests** (+2 expected failures, 11 skipped), **421 E2E**. One missing-tool loader attempt failed; the retry uses existing Vite and proves 45 full-route outputs identical. Original logs are retained. The 13 historical sim files and baseline-v1 bytes are unchanged; fresh behavioral OFF digest is 47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3.

## Brief coverage driving A4

| User requirement | Current observable loop | Before / 10 | Required phase / acceptance |
|---|---|---:|---|
| Good mechanics and retention | Routes, loadouts, automatic outcome | 6.5 | P1/P3/P5: visible preparation responsibility and concise outcome |
| Complete equipment | 4 slots, 8 sets, enhancements, reforge, tailoring, salvage | 6.5 | P2: utility comparison, real loadouts and meaningful tiers |
| Complete items | Distributed materials, gear, currencies and designs | 6 | P2: unified source/sink/cap/binding catalogue |
| Balanced items | Deterministic rules, known utility outlier | 4 | P2/P6: paired heldout utility and tier gates |
| Rare versus common | Four labels and source gates | 6 | P2: quantified distinction at every intended content band |
| Distinctness | Set/unique descriptions | 6 | P1/P2: behavioral identities with a documented niche |
| Gacha | Three earned banners, disclosed odds, pity | 8 | P4: deterministic selector and 10,000-account simulation |
| More than battle | Cafe, quests, routes, Tower, journal | 6.5 | P5: daily plan, capped idle service, permanent milestones |
| NFT-value limits | Design caps and local counters | 3 | P4: pure issuance ledger, replay/race tests, zero combat bonus |
| Research-based original identity | 34-game desk study and cozy cafe | 7 | R/D: verified gap evidence and explicit original principles |
| Keep proven basics | Progression, synergies, targeting and pity exist | 7 | All phases: extend, retain saves and prove OFF equivalence |

The current product has substantial meta systems, but its screens rarely explain how a preparation decision caused a battle observation. The next design must make those connections visible, remove obsolete manual-system explanations, bound individual-item utility and end a boss encounter when the boss is defeated.

## G0 closure recovered in P1
The immutable179-file BEFORE run completed at2026-11-07T16:00:26.924Z. The coordinator and its children exited normally; no stale timing lock remained. Full165-cell/8250-route OFF digest47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Economy90accounts×45days: heavy/casual paid draws1.00×, fish1.8083×, threads1.9178×, stamps1.00×, essence2.1948×; all≤3×. Detailed receipts in g0/before.json, economy.json, saturation.json, close-series.json. Historical G0 small samples are retained honestly; v4 acceptance requires500/cell.
