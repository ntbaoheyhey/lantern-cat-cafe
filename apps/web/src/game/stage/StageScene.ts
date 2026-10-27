import Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { monsterArt } from '../../art/monsters';
import { backdropFor } from '../../art/backdrops';
import { bakeCat, CLASS_LOOKS } from '../rig';
import { buildIdleCues, CuePlayer, type CombatCue } from '../combat';
import { bakeMonster, equippedVisuals } from '../arena/assets';
import { claimedKills } from './progress';
import { computeFloorY, damageTextStyle, feedbackAt, scaleForMonster, visibleBounds } from './stageFx';

type Actor = Phaser.GameObjects.Sprite;
interface Hit { target: Actor; age: number; x: number; y: number; text: Phaser.GameObjects.Text; flash: Phaser.GameObjects.Image | null; missed: boolean }

export class StageScene extends Phaser.Scene {
  private visualKey = '';
  private montage: ((count: number) => void) | null = null;
  private applyMotion: (() => void) | null = null;
  private state0: ServerStateV2 | null = null;
  private cat: Actor | null = null;
  private monster: Actor | null = null;
  private director: { update(delta: number): void; destroy(): void } | null = null;
  private reduced = false;
  private ground: Phaser.GameObjects.Graphics | null = null;
  private hpBar: Phaser.GameObjects.Graphics | null = null;
  private hits: Hit[] = [];
  private floor = 84;
  private catWidth = 0;
  private monsterWidth = 0;
  private monsterHeight = 0;
  private hp: { value: number; max: number } | null = null;
  private homes: [number, number] = [0, 0];
  constructor() { super('v2-stage'); }
  create() {
    // Phaser enters RUNNING after create() returns; show() must wait for CREATE.
    const showQueuedState = () => { if (this.state0) this.show(this.state0, this.reduced); };
    this.events.once(Phaser.Scenes.Events.CREATE, showQueuedState);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.CREATE, showQueuedState);
      this.director?.destroy();
      this.clearFeedback();
    });
  }
  private clearFeedback() {
    for (const hit of this.hits) { hit.text.destroy(); hit.flash?.destroy(); }
    this.hits = [];
    this.ground?.destroy(); this.hpBar?.destroy();
    this.ground = null; this.hpBar = null; this.hp = null;
  }
  private bounds(sprite: Actor) {
    return visibleBounds(sprite.frame.width, sprite.frame.height,
      (x, y) => (this.textures.getPixelAlpha(x, y, sprite.texture.key, sprite.frame.name) ?? 0) > 0);
  }
  show(state: ServerStateV2, reducedMotion: boolean) {
    const before = this.state0, motionChanged = this.reduced !== reducedMotion;
    this.state0 = state; this.reduced = reducedMotion;
    if (!this.sys.isActive() || !state.cat.classId) return;
    const visuals = equippedVisuals(state);
    const key = JSON.stringify([state.cat.classId, state.progress.chapter, state.progress.round,
      Object.entries(visuals).sort(([a], [b]) => a.localeCompare(b))]);
    const count = Math.min(8, claimedKills(before, state));
    if (key === this.visualKey && this.cat && this.monster) {
      if (motionChanged) this.applyMotion?.();
      if (count > 0) this.montage?.(count);
      return;
    }
    this.visualKey = key;
    this.director?.destroy(); this.clearFeedback(); this.cat?.destroy(); this.monster?.destroy();
    if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') {
      const canvas = this.game.canvas;
      canvas.dataset.stageRebuilds = String(Number(canvas.dataset.stageRebuilds ?? 0) + 1);
    }
    const cls = state.cat.classId;
    const sheet = bakeCat(this, CLASS_LOOKS[cls], visuals);
    this.floor = computeFloorY(this.scale.height, backdropFor(state.progress.chapter).floorY);
    const width = this.scale.width;
    this.homes = [Math.round(width * .3), Math.round(width * .7)];
    this.cat = this.add.sprite(this.homes[0], this.floor, sheet.key, 'idle:0').setOrigin(sheet.origin.x, sheet.origin.y);
    const catBounds = this.bounds(this.cat);
    this.catWidth = catBounds.width;
    const chapter = v2.CHAPTERS.find(ch => ch.index === state.progress.chapter)!;
    const art = monsterArt(chapter.regulars[(state.progress.round - 1) % chapter.regulars.length]!)!;
    const anims = bakeMonster(this, art);
    this.monster = this.add.sprite(this.homes[1], this.floor, anims.walk, '0').setOrigin(.5, 1);
    const bounds = this.bounds(this.monster);
    const scale = scaleForMonster(catBounds.height, bounds.height, art.kind === 'boss');
    this.monster.setScale(scale);
    this.monsterWidth = bounds.width * scale; this.monsterHeight = bounds.height * scale;
    this.ground = this.add.graphics().setDepth(-1);
    this.hpBar = this.add.graphics().setDepth(2);
    const pose = (actor: Actor, key: string, frame: string) => {
      actor.play(key);
      if (this.reduced) actor.stop().setFrame(frame);
    };
    this.applyMotion = () => {
      pose(this.monster!, anims.walk, '0');
      const idle = this.reduced || this.state0!.progress.gated;
      pose(this.cat!, sheet.anims[idle ? 'idle' : 'walk'].key, idle ? 'idle:0' : 'walk:0');
    };
    this.applyMotion();

    // Reuse the existing combat timeline; stage-only rendering avoids the arena director's
    // knockback, defeat hops and pooled numbers, which have different motion/timing rules.
    const handle = (cue: CombatCue) => {
      switch (cue.type) {
        case 'spawn':
          this.hp = { value: cue.maxHp, max: cue.maxHp };
          pose(this.monster!, anims.walk, '0');
          break;
        case 'attackStart':
          pose(this.cat!, sheet.anims.attack.key, 'attack:0');
          break;
        case 'impact':
          if (this.hp) this.hp.value = cue.hp;
          pose(this.monster!, anims.hit, '0');
          this.hit(this.monster!, cue.damage, cue.crit, false);
          pose(this.cat!, sheet.anims.idle.key, 'idle:0');
          break;
        case 'dot':
          if (this.hp) this.hp.value = cue.hp;
          this.hit(this.monster!, cue.damage, false, false);
          break;
        case 'bossImpact':
          this.hit(this.cat!, cue.damage, cue.big, cue.dodged);
          break;
        case 'defeat':
          // Keep feet grounded; the next spawn resets the pose without a hop/fade.
          pose(this.monster!, anims.defeat, '0');
          break;
      }
    };
    const monster = v2.monsterAt(art.id, v2.stageOf(state.progress.chapter, state.progress.round));
    const cuesFor = (cycles: number) => {
      const current = this.state0!;
      const stats = v2.deriveStats({ classId: cls, level: current.cat.level }, current.inventory.filter(i => i.equipped).map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus })));
      return buildIdleCues(stats, monster, { cycles });
    };
    let player = new CuePlayer(cuesFor(Math.max(1, count)), handle), alive = true;
    let montage = count > 0;
    // A credited claim replaces only the compressed timeline; sprites and feedback stay alive.
    this.montage = cycles => { player = new CuePlayer(cuesFor(cycles), handle); montage = true; };
    this.director = {
      update: delta => {
        if (!alive || (this.state0!.progress.gated && !montage)) return;
        player.advance(delta);
        if (player.done) {
          montage = false;
          if (!this.state0!.progress.gated) player = new CuePlayer(cuesFor(1), handle);
        }
      },
      destroy: () => { alive = false; },
    };
    this.drawGround();
  }
  relayout() {
    this.floor = computeFloorY(this.scale.height, backdropFor(this.state0?.progress.chapter ?? 1).floorY);
    this.homes = [Math.round(this.scale.width * .3), Math.round(this.scale.width * .7)];
    this.cat?.setPosition(this.homes[0], this.floor);
    this.monster?.setPosition(this.homes[1], this.floor);
    for (const hit of this.hits) {
      const nextX = hit.target === this.cat ? this.homes[0] : this.homes[1];
      hit.x = nextX;
    }
    this.drawGround();
  }
  private hit(target: Actor, damage: number, big: boolean, missed: boolean) {
    const css = getComputedStyle(this.game.canvas);
    const colors = { accent: css.getPropertyValue('--accent').trim() || '#ff9a4a', muted: css.getPropertyValue('--muted').trim() || '#b8a9c9', font: css.getPropertyValue('--font-num').trim() || '"JetBrains Mono", monospace' };
    const y = this.floor - (target === this.monster ? this.monsterHeight : this.bounds(target).height) - 6;
    const text = this.add.text(target.x, y, missed ? 'Miss' : `${Math.round(damage)}`, damageTextStyle(big, missed, colors)).setOrigin(.5, 1).setDepth(3);
    // Canvas Phaser does not render sprite tints. Cache a white silhouette of the
    // actual hit frame instead, preserving transparency rather than flashing a box.
    let flash: Phaser.GameObjects.Image | null = null;
    if (!missed) {
      const frame = target.frame, key = `stage-flash:${target.texture.key}:${frame.name}`;
      if (!this.textures.exists(key)) {
        const texture = this.textures.createCanvas(key, frame.width, frame.height)!;
        texture.context.drawImage(frame.source.image as HTMLCanvasElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.width, frame.height);
        texture.context.globalCompositeOperation = 'source-in';
        texture.context.fillStyle = '#ffffff';
        texture.context.fillRect(0, 0, frame.width, frame.height);
        texture.refresh();
      }
      flash = this.add.image(target.x, target.y, key).setOrigin(target.originX, target.originY).setScale(target.scaleX, target.scaleY).setDepth(1);
    }
    // Cap scene objects even when many cue impacts share a frame.
    if (this.hits.length >= 12) { const oldest = this.hits.shift()!; oldest.text.destroy(); oldest.flash?.destroy(); }
    this.hits.push({ target, age: 0, x: target.x, y, text, flash, missed });
  }
  private drawGround() {
    const cat = this.cat, monster = this.monster;
    if (!cat || !monster) return;
    this.ground?.clear().fillStyle(0x000000, .35)
      .fillEllipse(cat.x, this.floor, this.catWidth * .7, 4)
      .fillEllipse(monster.x, this.floor, this.monsterWidth * .7, 4);
    const bar = this.hpBar?.clear();
    if (this.hp && bar) {
      const w = Math.round(this.monsterWidth), x = Math.round(monster.x - w / 2), y = Math.round(this.floor - this.monsterHeight - 4);
      bar.fillStyle(0x241b30).fillRect(x, y, w, 3)
        .fillStyle(0xd64f59).fillRect(x, y, Math.round(w * Math.max(0, this.hp.value) / this.hp.max), 3);
    }
  }
  update(_time: number, delta: number) {
    // Restore home before consuming cues, so simultaneous impacts never accumulate drift.
    this.cat?.setPosition(this.homes[0], this.floor).clearTint();
    this.monster?.setPosition(this.homes[1], this.floor).clearTint();
    this.director?.update(delta);
    for (const hit of this.hits) {
      const fx = feedbackAt(hit.age, this.reduced);
      if (!hit.missed) {
        hit.target.x = (hit.target === this.cat ? this.homes[0] : this.homes[1]) + fx.shake;
      }
      hit.flash?.setPosition(hit.target.x, hit.target.y).setVisible(fx.flash);
      hit.text.setPosition(hit.x, hit.y - fx.rise).setAlpha(fx.alpha);
      hit.age += delta;
    }
    this.hits = this.hits.filter(hit => {
      if (feedbackAt(hit.age, this.reduced).done) { hit.text.destroy(); hit.flash?.destroy(); return false; }
      return true;
    });
    this.drawGround();
  }
}
