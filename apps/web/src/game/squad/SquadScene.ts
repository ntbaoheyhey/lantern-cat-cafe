import Phaser from 'phaser';
import { ABILITIES, HEROES, SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import { createProjection, project } from '@taskbar-hero/game-rules/src/squad/replay';
import type { Actor, BattleEvent, Cast, Projection } from '@taskbar-hero/game-rules/src/squad/types';

import { activeCast, actorPosition, castEnd, firstImpact, hasImpactResidue, lastImpact } from './presentation';
import { squadAsset } from './assets';

const V = C.presentation;
const E = V.effect;
const rgb = (color: string) => Number.parseInt(color.slice(1), 16);
const COL = { party: rgb(V.partyColor), danger: rgb(V.dangerColor), heal: rgb(V.healColor), gold: rgb(V.goldColor), ink: 0x121522, paper: 0xfff1d6, purple: 0xcfadf5 };
const poseRows = { idle: 0, move: 1, basic: 2, cast1: 3, cast2: 4, ultimate: 5, hit: 6, defeat: 7, victory: 8 };
type Effect = { event: BattleEvent; start: number };
type Label = { text: Phaser.GameObjects.Text; target: string; until: number; amount: number; kind: BattleEvent['type']; start: number };
interface Rig { sprite: Phaser.GameObjects.Sprite; name: Phaser.GameObjects.Text; hp: Phaser.GameObjects.Graphics; marker: Phaser.GameObjects.Text; hitUntil: number; diedAt: number }

/** Event-driven pixels: no damage formula and no access to the battle engine or game store. */
export class SquadScene extends Phaser.Scene {
  calm = false;
  onTarget: (id: string) => void = () => {};
  clock: () => { time: number; running: boolean; speed: number; priority: string | null } = () => ({ time: 0, running: false, speed: 1, priority: null });
  private model: Projection = createProjection();
  private rigs = new Map<string, Rig>();
  private rigPool: Rig[] = [];
  private passiveIcons: Phaser.GameObjects.Image[] = [];
  private effects: Effect[] = [];
  private labels: Label[] = [];
  private labelPool: Phaser.GameObjects.Text[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private quietGraphics!: Phaser.GameObjects.Graphics;
  private zones!: Phaser.GameObjects.Graphics;
  private ready = false;
  private now = 0;
  private lastDraw = -Infinity;
  private stopUntil = 0;
  private pending: BattleEvent[] = [];
  constructor() { super('squad'); }
  get loaded() { return this.ready; }
  invalidate() { this.lastDraw = -Infinity; if (!document.hidden) this.game.loop.wake(); }
  preload() {
    this.load.image('sq-room', squadAsset('cafe-room.png'));
    for (const skill of ['steadfast', 'warmWick', 'lastSip']) this.load.image('sq-icon-' + skill, squadAsset('icon-' + skill + '.png'));
    for (const role of [...HEROES, 'guard', 'flanker', 'ranger', 'healer', 'charger', 'elite', 'yarn', 'thread', 'dummy']) {
      const n = role === 'yarn' ? V.bossFrame : HEROES.includes(role as typeof HEROES[number]) ? V.heroFrame : V.enemyFrame;
      this.load.spritesheet('sq-' + role, squadAsset(role + '.png'), { frameWidth: n, frameHeight: n });
    }
  }
  create() {
    if (this.textures.exists('sq-room')) this.add.image(0, 0, 'sq-room').setOrigin(0);
    else this.add.rectangle(0, 0, V.width, V.height, 0x2d354d).setOrigin(0);
    this.zones = this.add.graphics().setDepth(1000); this.graphics = this.add.graphics().setDepth(1100);
    this.quietGraphics = this.add.graphics().setDepth(1099).setAlpha(V.quietEffectAlpha);
    for (let i = 0; i < V.maxBright; i++) this.passiveIcons.push(this.add.image(0, 0, 'sq-icon-steadfast').setDepth(1450).setVisible(false));
    for (let i = 0; i < V.maxLabels; i++) this.labelPool.push(this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fff1d6', backgroundColor: '#121522', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(1500).setVisible(false));
    this.ready = true; const pending = this.pending; this.pending = []; this.consume(pending);
    this.events.once('shutdown', () => { this.ready = false; this.rigs.clear(); this.rigPool = []; this.passiveIcons = []; this.labels = []; this.labelPool = []; this.effects = []; });
  }
  reset(events: readonly BattleEvent[]) {
    for (const r of this.rigs.values()) this.recycle(r);
    this.rigs.clear(); this.model = createProjection(); this.effects = [];
    this.labels.forEach(l => l.text.setVisible(false)); this.labels = []; this.pending = [];
    this.now = 0; this.lastDraw = -Infinity; this.consume(events);
  }
  consume(events: readonly BattleEvent[]) {
    if (!this.ready) { this.pending.push(...events); return; }
    for (const e of events) {
      project(this.model, [e]);
      if (e.type === 'wave_transition') {
        this.effects = [];
        for (const [id, r] of this.rigs) if (!this.model.actors[id]) {
          this.recycle(r); this.rigs.delete(id);
        }
      }
      if (e.actor) this.ensure(e.actor);
      if (e.actors) e.actors.forEach(a => this.ensure(a));
      if (hasImpactResidue(e)) {
        this.effects.push({ event: e, start: e.time });
        if (this.effects.length > V.maxEffects) this.effects.shift();
      }
      if (['impact', 'heal', 'shield'].includes(e.type) && e.target && e.amount) this.number(e);
      if (e.type === 'impact' && e.target) {
        const r = this.rigs.get(e.target); if (r) r.hitUntil = e.time + V.hitMs;
        if (e.critical && e.skill && (ABILITIES[e.skill]?.heavy || ABILITIES[e.skill]?.ultimate) && !this.calm) this.stopUntil = performance.now() + V.hitStopMs;
      }
      if (e.type === 'death' && e.target) { const r = this.rigs.get(e.target); if (r) r.diedAt = e.time; }
    }
    this.lastDraw = -Infinity;
  }
  private ensure(a: Actor) {
    if (this.rigs.has(a.id) || a.hp <= 0) return;
    const key = this.textures.exists('sq-' + a.role) ? 'sq-' + a.role : 'sq-guardian';
    const n = a.role === 'yarn' ? V.bossFrame : a.side === 'party' ? V.heroFrame : V.enemyFrame;
    const foot = a.role === 'yarn' ? V.bossFoot : a.side === 'party' ? V.heroFoot : V.enemyFoot;
    const reuse = this.rigPool.pop();
    const sprite = (reuse?.sprite ?? this.add.sprite(a.x, a.y, key, 0)).setTexture(key, 0).setOrigin(0.5, foot / n).setDepth(a.y).setVisible(true).setAlpha(1);
    sprite.removeAllListeners('pointerdown');
    if (a.side === 'enemy') sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onTarget(a.id));
    const name = reuse?.name ?? this.add.text(a.x, a.y + 9, a.name, { fontFamily: 'monospace', fontSize: '10px', color: '#fff1d6', backgroundColor: '#121522' }).setOrigin(0.5).setDepth(1300);
    const marker = reuse?.marker ?? this.add.text(a.x, a.y - n, '', { fontFamily: 'monospace', fontSize: '10px', color: '#fff1d6', backgroundColor: '#121522' }).setOrigin(0.5).setDepth(1400);
    this.rigs.set(a.id, { sprite, name, marker, hp: reuse?.hp ?? this.add.graphics().setDepth(1300), hitUntil: 0, diedAt: 0 });
  }
  private recycle(r: Rig) {
    r.sprite.setVisible(false).disableInteractive(); r.name.setVisible(false); r.marker.setVisible(false); r.hp.clear(); this.rigPool.push(r);
  }
  private number(e: BattleEvent) {
    const prefix = e.type === 'shield' ? '◇' : e.type === 'heal' ? '+' : '−';
    const same = this.labels.find(l => l.target === e.target && l.kind === e.type && l.until > e.time);
    if (same) { same.amount += e.amount!; same.text.setText(prefix + same.amount); return; }
    const text = this.labelPool.find(t => !t.visible); if (!text) return;
    text.setText(prefix + e.amount).setColor(e.type === 'heal' ? V.healColor : e.type === 'shield' ? V.partyColor : e.critical ? V.goldColor : '#fff1d6').setVisible(true);
    this.labels.push({ text, target: e.target!, until: e.time + V.labelMs, start: e.time, amount: e.amount!, kind: e.type });
  }
  update() {
    if (!this.ready) return;
    const clock = this.clock(); this.now = clock.time;
    const interval = 1000 / (clock.running ? this.calm ? V.calmFps : V.fps : V.idleFps);
    if (performance.now() - this.lastDraw < interval || (clock.running && !this.calm && performance.now() < this.stopUntil)) return;
    this.lastDraw = performance.now();
    this.zones.clear(); this.graphics.clear(); this.quietGraphics.clear();
    for (const cast of Object.values(this.model.casts)) {
      if (this.now > castEnd(cast)) { delete this.model.casts[cast.id]; continue; }
    }
    for (const a of Object.values(this.model.actors)) this.actor(a);
    // Positions are settled before projectiles and telegraphs are drawn.
    this.effects = this.effects.filter(fx => this.now - fx.start < V.residueMs);
    const brightResidues = this.effects.slice(-V.maxBright);
    // A single budget covers motion AND impact; danger zones/status icons remain
    // readable on their own layer even when cosmetic brightness is exhausted.
    Object.values(this.model.casts).sort((a, b) => Number(!!ABILITIES[b.skill]?.heavy) - Number(!!ABILITIES[a.skill]?.heavy))
      .forEach((cast, i) => this.castEffect(cast, i < V.maxBright - brightResidues.length));
    brightResidues.forEach(fx => this.impactEffect(fx));
    this.passiveIcons.forEach(icon => icon.setVisible(false));
    this.effects.filter(fx => fx.event.type === 'passive').slice(-V.maxBright).forEach((fx, i) => {
      const r = this.rigs.get(fx.event.source ?? '');
      if (r) this.passiveIcons[i]!.setTexture('sq-icon-' + fx.event.skill).setPosition(r.sprite.x, Math.max(V.sceneInset, r.sprite.y - V.heroFrame)).setVisible(true);
    });
    for (const l of this.labels) {
      const a = this.model.actors[l.target];
      if (!a || this.now >= l.until) l.text.setVisible(false);
      else { const rig = this.rigs.get(a.id), line = l.kind === 'shield' ? 2 : l.kind === 'heal' ? 1 : 0;
        l.text.setPosition(rig?.sprite.x ?? a.x, Math.max(V.sceneInset, (rig?.sprite.y ?? a.y) - V.heroFrame - line * V.labelLine - (this.calm ? 0 : (this.now - l.start) / V.labelMs * V.numberRise))); }
    }
    this.labels = this.labels.filter(l => l.text.visible);
  }
  private actor(a: Actor) {
    const r = this.rigs.get(a.id); if (!r) return;
    if (a.hp <= 0 && this.now - r.diedAt >= V.defeatFadeMs) { this.recycle(r); this.rigs.delete(a.id); return; }
    const cast = activeCast(this.model, a.id, this.now);
    const point = actorPosition(this.model, a, this.now, this.calm);
    const x = Math.round(point.x), y = Math.round(point.y);
    let row = 0, frame = Math.floor(this.now / V.idleFrameMs) % 6;
    if (this.calm) frame = 0;
    if (cast) {
      const skill = ABILITIES[cast.skill]!, phase = this.now - cast.start;
      const kit = a.side === 'party' ? [a.role + 'Basic', ...({ guardian: ['shieldBash', 'rally', 'hearthwall'], witch: ['threadSnare', 'emberOrb', 'lanternstorm'], alchemist: ['milkFlask', 'mossFlask', 'nineLives'] }[a.role as 'guardian'])] : [];
      row = a.side === 'party' ? [poseRows.basic, poseRows.cast1, poseRows.cast2, poseRows.ultimate][Math.max(0, kit.indexOf(cast.skill))]! : this.now < cast.release ? 3 : 2;
      frame = this.now < cast.release ? Math.min(2, Math.floor(phase / skill.windupMs * 3)) : Math.min(5, 3 + Math.floor((this.now - cast.release) / V.frameMs));
      if (skill.melee && !this.calm && phase < V.approachMs) row = poseRows.move;
    } else if (this.model.result?.winner === a.side) { row = a.side === 'party' ? 8 : 0; }
    if (this.now < r.hitUntil) { row = a.side === 'party' ? 6 : 4; frame = 0; }
    if (a.hp <= 0) { row = a.side === 'party' ? 7 : 5; frame = Math.min(5, Math.floor((this.now - r.diedAt) / V.frameMs)); }
    if (a.role === 'yarn' && this.model.phase === 2 && !cast && a.hp > 0) row = 6;
    const frames = r.sprite.texture.frameTotal - 1;
    r.sprite.setFrame(Math.min(frames - 1, row * 6 + frame)).setPosition(Math.round(x), Math.round(y)).setDepth(y).setAlpha(a.hp <= 0 ? Math.max(0, 1 - (this.now - r.diedAt) / V.defeatFadeMs) : 1);
    const n = a.role === 'yarn' ? V.bossFrame : a.side === 'party' ? V.heroFrame : V.enemyFrame;
    const top = Math.max(V.sceneInset, y - n + V.sceneInset);
    r.name.setPosition(x, y + 9).setText(a.side === 'party' ? a.name : a.role === 'yarn' ? 'Yarn Giant' : a.role[0]!.toUpperCase() + a.role.slice(1));
    r.hp.clear(); r.name.setVisible(a.hp > 0); r.marker.setVisible(a.hp > 0);
    if (!a.hp) return;
    r.hp.fillStyle(COL.ink).fillRect(x - V.barWidth / 2 - 1, top - 1, V.barWidth + 2, V.barHeight + 2);
    r.hp.fillStyle(a.side === 'party' ? COL.heal : COL.danger).fillRect(x - V.barWidth / 2, top, Math.ceil(V.barWidth * a.hp / a.maxHp), V.barHeight);
    if (a.shield) r.hp.fillStyle(COL.party).fillRect(x - V.barWidth / 2, top + 5, Math.min(V.barWidth, V.barWidth * a.shield / a.maxHp), 2);
    const marks = a.statuses.map(s => ({ burn: '♨', snare: '⌗', stun: '★', guard: '◇', taunt: '!', restrain: '×', exposed: '◆' })[s.kind]).join(' ');
    r.marker.setText(marks).setPosition(x, top - 8);
    if (this.clock().priority === a.id) { this.zones.lineStyle(2, COL.gold).strokeRect(x - 28, y - n + 12, 56, n - 8); this.zones.fillStyle(COL.gold).fillTriangle(x - 5, top - 17, x + 5, top - 17, x, top - 11); }
    if (a.statuses.some(s => s.kind === 'guard')) this.zones.lineStyle(1, COL.party, 0.8).strokeEllipse(x, y - 26, 57, 66);
    if (a.statuses.some(s => s.kind === 'restrain')) { this.zones.lineStyle(2, COL.purple).strokeRect(x - 24, y - 54, 48, 54); this.zones.lineBetween(x - 24, y - 54, x + 24, y); }
    if (a.statuses.some(s => s.kind === 'burn')) this.zones.fillStyle(COL.danger, 0.8).fillTriangle(x - 6, y + 2, x, y - 10, x + 6, y + 2);
  }
  private castEffect(c: Cast, emphasis: boolean) {
    const a = ABILITIES[c.skill]!, source = this.model.actors[c.source]; if (!source) return;
    const danger = source.side === 'enemy', color = danger ? COL.danger : a.heal ? COL.heal : a.shield ? COL.party : COL.gold;
    const targetRig = this.rigs.get(c.targets[0] ?? '');
    const sourceRig = this.rigs.get(c.source);
    const from = { x: (sourceRig?.sprite.x ?? c.origin.x) + (danger ? E.enemySourceX : E.sourceX), y: (sourceRig?.sprite.y ?? c.origin.y) - E.sourceY };
    const to = { x: targetRig?.sprite.x ?? c.zone.x, y: (targetRig?.sprite.y ?? c.zone.y) - E.targetY };
    const progress = Math.max(0, Math.min(1, (this.now - c.release) / Math.max(1, a.travelMs)));
    const anticipation = this.now < c.release;
    const g = emphasis ? this.graphics : this.quietGraphics, z = this.zones;
    if (anticipation) {
      const frac = Math.max(0, (this.now - c.start) / a.windupMs);
      const actorX = sourceRig?.sprite.x ?? source.x, actorY = sourceRig?.sprite.y ?? source.y;
      z.fillStyle(COL.ink).fillRect(actorX - V.barWidth / 2, actorY + E.markHeight, V.barWidth, V.barHeight);
      z.fillStyle(color).fillRect(actorX - V.barWidth / 2, actorY + E.markHeight, Math.round(V.barWidth * frac), V.barHeight);
      if (a.heavy || a.shape === 'storm') {
        z.lineStyle(2, color, 0.9);
        if (['sweep', 'charge', 'cross'].includes(a.shape)) {
          const rows = a.shape === 'cross' ? c.targets.map(id => this.model.actors[id]?.y).filter((y): y is number => y !== undefined) : [c.zone.y];
          for (const y of rows) {
            z.fillStyle(color, 0.12).fillRect(E.laneLeft, y - E.laneOffset, E.laneRight - E.laneLeft, E.laneHeight).strokeRect(E.laneLeft, y - E.laneOffset, E.laneRight - E.laneLeft, E.laneHeight);
            for (let x = E.laneLeft; x < E.laneRight - E.stripeSpacing; x += E.stripeSpacing) z.lineBetween(x, y + E.markHeight, x + E.stripeSpacing, y - E.laneOffset);
            z.fillStyle(color).fillTriangle(E.laneLeft + E.markHeight, y - E.impactStart, E.laneLeft + E.markHeight, y + E.shardSize, E.laneLeft + E.laneOffset, y);
          }
        } else {
          z.strokeEllipse(to.x, c.zone.y, (a.radius ?? 40) * 2, 40);
          z.lineBetween(to.x - 12, to.y, to.x + 12, to.y);z.lineBetween(to.x, to.y - 12, to.x, to.y + 12);
        }
        // A floor lane can pass behind another row's tall sprite. Explicit brackets
        // distinguish the actual locked victims from actors merely overlapping its pixels.
        for (const id of c.targets) {
          const t = this.rigs.get(id)?.sprite;
          if (t) z.lineStyle(E.markLine, color).strokeRect(t.x - E.markWidth / 2, t.y - V.heroFoot, E.markWidth, V.heroFoot);
        }
      } else if (a.radius) {
        // The core locks membership at cast time. Mark those actors at their visible positions,
        // including melee attackers that have temporarily left their formation anchors.
        for (const id of c.targets) { const t = this.rigs.get(id)?.sprite; if (t) z.lineStyle(E.markLine, color, 0.7).strokeEllipse(t.x, t.y, E.markWidth, E.markHeight); }
      }
      else z.lineStyle(1, color, 0.6).strokeEllipse(to.x, c.zone.y + 1, 40, 12);
      return;
    }
    if (c.skill === 'mossFlask' && this.now >= firstImpact(c)) {
      const left = Math.max(0, 1 - (this.now - firstImpact(c)) / a.durationMs!);
      z.fillStyle(COL.heal, 0.09).fillEllipse(c.zone.x, c.zone.y, a.radius! * 2, V.patchHeight);
      z.lineStyle(2, COL.heal, 0.7).strokeEllipse(c.zone.x, c.zone.y, a.radius! * 2, V.patchHeight);
      z.fillStyle(COL.heal).fillRect(c.zone.x - V.barWidth / 2, c.zone.y + V.patchHeight / 2, V.barWidth * left, 2);
      z.lineStyle(2, COL.heal).lineBetween(c.zone.x - 6, c.zone.y, c.zone.x + 6, c.zone.y);
      z.lineBetween(c.zone.x, c.zone.y - 6, c.zone.x, c.zone.y + 6); return;
    }
    if (this.now > lastImpact(c)) return;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    g.lineStyle(2, color, emphasis ? 0.9 : 0.35);g.fillStyle(color, emphasis ? 1 : 0.35);
    if (a.shape === 'flask' || a.shape === 'patch') {
      const arc = this.calm ? y : y - Math.sin(progress * Math.PI) * V.flaskArc;
      g.fillStyle(color).fillRoundedRect(Math.round(x) - 5, Math.round(arc) - 4, 10, 12, 2);
      g.fillStyle(COL.paper).fillRect(Math.round(x) - 2, Math.round(arc) - 9, 4, 6);
      g.lineStyle(1, color, 0.45).lineBetween(x - 12, arc + 7, x - 6, arc + 3);
      z.lineStyle(1, color).strokeEllipse(to.x, c.zone.y, a.radius ? a.radius : 38, 16);
    } else if (a.shape === 'arrow') {
      const angle = Math.atan2(to.y - from.y, to.x - from.x);const dx = Math.cos(angle), dy = Math.sin(angle);
      g.lineBetween(x - dx * 24, y - dy * 24, x, y);g.fillTriangle(x + dx * 5, y + dy * 5, x - dy * 4, y + dx * 4, x + dy * 4, y - dx * 4);
    } else if (a.shape === 'thread') {
      g.lineStyle(2, color).lineBetween(from.x, from.y, to.x, to.y);
      for (const id of c.targets) { const t = this.rigs.get(id)?.sprite; if (t) z.lineStyle(1, COL.purple).strokeEllipse(t.x, t.y - 12, 48, 30); }
    } else if (['slash', 'bash', 'charge'].includes(a.shape)) {
      if (this.calm) g.strokeCircle(to.x, to.y, 19);
      else { g.beginPath();g.arc(to.x, to.y, 25, -1.6 + progress * 2, 0.5 + progress * 2);g.strokePath(); }
      if (a.shape === 'bash') g.strokeRect(to.x - 13, to.y - 16, 26, 32);
    } else if (a.shape === 'wall' || a.shape === 'shelter' || a.shape === 'rally') {
      for (const id of c.targets) { const t = this.rigs.get(id)?.sprite; if (t) g.strokeRoundedRect(t.x - 28, t.y - 62, 56, 67, 12); }
      if (a.shape === 'wall') g.lineStyle(5, COL.party).lineBetween(270, 110, 270, 280);
    } else if (a.shape === 'sweep' || a.shape === 'cross') {
      const yy = c.zone.y - 20; g.lineStyle(5, color).lineBetween(55 + 520 * (1 - progress), yy - 25, 55 + 520 * (1 - progress), yy + 25);
      if (a.shape === 'cross') g.lineBetween(55 + 520 * progress, 110, 55 + 520 * progress, 270);
    } else if (a.shape === 'storm') {
      // Every strike has a fresh marked countdown, including strikes two and three.
      const strike = Math.max(0, Math.ceil((this.now - firstImpact(c)) / C.stormSpacingMs));
      const due = firstImpact(c) + strike * C.stormSpacingMs;
      const fraction = 1 - Math.max(0, due - this.now) / C.stormSpacingMs;
      g.lineStyle(2, color, Math.max(0.25, fraction));
      for (const id of c.targets) { const t = this.rigs.get(id)?.sprite; if (t) { z.lineStyle(2, color).strokeEllipse(t.x, t.y, 46, 18);z.fillStyle(color).fillRect(t.x - 20, t.y + 12, 40 * fraction, 3);g.lineBetween(t.x, t.y - 115, t.x, t.y - 35);g.fillTriangle(t.x - 6, t.y - 44, t.x + 6, t.y - 44, t.x, t.y - 28); } }
    } else if (a.shape === 'mend') {
      g.lineBetween(x - 7, y, x + 7, y);g.lineBetween(x, y - 7, x, y + 7);
    } else { g.fillTriangle(x - 10, y - 5, x + 8, y, x - 10, y + 5);g.fillCircle(x, y, c.skill === 'emberOrb' ? 9 : 4); }
  }
  private impactEffect(fx: Effect) {
    const e = fx.event, a = this.model.actors[e.target ?? e.source ?? '']; if (!a) return;
    const rig = this.rigs.get(a.id), x = rig?.sprite.x ?? a.x, y = rig?.sprite.y ?? a.y;
    const p = (this.now - fx.start) / V.residueMs;
    const hostile = this.model.actors[e.source ?? '']?.side === 'enemy';
    const color = e.type === 'heal' ? COL.heal : e.type === 'shield' ? COL.party : e.type === 'passive' ? COL.purple : hostile ? COL.danger : COL.gold;
    const r = this.calm ? E.calmRadius : E.impactStart + p * E.impactGrowth;
    const g = this.graphics, yy = y - E.impactY, shape = ABILITIES[e.skill ?? '']?.shape;
    g.lineStyle(E.markLine, color, 1 - p);
    if (e.type === 'heal') {
      g.strokeEllipse(x, y, r * 2, r);
      g.lineBetween(x - r / 2, yy, x + r / 2, yy); g.lineBetween(x, yy - r / 2, x, yy + r / 2);
    } else if (e.type === 'shield') {
      g.strokeRoundedRect(x - r, yy - r, r * 2, r * 2, E.shardSize);
      g.lineBetween(x - r, yy + r, x, yy + r + E.shardSize); g.lineBetween(x, yy + r + E.shardSize, x + r, yy + r);
    } else if (shape === 'slash' || shape === 'charge' || shape === 'sweep' || shape === 'cross') {
      g.lineBetween(x - r, yy + r / 2, x + r, yy - r / 2);
      g.lineBetween(x - r / 2, yy + r, x + r / 2, yy - r);
    } else if (shape === 'thread' || e.type === 'passive') {
      g.strokeEllipse(x, yy, r * 2, r); g.strokeEllipse(x, yy, r, r * 2);
    } else if (shape === 'bash') {
      g.strokeRect(x - r, yy - r / 2, r * 2, r);
      g.lineBetween(x - r / 2, yy - r, x + r / 2, yy + r);
    } else {
      g.strokeEllipse(x, yy, r * 2, r);
      if (!this.calm && (shape === 'orb' || shape === 'storm')) {
        g.fillStyle(color, 1 - p);
        for (let i = 0; i < E.shardCount; i++) { const angle = i / E.shardCount * Math.PI * 2;
          g.fillRect(Math.round(x + Math.cos(angle) * r) - E.shardSize / 2, Math.round(yy + Math.sin(angle) * r) - E.shardSize / 2, E.shardSize, E.shardSize); }
      }
    }
  }
}
