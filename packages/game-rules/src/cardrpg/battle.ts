import { Rng, deriveSeed } from '../rng';
import { createTurnBattle } from '../squad/turn/engine';
import type { CardRpgCombat, Hero, Preset, TurnBattle, TurnOptions } from '../squad/turn/types';
import type { GearProperty } from '../squad/gear/catalog';
import { CARD_BY_ID, CHAPTERS, ITEM_BY_ID, ITEMS } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import type { AccountState, BattleRewardPayload, Preview, Result, Reward } from './contract';
import { activeSets, computeCardStats, findItem } from './equipment';
import { grant, integer, noBattle, preview, progress, requireRule, transact } from './internal';
import { makeItem } from './state';
export function toBattleOptions(state: AccountState, seed: number, preset: Preset = 'hearthkeepers'): TurnOptions {
  const team = state.teams.find(t => t.id === state.activeTeamId); requireRule(team, 'INVALID_TEAM', 'Active team not found.');
  const cards = Object.fromEntries(team.cardIds.map(id => {
    const instance = state.cards.find(c => c.id === id); requireRule(instance, 'INVALID_TEAM', 'Team cat not owned.'); const card = CARD_BY_ID[instance.cardId]!;
    const properties = Object.values(state.loadouts[id] ?? {}).map(i => ITEM_BY_ID[findItem(state,i!).itemId]!.uniqueEffect).filter(Boolean) as GearProperty[];
    return [card.role, { cardId: card.id, name: card.name, stats: computeCardStats(state,id), properties, sets: activeSets(state,id).map(set => `${set.id}:${set.pieces}`) }];
  })) as CardRpgCombat['cards'];
  requireRule(['guardian','witch','alchemist'].every(role => cards[role as Hero]), 'INVALID_TEAM', 'A team needs one cat of each role.');
  return { seed, preset, encounter: 'campaign', gearMode: 'starter', interactive: true, cardRpg: { runId: state.pendingRun?.id ?? state.nextRunId, cards, extraTonics: Math.min(2, state.inventory.stacks['milk-tonic'] ?? 0) } };
}
export function startBattle(state: AccountState, seed = state.seed, chapterId = 'cafe-patrol', preset: Preset = 'hearthkeepers'): Result<{ battle: TurnBattle; options: TurnOptions }> {
  return transact(state, s => {
    noBattle(s); requireRule(integer(seed, 0, 0xffffffff), 'INVALID_AMOUNT', 'Battle seed must be an unsigned integer.');
    const chapter = CHAPTERS.find(c => c.id === chapterId); requireRule(chapter?.implemented, 'NOT_READY', 'This chapter is design content, not playable yet.');
    const options = toBattleOptions(s,seed,preset); s.pendingRun = { id:s.nextRunId++, chapterId, seed };
    const used = options.cardRpg!.extraTonics; if (used) s.inventory.stacks['milk-tonic']! -= used;
    return { options, battle: createTurnBattle(options) };
  });
}
export function abandonBattle(state: AccountState): Result { return transact(state, s => { requireRule(s.pendingRun, 'NOT_READY', 'No battle to abandon.'); s.pendingRun = null; }); }
function baseReward(state: AccountState, won: boolean): Reward {
  if (state.daily.battles >= C.battle.rewardedPerDay) return { currencies: {}, xp: 0 };
  return won ? { currencies: { ...C.battle.reward }, xp: C.battle.xp } : { currencies: {}, xp: C.battle.lossXp };
}
export function previewBattleRewards(state: AccountState, battle: TurnBattle): Preview<BattleRewardPayload> { return preview(() => {
  const run = state.pendingRun; requireRule(run && run.id === battle.run.cardRpg?.runId && run.seed === battle.seed && battle.encounter === 'campaign', 'NOT_READY', 'Battle does not match the pending run.');
  requireRule(battle.result, 'NOT_READY', 'Finish the battle before claiming rewards.');
  const won = battle.result.winner === 'party';
  return { id: `run-${run.id}`, runId: run.id, chapterId: run.chapterId, won, wavesCleared: battle.result.wavesCleared, rounds: battle.result.rounds, reward: baseReward(state,won), firstClear: won && !state.clearedChapters.includes(run.chapterId), eligibleRelicDesign: won && !(state.inventory.stacks[`boss-day-${state.day}`] ?? 0) && state.daily.battles < C.battle.rewardedPerDay };
}); }
export function applyBattleRewards(state: AccountState, payload: BattleRewardPayload): Result<Reward> { return transact(state, (s,events) => {
  requireRule(!s.claimedBattleIds.includes(payload.id), 'ALREADY_CLAIMED', 'Battle reward already claimed.');
  const run = s.pendingRun; requireRule(run && payload.id === `run-${run.id}` && payload.runId === run.id && payload.chapterId === run.chapterId, 'NOT_READY', 'Reward does not match the pending local run.');
  requireRule(integer(payload.rounds,1) && integer(payload.wavesCleared,0,3), 'INVALID_AMOUNT', 'Invalid battle summary.');
  const expected = baseReward(s,payload.won); requireRule(JSON.stringify(payload.reward) === JSON.stringify(expected), 'INVALID_AMOUNT', 'Reward amounts must come from the rules preview.');
  const rewarded = s.daily.battles < C.battle.rewardedPerDay, first = payload.won && !s.clearedChapters.includes(run.chapterId);
  const reward = grant(s,expected,true,events);
  if (rewarded) { s.daily.battles++; progress(s,'battles'); }
  if (payload.won) {
    if (rewarded) { progress(s,'wins'); progress(s,'bossWins');
      if (!s.inventory.stacks[`boss-day-${s.day}`]) { s.inventory.stacks[`boss-day-${s.day}`] = 1; s.inventory.stacks['boss-proof'] = (s.inventory.stacks['boss-proof'] ?? 0) + C.battle.bossProof; }
      const rng = new Rng(deriveSeed(run.seed,run.id)), pool = ITEMS.filter(i => i.rarity === (first ? 'rare' : 'common'));
      const item = makeItem(s,pool[rng.int(0,pool.length-1)]!.id,'battle'); s.inventory.items.push(item); reward.items = [item.itemId];
    }
    if (first) { s.clearedChapters.push(run.chapterId); s.chapter = Math.max(2,s.chapter); const extra = grant(s,{currencies:C.battle.firstClear,xp:0},false); for(const [k,v] of Object.entries(extra.currencies)) reward.currencies[k as keyof typeof reward.currencies]=(reward.currencies[k as keyof typeof reward.currencies]??0)+v; }
  }
  s.claimedBattleIds.push(payload.id); s.pendingRun = null; events.push({type:'reward.claimed',id:payload.id,reward}); return reward;
}); }
export function finishBattle(state: AccountState, battle: TurnBattle): Result<Reward> { const p = previewBattleRewards(state,battle); return p.ok ? applyBattleRewards(state,p.value) : {ok:false,state,events:[],error:p.error}; }
