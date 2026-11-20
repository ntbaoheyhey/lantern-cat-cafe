import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

/** Rehearse a full-health boss matchup; previewing never equips or starts a route. */
export function equipmentForecast(state: R.DepthAccount, cardId: string, instanceId: string, chapter: number, band: number) {
  if (!R.gameplayV4(state)) return { error: 'Boss comparisons need Gameplay v4.' } as const;
  const route = R.CHAPTERS.find(candidate => candidate.id === chapter);
  if (!route || chapter > 1 && !state.cleared.includes(chapter - 1))
    return { error: 'Clear the preceding chapter to scout this boss.' } as const;
  const ceiling = Math.min(...state.team.map(id => state.account.cards.find(card => card.cardId === id)!.level));
  if (!Number.isInteger(band) || band < 1 || band > ceiling)
    return { error: 'Choose a band your whole crew can enter.' } as const;
  const changed = R.equipGear(state, cardId, instanceId);
  if (!changed.ok) return { error: changed.error ?? 'This equipment change is unavailable.' } as const;
  const setup = (account: R.DepthAccount): R.BattleSetup => ({
    seed: 1, chapter, cats: R.battleCats(account), enemies: [route.boss],
    gameplayV4: true, challengeLevel: band, enemyStats: R.challengeStatsV4(band),
    plan: { ...(account.v4?.plan ?? R.DEFAULT_PLAN) },
  });
  const before = setup(state), after = setup(changed.state);
  return { before, after, boss: R.ENEMY_BY_ID[route.boss]!.name,
    // Re-equipping the same piece only reinserts its slot key; it cannot change the matchup.
    sameCrew: Object.values(state.equipment[cardId] ?? {}).includes(instanceId)
      || R.forecastKeyV4(before) === R.forecastKeyV4(after),
    benched: !state.team.includes(cardId),
    transfer: Object.entries(state.equipment).find(([id, slots]) => id !== cardId && Object.values(slots).includes(instanceId))?.[0] };
}
