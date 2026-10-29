import Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { monsterArt, monsterPilotArt, type MonsterArt } from '../../art/monsters';
import { backdropFor } from '../../art/backdrops';
import { bakeCat, CLASS_LOOKS, type CatSheet } from '../rig';
import { buildIdleCues, CuePlayer, Pool, type CombatCue } from '../combat';
import { drawProjectile, type Projectile } from '../combat/effects';
import { bakeMonster, equippedVisuals, preloadMonsterArt } from '../arena/assets';
import { computeFloorY, damageTextStyle, horizontalBounds, scaleForMonster, visibleBounds } from './stageFx';
import { APPROACH_MS, DEFEAT_MS, HIDDEN_RESULT_MS, claimMontage, contactX, expectedCatHp, frontierMonster, stageStats, bossReady } from './choreography';

type Actor = Phaser.GameObjects.Sprite;
interface Hit { target: Actor; age: number; x: number; y: number; text: Phaser.GameObjects.Text; flash: Phaser.GameObjects.Image; missed: boolean }
interface Plan { id: string; anims: ReturnType<typeof bakeMonster>; scale: number; width: number; height: number; enemyInterval: number; left: number; hitLeft: number; flash: string; fight: v2.MonsterFight; cues: CombatCue[]; hp: number; credited: boolean }

interface MonsterMetrics {
  b: ReturnType<typeof visibleBounds>;
  scale: number;
  left: number;
  hitLeft: number;
}
const globalMonsterMetrics = new Map<string, MonsterMetrics>();
const globalCatBoundsCache = new Map<string, { width: number; height: number; edges: Map<string, { left: number; right: number }> }>();
const globalAlphaCache = new Map<string, Uint8ClampedArray>();

function computeMonsterMetrics(art: MonsterArt, catHeight: number): MonsterMetrics {
  const activeArt = monsterPilotArt(art.id) ?? art;
  const walkFrames = activeArt.frames.walk ?? activeArt.frames.idle!;
  const walk0 = walkFrames[0]!;
  const w = activeArt.size.w;
  const h = activeArt.size.h;

  const isWalkOpaque = (x: number, y: number): boolean => {
    const row = walk0[y];
    return row !== undefined && x < row.length && row[x] !== '.';
  };

  const b = visibleBounds(w, h, isWalkOpaque);
  const scale = scaleForMonster(catHeight, b.height, activeArt.kind === 'boss');
  const left = horizontalBounds(w, h, 0.5, scale, isWalkOpaque).left;

  const hitFrames = activeArt.frames.hit ?? activeArt.frames.idle ?? activeArt.frames.walk!;
  const hit0 = hitFrames[0]!;
  const isHitOpaque = (x: number, y: number): boolean => {
    const row = hit0[y];
    return row !== undefined && x < row.length && row[x] !== '.';
  };
  const hitLeft = horizontalBounds(w, h, 0.5, scale, isHitOpaque).left;

  return { b, scale, left, hitLeft };
}

