import { v2 } from '@taskbar-hero/game-rules';
import type { ReactNode } from 'react';
import { keySources } from './boss/BossKeyHint';
export interface HelpTopic { id: string; title: string; content: ReactNode }
/** Existing guide content; values remain derived from live rule configuration. */
export function helpTopics(): HelpTopic[] {
  const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
  const catKeyName = catKeyDef?.name ?? 'Cat Key';
  const keyMaxStack = catKeyDef?.maxStack ?? 5;

  const yarnDef = v2.MATERIALS.find((m) => m.id === 'yarn');
  const yarnName = yarnDef?.name ?? 'Yarn';

  const moonPearlDef = v2.MATERIALS.find((m) => m.id === 'moonPearl');
  const moonPearlName = moonPearlDef?.name ?? 'Moon Pearl';

  const dailyKeys = v2.V2_CONFIG.idle.dailyKeys;
  const keyCost = v2.V2_CONFIG.boss.keyCost;
  const lossCooldownSeconds = v2.V2_CONFIG.boss.lossCooldownSeconds;
  const bagLimit = v2.V2_CONFIG.bag.limit;
  const firstClearKeys = ((v2.V2_CONFIG.boss as { firstClearKeys?: number }).firstClearKeys ?? 0);

  const keyLines = keySources().lines;

  const relicYarn = v2.RELIC_RECIPE.materials.yarn ?? 0;
  const relicMoonPearl = v2.RELIC_RECIPE.materials.moonPearl ?? 0;
  const relicPerDay = v2.RELIC_RECIPE.perDay;

  const recipeRarities = v2.RECIPES.map((r) => r.rarity.charAt(0).toUpperCase() + r.rarity.slice(1)).join(', ');

  return [
    { id: 'getting-started', title: 'Getting started', content: <>
        <h3>Getting started</h3>
        <p>
          Mochi the cat naps, wanders and fights on the stage while you work. Pick a class to begin;
          idle claims earn Fish, Yarn, XP and materials.
        </p>
      </> },
    { id: 'classes', title: 'Classes', content: <>
        <h3>Classes</h3>
        <ul className="help-v2-list">
          {v2.CLASSES.map((c) => {
            const trait =
              (c as { description?: string }).description ??
              (c as { trait?: string }).trait ??
              (c.passive as { description?: string }).description ??
              (c.passive as { trait?: string }).trait;
            return (
              <li key={c.id}>
                <strong>{c.name}</strong>: {c.weaponType}
                {trait ? ` — ${trait}` : ''}
              </li>
            );
          })}
        </ul>
      </> },
    { id: 'chapters', title: 'Chapters and rounds', content: <>
        <h3>Chapters and rounds</h3>
        <ol className="help-v2-list">
          {v2.CHAPTERS.map((ch) => (
            <li key={ch.id}>
              <strong>{ch.name}</strong>: {ch.roundsPerChapter} rounds of {ch.killsPerRound} monsters, boss at the last round.
            </li>
          ))}
        </ol>
        <dl className="help-v2-terms">
          <dt className="help-v2-term">Gated</dt>
          <dd className="help-v2-def">Being &quot;gated&quot; means the cat needs more power (upgrade gear).</dd>
        </dl>
      </> },
    { id: 'keys', title: 'Cat Keys and bosses', content: <>
        <h3>Cat Keys and bosses</h3>
        <p>
          You get {dailyKeys} {catKeyName}{dailyKeys === 1 ? '' : 's'} with your first claim each day (hold up to {keyMaxStack}). A boss win spends {keyCost} {catKeyName}{keyCost === 1 ? '' : 's'}. A loss keeps the key and starts a {lossCooldownSeconds} s catnap (one cooldown for all chapters). Rematch cleared bosses for a smaller chest.
        </p>
        {firstClearKeys > 0 && (
          <p>
            First-clear boss chests also award {firstClearKeys} {catKeyName}{firstClearKeys === 1 ? '' : 's'}.
          </p>
        )}
        <ul className="help-key-sources" data-testid="help-key-sources">
          {keyLines
            .filter((line) => line.id !== 'firstClear')
            .map((line) => (
              <li key={line.id} data-source={line.id}>{line.text}</li>
            ))}
        </ul>
      </> },
    { id: 'forge', title: 'Forge', content: <>
        <h3>Forge</h3>
        <p>
          Craft gear with Fish, Yarn and materials (guaranteed rarity per recipe: {recipeRarities}). Salvage returns part of the cost (always less than it cost). Lock items to protect them in your bag (holds up to {bagLimit} items).
        </p>
        <p>
          The Relic: {relicYarn} {yarnName} + {relicMoonPearl} {moonPearlName}, {relicPerDay} per day, shared with v1.
        </p>
      </> },
    { id: 'drops', title: 'Drop rates', content: <>
        <h3>Drop rates</h3>
        <p>
          First-clear chests always give a {moonPearlName} (100%), while repeat chests give one with 30% chance. Gear drops average 1.5 items per chest on first clear versus 0.95 items on repeats. {catKeyName} is absent from chest tables today.
        </p>
        <p>
          For full tables and probabilities, see <code className="help-v2-code">docs/drop-rates-v2.md</code>.
        </p>
      </> },
  ];
}
