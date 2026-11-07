import * as R from '../../packages/game-rules/src/cardrpg/depth/index';
import { actAutoExtras, createAutoExtrasMemory, DEFAULT_AUTO_EXTRAS, playAutoExtras, type AutoExtrasOptions, type AutoExtraCue } from '../../packages/game-rules/src/cardrpg/depth/auto-extras/index';
import { DepthModel } from '../../apps/web/src/game/cardrpg/depth/model';
import { snapshotBattle, splitPresentation } from '../../apps/web/src/game/cardrpg/depth/battle-presentation';
import { createCardActionPlan } from '../../apps/web/src/game/cardrpg/depth/card-action-plan';
import type { EffectPlan } from '../../apps/web/src/game/squad/turn3d/effects';
import type { TurnEvent } from '../../packages/game-rules/src/squad/turn/types';

export const LAB_TEAMS = { starter: ['mochi', 'soot', 'clover'], garden: ['mochi', 'mallow', 'clover'], tide: ['panko', 'mallow', 'sorrel'] } as const;
/** Disposable preview account. No game-save or reward command is called. */
export class MechanicsModel extends DepthModel {
  options: Readonly<AutoExtrasOptions> = DEFAULT_AUTO_EXTRAS;
  cues: AutoExtraCue[] = [];
  private extrasMemory = createAutoExtrasMemory();
  private before: R.Battle | null = null;
  private shownImpact = false;
  private labImpact: R.Battle | null = null;
  private labRound: EffectPlan | null = null;
  prepare(team: keyof typeof LAB_TEAMS, chapter: number, seed: number, options: AutoExtrasOptions) {
    this.options = Object.freeze({ ...options }); this.extrasMemory = createAutoExtrasMemory();
    this.cues = []; this.before = null; this.labImpact = null; this.labRound = null; this.plan = null; this.animationAt = 0;
    const ids = LAB_TEAMS[team], prototype = this.state.account.cards[0]!;
    this.state.account.cards = ids.map(id => ({ ...prototype, id, cardId: id, level: 1, stars: 1 }));
    this.state.team = [...ids]; this.state.rows = Object.fromEntries(ids.map((id, index) => [id, index ? 'rear' : 'front']));
    this.state.equipment = {};
    const enemies = chapter === 1 ? ['kettle-knight', 'yarn-giant'] : chapter === 2 ? ['pollen-scout', 'rain-spool'] : ['crumb-sentinel', 'pantry-crown'];
    this.tutorialBattle = R.createBattle({ seed, chapter, cats: R.battleCats(this.state), enemies });
    this.paused = false; this.watching = false; this.sceneStarted = false; this.sceneReady = false;
    this.notify(false);
  }
  override get visualBattle() { return !this.options.autoExtras ? super.visualBattle : this.before && !this.shownImpact ? this.before : this.labImpact ?? this.battle; }
  override act(choice?: R.Choice) {
    if (!this.options.autoExtras) { super.act(choice); return; }
    const battle = this.battle; if (!battle || !this.canAct) return;
    const actor = R.currentActor(battle); if (!actor) return;
    const selected = actor.side === 'party' ? choice ?? R.chooseAction(battle, 'auto') : undefined;
    const intent = battle.intents.find(i => i.actorId === actor.id);
    const signature = !intent?.interrupted && !actor.statuses.some(s => s.id === 'drowsy')
      && (intent?.signature || ['heal', 'shield'].includes(R.ENEMY_BY_ID[actor.catalogId]?.mechanic ?? ''));
    const skillId = selected?.skillId ?? `${R.ENEMY_BY_ID[actor.catalogId]!.role}Attack`;
    const identity = actor.side === 'enemy' ? `enemy:${actor.catalogId}${signature ? '' : ':basic'}` : skillId;
    this.before = snapshotBattle(battle);
    if (!actAutoExtras(battle, this.extrasMemory, this.options, selected)) throw Error('Lab action stalled');
    this.cues = [...this.extrasMemory.cues]; this.shownImpact = false;
    // The wrapper appends its proc after the rules action. Reorder only this
    // presentation copy so its shield/label appears at the triggering impact.
    const display = snapshotBattle(battle), fresh = display.log.splice(this.before.log.length);
    const extra = fresh.filter(event => event.skillId.startsWith('auto-extra:'));
    const normal = fresh.filter(event => !event.skillId.startsWith('auto-extra:'));
    const marker = normal.findIndex(event => event.kind === 'action' || event.kind === 'enemy-action');
    normal.splice(marker < 0 ? normal.length : marker, 0, ...extra); display.log.push(...normal);
    const presentation = splitPresentation(this.before, display, skillId);
    this.labImpact = presentation.impact; this.labRound = presentation.roundPlan;
    const events = presentation.events;
    const targets = [...new Set(events.flatMap(e => e.targetIds))];
    if (!targets.length) targets.push(selected?.targetId ?? intent?.targetId ?? actor.id);
    const start: TurnEvent = { version: 3, seq: 0, turn: actor.turns, round: this.before.round,
      actionId: battle.log.length, beat: 0, type: 'action_start', actorId: actor.id, skillId, targetIds: targets, amount: 0 };
    this.plan = createCardActionPlan([start, ...events], identity);
    this.plan.presentationCues = this.cues.map(c => `auto-extra:${c.id}`);
    this.plan.presentationCueTargets = Object.fromEntries(this.cues.map(c => [`auto-extra:${c.id}`, c.targetId]));
    this.momentNote = this.cues.map(c => c.label).join(' · '); this.animationAt = 0; this.notify(false);
  }
  override tick(ms: number) {
    if (!this.options.autoExtras) { super.tick(ms); return; }
    if (this.paused || !this.watching || !this.plan) return;
    this.animationAt += ms * this.state.settings.speed;
    if (!this.shownImpact && this.impactVisible) { this.shownImpact = true; this.notify(false); }
    if (this.animationAt >= this.plan.duration) this.finishMoment();
  }
  override finishMoment() {
    if (!this.options.autoExtras) { super.finishMoment(); return; }
    this.plan = this.labRound; this.labRound = null; this.labImpact = null; this.cues = []; this.before = null; this.animationAt = 0; this.shownImpact = true; this.momentNote = '';
    if (this.battle?.result && !this.plan) this.watching = false;
    this.notify(false);
  }
  override skip() {
    if (!this.options.autoExtras) { super.skip(); return; }
    if (this.battle) playAutoExtras(this.battle, this.extrasMemory, this.options);
    this.plan = null; this.before = null; this.watching = false; this.notify(false);
  }
  override leave() { this.paused = true; this.watching = false; this.sceneStarted = false; this.plan = null; this.notify(false); }
}