/** A preview of the analytic idle fight. Only acknowledged claims update the kill track. */
export class StageScene extends Phaser.Scene {
  private visualKey = '';
  private state0: ServerStateV2 | null = null;
  private cat: Actor | null = null;
  private monster: Actor | null = null;
  private sheet!: CatSheet;
  private reduced = false;
  private ground: Phaser.GameObjects.Graphics | null = null;
  private hpBar: Phaser.GameObjects.Graphics | null = null;
  private projectiles: Phaser.GameObjects.Graphics | null = null;
  private hits: Pool<Hit> | null = null;
  private shots = new Pool<Projectile>(8, () => ({ kind: 'arrow', age: 0, dur: 1, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  private floor = 84;
  private preloadedBosses = false;
  private catWidth = 0;
  private catHeight = 0;
  private catFlash = '';
  private monsterLeft = 0;
  private attackDuration = 0;
  private attackInterval = 1000;
  private weapon!: v2.WeaponProfile;
  private hp: { value: number; max: number } | null = null;
  private catHp = 0;
  private maxHp = 1;
  private homes: [number, number] = [0, 0];
  private catEdges = new Map<string, { left: number; right: number }>();
  private preview!: Plan;
  private plans: Plan[] = [];
  private planIndex = 0;
  private plan!: Plan;
  private age = 0;
  private defeatedAt = -1;
  private defeatPose = false;
  private lungeAt = -1;
  private attackAt = -1;
  private player!: CuePlayer;
  private nextEnemyAttack = 0;
  private halt = false;
  private hiddenAt: number | null = null;
  private suppressMontage = false;
  private director: { update(delta: number): void; destroy(): void } | null = null;
  constructor() { super('v2-stage'); }
  create() {
    const showQueuedState = () => { if (this.state0) this.show(this.state0, this.reduced); };
    this.events.once(Phaser.Scenes.Events.CREATE, showQueuedState);
    const visibility = () => {
      if (document.hidden) { this.hiddenAt = Date.now(); return; }
      if (this.hiddenAt !== null && Date.now() - this.hiddenAt >= HIDDEN_RESULT_MS) {
        this.suppressMontage = true;
        if (this.preview) { this.plans = []; this.begin(this.preview); }
      }
      this.hiddenAt = null;
    };
    document.addEventListener('visibilitychange', visibility);
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      this.events.off(Phaser.Scenes.Events.CREATE, showQueuedState);
      this.director?.destroy(); this.clearFeedback();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
    this.events.once(Phaser.Scenes.Events.DESTROY, dispose);
  }
  private clearFeedback() {
    for (const hit of this.hits?.all() ?? []) { hit.text.destroy(); hit.flash.destroy(); }
    this.hits = null; this.shots.releaseAll();
    this.ground?.destroy(); this.hpBar?.destroy(); this.projectiles?.destroy();
    this.ground = null; this.hpBar = null; this.projectiles = null; this.hp = null;
  }
  private isPixelOpaque(sprite: Actor, x: number, y: number): boolean {
    const key = sprite.texture.key;
    if (typeof this.textures.get !== 'function') {
      return (this.textures.getPixelAlpha(x, y, key, sprite.frame.name) ?? 0) > 0;
    }
    let alpha = globalAlphaCache.get(key);
    if (!alpha) {
      if (!this.textures.exists(key)) return false;
      const texture = this.textures.get(key);
      if (!texture || typeof texture.getSourceImage !== 'function') {
        return (this.textures.getPixelAlpha(x, y, key, sprite.frame.name) ?? 0) > 0;
      }
      const canvas = texture.getSourceImage() as HTMLCanvasElement;
      if (!canvas || !canvas.getContext) {
        return (this.textures.getPixelAlpha(x, y, key, sprite.frame.name) ?? 0) > 0;
      }
      const readback = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (readback && readback.getContext) {
        readback.width = canvas.width;
        readback.height = canvas.height;
        const readCtx = readback.getContext('2d', { willReadFrequently: true });
        if (readCtx) {
          readCtx.drawImage(canvas, 0, 0);
          alpha = readCtx.getImageData(0, 0, readback.width, readback.height).data;
          globalAlphaCache.set(key, alpha);
        }
      }
      if (!alpha) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return false;
        alpha = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        globalAlphaCache.set(key, alpha);
      }
    }
    const frame = sprite.frame;
    const src = sprite.texture.getSourceImage?.() as HTMLCanvasElement;
    const canvasWidth = src?.width ?? frame.width;
    const idx = ((frame.cutY + y) * canvasWidth + (frame.cutX + x)) * 4 + 3;
    return (alpha[idx] ?? 0) > 0;
  }
  private bounds(sprite: Actor) {
    return visibleBounds(sprite.frame.width, sprite.frame.height,
      (x, y) => this.isPixelOpaque(sprite, x, y));
  }
  private edge(sprite: Actor) {
    return horizontalBounds(sprite.frame.width, sprite.frame.height, sprite.originX, sprite.scaleX,
      (x, y) => this.isPixelOpaque(sprite, x, y));
  }
  private flashTexture(sprite: Actor) {
    const frame = sprite.frame, key = `stage-flash:${sprite.texture.key}:${frame.name}`;
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, frame.width, frame.height)!;
      texture.context.drawImage(frame.source.image as HTMLCanvasElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.width, frame.height);
      texture.context.globalCompositeOperation = 'source-in'; texture.context.fillStyle = '#ffffff';
      texture.context.fillRect(0, 0, frame.width, frame.height); texture.refresh();
    }
    return key;
  }
  private monsterFlash(hitKey: string): string {
    const key = `stage-flash:${hitKey}:0`;
    if (!this.textures.exists(key)) {
      if (this.textures.exists(hitKey)) {
        const tex = this.textures.get(hitKey);
        const frame = tex?.has?.('0') ? tex.get('0') : null;
        if (frame) {
          const t = this.textures.createCanvas(key, frame.width, frame.height);
          if (t && t.context) {
            t.context.drawImage(frame.source.image as HTMLCanvasElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.width, frame.height);
            t.context.globalCompositeOperation = 'source-in';
            t.context.fillStyle = '#ffffff';
            t.context.fillRect(0, 0, frame.width, frame.height);
            t.refresh();
          }
        }
      }
    }
    return key;
  }
  private pose(actor: Actor, key: string, _frame: string) {
    if (this.reduced) actor.stop();
    else actor.play(key, true);
  }
  show(state: ServerStateV2, reducedMotion: boolean) {
    const before = this.state0, motionChanged = this.reduced !== reducedMotion;
    this.state0 = state; this.reduced = reducedMotion;
    if (!this.sys.isActive() || !state.cat.classId) return;
    if (!this.preloadedBosses) {
      this.preloadedBosses = true;
      const preload = () => {
        for (const ch of v2.CHAPTERS) {
          const art = monsterArt(ch.boss);
          if (art && typeof preloadMonsterArt === 'function') preloadMonsterArt(art);
        }
      };
      if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(preload, { timeout: 500 });
      else setTimeout(preload, 50);
    }
    const visuals = equippedVisuals(state);
    const key = JSON.stringify([state.cat.classId, state.progress.chapter,
      Object.entries(visuals).sort(([a], [b]) => a.localeCompare(b))]);
    const stats = stageStats(state);
    const cls = state.cat.classId;
    const rebuild = key !== this.visualKey || !this.cat || !this.monster;
    const changed = rebuild || motionChanged || !before || before.cat.level !== state.cat.level ||
      JSON.stringify(before.progress) !== JSON.stringify(state.progress) ||
      JSON.stringify(before.inventory.filter(i => i.equipped).map(i => [i.itemKey, i.level, i.bonus])) !== JSON.stringify(state.inventory.filter(i => i.equipped).map(i => [i.itemKey, i.level, i.bonus]));
    if (!changed) return;
    if (rebuild) {
      this.visualKey = key; this.director?.destroy(); this.clearFeedback(); this.cat?.destroy(); this.monster?.destroy();
      if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') {
        const canvas = this.game.canvas;
        canvas.dataset.stageRebuilds = String(Number(canvas.dataset.stageRebuilds ?? 0) + 1);
      }
      this.sheet = bakeCat(this, CLASS_LOOKS[cls], visuals);
      this.cat = this.add.sprite(0, 0, this.sheet.key, 'idle:0').setOrigin(this.sheet.origin.x, this.sheet.origin.y);
      const cachedCat = globalCatBoundsCache.get(this.sheet.key);
      if (cachedCat) {
        this.catWidth = cachedCat.width; this.catHeight = cachedCat.height;
        this.catEdges = new Map(cachedCat.edges);
      } else {
        const b = this.bounds(this.cat); this.catWidth = b.width; this.catHeight = b.height;
        this.catEdges.clear();
        for (const name of ['idle', 'attack'] as const) for (const frame of this.sheet.anims[name].frames) {
          this.cat.setFrame(frame); this.catEdges.set(frame, this.edge(this.cat));
        }
        globalCatBoundsCache.set(this.sheet.key, { width: this.catWidth, height: this.catHeight, edges: new Map(this.catEdges) });
      }
      this.cat.setFrame('idle:0');
      this.catFlash = this.flashTexture(this.cat);
      this.attackDuration = this.sheet.anims.attack.frameMs.reduce((sum, n) => sum + n, 0);
      const anims = bakeMonster(this, monsterArt(frontierMonster(state, stats))!);
      this.monster = this.add.sprite(0, 0, anims.walk, '0').setOrigin(.5, 1);
      this.ground = this.add.graphics().setDepth(-1); this.hpBar = this.add.graphics().setDepth(2);
      this.projectiles = this.add.graphics().setDepth(3);
      const colors = getComputedStyle(this.game.canvas);
      this.hits = new Pool<Hit>(12, () => ({ target: this.monster!, age: 0, x: 0, y: 0, missed: false,
        text: this.add.text(0, 0, '', damageTextStyle(false, false, { accent: '#ff9a4a', muted: '#b8a9c9', font: colors.getPropertyValue('--font-num').trim() || 'monospace' })).setOrigin(.5, 1).setDepth(4),
        flash: this.add.image(0, 0, this.sheet.key, 'idle:0').setDepth(1),
      }), hit => { hit.text.setVisible(false); hit.flash.setVisible(false); }, true);
      // Prewarm the capped number/silhouette and projectile pools outside update().
      for (let i = 0; i < 12; i++) this.hits.acquire();
      this.hits.releaseAll();
      for (let i = 0; i < 8; i++) this.shots.acquire();
      this.shots.releaseAll();
      this.player = new CuePlayer([], cue => this.handle(cue));
      let alive = true;
      this.director = { update: delta => { if (alive) this.step(delta); }, destroy: () => { alive = false; } };
    }
    this.weapon = v2.weaponProfileOf(cls);
    this.halt = state.progress.gated || bossReady(state);
    this.maxHp = stats.hp; this.attackInterval = stats.attackIntervalMs;
    const prepare = (id: string, round: number, credited: boolean): Plan => {
      const art = monsterArt(id)!, anims = bakeMonster(this, art);
      const metricsKey = `${id}:${this.catHeight}`;
      let m = globalMonsterMetrics.get(metricsKey);
      if (!m) {
        m = computeMonsterMetrics(art, this.catHeight);
        globalMonsterMetrics.set(metricsKey, m);
      }
      const { b, scale, left, hitLeft } = m;
      const flash = this.monsterFlash(anims.hit);
      const monster = v2.monsterAt(id, v2.stageOf(state.progress.chapter, round));
      const fight = v2.monsterFight(stats, monster);
      const passive = v2.classOf(cls).passive;
      const enemyInterval = monster.attackIntervalMs + (passive.id === 'bonk' ? passive.params.delayMs * monster.attackIntervalMs / stats.attackIntervalMs : 0);
      return { id, anims, scale, width: b.width * scale, height: b.height * scale, enemyInterval, left, hitLeft, flash,
        fight, cues: buildIdleCues(stats, monster, { respawnMs: DEFEAT_MS }), hp: monster.hp, credited };
    };
    const montage = this.suppressMontage || document.hidden ? [] : claimMontage(before, state);
    this.suppressMontage = false;
    this.preview = prepare(frontierMonster(state, stats), state.progress.round, false);
    this.plans = montage.map(m => prepare(m.id, m.round, true)); this.planIndex = 0;
    this.begin(this.plans[0] ?? this.preview);
    this.relayout();
  }
  private begin(plan: Plan) {
    this.plan = plan; this.age = 0; this.attackAt = -1; this.defeatedAt = -1; this.defeatPose = false; this.lungeAt = -1;
    this.nextEnemyAttack = APPROACH_MS + plan.enemyInterval - 90;
    this.catHp = this.maxHp; if (!this.hp) this.hp = { value: plan.hp, max: plan.hp };
    else { this.hp.value = plan.hp; this.hp.max = plan.hp; }
    this.monsterLeft = plan.left;
    this.shots.releaseAll(); this.hits?.releaseAll();
    this.monster!.setTexture(plan.anims.walk, '0').setScale(plan.scale).setAlpha(this.reduced ? 0 : 1);
    this.pose(this.monster!, plan.anims.walk, '0');
    this.cat!.setFrame('idle:0');
    this.pose(this.cat!, this.sheet.anims.idle.key, 'idle:0');
    this.player.reset(plan.cues);
    if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') {
      this.game.canvas.dataset.stageMonster = plan.id;
      this.game.canvas.dataset.stageCredited = String(plan.credited);
    }
  }
  private stopped() {
    return !this.plan.credited && (this.halt || !this.plan.fight.canWin);
  }
  relayout() {
    this.floor = computeFloorY(this.scale.height, backdropFor(this.state0?.progress.chapter ?? 1).floorY);
    this.homes[0] = Math.round(this.scale.width * .3);
    this.homes[1] = Math.round(this.scale.width * .7);
    this.positionActors(); this.drawGround();
  }
  private positionActors() {
    if (!this.cat || !this.monster || !this.plan) return;
    this.cat.setPosition(this.homes[0], this.floor);
    const ranged = !!this.weapon.projectile;
    const edge = this.catEdges.get(String(this.cat.frame.name)) ?? this.catEdges.get('idle:0')!;
    const contact = contactX(this.homes[0], edge.right, this.monsterLeft);
    const destination = ranged && !this.stopped() ? this.homes[1] : contact;
    const p = this.reduced ? 1 : Math.min(1, this.age / APPROACH_MS);
    const from = this.scale.width + this.plan.width;
    this.monster.setPosition(this.reduced ? destination : from + (destination - from) * p, this.floor);
    if (!this.reduced && this.lungeAt >= 0) {
      const lunge = Math.max(0, 1 - Math.abs(this.age - this.lungeAt - 90) / 90);
      // Melee enemies reach the cat even when the cat uses a ranged weapon.
      this.monster.x += (contact - destination - 2) * lunge;
    }
    if (this.reduced && this.defeatedAt < 0) this.monster.setAlpha(Math.min(1, this.age / 200));
  }
  private handle(cue: CombatCue) {
    switch (cue.type) {
      case 'attackStart':
        this.attackAt = this.age;
        this.pose(this.cat!, this.sheet.anims.attack.key, 'attack:0'); break;
      case 'release': {
        if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') this.game.canvas.dataset.stageRelease = String(cue.t);
        if (this.reduced) break;
        const shot = this.shots.acquire();
        if (!shot) break;
        const frame = Number(String(this.cat!.frame.name).split(':')[1]) || 0;
        const grip = this.sheet.anchors('attack', frame).grip;
        shot.kind = cue.kind; shot.age = Math.max(0, this.player.now - cue.t); shot.dur = cue.travelMs;
        shot.from.x = this.cat!.x + grip.x - this.sheet.frameW * this.sheet.origin.x;
        shot.from.y = this.cat!.y + grip.y - this.sheet.frameH * this.sheet.origin.y;
        shot.to.x = this.monster!.x; shot.to.y = this.floor - this.plan.height * .55;
        break;
      }
      case 'impact': case 'dot':
        if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') this.game.canvas.dataset.stageImpact = String(cue.t);
        this.hp!.value = cue.hp;
        this.monsterLeft = this.reduced ? this.plan.left : this.plan.hitLeft;
        // Force the authored contact frame at the cue, independent of animation clock drift.
        if (!this.weapon.projectile && !this.reduced) {
          const anim = this.sheet.anims.attack;
          const timing = this.weapon;
          const at = cue.t % this.attackInterval;
          const index = Math.abs(at - timing.hitAtMs[1]!) < 1 ? 1 : 0;
          this.cat!.stop().setFrame(anim.frames[anim.hitFrames?.[index] ?? anim.hitFrames?.[0] ?? 0]!);
          this.lungeAt = -1;
          this.positionActors();
          if (import.meta.env.DEV || import.meta.env.MODE === 'g1-perf') {
            const edge = this.catEdges.get(String(this.cat!.frame.name))!;
            this.game.canvas.dataset.stageContactGap = String(this.monster!.x + this.monsterLeft - this.cat!.x - edge.right);
          }
        }
        this.pose(this.monster!, this.plan.anims.hit, '0');
        this.hit(this.monster!, cue.damage, cue.type === 'impact' && cue.crit, false); break;
      case 'defeat':
        this.defeatedAt = APPROACH_MS + cue.t;
        break;
    }
  }
  private hit(target: Actor, damage: number, _big: boolean, missed: boolean) {
    const hit = this.hits?.acquire(); if (!hit) return;
    hit.target = target; hit.age = 0; hit.x = target.x;
    hit.y = this.floor - (target === this.cat ? this.catHeight : this.plan.height) - 6; hit.missed = missed;
    hit.text.setColor(missed ? '#b8a9c9' : '#ffffff').setText(missed ? 'Miss' : `${Math.round(damage)}`).setVisible(true).setAlpha(1);
    hit.flash.setTexture(target === this.cat ? this.catFlash : this.plan.flash).setOrigin(target.originX, target.originY).setScale(target.scaleX, target.scaleY).setVisible(!missed);
  }
  private step(delta: number) {
    if (document.hidden || !this.plan) return;
    this.age += Math.min(delta, 50);
    this.positionActors();
    if (this.stopped()) return;
    if (this.age >= APPROACH_MS) {
      this.player.advance(Math.min(delta, 50));
      this.catHp = expectedCatHp(this.maxHp, this.plan.fight.damageTaken, this.player.now, this.plan.fight.timeToKillMs);
      if (this.age >= this.nextEnemyAttack && this.defeatedAt < 0) {
        this.lungeAt = this.age; this.nextEnemyAttack += this.plan.enemyInterval;
      }
      if (this.attackAt >= 0 && this.age - this.attackAt > this.attackDuration) {
        this.pose(this.cat!, this.sheet.anims.idle.key, 'idle:0'); this.attackAt = -1;
      }
    }
    if (!this.reduced && this.defeatedAt >= 0 && this.age - this.defeatedAt >= 80 && !this.defeatPose) {
      this.monster!.play(this.plan.anims.defeat); this.defeatPose = true;
    }
    if (this.defeatedAt >= 0) this.monster!.setAlpha(Math.max(0, 1 - (this.age - this.defeatedAt) / DEFEAT_MS));
    if (this.player.done) {
      if (this.plan.credited) {
        this.planIndex++;
        this.begin(this.plans[this.planIndex] ?? this.preview);
      } else this.begin(this.preview);
    }
  }
  private drawGround() {
    if (!this.cat || !this.monster || !this.plan) return;
    this.ground?.clear().fillStyle(0x000000, .35).fillEllipse(this.cat.x, this.floor, this.catWidth * .7, 4)
      .fillEllipse(this.monster.x, this.floor, this.plan.width * .7, 4);
    const bar = this.hpBar?.clear(); if (!bar || !this.hp) return;
    const mw = Math.round(this.plan.width), mx = Math.round(this.monster.x - mw / 2), my = Math.round(this.floor - this.plan.height - 4);
    bar.fillStyle(0x241b30).fillRect(mx, my, mw, 3).fillStyle(0xd64f59).fillRect(mx, my, Math.round(mw * Math.max(0, this.hp.value) / this.hp.max), 3);
    const cw = Math.max(24, this.catWidth), cx = Math.round(this.cat.x - cw / 2), cy = Math.round(this.floor - this.catHeight - 5);
    bar.fillStyle(0x241b30).fillRect(cx, cy, cw, 3).fillStyle(0x8edb9b).fillRect(cx, cy, Math.round(cw * this.catHp / this.maxHp), 3);
  }
  update(_time: number, delta: number) {
    this.director?.update(delta);
    const active = this.hits?.active;
    if (active) for (let i = active.length - 1; i >= 0; i--) {
      const hit = active[i]!;
      const progress = Math.min(1, hit.age / 600);
      if (!this.reduced && !hit.missed && hit.age < 100) hit.target.x += hit.target === this.cat ? -2 : 2;
      hit.flash.setPosition(hit.target.x, hit.target.y).setVisible(!hit.missed && hit.age < 80).setAlpha(hit.target.alpha);
      hit.text.setPosition(hit.x, hit.y - (this.reduced ? 0 : 12 * progress)).setAlpha(1 - progress);
      hit.age += Math.min(delta, 50);
      if (hit.age >= 600) this.hits!.release(hit);
    }
    const g = this.projectiles?.clear();
    const shots = this.shots.active;
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i]!;
      shot.to.x = this.monster!.x;
      shot.to.y = this.floor - this.plan.height * .55;
      if (g && !this.reduced) drawProjectile(g, shot);
      shot.age += Math.min(delta, 50);
      if (shot.age >= shot.dur) this.shots.release(shot);
    }
    this.drawGround();
  }
}
