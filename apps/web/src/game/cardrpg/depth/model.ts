import {chainFlags} from '../chain/flags';
import { paceActionA6 } from './pacing-a6';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { CARDS, type Command, type Slot } from '@taskbar-hero/game-rules/cardrpg';
import { sampleActionPlan, type EffectPlan } from '../../squad/turn3d/effects';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { galleryFixture, GALLERY_ACTIONS } from './feel-lab';
import { CafeAudio } from '../../squad/turn3d/audio';
import { createCardActionPlan } from './card-action-plan';
import { snapshotBattle, splitPresentation } from './battle-presentation';
import { passivePresentation } from './passive-presentation';
import { readTeamPresets, TEAM_PRESETS_KEY, type TeamPreset } from './meta-presentation';

export type Screen = 'tower' | 'bonds' | 'journal' | 'hub' | 'team' | 'collection' | 'inventory' | 'gacha' | 'map' | 'codex' | 'relics' | 'save' | 'evidence' | 'prepare' | 'result';
export class DepthModel {
  state: R.DepthAccount;
  screen: Screen = 'hub';
  cardId = 'mochi';
  itemId = '';
  inventorySlot: Slot | 'all' = 'all';
  notice = 'Build your team, press Fight, then watch your companions take the lead.';
  error = false;
  teamPresets: Array<TeamPreset | null> = [null, null, null];
  galleryBattle: R.Battle | null = null;
  galleryId = GALLERY_ACTIONS[0]!.id;
  galleryEffectOnly = false;
  gallerySpeed = 1;
  labOpen = false;
  labPanel: 'gallery' | 'compare' | 'motion' | 'performance' | 'checklist' = 'gallery';
  labPerformance = false;
  private galleryReturn?: { plan: EffectPlan | null; animationAt: number; paused: boolean };
  readonly galleryActions = GALLERY_ACTIONS;
  watching = false;
  camera: 'wide' | 'close' | 'far' = 'wide';
  paused = false;
  tutorialBattle: R.Battle | null = null;
  replay: R.Battle | null = null;
  replayChoices: R.Choice[] = [];
  replayIndex = 0;
  replayReturn: Screen = 'save';
  plan: EffectPlan | null = null;
  animationAt = 0;
  playbackAt = 0;
  private playbackFrameAt?: number;
  ultimateBannerUntil = 0;
  comboBanner = '';
  comboBannerUntil = 0;
  private ultimateBannersAt: number[] = [];
  autoContinue = false;
  momentNote = '';
  private beforeImpact: R.Battle | null = null;
  private afterImpact: R.Battle | null = null;
  private roundPlan: EffectPlan | null = null;
  private impactApplied = false;
  sceneStarted = false;
  sceneReady = false;
  sceneError = '';
  readonly audio = new CafeAudio();
  liveRelicNote = 'Fixture collection';
  private revision = 0;
  private listeners = new Set<() => void>();
  private storageFailed = false;
  private cafeClockStart = Date.now();
  private cafeClockBase = 0;
  get cafeNow() { return this.offline ? this.cafeClockBase + Math.max(0, Date.now() - this.cafeClockStart) : Date.now(); }
  private resetCafeClock() { this.cafeClockStart = Date.now(); this.cafeClockBase = Math.max(this.state.idle.lastAt, this.state.v4?.clockWatermark ?? 0, (this.state.idle.dayKey ?? 0) * 86400000); }

