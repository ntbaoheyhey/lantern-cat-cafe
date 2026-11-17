# V5 Audio Quality Gate Scores (AG4)

Evaluation Criteria (1-5 scale, all must be >= 4 to pass):
- **S1**: Clear Transient (sharp attack snap, distinct impact instant at 0ms)
- **S2**: Body Weight Fits Hit (adequate low/mid energy 60-250 Hz for strike mass)
- **S3**: Tail Fits VFX Length (appropriate decay duration, spatial resonance, no premature cut)
- **S4**: Theme Fit (character motifs: cosy cats, fabric, bakery, ember, herbal garden)
- **S5**: Level Matches Set (+/- 2 LU from target -18.0 LUFS, true peak <= -1.0 dBTP)

## U0 Calibration
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `calibration-impact` | 5 | 5 | 4 | 4 | 5 | 4 | PASS | -19.6 LUFS, -1.7 dBTP, 2.7 KB |

## U1 Hero Skills
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `hero.mochi.basic` | 4 | 5 | 5 | 5 | 4 | 4 | PASS | Soft cloth whoosh + plush thud, -19.2 LUFS |
| `hero.mochi.skill` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Fabric whip + deep cushion thump, -18.3 LUFS |
| `hero.mochi.ultimate` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Billowing cloth into heavy plush drop, -17.6 LUFS |
| `hero.soot.basic` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Sharp ember snap + flame puff, -18.5 LUFS |
| `hero.soot.skill` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Double crackle burst + spark combustion, -17.8 LUFS |
| `hero.soot.ultimate` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Hiss build-up -> explosive detonation, -18.1 LUFS |
| `hero.clover.basic` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Crystal chime + light leaf rustle, -17.5 LUFS |
| `hero.clover.skill` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Melodic healing chord + swirling breeze, -17.6 LUFS |
| `hero.clover.ultimate` | 5 | 5 | 5 | 5 | 4 | 4 | PASS | Radiant chime burst + forest aura, -16.7 LUFS |
| `hero.panko.basic` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Crisp toast bite + butter squish, -18.2 LUFS |
| `hero.panko.skill` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Crust fracture + buttery skillet sizzle, -17.5 LUFS |
| `hero.panko.ultimate` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Grinding crust -> oven slam + butter spray, -17.6 LUFS |

All current cues score >= 4 across all 5 dimensions (Quality Gate Passed).


## U3 Enemy, Boss & UI Set
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `enemy.hit.light` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Quick snap + subtle flinch, -19.5 LUFS |
| `enemy.hit.medium` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Punchy knock + resonant tail, -18.3 LUFS |
| `enemy.hit.heavy` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Deep hollow thud + crunch stagger, -18.5 LUFS |
| `enemy.death.small` | 4 | 5 | 5 | 5 | 5 | 4 | PASS | Deflating whoosh + soft dissolve crumble, -18.2 LUFS |
| `enemy.death.boss` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Dramatic crystal shatter + descending sub boom, -17.7 LUFS |
| `boss.yarn-giant.ultimate` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Yarn tension swell -> colossal wool earthquake slam, -17.1 LUFS |
| `ui.receipt.confirmed` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Soft celestial confirmation chime (G5, B5, D6, G6), -17.7 LUFS |

