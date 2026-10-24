# Cat RPG v2 chest drop rates

Generated from chestDropRateRows() using the V1 CHESTS registry and the V4 expectedCounts engine. Do not hand-edit the tables. The exact generation command and its pasted output are in reports/v4b-lootcheck.md.

Chance means the probability of receiving at least one of that reward in one chest. Mean means the expected quantity per chest, including chests where the reward does not drop. Fish and materials are currency/stack amounts; gear means item counts. Figures are rounded to four decimal places only for display.

Gear rarity chances are unconditional per chest, including the chance that its gear group drops. Within each group V4 normalizes the actual rarity weights: first-clear totals are 100, 98, 96, 94, and 92 for chapters 1–5, respectively. Repeat weights sum to 100 in every chapter. Group totals and All gear items overlap their rarity rows and must not be added to them.

Fish rewards use FISH_UNIT = 10. Chapter 1 first-clear chests guarantee 300–500 Fish (30–50 units) and 15–25 Yarn, with means of 400 Fish and 20 Yarn. Fish and base-material quantities grow with CHEST_SCALING.amountGrowth = 2. Catnip Crystal and Starlight Scale lines use their own fixed counts.

Both first-clear and repeat chest IDs below are boss chests, as linked by CHAPTERS. Moon Pearl has a 100% first-clear chance and a 30% repeat chance; helper gear tables do not award it. Cat Key is absent from all chest tables.

Findings for V1/V6: gear item quantities do not grow by chapter: first-clear means stay at 1 main + 0.5 accessory = 1.5 items, and repeat means at 0.7 main + 0.25 accessory = 0.95 items. Rarity-weighted stat-multiplier value does increase, but that is not an increasing item count. Content was left unchanged.

## Chapter 1 — Living Room

First-clear: chest.ch1.first. Repeat: chest.ch1.repeat.

| Reward | First-clear chance | First-clear mean | Repeat chance | Repeat mean |
| --- | ---: | ---: | ---: | ---: |
| Fish | 100% | 400 | 100% | 160 |
| Yarn | 100% | 20 | 100% | 8 |
| Fluff Tuft | 100% | 6.5 | 100% | 3 |
| Shiny Button | 40% | 0.6 | 20% | 0.2 |
| Catnip Crystal | 0% | 0 | 0% | 0 |
| Starlight Scale | 0% | 0 | 0% | 0 |
| Moon Pearl | 100% | 1 | 30% | 0.3 |
| Cat Key | 0% | 0 | 0% | 0 |
| main gear (all rarities) | 100% | 1 | 70% | 0.7 |
| main gear: common | 0% | 0 | 28% | 0.28 |
| main gear: uncommon | 60% | 0.6 | 24.5% | 0.245 |
| main gear: rare | 30% | 0.3 | 12.6% | 0.126 |
| main gear: epic | 9% | 0.09 | 4.2% | 0.042 |
| main gear: legendary | 1% | 0.01 | 0.7% | 0.007 |
| accessory gear (all rarities) | 50% | 0.5 | 25% | 0.25 |
| accessory gear: common | 0% | 0 | 10% | 0.1 |
| accessory gear: uncommon | 30% | 0.3 | 8.75% | 0.0875 |
| accessory gear: rare | 15% | 0.15 | 4.5% | 0.045 |
| accessory gear: epic | 4.5% | 0.045 | 1.5% | 0.015 |
| accessory gear: legendary | 0.5% | 0.005 | 0.25% | 0.0025 |
| All gear items | 100% | 1.5 | 77.5% | 0.95 |

## Chapter 2 — Kitchen

First-clear: chest.ch2.first. Repeat: chest.ch2.repeat.

| Reward | First-clear chance | First-clear mean | Repeat chance | Repeat mean |
| --- | ---: | ---: | ---: | ---: |
| Fish | 100% | 800 | 100% | 320 |
| Yarn | 100% | 40 | 100% | 16 |
| Fluff Tuft | 100% | 13 | 100% | 6 |
| Shiny Button | 40% | 1.2 | 20% | 0.4 |
| Catnip Crystal | 50% | 0.75 | 25% | 0.25 |
| Starlight Scale | 0% | 0 | 0% | 0 |
| Moon Pearl | 100% | 1 | 30% | 0.3 |
| Cat Key | 0% | 0 | 0% | 0 |
| main gear (all rarities) | 100% | 1 | 70% | 0.7 |
| main gear: common | 0% | 0 | 22.4% | 0.224 |
| main gear: uncommon | 51.0204% | 0.5102 | 24.5% | 0.245 |
| main gear: rare | 30.6122% | 0.3061 | 14.7% | 0.147 |
| main gear: epic | 15.3061% | 0.1531 | 7% | 0.07 |
| main gear: legendary | 3.0612% | 0.0306 | 1.4% | 0.014 |
| accessory gear (all rarities) | 50% | 0.5 | 25% | 0.25 |
| accessory gear: common | 0% | 0 | 8% | 0.08 |
| accessory gear: uncommon | 25.5102% | 0.2551 | 8.75% | 0.0875 |
| accessory gear: rare | 15.3061% | 0.1531 | 5.25% | 0.0525 |
| accessory gear: epic | 7.6531% | 0.0765 | 2.5% | 0.025 |
| accessory gear: legendary | 1.5306% | 0.0153 | 0.5% | 0.005 |
| All gear items | 100% | 1.5 | 77.5% | 0.95 |

## Chapter 3 — Bathroom

First-clear: chest.ch3.first. Repeat: chest.ch3.repeat.

