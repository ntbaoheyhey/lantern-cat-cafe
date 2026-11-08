import type { AccountState, Command, Result } from './contract';
import { ascendCard, enhance, equip, levelCard, lockItem, reforge, salvage, unequip } from './equipment';
import { pull } from './gacha';
import { advanceLocalDay, claimCafeService, claimQuest, forge, selectTeam, exchangeShards } from './progression';
export function applyCommand(state: AccountState, command: Command): Result<unknown> {
  switch (command.type) {
    case 'pull': return pull(command.bannerId, state, command.seed, command.count);
    case 'equip': return equip(state, command.cardId, command.instanceId);
    case 'unequip': return unequip(state, command.cardId, command.slot);
    case 'enhance': return enhance(state, command.instanceId);
    case 'salvage': return salvage(state, command.instanceId);
    case 'forge': return forge(state, command.recipeId);
    case 'claimQuest': return claimQuest(state, command.questId);
    case 'lock': return lockItem(state, command.instanceId, command.locked, command.favourite);
    case 'level': return levelCard(state, command.cardId);
    case 'ascend': return ascendCard(state, command.cardId);
    case 'reforge': return reforge(state, command.instanceId, command.affixIndex, command.stat);
    case 'selectTeam': return selectTeam(state, command.cardIds);
    case 'advanceLocalDay': return advanceLocalDay(state);
    case 'exchangeShards': return exchangeShards(state,command.cardId,command.batches);
    case 'service': return claimCafeService(state, command.minutes);
  }
}