  constructor(readonly offline: boolean, readonly gameplayMode = false, readonly skillsMode = false, readonly a6Mode = false, readonly c2Mode = false) {
    this.state = R.createDepthAccount(11, offline ? 0 : Date.now());
    if (!offline) {
      try {
        const saved = localStorage.getItem(R.SAVE_KEY);
        if (saved) {
          this.state = R.importSave(saved, Date.now(), this.c2Mode);
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
    this.state = R.setGameplayV4(this.state, gameplayMode); if(skillsMode)this.state=R.setSkillsV5(this.state,true); this.state=R.setGameplayA6(this.state,this.a6Mode); if(this.c2Mode)this.state=R.setFormationC2(this.state); this.state.economyV3=chainFlags().economyV3; this.resetCafeClock();
    this.itemId = this.state.gear[0]?.id ?? '';
    if (!offline) {
      try { this.teamPresets = readTeamPresets(localStorage.getItem(TEAM_PRESETS_KEY)); } catch { /* Preferences remain available for this visit. */ }
    }
    this.restoreEncounter();
    this.consumeFormationNotice();
  }
  private consumeFormationNotice() {
    const notice=this.state.formationNoticeC2;if(!notice)return;
    delete this.state.formationNoticeC2;
    this.notice=notice==='bench'?'Strongest four ready. Others benched.':'Four companions ready.';
    this.notify();
  }
  saveTeamPreset(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= 3) return;
    this.teamPresets[index] = { name: `Shift ${index + 1}`, team: [...this.state.team],
      rows: Object.fromEntries(this.state.team.map(id => [id, this.state.rows[id]!])) };
    if (this.offline) {
      this.notice = `Shift ${index + 1} saved for this offline visit.`;
      this.error = false;
      this.notify(false);
      return;
    }
    try {
      localStorage.setItem(TEAM_PRESETS_KEY, JSON.stringify({ version: 1, slots: this.teamPresets }));
      this.notice = `Shift ${index + 1} saved in this browser.`;
    } catch { this.notice = `Shift ${index + 1} saved for this visit. Browser storage is unavailable.`; }
    this.error = false;
    this.notify(false);
  }
  loadTeamPreset(index: number) {
    const preset = this.teamPresets[index];
    if (!preset) return;
    this.apply(R.configureTeam(this.state, preset.team, preset.rows, this.state.skills), `${preset.name} restored.`);
  }
  snapshot = () => this.revision;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  async toggleSound() {
    if (this.audio.pending) return;
    const task = this.audio.toggle();
    this.notify(false);
    await task;
    this.state.settings.sound = this.audio.enabled;
    this.notify();
  }
  notify(save = true) {
    if (save && !this.offline && !this.storageFailed) {
      try { localStorage.setItem(R.SAVE_KEY, R.exportSave(this.state)); }
      catch { this.storageFailed = true; this.notice = 'Automatic saving is unavailable. Export a save code to keep this session.'; }
    }
    this.revision++;
    for (const listener of this.listeners) listener();
  }
  get battle() { return this.galleryBattle ?? this.replay ?? this.tutorialBattle ?? this.state.run?.battle ?? null; }
  get visualBattle() {
    if (this.galleryBattle || !this.plan || this.plan.skillId === 'round-status') return this.battle;
    return (this.impactApplied ? this.afterImpact : this.beforeImpact) ?? this.battle;
  }
  get impactVisible() { return !!this.plan && this.animationAt >= this.plan.beats[2]!.start; }
  get showBattle() { return !!this.battle && (!!this.galleryBattle || this.watching); }
  get saveStatus() { return this.offline ? 'Export to keep progress' : this.storageFailed ? 'Export to keep progress · local saving unavailable' : 'Saved locally'; }
  get busy() { return !!this.plan; }
  get canAct() { return !this.galleryBattle && this.showBattle && !!this.battle && !this.battle.result && !this.busy && !this.paused && (this.sceneReady || !!this.sceneError); }
  get frame() { return this.plan ? sampleActionPlan(this.plan, this.animationAt, this.state.settings.reducedMotion) : null; }
  inspect(id: string, progress = 0, play = false) {
    const fixture = galleryFixture(id);
    if (!this.galleryBattle) this.galleryReturn = { plan: this.plan, animationAt: this.animationAt, paused: this.paused };
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
    this.plan = this.galleryReturn?.plan ?? null;
    this.animationAt = this.galleryReturn?.animationAt ?? 0;
    this.paused = this.galleryReturn?.paused ?? false;
    this.galleryReturn = undefined;
    this.galleryEffectOnly = false;
    this.notify(false);
  }
  apply(result: R.RuleResult<R.DepthAccount>, message = 'Saved to your cafe account.') {
    this.error = !result.ok;
    if (result.ok) { this.state = result.state; this.notice = message; this.audio.ui(); }
    else this.notice = result.error ?? 'That action is unavailable.';
    this.notify();
    return result.ok;
  }
  go(screen: Screen, gearSlot: Slot | 'all' = 'all') {
    if (this.replay && !this.watching && screen !== 'result') this.clearReplay();
    if (screen === 'map' && this.battle && !this.watching) screen = this.battle.result ? 'result' : 'prepare';
    if (screen === 'hub' && (!this.state.run || this.state.run.complete)) this.sceneStarted = false;
    this.inventorySlot = screen === 'inventory' ? gearSlot : 'all';
    this.screen = screen; this.error = false; this.notify(false); }
  command(command: Command) { this.apply(R.metaCommand(this.state, command)); }
  start(chapter: number, mode: R.Run['mode'] = 'campaign', challengeLevel?: number) {
    if (this.apply(R.startRun(this.state, chapter, this.state.account.seed + this.state.nextRunId * 7919, mode, this.offline ? '2026-11-06' : new Date().toISOString().slice(0, 10), challengeLevel), 'Choose the first stop on your route.')) this.go('map');
  }
  enter(id: string) {
    if (this.apply(R.enterNode(this.state, id), 'Prepare your companions, then press Fight.')) {
      this.plan = null; this.paused = false; this.watching = false;
      if (this.battle) this.screen = 'prepare';
      this.notify(false);
    }
  }
  tutorial() {
    this.tutorialBattle = R.createBattle({ ...(this.state.formationC2?{formationC2:true}:{}),...(R.gameplayA6(this.state)?{gameplayA6:true}:{}),...(R.skillsV5(this.state)?{skillsV5:true}:{}),seed: 7, chapter: 1, cats: R.battleCats(this.state), enemies: ['practice-cushion'], tutorial: true,
      ...(R.gameplayV4(this.state) ? { gameplayV4: true, plan: this.state.v4?.plan,
        enemyStats: { 'practice-cushion': { hp: 300, attack: 60, defense: 0 } } } : {}) });
    this.plan = null; this.watching = false; this.paused = false; this.go('prepare');
  }
  fight() {
    if (!this.battle || this.battle.result) return;
    if (this.battle.v4 && !this.replay && !this.galleryBattle) {
      if (this.tutorialBattle) this.tutorialBattle.v4!.committed = true;
      else if (!this.apply(R.commitPreparation(this.state), 'Preparation committed. Your crew follows its standing plan.')) return;
    }
    this.comboBanner = ''; this.comboBannerUntil = 0;
    this.watching = true; this.paused = false; this.sceneStarted = true; this.screen = 'map';
    this.notify();
  }
  prepareCrew(team = this.state.team, rows = this.state.rows, plan = this.battle?.v4?.plan ?? R.DEFAULT_PLAN) {
    if (this.watching || this.replay || this.galleryBattle) return;
    if (this.tutorialBattle?.v4) {
      if (this.tutorialBattle.v4.committed) return;
      const result = R.configureTeam(this.state, team, rows, this.state.skills);
      if (!result.ok || !R.validPlan(plan)) { this.apply(result); return; }
      this.state = result.state;
      this.state.v4!.plan = { ...plan };
      this.tutorialBattle = R.createBattle({ ...this.tutorialBattle.initial, cats: R.battleCats(this.state), plan: { ...plan } });
      this.notice = 'Practice formation updated.'; this.notify(); return;
    }
    this.apply(R.configurePreparation(this.state, team, rows, plan), 'Preparation updated. Enemy lineup and encounter seed stay fixed.');
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
    this.watching = !!this.battle && !this.battle.result && (this.battle.choices.length > 0 || !!this.battle.v4?.committed);
    this.sceneStarted = this.watching;
    this.screen = this.battle ? this.battle.result ? 'result' : this.watching ? 'map' : 'prepare' : 'hub';
  }
  private showResult() {
    this.watching = false; this.paused = false; this.plan = null; this.screen = 'result'; this.notify();
  }
  get a6Battle() { return !!this.battle?.initial.gameplayA6; }
  get canSkip() {
    if (!this.a6Battle) return !this.galleryBattle;
    if (this.replay) return true;
    const run=this.state.run, node=run?.nodes.find(n=>n.id===run.current);
    return !!(run&&node&&this.state.v4?.journey?.stars[R.nodeStarKeyV4(run,node)]?.conditions.every(Boolean));
  }
  cycleSpeed() {
    const speeds=this.a6Battle?[1,2,3]:[1,2,4];
    this.state.settings.speed=speeds[(speeds.indexOf(this.state.settings.speed)+1)%speeds.length]!;this.notify();
  }
  get canAutoContinue() {
    return this.autoContinue && this.screen==='result' && this.a6Battle && this.battle?.result==='party'
      && !!this.state.run && !this.state.run.complete && !this.error && !this.tutorialBattle && !this.replay && !this.galleryBattle;
  }
  continueBattle() {
    if (!this.canAutoContinue || this.state.v4?.journey?.pending.length) return;
    this.finish();
    if (this.error) return;
    const run=this.state.run;
    if (!run) return;
    if (run.complete) { if(run.towerA6)this.go('tower'); return; }
    if (run.rewardChoices.length) return;
    const next=R.availableNodes(run);
    if (next.length===1 && next[0]!.enemies.length) {this.enter(next[0]!.id);if(!this.error)this.fight();}
  }
  skip() {
    if (!this.canSkip) return;
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
    const snapshot = snapshotBattle(battle);
    const before = battle.log.length;
    const intent = battle.intents.find(candidate => candidate.actorId === actor.id);
    const softened = intent?.interrupted || actor.statuses.some(status => status.id === 'drowsy');
    const utility = !battle.v4 && ['heal', 'shield'].includes(R.ENEMY_BY_ID[actor.catalogId]?.mechanic ?? '')
      && !actor.statuses.some(status => status.id === 'hush');
    const signature = !softened && (intent?.signature || utility);
    const selected = actor.side === 'party' ? choice ?? R.chooseAction(battle, 'auto') : null;
    let skillId = selected?.skillId ?? '';
    let accepted = false;
    if (actor.side === 'enemy') {
      skillId = `${R.ENEMY_BY_ID[actor.catalogId]!.role}Attack`;
      accepted = R.enemyAct(battle);
    } else accepted = R.act(battle, selected!);
    if (!accepted) { this.notice = 'This recorded action could not be resolved.'; this.error = true; this.showResult(); return; }
    const presentation = splitPresentation(snapshot, battle, skillId);
    const targets = [...new Set(presentation.events.flatMap(event => event.targetIds))];
    if (!targets.length) targets.push(selected?.targetId ?? intent?.targetId ?? actor.id);
    const events: TurnEvent[] = [{ version: 3, seq: 0, turn: actor.turns, round: snapshot.round,
      actionId: battle.log.length, beat: 0, type: 'action_start', actorId: actor.id, skillId, targetIds: targets, amount: 0 },
      ...presentation.events];
    this.beforeImpact = snapshot;
    this.afterImpact = presentation.impact;
    this.roundPlan = presentation.roundPlan;
    this.impactApplied = false;
    const identity = actor.side === 'enemy'
      ? battle.log.slice(before).find(event=>event.kind==='enemy-action')?.skillId || `enemy:${actor.catalogId}${signature ? '' : ':basic'}` : skillId;
    const savingHeal = events.find(event => event.type === 'heal' && event.amount > 0
      && snapshot.actors.some(target => event.targetIds.includes(target.id) && target.hp / target.maxHp <= .25)
      && presentation.impact.actors.some(target => event.targetIds.includes(target.id) && target.hp / target.maxHp > .25));
    const lastHit = events.some(event => event.type === 'death')
      && presentation.impact.actors.filter(target => target.side === 'enemy').every(target => target.hp <= 0);
    this.momentNote = savingHeal ? 'Clutch heal' : lastHit ? 'Last hit' : '';
    if (savingHeal) savingHeal.note = 'Clutch heal';
    this.plan = paceActionA6(createCardActionPlan(events, identity), battle.initial);
    if(this.a6Battle && this.plan.ultimate && actor.side==='party'){
      this.ultimateBannersAt=this.ultimateBannersAt.filter(at=>this.playbackAt-at<10000);
      if(this.ultimateBannersAt.length<2){this.ultimateBannersAt.push(this.playbackAt);this.ultimateBannerUntil=this.playbackAt+800/this.state.settings.speed;}
      else this.ultimateBannerUntil=0;
    }
    const actionEvents = battle.log.slice(before);
    const combos = actionEvents.filter(event => event.kind === 'bond.combo');
    if (combos.length) { this.comboBanner = combos.map(event => event.text).join(' · '); this.comboBannerUntil = this.playbackAt + 1800; }
    Object.assign(this.plan, passivePresentation(snapshot, presentation.impact));
    if (this.roundPlan) Object.assign(this.roundPlan, passivePresentation(presentation.impact, battle));
    this.animationAt = 0;
    this.notify();
  }
  tick(milliseconds: number, now = performance.now()) {
    const previousFrame = this.playbackFrameAt;
    this.playbackFrameAt = now;
    if(typeof window!=='undefined')window.__thAudio?.speed(this.state.settings.speed);
    if(typeof window!=='undefined')window.__thAudio?.pause(this.paused);
    if (this.paused || !this.showBattle || (!this.sceneReady && !this.sceneError)) return;
    // The shared canvas caps its delta at 100 ms. Keep opted-in playback at
    // wall-clock speed on slow frames, without catching up an inactive tab.
    const elapsed = this.a6Battle && !this.galleryBattle && previousFrame !== undefined
      ? Math.max(milliseconds, Math.min(250, Math.max(0, now - previousFrame))) : milliseconds;
    this.playbackAt += elapsed;
    if (!this.plan) { if (this.battle?.result && !this.galleryBattle) this.showResult(); return; }
    this.animationAt += elapsed * (this.galleryBattle ? this.gallerySpeed : this.state.settings.speed);
    if (!this.galleryBattle && !this.impactApplied && this.impactVisible) {
      this.impactApplied = true;
      this.notify(false);
    }
    if (this.animationAt >= this.plan.duration) this.finishMoment();
  }
  finishMoment() {
    if (this.galleryBattle) { this.plan = null; this.notify(false); return; }
    this.momentNote = '';
    this.plan = this.roundPlan;
    this.roundPlan = null;
    this.animationAt = 0;
    this.beforeImpact = null;
    this.afterImpact = null;
    this.impactApplied = true;
    if (this.battle?.result && !this.plan) this.showResult();
    else this.notify(false);
  }
  step(policy: R.Policy = 'auto') {
    if (!this.canAct || !this.battle) return;
    this.act(R.currentActor(this.battle)?.side === 'party' ? R.chooseAction(this.battle, policy) : undefined);
  }
  finish() {
    if (this.replay) { this.clearReplay(); this.go(this.replayReturn); return; }
    if (this.tutorialBattle?.result) {
      this.tutorialBattle = null;
      this.sceneStarted = false;
      this.state.tutorial = 3;
      this.notice = R.gameplayA6(this.state) ? 'Welcome a free friend. Then level up a cat in Cats.' : 'A welcome invitation is ready. Then equip your first piece.';
      this.go('gacha'); this.notify(); return;
    }
    if (this.apply(R.finishEncounter(this.state), 'Choose a charm or strengthen one unlocked skill.')) this.go('map');
  }
  applyResultAdvice(advice: R.BuildAdviceV4) {
    if (this.screen !== 'result' || this.replay || this.tutorialBattle || this.galleryBattle) return;
    const run = this.state.run;
    if (!run || !this.apply(R.applyResultAdviceV4(this.state, advice), advice.label)) return;
    this.plan = null; this.watching = false; this.paused = false;
    if(run.towerA6){if(!this.apply(R.startTowerFloorA6(this.state,run.floor),'Try the same Tower floor with your upgrade.'))return;this.go('map');}
    else this.start(run.chapter, run.mode, run.challengeLevel);
    if (this.state.run && !this.state.run.complete) {
      const first = R.availableNodes(this.state.run)[0];
      if (first) this.enter(first.id);
    }
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
  private get replayRecording() {
    // A live encounter owns its choices until settlement, including when the
    // player opens Settings from its result. lastChoices is still empty then.
    const encounter = this.tutorialBattle ?? this.state.run?.battle;
    if (encounter) return encounter.result || encounter.choices.length
      ? { setup: encounter.initial, choices: encounter.choices } : null;
    return this.state.lastBattle && this.state.lastChoices.length
      ? { setup: this.state.lastBattle, choices: this.state.lastChoices } : null;
  }
  get canReplay() { return !this.replay && !this.galleryBattle && !this.watching && !!this.replayRecording; }
  private clearReplay() {
    this.replay = null; this.plan = null; this.watching = false; this.paused = false;
    if (!this.battle) this.sceneStarted = false;
  }
  replayLast() {
    if (!this.canReplay) return;
    const recording = this.replayRecording!;
    this.replayReturn = this.screen;
    this.replayChoices = [...recording.choices];
    this.replay = R.createBattle(recording.setup);
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
      const next = R.importSave(code, this.offline ? 0 : Date.now(), this.c2Mode);
      if (!this.offline) { next.relics = []; next.selectedRelic = null; }
      this.state = R.setGameplayV4(next, this.gameplayMode); if(this.skillsMode)this.state=R.setSkillsV5(this.state,true); this.state=R.setGameplayA6(this.state,this.a6Mode); if(this.c2Mode)this.state=R.setFormationC2(this.state); this.state.economyV3=chainFlags().economyV3; this.resetCafeClock(); this.tutorialBattle = null; this.replay = null; this.plan = null; this.galleryBattle = null;
      this.restoreEncounter();
      this.paused = false;
      this.cardId = next.team[0]!; this.itemId = next.gear[0]?.id ?? '';
      this.storageFailed = false; this.notice = 'Save imported and checksum verified.'; this.error = false; this.consumeFormationNotice(); this.notify();
    } catch (error) { this.error = true; this.notice = String(error); this.notify(false); }
  }
  reset() {
    this.state = R.setGameplayV4(R.createDepthAccount(11, this.offline ? 0 : Date.now()), this.gameplayMode);
    if(this.skillsMode)this.state=R.setSkillsV5(this.state,true);
    this.state=R.setGameplayA6(this.state,this.a6Mode); if(this.c2Mode)this.state=R.setFormationC2(this.state); this.state.economyV3=chainFlags().economyV3; this.resetCafeClock();
    this.tutorialBattle = null; this.replay = null; this.plan = null; this.galleryBattle = null;
    this.paused = false; this.watching = false;
    this.cardId = this.state.team[0]!; this.itemId = this.state.gear[0]?.id ?? '';
    this.storageFailed = false; this.notice = 'A fresh cafe is ready.'; this.consumeFormationNotice(); this.go('hub'); this.notify();
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
