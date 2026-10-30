# Design Proposal: Stepped Bonus-Line Values

Proposal only. `V2_CONFIG` and runtime code are unchanged. Numbers and formulas below are suggestions requiring user sign-off.

---

## 1. Decision Needed

Before implementing stepped bonus lines, user sign-off is required on three specific design choices:

1. **Step Granularity per Stat Category**:
   - *Combat percentages (`critChance`, `dodge`)*: Should steps be $0.5\%$ (coarser, instant readability) or $0.25\%$ (finer gradation)?
   - *Multiplier percentages (`critDamage`, `attackSpeed`)*: Proposed $1.0\%$ for crit damage, $0.5\%$ for attack speed.
   - *Regen percentage (`hpRegen`)*: Proposed $0.05\%$ ($0.0005$) per tick.
   - *Utility percentages (`fishBonus`, `xpBonus`, `materialFind`, `bossDamage`)*: Proposed $0.5\%$ ($0.005$).
   - **Recommendation**: Adopt the proposed steps in Section 3. They align cleanly with interval endpoints, ensuring zero mean drift while eliminating messy floating-point numbers like $+3.74129\%$.
2. **RNG Integer Generation Method**:
   - *Option A*: Draw integer step $k \in \{0, \dots, K\}$ via `rng.int(0, K)`.
   - *Option B*: Draw uniform float $u \in [0, 1)$, compute $k = \operatorname{round}(u \cdot K)$.
   - **Recommendation**: Option A. `rng.int(0, K)` uses rejection sampling over discrete integers, guaranteeing perfectly uniform probability across all $K + 1$ discrete tiers.
3. **Migration Policy**:
   - Approve the "Preserve Existing" policy: legacy items in database keep their exact floating-point values without migration rewrites. Only newly crafted, dropped, or chest-rolled items use discrete steps.

---

## 2. Core Rule Specification

Today, bonus lines are rolled as continuous uniform floats in `packages/game-rules/src/v2/content/stats.ts`:
$$
\text{value}_{\text{current}} = \min + \text{rng.next}() \times (\max - \min)
$$

### Proposed Discrete Stepping Formula
For a given stat and gear rarity, let $[\min, \max]$ be the current defined roll range, and let $\text{step}$ be the approved step size:
$$
K = \frac{\max - \min}{\text{step}}
$$
where $K \in \mathbb{N}$ is the number of steps in the interval.

The rolled value is determined by:
$$
k \sim \operatorname{Uniform}\{0, 1, \dots, K\}
$$
$$
\text{value} = \min + k \times \text{step}
$$

Because $K \times \text{step} = \max - \min$, the rolled value is strictly bounded:
$$
\min \le \text{value} \le \max
$$
with exactly $K + 1$ possible distinct values.

---

## 3. Table of Suggested Steps per Stat

All values are expressed as decimals (and percentages in parentheses). Every range width $(\max - \min)$ is an exact integer multiple of its step, so $K = (\max - \min)/\text{step}$ is an integer:

| Stat | Step Size | Common ($K$) | Uncommon ($K$) | Rare ($K$) | Epic ($K$) | Legendary ($K$) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`attackSpeed`** | $0.005$ ($0.5\%$) | $1.0\%\text{--}2.0\%$ ($2$) | $2.0\%\text{--}3.0\%$ ($2$) | $3.0\%\text{--}5.0\%$ ($4$) | $4.0\%\text{--}7.0\%$ ($6$) | $6.0\%\text{--}10.0\%$ ($8$) |
| **`critChance`** | $0.005$ ($0.5\%$) | $1.0\%\text{--}2.0\%$ ($2$) | $1.0\%\text{--}3.0\%$ ($4$) | $2.0\%\text{--}4.0\%$ ($4$) | $3.0\%\text{--}6.0\%$ ($6$) | $5.0\%\text{--}8.0\%$ ($6$) |
| **`critDamage`** | $0.010$ ($1.0\%$) | $3.0\%\text{--}5.0\%$ ($2$) | $5.0\%\text{--}8.0\%$ ($3$) | $8.0\%\text{--}12.0\%$ ($4$) | $12.0\%\text{--}18.0\%$ ($6$) | $18.0\%\text{--}25.0\%$ ($7$) |
| **`dodge`** | $0.0025$ ($0.25\%$) | $0.5\%\text{--}1.0\%$ ($2$) | $1.0\%\text{--}1.5\%$ ($2$) | $1.0\%\text{--}2.0\%$ ($4$) | $2.0\%\text{--}3.0\%$ ($4$) | $3.0\%\text{--}4.0\%$ ($4$) |
| **`hpRegen`** | $0.0005$ ($0.05\%$) | $0.1\%\text{--}0.2\%$ ($2$) | $0.2\%\text{--}0.3\%$ ($2$) | $0.3\%\text{--}0.4\%$ ($2$) | $0.4\%\text{--}0.6\%$ ($4$) | $0.6\%\text{--}0.8\%$ ($4$) |
| **`fishBonus`** | $0.005$ ($0.5\%$) | $2.0\%\text{--}4.0\%$ ($4$) | $3.0\%\text{--}6.0\%$ ($6$) | $5.0\%\text{--}8.0\%$ ($6$) | $7.0\%\text{--}11.0\%$ ($8$) | $10.0\%\text{--}15.0\%$ ($10$) |
| **`xpBonus`** | $0.005$ ($0.5\%$) | $2.0\%\text{--}4.0\%$ ($4$) | $3.0\%\text{--}6.0\%$ ($6$) | $5.0\%\text{--}8.0\%$ ($6$) | $7.0\%\text{--}11.0\%$ ($8$) | $10.0\%\text{--}15.0\%$ ($10$) |
| **`materialFind`** | $0.005$ ($0.5\%$) | $2.0\%\text{--}4.0\%$ ($4$) | $3.0\%\text{--}6.0\%$ ($6$) | $5.0\%\text{--}8.0\%$ ($6$) | $7.0\%\text{--}11.0\%$ ($8$) | $10.0\%\text{--}15.0\%$ ($10$) |
| **`bossDamage`** | $0.005$ ($0.5\%$) | $2.0\%\text{--}4.0\%$ ($4$) | $3.0\%\text{--}6.0\%$ ($6$) | $5.0\%\text{--}8.0\%$ ($6$) | $7.0\%\text{--}11.0\%$ ($8$) | $10.0\%\text{--}15.0\%$ ($10$) |

---

## 4. Effect on Average Values (Mean Preservation)

### Mathematical Proof of Invariance
For any continuous uniform distribution $U \sim [\min, \max]$, the expected value is:
$$
\mathbb{E}[U] = \frac{\min + \max}{2}
$$

For our discrete stepped roll, where $k \in \{0, 1, \dots, K\}$ with uniform probability $P(k) = \frac{1}{K + 1}$:
$$
\mathbb{E}[\text{value}] = \min + \mathbb{E}[k] \times \text{step}
$$
Because the discrete uniform distribution is symmetric around its midpoint:
$$
\mathbb{E}[k] = \frac{K}{2}
$$
Substituting $K = \frac{\max - \min}{\text{step}}$:
$$
\mathbb{E}[\text{value}] = \min + \frac{\max - \min}{2 \cdot \text{step}} \times \text{step} = \min + \frac{\max - \min}{2} = \frac{\min + \max}{2}
$$

Therefore:
$$
\mathbb{E}[\text{value}_{\text{stepped}}] \equiv \mathbb{E}[\text{value}_{\text{continuous}}]
$$
The theoretical mean drift is **$0.00\%$** across every stat and rarity, well within the $\le 1\%$ mission constraint.

### Mean Comparison Table (Selected Key Stats)

