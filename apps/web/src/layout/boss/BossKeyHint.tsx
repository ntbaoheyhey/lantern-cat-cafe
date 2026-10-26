import { v2 } from '@taskbar-hero/game-rules';

export interface KeySourceLine {
  id: 'daily' | 'drop' | 'firstClear';
  text: string;
}

export interface KeySources {
  keyName: string;
  max: number;
  lines: KeySourceLine[];
}

const plural = (n: number) => (n === 1 ? '' : 's');

/** Key facts read live from V2_CONFIG / MATERIALS so a retune needs no UI edit. */
export function keySources(): KeySources {
  const def = v2.MATERIALS.find((m) => m.id === 'catKey');
  const keyName = def?.name ?? 'Cat Key';
  const max = def?.maxStack ?? 0;
  const { dailyKeys, clearedChapterKeyChance } = v2.V2_CONFIG.idle;
  const firstClearKeys = (v2.V2_CONFIG.boss as { firstClearKeys?: number }).firstClearKeys ?? 0;
  const lines: KeySourceLine[] = [
    {
      id: 'daily',
      text: `Daily: ${dailyKeys} ${keyName}${plural(dailyKeys)} with your first claim each day.`,
    },
  ];
  if (clearedChapterKeyChance > 0) {
    lines.push({
      id: 'drop',
      text: `Rare drop: about 1 in ${Math.round(1 / clearedChapterKeyChance)} monsters in cleared chapters.`,
    });
  }
  if (firstClearKeys > 0) {
    lines.push({
      id: 'firstClear',
      text: `First clear: a boss chest gives ${firstClearKeys} ${keyName}${plural(firstClearKeys)}.`,
    });
  }
  return { keyName, max, lines };
}

export function BossKeyHint({ keys }: { keys: number }) {
  const { keyName, max, lines } = keySources();
  return (
    <div className="boss-key-hint" data-testid="boss-key-hint">
      <div className="boss-key-hint-count" data-testid="boss-key-hint-count">
        {keyName}s: {keys} / {max}
      </div>
      <div className="boss-key-hint-title">Where keys come from</div>
      <ul className="boss-key-hint-list" data-testid="boss-key-hint-sources">
        {lines.map((line) => (
          <li key={line.id} data-source={line.id}>
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
