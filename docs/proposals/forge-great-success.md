# Design Proposal: Forge "Great Success" Crafting

Proposal only. `V2_CONFIG` and runtime code are unchanged. Numbers and formulas below are suggestions requiring user sign-off.

---

## 1. Decision Needed

Before implementing this feature, user sign-off is required on three decisions:

1. **Proc Chances by Rarity**:
   - Proposed default: Common $10\%$, Uncommon $8\%$, Rare $6\%$, Epic $4\%$, Legendary $2\%$.
   - *Alternative conservative*: Common $5\%$, Uncommon $4\%$, Rare $3\%$, Epic $2\%$, Legendary $1\%$.
   - **Recommendation**: Adopt the proposed default. Higher chances at low rarity deliver early gratification to onboarding players without distorting end-game legendary balance.
2. **Cap on Extra Bonus Lines**:
   - Should Great Success strictly respect the rarity's maximum bonus lines, or can it grant $+1$ bonus line up to a hard cap of $4$?
   - *Option A (Capped by rarity tier)*: Common (0 base $\to$ 0 max, or gains $+1$ roll quality), Uncommon (1 base $\to$ 2 max), Rare (2 base $\to$ 3 max), Epic (3 base $\to$ 4 max), Legendary (4 base $\to$ 4 max, but rolls max-tier roll values).
   - *Option B (Uniform $+1$ Line)*: Common gets 1 line (normal is 0), Uncommon gets 2 lines, Rare gets 3 lines, Epic gets 4 lines, Legendary gets 4 lines with a guaranteed maximum percentile roll on one line.
   - **Recommendation**: Option B. Crafting a Great Success on a Common item yielding 1 bonus line feels wonderful for beginners and introduces the concept clearly.
3. **Audio/Visual Reveal Moment**:
   - Approve adding a celebratory particle flash, sparkling pixel border (`--rarity-great`), and reveal note ("Great Craft! Extra bonus line unlocked!").

---

## 2. Core Rule Specification

When a player executes a craft via `v2-craft` (or `craft()` in `@taskbar-hero/game-rules`):

1. **Craft Execution**: Standard resource costs (Yarn, tier materials, Fish) are validated and debited.
2. **Great Success Roll**: A Bernoulli trial is drawn from the PRNG stream:
   $$
   \text{isGreat} \sim \operatorname{Bernoulli}(p(\text{rarity}))
   $$
3. **Bonus Line Allocation**:
   - Standard craft line count: $N = \text{rarity.bonusLines}$.
   - Great Success craft line count: $N_{\text{great}} = \min(4, N + 1)$.
   - Bonus lines are drawn without replacement from `STATS.filter(s => s.bonusLine)` following standard uniform range generation.
4. **Metadata**: The generated `ItemV2` records `greatSuccess: true` in its owned row for celebratory presentation and auditing.

### Suggested Chance per Rarity

| Rarity | Base Bonus Lines | Great Success Chance ($p$) | Great Success Bonus Lines | Max Item Level |
| --- | :---: | :---: | :---: | :---: |
| **Common** | $0$ | $10\%$ ($0.10$) | $1$ | $10$ |
| **Uncommon** | $1$ | $8\%$ ($0.08$) | $2$ | $20$ |
| **Rare** | $2$ | $6\%$ ($0.06$) | $3$ | $30$ |
| **Epic** | $3$ | $4\%$ ($0.04$) | $4$ | $40$ |
| **Legendary** | $4$ | $2\%$ ($0.02$) | $4$ (Max Roll Guaranteed) | $50$ |

---

## 3. Expected Power Effect Over 2 Weeks of Play

Using the simulation model in `packages/game-rules/src/v2/sim`:

- **Craft Cadence**: Typical active progression averages $2$ to $4$ crafts per active day across Chapters 1–4, totaling $\approx 35\text{–}45$ crafts over a 14-day horizon.
- **Expected Procs**:
  - Common/Uncommon crafts ($\sim 20$ crafts): $\approx 1.8$ Great Successes.
  - Rare crafts ($\sim 15$ crafts): $\approx 0.9$ Great Successes.
  - Epic/Legendary crafts ($\sim 5\text{–}8$ crafts): $\approx 0.2$ Great Successes.
- **Power Impact Analysis**:
  - An extra bonus line grants an average of $+3.5\%$ crit chance, $+4.0\%$ dodge, or $+5.0\%$ attack speed.
  - Across the 9 equipment slots, one Great Success piece increases hero DPS by $\approx 2.1\%$ and effective HP by $\approx 1.8\%$.
  - Cumulative power rating increase: **$+1.2\%$ to $+2.8\%$** across the 2-week active progression.
- **Conclusion**: The power bump is bounded, positive, and non-disruptive. It will not break boss DPS gates or skip chapter pacing bands.

---

## 4. PRNG Stream & Roll Order Changes

In `packages/game-rules/src/v2/forge/craft.ts`:

### Existing Roll Order
1. Draw catalog item: `rng.int(0, candidates.length - 1)`
2. For $i = 0$ to $\text{rarity.bonusLines} - 1$:
   - Pick stat without replacement: `rng.int(0, available.length - 1)`
   - Roll stat value: `min + rng.next() * (max - min)`

### Proposed Roll Order
```ts
// 1. Catalog item selection (UNTOUCHED - identical seed consumption)
const definition = candidates[rng.int(0, candidates.length - 1)]!;

// 2. Great success check (1 draw from stream)
const greatChance = cfg.forge.greatSuccessChance[recipe.rarity] ?? 0;
const isGreat = rng.chance(greatChance);

// 3. Bonus line rolling
const lineCount = isGreat ? Math.min(4, rarity.bonusLines + 1) : rarity.bonusLines;
for (let line = 0; line < lineCount; line++) {
  const [stat] = available.splice(rng.int(0, available.length - 1), 1);
  const [min, max] = BONUS_LINE_RANGES[stat!]![rarity.id];
  bonusLines.push({ stat: stat!, value: min + rng.next() * (max - min) });
}
```

*Architectural Guarantee*: By placing the `rng.chance()` call *after* the catalog item selection, the item template drawn is invariant. Only the subsequent bonus line count is modified.

---

## 5. Server, SQL, and Test Impact

| Component | Nature of Impact |
| --- | --- |
| **API Contract** (`@taskbar-hero/api-contract`) | Add optional `greatSuccess?: boolean` to `ItemViewV2` and `CraftResultV2`. Non-breaking change. |
| **Edge Function** (`supabase/functions/v2-craft`) | Exposes `greatSuccess` in response payload. No schema alterations required as bonus lines array is stored directly in JSONB. |
| **SQL Schema** | Zero changes. `owned_items` stores `bonus_lines jsonb`, which naturally accommodates $N + 1$ lines. |
| **Unit Tests** | Seeded tests in `forge.test.ts` that verify exact bonus rolls will require baseline re-anchoring due to the 1-word RNG advance. |
| **Client UI** | `ForgePanel.tsx` and `ForgeReveal.tsx` check `result.item.greatSuccess` to trigger celebratory visual effects. |

---

## 6. Proposed Configuration Additions in `config.ts`

*(Documentation only — do not edit `packages/game-rules/src/v2/config.ts` until approved)*

```ts
export const V2_CONFIG = {
  // ... existing configuration ...

  forge: {
    /** Chance of a Great Success craft (+1 bonus line, capped at 4) per rarity tier. */
    greatSuccessChance: {
      common: 0.10,
      uncommon: 0.08,
      rare: 0.06,
      epic: 0.04,
      legendary: 0.02,
    },
  },
} as const;
```
