import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARDS } from '@taskbar-hero/game-rules/cardrpg';
import { createActionPlan } from '../../squad/turn3d/effects';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';

/** Isolated presentation fixtures. Previewing never grants items or alters the account. */
export const GALLERY_ACTIONS = [
  ...R.CATS.flatMap(cat => cat.skills.map(skill => ({
    id: skill.id, owner: cat.id, name: `${cat.name} · ${skill.name}`, ultimate: skill.type === 'ultimate', enemy: false,
  }))),
  ...R.ENEMIES.map(enemy => ({
    id: `enemy:${enemy.id}`, owner: enemy.id, name: `${enemy.name} · ${enemy.intent}`, ultimate: false, enemy: true,
  })),
];

export function galleryFixture(id: string) {
  const action = GALLERY_ACTIONS.find(item => item.id === id);
  if (!action) throw new Error(`Unknown gallery action ${id}`);
  const account = R.createDepthAccount(71);
  account.account.cards = CARDS.map(card => ({ id: card.id, cardId: card.id, level: 10, stars: 3, shards: 0, soulbound: true }));
  account.team = [...new Set([action.enemy ? 'mochi' : action.owner, 'mochi', 'soot', 'clover'])].slice(0, 3);
  for (const cat of R.CATS) {
    account.rows[cat.id] = cat.row;
    account.skills[cat.id] = cat.skills.slice(0, 3).map(skill => skill.id);
  }
  const enemy = R.ENEMY_BY_ID[action.owner];
  const battle = R.createBattle({ seed: 71, chapter: enemy?.chapter ?? 1, cats: R.battleCats(account), enemies: [action.enemy ? action.owner : 'button-guard'] });
  const caster = battle.actors.find(actor => actor.catalogId === action.owner)!;
  const skill = R.skillById(id);
  const friendly = skill && ['ally', 'allies', 'self', 'fallen'].includes(skill.target);
  const targets = battle.actors.filter(actor => actor.side === (friendly ? caster.side : caster.side === 'party' ? 'enemy' : 'party'));
  const targetIds = (skill?.target === 'self' ? [caster] : ['allies', 'foes', 'row'].includes(skill?.target ?? '') ? targets : targets.slice(0, 1)).map(actor => actor.id);
  const skillId = action.enemy ? `${enemy!.role}Attack` : id;
  const start: TurnEvent = { version: 3, seq: 0, turn: 1, round: 1, actionId: 1, beat: 0, type: 'action_start', actorId: caster.id, skillId, targetIds, amount: 0 };
  const effect = skill?.effects.some(item => item.kind === 'heal') ? 'heal' : friendly ? 'shield' : 'damage';
  const plan = createActionPlan([start, { ...start, seq: 1, beat: 2, type: effect, amount: 42 }]);
  return { battle, plan, action };
}
