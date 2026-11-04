# Gameplay research — Cat Café Quest
2026-11-04 · Original art only · Candidate build, not live. One author; no player-retention claim.

## Evidence and principles
The baseline is #278, f8837d6. The full wall-clock guest run is being recorded in `before-run.json`; its completed metrics will be inserted before delivery. Seeded fixtures are used separately for screenshots, never as evidence of first-session pacing. An initial harness failure exposed an extra class confirmation and is retained in `logs/before-run-failed.log`.

| ID | Source (text study only) | Finding and application |
|---|---|---|
| R1 | [Pecorella, The Math of Idle Games](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i) | Production and cost growth create changing upgrade breakpoints. Simulate progression and evaluate time-to-afford; do not multiply rewards to hide a wall. |
| R2 | [NN/g, Onboarding Tutorials vs Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/) | Out-of-context instruction must be remembered. Use three optional contextual prompts: watch Mochi, inspect/equip, challenge the boss. |
| R3 | [NN/g, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Show primary attributes before detail. Put three key stats and before/after deltas above secondary bonus lines. |
| R4 | [Game Accessibility Guidelines, fixed colour](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/) | Colour needs redundant text/shape. Add rarity symbols, directional comparison arrows and labelled danger cues. |
| R5 | [Riot, Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/) | Silhouette communicates identity, facing and threat; effects must match events. Household bosses need readable windups and a ground marker; replay data remains authoritative. No art copied. |
| R6 | [SLYNYRD, Attack Animation](https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation) | Separate anticipation, strike and recovery; put smear energy on the strike. Keep integer pixel scale and equipment attachment points. No source art downloaded. |
| R7 | [Berbece, Game Feel](https://www.gdcvault.com/play/1022759/Game-Feel-Why-Your-Death) | Abstract describes responsiveness through coordinated animation/particles. Use small bounded impact layers and a readable settle; the full video was not watched. |
| R8 | [Meier, Interesting Decisions](https://www.gdcvault.com/play/1015756/Do-Say-The-Right-Thing) | Choices need situational trade-offs. Show an offence and a survival lens, and state what a recommendation measures. |
| R9 | [SLYNYRD, Colour Palettes](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes) | Limited hue-shifted ramps improve material separation. Extend our own Evening Atelier palette, upper-left light and readable clusters. |
| R10 | [W3C, Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Nonessential motion should be suppressible. Reduced motion keeps results static; hidden tabs stop cosmetic clocks. |

Sources establish principles, not universal numerical retention targets. The brief's 30-second reward, two-minute choice and five-minute boss are product hypotheses to measure. A short/medium/long goal ladder is our design synthesis: current actionable upgrade, chapter boss, next room/Relic. Variable rewards add surprise but cannot replace legible progress. Show actual odds; do not invent a pity timer. Offline catch-up must use the existing cap/efficiency, without suggesting active-rate rewards during the whole absence. No audio is needed to convey telegraphs; optional sound is deferred.

## Ranked problems and intervention
Impact is 1–5 (5 highest); effort S/M/L. Ranking combines expected fun/first impression and cost, not a validated retention model.

| Rank | Verified problem / evidence | Impact / effort | Response |
|---:|---|---|---|
| 1 | Initial five-step modal blocks class screen and discusses wallet minting before combat. | 5 / S | Nonblocking three-step coach; forever dismiss; explicit Help still available (R2). |
| 2 | Start adventure opens another class confirmation; no new information for first choice. | 4 / S | Direct start only for first class; retain confirmation for later switches (R2). |
| 3 | Home goal treats a gated/finished round as boss readiness. | 5 / S | Use exact chapter gate and a three-horizon goal ladder (R1,R5). |
| 4 | First authoritative feedback waits for the 30-second timer. | 5 / M | One early claim after first class, within existing server minimum/budget; normal cadence retained (R1,R7). |
| 5 | Portrait and equipment-aware actor use different visual ramps and face treatment. | 5 / M | Warm outlined Mochi, coherent palette, expressive idle and attack poses (R6,R9). |
| 6 | Boss danger is a floating number in the damage lane; no stable ground cue. | 5 / M | Telegraph marker, named read-only phases, honest auto-dodge explanation (R4,R5). |
| 7 | Gear has a single aggregate recommendation that hides HP/ATK trade-offs. | 4 / M | Offence/survival summaries with actual derived-stat deltas (R3,R8). |
| 8 | Rarity is heavily encoded by colour; small icons have similar value masses. | 4 / M | Distinct slot silhouettes, shape badge, consistent frame/light (R4,R9). |
| 9 | Craft result does not celebrate a high bonus roll distinctly; rarity is already guaranteed. | 4 / S | A transparent high-roll quality score based on actual ranges; never claim a rarity upgrade (R3,R7). |
| 10 | Boss art/chapter creatures retain older palettes and weak idle personality. | 4 / L | Original contour/material upgrades, expressions, generated sheets (R5,R6,R9). |
| 11 | Particle and timing limits are scattered in renderers. | 3 / M | Shared config budget, bounded allocation, reduced/hidden checks (R7,R10). |
| 12 | Relic detail and inventory secondary actions compete with the main decision. | 3 / M | Larger collectible, provenance, stat hierarchy and clear ordinary-gear market restriction (R3,R4). |

Economy constraints: V2 claim, drop and boss outcomes are calculated by the same rules used server-side. Craft rarity is guaranteed; only bonus stats/values roll. There is no craft pity or great-success mechanic. A visual “great roll” must mean an explicitly defined quality threshold, with no new reward. New interactive boss mechanics that alter damage are a separate default-OFF Sample; default replay must remain identical. Cosmetic combo/mouse cues grant zero currency and cannot be farmed.

Backlog under the five-hour limit: human first-session research, bespoke enemy mechanics requiring server verification, new item taxonomy/economy, original audio, broader hardware/OS power tests. Do not mark these delivered from static mockups.