| Reward | First-clear chance | First-clear mean | Repeat chance | Repeat mean |
| --- | ---: | ---: | ---: | ---: |
| Fish | 100% | 1600 | 100% | 640 |
| Yarn | 100% | 80 | 100% | 32 |
| Fluff Tuft | 100% | 26 | 100% | 12 |
| Shiny Button | 40% | 2.4 | 20% | 0.8 |
| Catnip Crystal | 50% | 0.75 | 25% | 0.25 |
| Starlight Scale | 40% | 0.4 | 15% | 0.15 |
| Moon Pearl | 100% | 1 | 30% | 0.3 |
| Cat Key | 0% | 0 | 0% | 0 |
| main gear (all rarities) | 100% | 1 | 70% | 0.7 |
| main gear: common | 0% | 0 | 16.8% | 0.168 |
| main gear: uncommon | 41.6667% | 0.4167 | 24.5% | 0.245 |
| main gear: rare | 31.25% | 0.3125 | 16.8% | 0.168 |
| main gear: epic | 21.875% | 0.2188 | 9.8% | 0.098 |
| main gear: legendary | 5.2083% | 0.0521 | 2.1% | 0.021 |
| accessory gear (all rarities) | 50% | 0.5 | 25% | 0.25 |
| accessory gear: common | 0% | 0 | 6% | 0.06 |
| accessory gear: uncommon | 20.8333% | 0.2083 | 8.75% | 0.0875 |
| accessory gear: rare | 15.625% | 0.1563 | 6% | 0.06 |
| accessory gear: epic | 10.9375% | 0.1094 | 3.5% | 0.035 |
| accessory gear: legendary | 2.6042% | 0.026 | 0.75% | 0.0075 |
| All gear items | 100% | 1.5 | 77.5% | 0.95 |

## Chapter 4 — Basement

First-clear: chest.ch4.first. Repeat: chest.ch4.repeat.

| Reward | First-clear chance | First-clear mean | Repeat chance | Repeat mean |
| --- | ---: | ---: | ---: | ---: |
| Fish | 100% | 3200 | 100% | 1280 |
| Yarn | 100% | 160 | 100% | 64 |
| Fluff Tuft | 100% | 52 | 100% | 24 |
| Shiny Button | 40% | 4.8 | 20% | 1.6 |
| Catnip Crystal | 50% | 0.75 | 25% | 0.25 |
| Starlight Scale | 40% | 0.4 | 15% | 0.15 |
| Moon Pearl | 100% | 1 | 30% | 0.3 |
| Cat Key | 0% | 0 | 0% | 0 |
| main gear (all rarities) | 100% | 1 | 70% | 0.7 |
| main gear: common | 0% | 0 | 11.2% | 0.112 |
| main gear: uncommon | 31.9149% | 0.3191 | 24.5% | 0.245 |
| main gear: rare | 31.9149% | 0.3191 | 18.9% | 0.189 |
| main gear: epic | 28.7234% | 0.2872 | 12.6% | 0.126 |
| main gear: legendary | 7.4468% | 0.0745 | 2.8% | 0.028 |
| accessory gear (all rarities) | 50% | 0.5 | 25% | 0.25 |
| accessory gear: common | 0% | 0 | 4% | 0.04 |
| accessory gear: uncommon | 15.9574% | 0.1596 | 8.75% | 0.0875 |
| accessory gear: rare | 15.9574% | 0.1596 | 6.75% | 0.0675 |
| accessory gear: epic | 14.3617% | 0.1436 | 4.5% | 0.045 |
| accessory gear: legendary | 3.7234% | 0.0372 | 1% | 0.01 |
| All gear items | 100% | 1.5 | 77.5% | 0.95 |

## Chapter 5 — Night Rooftops

First-clear: chest.ch5.first. Repeat: chest.ch5.repeat.

| Reward | First-clear chance | First-clear mean | Repeat chance | Repeat mean |
| --- | ---: | ---: | ---: | ---: |
| Fish | 100% | 6400 | 100% | 2560 |
| Yarn | 100% | 320 | 100% | 128 |
| Fluff Tuft | 100% | 104 | 100% | 48 |
| Shiny Button | 40% | 9.6 | 20% | 3.2 |
| Catnip Crystal | 50% | 0.75 | 25% | 0.25 |
| Starlight Scale | 40% | 0.4 | 15% | 0.15 |
| Moon Pearl | 100% | 1 | 30% | 0.3 |
| Cat Key | 0% | 0 | 0% | 0 |
| main gear (all rarities) | 100% | 1 | 70% | 0.7 |
| main gear: common | 0% | 0 | 5.6% | 0.056 |
| main gear: uncommon | 21.7391% | 0.2174 | 24.5% | 0.245 |
| main gear: rare | 32.6087% | 0.3261 | 21% | 0.21 |
| main gear: epic | 35.8696% | 0.3587 | 15.4% | 0.154 |
| main gear: legendary | 9.7826% | 0.0978 | 3.5% | 0.035 |
| accessory gear (all rarities) | 50% | 0.5 | 25% | 0.25 |
| accessory gear: common | 0% | 0 | 2% | 0.02 |
| accessory gear: uncommon | 10.8696% | 0.1087 | 8.75% | 0.0875 |
| accessory gear: rare | 16.3043% | 0.163 | 7.5% | 0.075 |
| accessory gear: epic | 17.9348% | 0.1793 | 5.5% | 0.055 |
| accessory gear: legendary | 4.8913% | 0.0489 | 1.25% | 0.0125 |
| All gear items | 100% | 1.5 | 77.5% | 0.95 |
