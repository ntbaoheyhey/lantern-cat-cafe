import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

/** Translate historical catalogue prose into the vocabulary shown by A6 battles. */
export function guideTermsA6(text: string): string {
  const names: Record<string, string> = {
    Scalded: 'Burning', Scald: 'Burn', Snag: 'Bleed', Scented: 'Marked',
    'Brittle sugar': 'Shred', Brittle: 'Shred', Drowsy: 'Daze',
    Steep: 'Regen', Cozy: 'Warm', Tangle: 'Shred', Hush: 'Daze', Rattled: 'Daze',
  };
  return text.replace(/\b(?:Scalded|Scald|Snag|Scented|Brittle sugar|Brittle|Drowsy|Steep|Cozy|Tangle|Hush|Rattled)\b/g, name => names[name]!);
}

export function enemyGuideA6(id: string): { intent: string; counter: string; phases: string } {
  const current = R.ENEMY_MECHANICS_V5[id], earlier = R.enemyGuideV4(id);
  // V5 applies the opening Warm to the guard itself, then shields its whole row.
  const intent = id === 'button-guard'
    ? 'Starts with Warm and shields its row on signature turns.'
    : current?.mechanic ?? guideTermsA6(earlier.intent).replace('below half HP', 'in the closing phase');
  return {
    intent: intent.replace('Three seeded hits', 'Three hits'),
    counter: current?.counter ?? guideTermsA6(earlier.counter),
    phases: R.ENEMY_BY_ID[id]!.tier === 'boss'
      ? '66% HP: woolguard shield · 33% HP: closing attacks and more Binding Threads'
      : '',
  };
}

/** Keep qualitative forecast advice in the same vocabulary as the live encounter. */
export function forecastAdviceA6(enemies: string[], firstFallen: string | null): string {
  const enemy = enemies.map(id => R.ENEMY_BY_ID[id]!).find(item => item.tier === 'boss') ?? R.ENEMY_BY_ID[enemies[0]!]!;
  const guide = enemyGuideA6(enemy.id);
  return firstFallen
    ? `${R.CAT_BY_ID[firstFallen]?.name ?? firstFallen} often falls first. ${guide.counter}`
    : `${enemy.name}: ${guide.intent}`;
}
