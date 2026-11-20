import { ImpactPool } from '../../visual/impact';
import { VISUAL_PALETTE as C } from '../../visual/tokens';
import Phaser from 'phaser';
import { CONFIG, v2 } from '@taskbar-hero/game-rules';
import type { BossFightResultV2 } from '../../api/GameApiV2';
import { monsterArt } from '../../art/monsters';
import { backdropFor } from '../../art/backdrops';
import { bakeCat, CLASS_LOOKS, type CatSheet } from '../rig';
import { bakeMonster, equippedVisuals } from './assets';
import { ArenaPlayback } from './playback';
import { finalState, type ArenaCue, type ArenaCueOptions } from './cues';

export interface ArenaSceneData extends ArenaCueOptions {
  result: BossFightResultV2;
  ready(skip: () => void): void;
  done(): void;
  hp(catHp: number, bossHp: number): void;
  phase?(phase: string): void;
}
export class ArenaScene extends Phaser.Scene {
  private input0!: ArenaSceneData;
  private replay!: ArenaPlayback;
  private cat!: Phaser.GameObjects.Sprite;
  private boss!: Phaser.GameObjects.Sprite;
  private sheet!: CatSheet;
  private bossAnims!: ReturnType<typeof bakeMonster>;
  private pendingHeavy = 0;
  private pendingQuick = 0;
  private danger: Phaser.GameObjects.Graphics | null = null;
  private bars!: Phaser.GameObjects.Graphics;
  private catHp = 0;
  private bossHp = 0;
  private ended = false;
  private impact: ImpactPool | null = null;
  private chipHp = 0;
  private critStop = 0;
  private labels: Phaser.GameObjects.Text[] = [];
  private shots: Phaser.GameObjects.Arc[] = [];
  private clearFx() {
    for (const object of this.labels) { this.tweens.killTweensOf(object); object.destroy(); }
    for (const object of this.shots) { this.tweens.killTweensOf(object); object.destroy(); }
    this.labels.length = 0; this.shots.length = 0; this.impact?.clear(); this.danger?.clear(); this.pendingHeavy = 0; this.pendingQuick = 0; this.critStop = 0; if (this.anims) this.anims.globalTimeScale = this.replay?.speed ?? 1;
  }
  constructor() { super('boss-arena'); }
  init(data: ArenaSceneData) { this.input0 = data; }
  create() {
    const d = this.input0;
    const floor = backdropFor(d.chapter).floorY * 2;
    this.sheet = bakeCat(this, CLASS_LOOKS[d.classId], equippedVisuals(d.result.state));
    this.cat = this.add.sprite(110, floor, this.sheet.key, 'idle:0').setOrigin(this.sheet.origin.x, this.sheet.origin.y).setScale(2);
    const art = monsterArt(v2.CHAPTERS.find(c => c.index === d.chapter)!.boss)!;
    this.bossAnims = bakeMonster(this, art);
    this.boss = this.add.sprite(380, floor, this.bossAnims.idle, '0').setOrigin(0.5, 1).setScale(2);
    if (!d.reducedMotion) { this.cat.play(this.sheet.anims.idle.key); this.boss.play(this.bossAnims.idle); }
    this.danger = this.add.graphics().setDepth(8);
    this.bars = this.add.graphics().setDepth(10);
    this.impact = new ImpactPool(this.add.graphics().setDepth(15));
    this.catHp = Math.max(0, d.catMaxHp);
    this.bossHp = v2.bossOfChapter(d.chapter).hp; this.chipHp = this.bossHp;
    this.drawBars();
    this.replay = new ArenaPlayback(d.result, d, { cue: cue => this.applyCue(cue), finish: state => this.finish(state) });
    d.ready(() => this.replay.skip());
    this.anims.globalTimeScale = this.replay.speed;
    const visibility = () => this.replay.visibility(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      this.clearFx(); this.impact?.destroy(); this.impact = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
    this.events.once(Phaser.Scenes.Events.DESTROY, dispose);
    visibility();
    this.replay.advance(0);
  }
  update(_time: number, delta: number) {
    if (document.hidden) return;
    this.replay?.advance(delta); this.impact?.update(delta);
    if (this.critStop > 0) { this.critStop -= Math.min(delta, 50); if (this.critStop <= 0) this.anims.globalTimeScale = this.replay?.speed ?? 1; }
    if (this.chipHp > this.bossHp) { this.chipHp = this.input0.reducedMotion ? this.bossHp : Math.max(this.bossHp, this.chipHp - v2.bossOfChapter(this.input0.chapter).hp * Math.min(delta, 50) / CONFIG.gameplay.juice.chipTrailMs); this.drawBars(false); }
  }
  private number(text: string, target: 'cat' | 'boss', color: string = C.paper, big = false) {
    if (this.labels.length >= Math.min(CONFIG.gameplay.juice.maxLabels, CONFIG.gameplay.juice.maxTweens - this.shots.length)) { const oldest = this.labels.shift()!; this.tweens.killTweensOf(oldest); oldest.destroy(); }
    const label = this.add.text(target === 'cat' ? 110 : 380, 60, text, { fontFamily: 'monospace', fontSize: big && !this.input0.reducedMotion ? '25px' : '18px', color, stroke: C.ink, strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.labels.push(label);
    this.tweens.add({ targets: label, y: this.input0.reducedMotion ? 60 : 36, alpha: 0, duration: this.input0.reducedMotion ? CONFIG.gameplay.juice.calmLabelMs : CONFIG.gameplay.juice.labelMs, onComplete: () => label.destroy() });
  }
  private drawBars(notify = true) {
    const catMax = Math.max(1, this.input0.catMaxHp), bossMax = Math.max(1, v2.bossOfChapter(this.input0.chapter).hp);
    this.bars.clear().fillStyle(0x121522, 0.95);
    this.bars.fillRect(34, 16, 152, 10).fillRect(304, 16, 152, 10);
    this.bars.fillStyle(0xa5d5ad).fillRect(35, 17, 150 * Phaser.Math.Clamp(this.catHp / catMax, 0, 1), 8);
    this.bars.fillStyle(0xf5cb7b).fillRect(305, 17, 150 * Phaser.Math.Clamp(this.chipHp / bossMax, 0, 1), 8);
    this.bars.fillStyle(0xd87c88).fillRect(305, 17, 150 * Phaser.Math.Clamp(this.bossHp / bossMax, 0, 1), 8);
    if (notify) this.input0.hp(this.catHp, this.bossHp);
  }
  private catPose(name: 'attack' | 'hurt' | 'defeat' | 'victory') {
    if (!this.input0.reducedMotion) this.cat.play(this.sheet.anims[name].key);
  }
  private bossPose(name: 'hit' | 'windup' | 'attack' | 'defeat') {
    if (!this.input0.reducedMotion) this.boss.play(this.bossAnims[name]);
  }
  private drawThreat(settled = 'Reading the room') {
    const heavy = this.pendingHeavy > 0, active = heavy || this.pendingQuick > 0;
    this.danger?.clear();
    this.input0.phase?.(heavy ? 'Heavy windup · brace for impact' : active ? 'Quick windup · watch the floor' : settled);
    if (!active) return;
    const floor = backdropFor(this.input0.chapter).floorY * 2;
    this.danger?.fillStyle(parseInt((heavy ? C.coral : C.gold).slice(1), 16), 0.7);
    for (let x = 68; x <= 152; x += 12) {
      this.danger?.fillRect(x, floor + 3, 8, 3);
      if (heavy) this.danger?.fillRect(x, floor + 9, 8, 3);
    }
  }
  private applyCue(cue: ArenaCue) {
    switch (cue.type) {
      case 'spawn': break;
      case 'attackStart': this.catPose('attack'); break;
      case 'release': {
        if (this.input0.reducedMotion) break;
        if (this.shots.length >= Math.min(CONFIG.gameplay.juice.maxProjectiles, CONFIG.gameplay.juice.maxTweens - this.labels.length)) { const oldest = this.shots.shift()!; this.tweens.killTweensOf(oldest); oldest.destroy(); }
        const projectile = this.add.circle(135, 116, 3, cue.kind === 'arrow' ? 0xffd27b : cue.kind === 'bolt' ? 0xba98ef : 0xa5d5ad);
        this.shots.push(projectile);
        this.tweens.add({ targets: projectile, x: 380, duration: cue.travelMs, onComplete: () => projectile.destroy() });
        break;
      }
      case 'impact':
        this.bossHp = Math.max(0, cue.hp); this.bossPose('hit'); this.number(`${Math.round(cue.damage)}${cue.crit ? '!' : ''}`, 'boss', cue.crit ? C.gold : C.paper, cue.crit); this.drawBars();
        if (!this.input0.reducedMotion) { this.impact?.burst(380, 115, cue.crit); if (cue.crit && this.anims) { this.critStop = CONFIG.gameplay.juice.critStopMs; this.anims.globalTimeScale = 0; } } break;
      case 'dot': this.bossHp = Math.max(0, cue.hp); this.number(`${cue.source}: ${Math.round(cue.damage)}`, 'boss', cue.source === 'burn' ? '#ffb870' : '#a2e997'); this.drawBars(); break;
      case 'bossWindup': {
        this.bossPose('windup');
        if (cue.big) this.pendingHeavy++; else this.pendingQuick++;
        this.drawThreat();
        this.number(cue.big ? 'HEAVY !' : '!', 'boss', C.gold); break;
      }
      case 'bossImpact':
        if (cue.big) this.pendingHeavy = Math.max(0, this.pendingHeavy - 1); else this.pendingQuick = Math.max(0, this.pendingQuick - 1);
        this.drawThreat(cue.dodged ? 'Auto-dodge · Mochi avoided the strike' : 'Recovery · Mochi keeps attacking');
        this.bossPose('attack'); this.catHp = Math.max(0, cue.catHp);
        if (!cue.dodged) this.catPose('hurt');
        this.number(cue.dodged ? 'Dodged' : String(Math.round(cue.damage)), 'cat'); this.drawBars(); break;
      case 'flash':
        if (!this.input0.reducedMotion) { const target = cue.target === 'cat' ? this.cat : this.boss; target.setTintFill(0xfff1d6); this.time.delayedCall(CONFIG.gameplay.juice.flashMs, () => target.clearTint()); }
        break;
      case 'shake': if (!this.input0.reducedMotion) this.cameras.main.shake(CONFIG.gameplay.juice.shakeMs, (cue.big ? CONFIG.gameplay.juice.maxShakePx : CONFIG.gameplay.juice.maxShakePx / 2) / Math.max(512, this.game?.canvas?.clientWidth ?? 512)); break;
      case 'defeat': case 'bossDefeat': this.bossPose('defeat'); break;
      case 'catDefeat': this.catPose('defeat'); break;
      case 'end': case 'cycleEnd': break;
    }
  }
  private finish(state: ReturnType<typeof finalState>) {
    if (this.ended) return;
    this.ended = true; this.clearFx();
    this.catHp = state.catHp; this.bossHp = state.bossHp; this.chipHp = state.bossHp; this.drawBars();
    this.catPose(state.won ? 'victory' : 'defeat');
    if (state.won) { this.bossPose('defeat'); if (!this.input0.reducedMotion) this.impact?.burst(380, 140, true, true); }
    this.add.text(256, 45, state.won ? 'Boss defeated!' : 'Rest, then try again', { fontFamily: 'monospace', fontSize: '20px', color: C.paper, stroke: C.ink, strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    this.input0.phase?.(state.won ? 'Victory · room cleared' : 'Rest · keep your key and improve gear');
    this.input0.done();
  }
}
