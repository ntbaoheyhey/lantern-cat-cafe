import Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
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
}
export class ArenaScene extends Phaser.Scene {
  private input0!: ArenaSceneData;
  private replay!: ArenaPlayback;
  private cat!: Phaser.GameObjects.Sprite;
  private boss!: Phaser.GameObjects.Sprite;
  private sheet!: CatSheet;
  private bossAnims!: ReturnType<typeof bakeMonster>;
  private bars!: Phaser.GameObjects.Graphics;
  private catHp = 0;
  private bossHp = 0;
  private ended = false;
  private labels: Phaser.GameObjects.Text[] = [];
  private shots: Phaser.GameObjects.Arc[] = [];
  private clearFx() {
    for (const object of this.labels) { this.tweens.killTweensOf(object); object.destroy(); }
    for (const object of this.shots) { this.tweens.killTweensOf(object); object.destroy(); }
    this.labels.length = 0; this.shots.length = 0;
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
    this.bars = this.add.graphics().setDepth(10);
    this.catHp = Math.max(0, d.catMaxHp);
    this.bossHp = v2.bossOfChapter(d.chapter).hp;
    this.drawBars();
    this.replay = new ArenaPlayback(d.result, d, { cue: cue => this.applyCue(cue), finish: state => this.finish(state) });
    d.ready(() => this.replay.skip());
    this.anims.globalTimeScale = this.replay.speed;
    const visibility = () => this.replay.visibility(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { document.removeEventListener('visibilitychange', visibility); this.clearFx(); });
    visibility();
    this.replay.advance(0);
  }
  update(_time: number, delta: number) { this.replay?.advance(delta); }
  private number(text: string, target: 'cat' | 'boss', color = '#fff3d0') {
    if (this.labels.length >= 12) { const oldest = this.labels.shift()!; this.tweens.killTweensOf(oldest); oldest.destroy(); }
    const label = this.add.text(target === 'cat' ? 110 : 380, 60, text, { fontFamily: 'monospace', fontSize: '18px', color, stroke: '#1c1428', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.labels.push(label);
    this.tweens.add({ targets: label, y: this.input0.reducedMotion ? 60 : 36, alpha: 0, duration: this.input0.reducedMotion ? 220 : 650, onComplete: () => label.destroy() });
  }
  private drawBars() {
    const catMax = Math.max(1, this.input0.catMaxHp), bossMax = Math.max(1, v2.bossOfChapter(this.input0.chapter).hp);
    this.bars.clear().fillStyle(0x281b34, 0.95);
    this.bars.fillRect(34, 16, 152, 10).fillRect(304, 16, 152, 10);
    this.bars.fillStyle(0x8edb9b).fillRect(35, 17, 150 * Phaser.Math.Clamp(this.catHp / catMax, 0, 1), 8);
    this.bars.fillStyle(0xf38e8e).fillRect(305, 17, 150 * Phaser.Math.Clamp(this.bossHp / bossMax, 0, 1), 8);
    this.input0.hp(this.catHp, this.bossHp);
  }
  private catPose(name: 'attack' | 'hurt' | 'defeat' | 'victory') {
    if (!this.input0.reducedMotion) this.cat.play(this.sheet.anims[name].key);
  }
  private bossPose(name: 'hit' | 'windup' | 'attack' | 'defeat') {
    if (!this.input0.reducedMotion) this.boss.play(this.bossAnims[name]);
  }
  private applyCue(cue: ArenaCue) {
    switch (cue.type) {
      case 'spawn': break;
      case 'attackStart': this.catPose('attack'); break;
      case 'release': {
        if (this.input0.reducedMotion) break;
        if (this.shots.length >= 8) { const oldest = this.shots.shift()!; this.tweens.killTweensOf(oldest); oldest.destroy(); }
        const projectile = this.add.circle(135, 116, 3, cue.kind === 'arrow' ? 0xffd27b : cue.kind === 'bolt' ? 0xba98ef : 0x8edb9b);
        this.shots.push(projectile);
        this.tweens.add({ targets: projectile, x: 380, duration: cue.travelMs, onComplete: () => projectile.destroy() });
        break;
      }
      case 'impact':
        this.bossHp = Math.max(0, cue.hp); this.bossPose('hit'); this.number(`${Math.round(cue.damage)}${cue.crit ? '!' : ''}`, 'boss', cue.crit ? '#ffd27b' : undefined); this.drawBars(); break;
      case 'dot': this.bossHp = Math.max(0, cue.hp); this.number(`${cue.source}: ${Math.round(cue.damage)}`, 'boss', cue.source === 'burn' ? '#ffb870' : '#a2e997'); this.drawBars(); break;
      case 'bossWindup': this.bossPose('windup'); this.number(cue.big ? 'Big attack!' : 'Watch out', 'cat'); break;
      case 'bossImpact':
        this.bossPose('attack'); this.catHp = Math.max(0, cue.catHp);
        if (!cue.dodged) this.catPose('hurt');
        this.number(cue.dodged ? 'Dodged' : String(Math.round(cue.damage)), 'cat'); this.drawBars(); break;
      case 'flash':
        if (!this.input0.reducedMotion) { const target = cue.target === 'cat' ? this.cat : this.boss; target.setTintFill(0xffffff); this.time.delayedCall(70, () => target.clearTint()); }
        break;
      case 'shake': if (!this.input0.reducedMotion) this.cameras.main.shake(90, cue.big ? 0.008 : 0.003); break;
      case 'defeat': case 'bossDefeat': this.bossPose('defeat'); break;
      case 'catDefeat': this.catPose('defeat'); break;
      case 'end': case 'cycleEnd': break;
    }
  }
  private finish(state: ReturnType<typeof finalState>) {
    if (this.ended) return;
    this.ended = true; this.clearFx();
    this.catHp = state.catHp; this.bossHp = state.bossHp; this.drawBars();
    this.catPose(state.won ? 'victory' : 'defeat');
    if (state.won) this.bossPose('defeat');
    this.add.text(256, 45, state.won ? 'Boss defeated!' : 'Rest, then try again', { fontFamily: 'monospace', fontSize: '20px', color: '#fff3d0', stroke: '#281b34', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    this.input0.done();
  }
}
