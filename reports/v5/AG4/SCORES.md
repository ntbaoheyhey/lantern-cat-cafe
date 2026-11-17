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
