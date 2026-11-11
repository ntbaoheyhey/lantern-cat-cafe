import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

/** Player-facing triggers from skills-v5/reactions.ts; crew membership is not a requirement. */
export const reactionGuideA6: Record<R.ReactionIdV5, string[]> = {
  'crumb-burst': [
    'Use a Crumb detonation skill on a living foe carrying Crumb. A normal hit alone cannot trigger it.',
    'Consume all of that foe’s Crumb and Burn stacks for damage through shields. The skill and route bonuses set the damage.',
  ],
  wildfire: [
    'Hit a foe carrying at least 3 Burn with a Splash, Row or All attack.',
    'Apply 1 Burn to each adjacent foe. Burn on the original target remains. Rupture takes priority if the target survives with Bleed and Shred.',
  ],
  rupture: [
    'A direct hit must leave the foe alive with both Bleed and Shred.',
    'Consume all of its Bleed and deal 12 HP damage per consumed stack, through shields. Shred remains.',
  ],
  spread: [
    'Defeat a foe carrying Mark while it has an adjacent living ally.',
    'Copy half of every debuff stack, rounded up, to the nearest adjacent foe. Each copied debuff can be resisted.',
  ],
};

/** Translate historical catalogue prose into the vocabulary shown by A6 battles. */
export function guideTermsA6(text: string): string {
  const names: Record<string, string> = {
    Scalded: 'Burning', Scald: 'Burn', Snag: 'Bleed', Scented: 'Marked',
    'Brittle sugar': 'Shred', Brittle: 'Shred', Drowsy: 'Daze',
    Steep: 'Regen', Cozy: 'Warm', Tangle: 'Shred', Hush: 'Daze', Rattled: 'Daze',
  };
  return text.replace(/\b(?:Scalded|Scald|Snag|Scented|Brittle sugar|Brittle|Drowsy|Steep|Cozy|Tangle|Hush|Rattled)\b/g, name => names[name]!);
}

/** A6 rage timing and V5 effects; historical catalogues keep their own rules. */
const enemyNotesA6: Record<string, { intent: string; counter: string }> = {
  'button-guard': {
    intent: 'First action grants itself Warm. At full rage, shields its row.',
    counter: 'Use Shred and direct hits to strip shields, or Burn to bypass them.',
  },
  'sock-skipper': {
    intent: 'Hits the weakest rear cat and applies Bleed. Shelter can draw its attack.',
    counter: 'Shield the rear to absorb Bleed before their actions, or cleanse it.',
  },
  'spool-ram': {
    intent: 'Winds up, then strikes a row on its next action.',
    counter: 'Daze clears the charge and replaces the strike with a weaker basic.',
  },
  'needle-moth': {
    intent: 'Hits random cats three times. The same cat can be hit more than once.',
    counter: 'Warm and team shields soften repeated hits.',
  },
  'teacup-healer': {
    intent: 'Heals its weakest ally on even rounds or at full rage. Other turns hit and Mark a cat; its first action also grants itself Regen.',
    counter: 'Bitter halves healing and shielding. Mark lets your crew reach it through the front row.',
  },
  'kettle-knight': {
    intent: 'First action grants itself shield and Warm. Reflects hits while its shield holds. Below half HP, basics Burn the front row.',
    counter: 'Shred and hits break its shield. Cleanse Burn; Regen removes one stack at round end.',
  },
  'binding-thread': {
    intent: 'Hits the weakest reachable cat with Shred; full rage adds Daze.',
    counter: 'Defeat it to release its own knots, or cleanse the affected cat.',
  },
  'yarn-giant': {
    intent: 'At full rage, hits a row with Shred. In its closing phase, hits all cats with Bitter.',
    counter: 'Cleanse the crew. Daze turns its signature into a basic hit.',
  },
  'practice-cushion': {
    intent: 'Bumps a front cat. At full rage, its bump becomes stronger.',
    counter: 'Put a guardian in front and watch its protection.',
  },
  'pollen-scout': {
    intent: 'At full rage, hits a cat and plants a Binding Thread, up to two living threads.',
    counter: 'Daze stops planting. Clear threads to release their knots.',
  },
  'rain-spool': {
    intent: 'At full rage, removes all shields from the front row, then hits and applies Daze. Its closing phase reaches both rows.',
    counter: 'Prefer healing and Regen. Daze turns its signature into a basic hit.',
  },
  'crumb-sentinel': {
    intent: 'Hits add Crumb trails. At full rage, also detonates its target’s trails through shields.',
    counter: 'Cleanse Crumb trails before the signature, or use Daze to stop the detonation.',
  },
  'pantry-crown': {
    intent: 'At full rage, hits the front row with Daze and removes up to 6 shield from its main target. Its closing phase reaches both rows and can summon threads.',
    counter: 'Cleanse Daze. Daze on the boss turns its signature into a basic hit.',
  },
};

export function enemyGuideA6(id: string): { intent: string; counter: string; phases: string } {
  const note = enemyNotesA6[id];
  const earlier = note ? undefined : R.enemyGuideV4(id);
  return {
    intent: note?.intent ?? guideTermsA6(earlier!.intent),
    counter: note?.counter ?? guideTermsA6(earlier!.counter),
    phases: R.ENEMY_BY_ID[id]!.tier === 'boss'
      ? '66% HP: woolguard shield · 33% HP: closing attacks and up to 2 more Binding Threads. Defeat the boss and its linked helpers leave.'
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
