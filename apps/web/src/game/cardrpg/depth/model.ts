import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { CARDS, type Command } from '@taskbar-hero/game-rules/cardrpg';
import { createActionPlan, sampleActionPlan, type EffectPlan } from '../../squad/turn3d/effects';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { galleryFixture, GALLERY_ACTIONS } from './feel-lab';
import { CafeAudio } from '../../squad/turn3d/audio';

export type Screen = 'hub' | 'team' | 'collection' | 'inventory' | 'gacha' | 'map' | 'codex' | 'relics' | 'save' | 'evidence' | 'prepare' | 'result';
export class DepthModel {
  state: R.DepthAccount;
  screen: Screen = 'hub';
  cardId = 'mochi';
  itemId = '';
  notice = 'Build your team, press Fight, then watch your companions take the lead.';
  error = false;
  galleryBattle: R.Battle | null = null;
  galleryId = GALLERY_ACTIONS[0]!.id;
  readonly galleryActions = GALLERY_ACTIONS;
  watching = false;
  camera: 'wide' | 'close' | 'overhead' = 'wide';
  paused = false;
  tutorialBattle: R.Battle | null = null;
  replay: R.Battle | null = null;
  replayChoices: R.Choice[] = [];
  replayIndex = 0;
  replayReturn: Screen = 'save';
  plan: EffectPlan | null = null;
  animationAt = 0;
  sceneStarted = false;
  sceneReady = false;
  sceneError = '';
  readonly audio = new CafeAudio();
  liveRelicNote = 'Fixture collection';
  private revision = 0;
  private listeners = new Set<() => void>();
  private storageFailed = false;