| Stat & Tier | Current Range | Continuous Mean | Stepped Values Possible | Stepped Mean | Absolute Drift | Relative Drift |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`critChance` (Uncommon)** | $[1.0\%, 3.0\%]$ | $2.000\%$ | $1.0\%, 1.5\%, 2.0\%, 2.5\%, 3.0\%$ | $2.000\%$ | $0.000\%$ | **$0.00\%$** |
| **`critChance` (Legendary)** | $[5.0\%, 8.0\%]$ | $6.500\%$ | $5.0\%, 5.5\%, 6.0\%, 6.5\%, 7.0\%, 7.5\%, 8.0\%$ | $6.500\%$ | $0.000\%$ | **$0.00\%$** |
| **`critDamage` (Rare)** | $[8.0\%, 12.0\%]$ | $10.000\%$ | $8\%, 9\%, 10\%, 11\%, 12\%$ | $10.000\%$ | $0.000\%$ | **$0.00\%$** |
| **`critDamage` (Legendary)** | $[18.0\%, 25.0\%]$ | $21.500\%$ | $18\%, 19\%, 20\%, 21\%, 22\%, 23\%, 24\%, 25\%$ | $21.500\%$ | $0.000\%$ | **$0.00\%$** |
| **`attackSpeed` (Epic)** | $[4.0\%, 7.0\%]$ | $5.500\%$ | $4.0\%, 4.5\%, 5.0\%, 5.5\%, 6.0\%, 6.5\%, 7.0\%$ | $5.500\%$ | $0.000\%$ | **$0.00\%$** |
| **`dodge` (Legendary)** | $[3.0\%, 4.0\%]$ | $3.500\%$ | $3.00\%, 3.25\%, 3.50\%, 3.75\%, 4.00\%$ | $3.500\%$ | $0.000\%$ | **$0.00\%$** |
| **`hpRegen` (Epic)** | $[0.4\%, 0.6\%]$ | $0.500\%$ | $0.40\%, 0.45\%, 0.50\%, 0.55\%, 0.60\%$ | $0.500\%$ | $0.000\%$ | **$0.00\%$** |
| **`bossDamage` (Epic)** | $[7.0\%, 11.0\%]$ | $9.000\%$ | $7.0\%, 7.5\%, 8.0\%, 8.5\%, 9.0\%, 9.5\%, 10.0\%, 10.5\%, 11.0\%$ | $9.000\%$ | $0.000\%$ | **$0.00\%$** |

---

## 5. Migration Policy (Existing Items)

1. **No Database Modification**:
   - Existing items in Postgres (`public.owned_items`) and browser `localStorage` contain `bonus_lines` stored as JSONB arrays, e.g. `[{"stat": "critChance", "value": 0.023471}]`.
   - **No backfill migration script or SQL rewrite is executed.**
2. **Runtime Backward Compatibility**:
   - `deriveStats` in `packages/game-rules/src/v2/combat/stats.ts` sums `line.value` directly into hero accumulators:
     ```ts
     for (const line of inst.bonusLines ?? []) add(line.stat, Math.max(0, finite(line.value)));
     ```
   - It functions identically whether `line.value` is stepped ($0.025$) or unstepped ($0.023471$).
3. **Player Perception**:
   - Existing gear keeps rolled power. No player loses stats or experiences phantom downgrades.
   - Newly crafted or found items display visually clean, satisfying increments in tooltips and item comparison panels.

---

## 6. Implementation Sketch (When Approved)

In `packages/game-rules/src/v2/content/stats.ts`:
```ts
export const BONUS_LINE_STEPS: Readonly<Record<StatId, number>> = {
  attackSpeed: 0.005,
  critChance: 0.005,
  critDamage: 0.010,
  dodge: 0.0025,
  hpRegen: 0.0005,
  fishBonus: 0.005,
  xpBonus: 0.005,
  materialFind: 0.005,
  bossDamage: 0.005,
};

export function rollBonusLineValue(stat: StatId, rarity: GearRarityId, rng: Rng): number {
  const [min, max] = BONUS_LINE_RANGES[stat]![rarity];
  const step = BONUS_LINE_STEPS[stat] ?? 0.005;
  const steps = Math.round((max - min) / step);
  const k = rng.int(0, steps);
  return Number((min + k * step).toFixed(6));
}
```
Replacing `min + rng.next() * (max - min)` across `craft.ts`, `drops.ts`, and `chest.ts`.