## R1 Variations
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `hero.mochi.basic.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | High snap variation (+3%), -18.8 LUFS, -2.9 dBTP |
| `hero.mochi.basic.var2` | 4 | 5 | 5 | 5 | 4 | 4 | PASS | Deep plush thud (-3%), -19.3 LUFS, -2.3 dBTP |
| `hero.mochi.skill.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Bright fabric whip (+3%), -18.9 LUFS, -2.6 dBTP |
| `hero.mochi.skill.var2` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Heavier cushion impact (-3%), -18.7 LUFS, -1.9 dBTP |
| `hero.soot.basic.var1` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Crisp high ember pop (+3%), -19.1 LUFS, -1.7 dBTP |
| `hero.soot.basic.var2` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Low smoky pop (-3%), -18.2 LUFS, -1.6 dBTP |
| `hero.soot.skill.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Dense spark crackle (+3%), -17.2 LUFS, -1.7 dBTP |
| `hero.soot.skill.var2` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Warm combustion burst (-3%), -17.0 LUFS, -2.1 dBTP |
| `hero.clover.basic.var1` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Higher crystal shimmer (+3%), -17.3 LUFS, -1.2 dBTP |
| `hero.clover.basic.var2` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Warm resonant chime (-3%), -17.1 LUFS, -1.3 dBTP |
| `hero.clover.skill.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Bright healing chime cascade (+3%), -16.7 LUFS, -2.1 dBTP |
| `hero.clover.skill.var2` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Deep soothing aura chord (-3%), -16.5 LUFS, -2.1 dBTP |
| `hero.panko.basic.var1` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Crisp crust snap (+3%), -19.4 LUFS, -2.5 dBTP |
| `hero.panko.basic.var2` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Low buttery crunch (-3%), -19.7 LUFS, -2.1 dBTP |
| `hero.panko.skill.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Sizzling butter fracture (+3%), -17.7 LUFS, -2.0 dBTP |
| `hero.panko.skill.var2` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Rich skillet crunch (-3%), -17.6 LUFS, -2.1 dBTP |
| `enemy.hit.light.var1` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Sharp slap tick (+3%), -19.4 LUFS, -3.1 dBTP |
| `enemy.hit.light.var2` | 5 | 4 | 5 | 5 | 4 | 4 | PASS | Muffled tick (-3%), -20.2 LUFS, -2.8 dBTP |
| `enemy.hit.medium.var1` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Mid-frequency punch knock (+3%), -18.1 LUFS, -2.0 dBTP |
| `enemy.hit.medium.var2` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Deep wooden knock (-3%), -17.7 LUFS, -2.2 dBTP |

## 144 Ranged Impact Variants (Per-Element Cuts)
| Cue Set | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `ranged.ember.impact` (36 variants) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Cut from v4-ranged-ember.webm, exact durations 0.64-1.03s |
| `ranged.heavy.impact` (36 variants) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Cut from v4-ranged-heavy.webm, exact durations 0.82-1.16s |
| `ranged.shadow.impact` (36 variants) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Cut from v4-ranged-shadow.webm, exact durations 0.73-0.88s |
| `ranged.tide.impact` (36 variants) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Cut from v4-ranged-tide.webm, exact durations 0.44-0.74s |

## Cat Voice Hit & Death Slices (16 Cues)
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `voice.mochi.hit` (2 takes) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Plush cat yelp, -17.5 LUFS avg, 1.51-1.55s |
| `voice.mochi.death` (2 takes) | 4 | 5 | 5 | 5 | 5 | 4 | PASS | Soft deflating mew, -18.2 LUFS avg, 1.27-1.30s |
| `voice.soot.hit` (2 takes) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Feisty kitten hiss-yelp, -17.8 LUFS avg, 0.93-0.95s |
| `voice.soot.death` (2 takes) | 4 | 5 | 5 | 5 | 5 | 4 | PASS | Ember sigh mew, -18.0 LUFS avg, 1.13-1.16s |
| `voice.clover.hit` (2 takes) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Gentle bell-toned yelp, -17.2 LUFS avg, 1.59-1.63s |
| `voice.clover.death` (2 takes) | 4 | 5 | 5 | 5 | 5 | 4 | PASS | Soft fluttering purr-mew, -18.5 LUFS avg, 1.59-1.63s |
| `voice.panko.hit` (2 takes) | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Crumbly surprised squeak, -17.6 LUFS avg, 1.21-1.24s |
| `voice.panko.death` (2 takes) | 4 | 5 | 5 | 5 | 5 | 4 | PASS | Sleepy breadloaf mew, -18.1 LUFS avg, 1.45-1.48s |

## R2 Ambience Loops
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `ambience.workshop.cosy` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Warm C-major pad + purr + chime, -21.6 LUFS, 86.9 KB |
| `ambience.battle.bed` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | D-minor tension + 60 BPM pulse, -22.0 LUFS, 64.4 KB |

## R3 Full UI Set
| Cue ID | S1 | S2 | S3 | S4 | S5 | Min | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `ui.click` | 5 | 5 | 5 | 5 | 4 | 4 | PASS | Crisp tactile wooden switch click, -19.3 LUFS, 1.3 KB |
| `ui.hover` | 5 | 4 | 5 | 5 | 5 | 4 | PASS | Soft airy tick flutter, -19.1 LUFS, 1.1 KB |
| `ui.confirm` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Affirmative major-third chime, -17.5 LUFS, 2.1 KB |
| `ui.cancel` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Soft descending warm rejection, -17.0 LUFS, 2.6 KB |
| `ui.card_flip` | 5 | 5 | 5 | 5 | 4 | 4 | PASS | Parchment card slide + edge snap, -19.6 LUFS, 3.0 KB |
| `ui.coin` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Sparkling high metallic bell ring, -16.6 LUFS, 3.1 KB |
| `ui.error` | 5 | 5 | 5 | 5 | 5 | 5 | PASS | Soft muted low dissonant thud, -18.4 LUFS, 3.1 KB |