  constructor(readonly offline: boolean) {
    this.state = R.createDepthAccount(11, offline ? 0 : Date.now());
    if (!offline) {
      try {
        const saved = localStorage.getItem(R.SAVE_KEY);
        if (saved) {
          this.state = R.importSave(saved, Date.now());
          this.notice = 'Welcome back. Your progress is restored.';
        }
      } catch (error) {
        this.storageFailed = true;
        this.notice = `Saved progress needs attention. ${String(error)} Use Export / import before resetting.`;
      }
      this.state = R.syncCalendarDay(this.state, Date.now()).state;
      this.state.relics = [];
      this.state.selectedRelic = null;
      this.liveRelicNote = 'Read connected wallet or choose fixture mode';
    }
    this.itemId = this.state.gear[0]?.id ?? '';
    this.restoreEncounter();
  }
  snapshot = () => this.revision;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  notify(save = true) {
    if (save && !this.offline && !this.storageFailed) {
      try { localStorage.setItem(R.SAVE_KEY, R.exportSave(this.state)); }
      catch { this.storageFailed = true; this.notice = 'Automatic saving is unavailable. Export a save code to keep this session.'; }
    }
    this.revision++;
    for (const listener of this.listeners) listener();
  }
  get battle() { return this.galleryBattle ?? this.replay ?? this.tutorialBattle ?? this.state.run?.battle ?? null; }
  get showBattle() { return !!this.battle && (!!this.galleryBattle || this.watching); }
  get saveStatus() { return this.offline ? 'Export to keep progress' : this.storageFailed ? 'Export to keep progress · local saving unavailable' : 'Saved locally'; }
  get busy() { return !!this.plan; }
  get canAct() { return !this.galleryBattle && this.showBattle && !!this.battle && !this.battle.result && !this.busy && !this.paused && (this.sceneReady || !!this.sceneError); }
  get frame() { return this.plan ? sampleActionPlan(this.plan, this.animationAt, this.state.settings.reducedMotion) : null; }
  inspect(id: string, progress = 0, play = false) {
    const fixture = galleryFixture(id);
    this.galleryId = id;
    this.galleryBattle = fixture.battle;
    this.plan = progress < 0 ? null : fixture.plan;
    this.animationAt = fixture.plan.duration * Math.max(0, Math.min(1, progress));
    this.paused = !play;
    this.sceneStarted = true;
    this.notify(false);
  }
  closeGallery() {
    this.galleryBattle = null;
    this.plan = null;
    this.paused = false;
    this.notify(false);
  }
  apply(result: R.RuleResult<R.DepthAccount>, message = 'Saved to your cafe account.') {
    this.error = !result.ok;
    if (result.ok) { this.state = result.state; this.notice = message; this.audio.ui(); }
    else this.notice = result.error ?? 'That action is unavailable.';
    this.notify();
    return result.ok;
  }
  go(screen: Screen) {
    if (screen === 'map' && this.battle && !this.watching) screen = this.battle.result ? 'result' : 'prepare';
    if (screen === 'hub' && (!this.state.run || this.state.run.complete)) this.sceneStarted = false;
    this.screen = screen; this.error = false; this.notify(false); }
  command(command: Command) { this.apply(R.metaCommand(this.state, command)); }
  start(chapter: number, mode: R.Run['mode'] = 'campaign') {
    if (this.apply(R.startRun(this.state, chapter, this.state.account.seed + this.state.nextRunId * 7919, mode, this.offline ? '2026-11-06' : new Date().toISOString().slice(0, 10)), 'Choose the first stop on your route.')) this.go('map');
  }
  enter(id: string) {
    if (this.apply(R.enterNode(this.state, id), 'Prepare your companions, then press Fight.')) {
      this.plan = null; this.paused = false; this.watching = false;
      if (this.battle) this.screen = 'prepare';
      this.notify(false);
    }
  }
  tutorial() {
    this.tutorialBattle = R.createBattle({ seed: 7, chapter: 1, cats: R.battleCats(this.state), enemies: ['practice-cushion'], tutorial: true });
    this.plan = null; this.watching = false; this.paused = false; this.go('prepare');
  }
  fight() {
    if (!this.battle || this.battle.result) return;
    this.watching = true; this.paused = false; this.sceneStarted = true; this.screen = 'map';
    this.notify(false);
  }
  watchNow() {
    if (!this.state.run || this.state.run.complete) {
      this.start(1);
      const node = R.availableNodes(this.state.run!)[0];
      if (node) this.enter(node.id);
    }
    this.go('map');
    this.fight();
  }
  private restoreEncounter() {
    this.watching = !!this.battle && !this.battle.result && this.battle.choices.length > 0;
    this.sceneStarted = this.watching;
    this.screen = this.battle ? this.battle.result ? 'result' : this.watching ? 'map' : 'prepare' : 'hub';
  }
  private showResult() {
    this.watching = false; this.paused = false; this.plan = null; this.screen = 'result'; this.notify();
  }
  skip() {
    if (!this.battle || this.galleryBattle) return;
    if (this.replay) {
      this.replay = R.replayBattle(this.replay.initial, this.replayChoices);
      this.replayIndex = this.replayChoices.length;
    } else R.playBattle(this.battle, 'auto');
    this.showResult();
  }
  act(choice?: R.Choice) {
    const battle = this.battle;
    if (!battle || !this.canAct) return;
    const actor = R.currentActor(battle);
    if (!actor) return;
    const before = battle.log.length;
    const selected = actor.side === 'party' ? choice ?? R.chooseAction(battle, 'auto') : null;
    let skillId = selected?.skillId ?? '';
    let accepted = false;
    if (actor.side === 'enemy') {
      skillId = `${R.ENEMY_BY_ID[actor.catalogId]!.role}Attack`;
      accepted = R.enemyAct(battle);
    } else accepted = R.act(battle, selected!);
    if (!accepted) { this.notice = 'This recorded action could not be resolved.'; this.error = true; this.showResult(); return; }
    const targets = [...new Set(battle.log.slice(before).map(e => e.targetId))];
    const events: TurnEvent[] = [{ version: 3, seq: 0, turn: actor.turns, round: battle.round,
      actionId: battle.log.length, beat: 0, type: 'action_start', actorId: actor.id, skillId, targetIds: targets, amount: 0 }];
    for (const event of battle.log.slice(before)) {
      const type = ({ damage: 'damage', dot: 'damage', detonate: 'damage', heal: 'heal', shield: 'shield', defeat: 'death', status: 'status_apply' } as const)[event.kind as 'damage'];
      if (type) events.push({ version: 3, seq: events.length, turn: actor.turns, round: event.round,
        actionId: battle.log.length, beat: 2, type, actorId: event.actorId, skillId,
        targetIds: [event.targetId], amount: event.amount });
    }
    this.plan = createActionPlan(events);
    this.animationAt = 0;
    this.notify();
  }
  tick(milliseconds: number) {
    if (this.paused || !this.showBattle) return;
    if (!this.plan) { if (this.battle?.result && !this.galleryBattle) this.showResult(); return; }
    this.animationAt += milliseconds * this.state.settings.speed;
    if (this.animationAt >= this.plan.duration) {
      this.plan = null;
      if (this.battle?.result && !this.galleryBattle) this.showResult();
      else this.notify(false);
    }
  }
  step(policy: R.Policy = 'auto') {
    if (!this.canAct || !this.battle) return;
    this.act(R.currentActor(this.battle)?.side === 'party' ? R.chooseAction(this.battle, policy) : undefined);
  }
  finish() {
    if (this.replay) { this.replay = null; this.plan = null; this.watching = false; this.go(this.replayReturn); return; }
    if (this.tutorialBattle?.result) {
      this.tutorialBattle = null;
      this.sceneStarted = false;
      this.state.tutorial = 3;
      this.notice = 'A welcome invitation is ready. Then equip your first piece.';
      this.go('gacha'); this.notify(); return;
    }
    if (this.apply(R.finishEncounter(this.state), 'Choose a charm or strengthen one unlocked skill.')) this.go('map');
  }
  improveTeam() {
    this.finish();
    if (this.state.run && !this.state.run.complete) this.apply(R.abandonRun(this.state), 'Route rewards kept. Improve your team for the next route.');
    this.go('team');
  }
  leave() {
    if (this.galleryBattle) { this.closeGallery(); return; }
    if (this.replay) { this.finish(); return; }
    this.paused = false; this.plan = null; this.watching = false;
    if (this.tutorialBattle) { this.tutorialBattle = null; this.state.tutorial = 3; }
    else this.apply(R.abandonRun(this.state), 'Partial route rewards kept.');
    this.go('hub'); this.notify();
  }
  invite(free = false) {
    const seed = this.state.account.seed + this.state.account.history.length * 101 + 39;
    this.apply(free ? firstInvitation(this.state, 4) : R.metaCommand(this.state, { type: 'pull', bannerId: 'standard', seed }), 'Your invitation is open. Every companion has their own kit.');
  }
  replayLast() {
    const completed = this.screen === 'result' ? this.battle : null;
    const setup = completed?.initial ?? this.state.lastBattle;
    if (!setup) return;
    this.replayReturn = this.screen;
    this.replayChoices = [...(completed?.choices ?? this.state.lastChoices)];
    this.replay = R.createBattle(setup);
    this.replayIndex = 0;
    this.sceneStarted = true; this.watching = true; this.paused = false; this.plan = null; this.go('map');
  }
  replayStep() {
    if (!this.replay || !this.canAct) return;
    if (R.currentActor(this.replay)?.side === 'enemy') this.act();
    else {
      const choice = this.replayChoices[this.replayIndex++];
      if (choice) this.act(choice);
      else { this.notice = 'Replay reached its last recorded action.'; this.showResult(); }
    }
  }
  import(code: string) {
    try {
      const next = R.importSave(code, this.offline ? 0 : Date.now());
      if (!this.offline) { next.relics = []; next.selectedRelic = null; }
      this.state = next; this.tutorialBattle = null; this.replay = null; this.plan = null; this.galleryBattle = null;
      this.restoreEncounter();
      this.paused = false;
      this.cardId = next.team[0]!; this.itemId = next.gear[0]?.id ?? '';
      this.storageFailed = false; this.notice = 'Save imported and checksum verified.'; this.error = false; this.notify();
    } catch (error) { this.error = true; this.notice = String(error); this.notify(false); }
  }
  reset() {
    this.state = R.createDepthAccount(11, this.offline ? 0 : Date.now());
    this.tutorialBattle = null; this.replay = null; this.plan = null; this.galleryBattle = null;
    this.paused = false; this.watching = false;
    this.cardId = this.state.team[0]!; this.itemId = this.state.gear[0]?.id ?? '';
    this.storageFailed = false; this.notice = 'A fresh cafe is ready.'; this.go('hub'); this.notify();
  }
  shortcut(kind: 'unlock' | 'stamps' | 'chapter') {
    if (!this.offline) return;
    this.state.run = null;
    if (kind === 'unlock') {
      this.state.account.cards = CARDS.map(c => ({ id: c.id, cardId: c.id, level: 10, stars: 3, shards: 120, soulbound: true }));
      for (const cat of R.CATS) {
        this.state.skills[cat.id] = cat.skills.slice(0, 3).map(s => s.id);
        this.state.rows[cat.id] = cat.row;
      }
      this.state.account.currencies = { fish: 8000, threads: 1000, stamps: 600, essence: 100 };
      this.state.materials = 150;
      for (const slot of ['weapon', 'outfit', 'charm', 'relic']) this.state.gear.push(R.makeGear(this.state, `bellsteel-${slot}-epic`, 1));
    }
    if (kind === 'stamps') this.state.account.currencies.stamps += 1500;
    if (kind === 'chapter') { this.state.cleared = [1, 2, 3]; this.state.account.chapter = 4; }
    this.notice = 'Demo shortcut applied. This account contains reviewer-granted progress.';
    this.notify();
  }
}
