import Phaser from 'phaser';
import { squad } from '@taskbar-hero/game-rules';
import { bakeCat, CLASS_LOOKS, type CatSheet } from '../game/rig';
import { bakeMonster } from '../game/arena/assets';
import { monsterArt, type MonsterAnim } from '../art/monsters';

export interface SquadBridge { read(): { battle: squad.Battle; running: boolean; reduced: boolean; speed: number; restoration?: number }; pick(id: string): void }
type Visual = { sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text; sheet?: CatSheet; monster?: Record<MonsterAnim, string>; pose: string; home: squad.Point; hitUntil: number };
type Effect = { event: squad.BattleEvent; until: number };
const ART: Record<squad.EnemyRole, string> = { guard: 'mon.sock.puppet', flanker: 'mon.dust.bunny', slinger: 'mon.toast.mimic', mender: 'mon.loose.yarn', charger: 'mon.roomba.scout', yarn: 'mon.yarn.giant', knot: 'mon.loose.yarn', vacuum: 'mon.vacuum.beast' };
const SHORT_NAME: Record<squad.EnemyRole, string> = { guard: 'Guard', flanker: 'Skitter', slinger: 'Slinger', mender: 'Mender', charger: 'Ram', yarn: 'Yarn Giant', knot: 'Knot', vacuum: 'Vacuum Beast' };
const COLORS = { ink: 0x211d2a, cream: 0xffe6bc, amber: 0xefb86b, rose: 0xe98989, sage: 0xadd9ad, lavender: 0xc3acec, blue: 0x94cbd8 };

/** One event presenter for groups and bosses. All HP, targets and outcomes come from game-rules. */
export class SquadScene extends Phaser.Scene {
  private bridge!: SquadBridge;
  private actors = new Map<string, Visual>();
  private floor!: Phaser.GameObjects.Graphics;
  private zones!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private labels: { text: Phaser.GameObjects.Text; until: number; y: number; key: string; amount: number }[] = [];
  private effects: Effect[] = [];
  private cursor = 0;
  private lastTick = -1;
  private w = 0;
  private h = 0;
  private optionsKey = '';
  private restoration = -1;
  constructor() { super('squad-combat'); }
  init(bridge: SquadBridge) { this.bridge = bridge; }
  create() {
    this.floor = this.add.graphics().setDepth(-10);
    this.zones = this.add.graphics().setDepth(1);
    this.fx = this.add.graphics().setDepth(900);
    this.bars = this.add.graphics().setDepth(950);
    this.events.once('shutdown', () => { this.actors.clear(); this.effects = []; this.labels = []; });
  }
  private point(p: squad.Point) { return { x: Math.round(p.x * this.scale.width / 800), y: Math.round(p.y * this.scale.height / 380) }; }
  private areaSize(radius: number) {
    // Project the same simulation circle as actor positions; compact mode changes both axes.
    return { width: radius * 2 * this.scale.width / 800, height: radius * 2 * this.scale.height / 380 };
  }
  private room() {
    const w = this.scale.width, h = this.scale.height;
    this.floor.clear().fillStyle(0x302b37).fillRect(0, 0, w, h);
    this.floor.fillStyle(0x44333c).fillRect(0, h * 0.18, w, h * 0.82);
    this.floor.fillStyle(0x2b2730).fillRect(0, 0, w, h * 0.18);
    this.floor.lineStyle(1, 0x6a4850, 0.45);
    for (let y = h * 0.2; y < h; y += 32) this.floor.lineBetween(0, Math.round(y), w, Math.round(y));
    for (let x = 0; x < w; x += 140) this.floor.lineBetween(x, h * 0.2, x, h);
    this.floor.fillStyle(0x65404b).fillRoundedRect(w * 0.05, h * 0.29, w * 0.9, h * 0.61, 18);
    this.floor.lineStyle(3, 0xa16a64, 0.6).strokeRoundedRect(w * 0.065, h * 0.32, w * 0.87, h * 0.55, 14);
    this.floor.lineStyle(1, 0xbc8a75, 0.22).strokeRoundedRect(w * 0.08, h * 0.35, w * 0.84, h * 0.49, 10);
    // Window, shelf, tea cups: decoration stays above the combat floor.
    this.floor.fillStyle(0x172632).fillRect(w * 0.09, 7, 95, h * 0.14);
    this.floor.lineStyle(3, 0x927564).strokeRect(w * 0.09, 7, 95, h * 0.14).lineBetween(w * 0.09 + 48, 7, w * 0.09 + 48, h * 0.14 + 7);
    this.floor.fillStyle(0x96715c).fillRect(w * 0.66, h * 0.13, w * 0.27, 5);
    for (let i = 0; i < 4; i++) { this.floor.fillStyle(i % 2 ? 0xc8a186 : 0x9baa8d).fillRect(w * 0.7 + i * 28, h * 0.13 - 15, 16, 15); }
    if (this.restoration >= 1) {
      this.floor.fillStyle(0x805952).fillRect(w * 0.42, 4, 70, h * 0.15);
      this.floor.fillStyle(0x211d2a).fillRect(w * 0.42 + 9, 10, 52, h * 0.13);
      this.floor.fillStyle(COLORS.amber).fillTriangle(w * 0.42 + 20, h * 0.14, w * 0.42 + 35, 12, w * 0.42 + 50, h * 0.14);
    }
    if (this.restoration >= 2) for (let i = 0; i < 3; i++) {
      const x = w * 0.27 + i * 19;
      this.floor.fillStyle(0xba8070).fillRect(x, h * 0.12, 13, 12);
      this.floor.fillStyle(COLORS.sage).fillEllipse(x + 6, h * 0.1, 18, 12);
    }
    if (this.restoration >= 3) this.floor.lineStyle(2, COLORS.amber, 0.7).lineBetween(w * 0.04, 3, w * 0.96, 3);
  }
  private addActor(a: squad.Actor): Visual {
    const home = this.point(a), scale = this.scale.width >= 600 ? 2 : 1;
    let sprite: Phaser.GameObjects.Sprite, sheet: CatSheet | undefined, monster: Record<MonsterAnim, string> | undefined;
    if (a.side === 'hero') {
      sheet = bakeCat(this, CLASS_LOOKS[a.role as squad.HeroRole]);
      sprite = this.add.sprite(home.x, home.y, sheet.key, 'idle:0').setOrigin(sheet.origin.x, sheet.origin.y).setScale(scale);
    } else {
      monster = bakeMonster(this, monsterArt(ART[a.role as squad.EnemyRole])!);
      sprite = this.add.sprite(home.x, home.y, monster.idle, '0').setOrigin(0.5, 1).setScale((a.role === 'yarn' || a.role === 'vacuum') ? scale + 1 : scale);
      sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.bridge.pick(a.id));
    }
    const label = this.add.text(home.x, home.y + 10, a.side === 'hero' ? a.name : SHORT_NAME[a.role as squad.EnemyRole], { fontFamily: 'monospace', fontSize: '11px', color: '#f6dfc3', stroke: '#211d2a', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(960);
    return { sprite, label, sheet, monster, pose: '', home, hitUntil: 0 };
  }
  private pose(v: Visual, name: string, reduced: boolean) {
    if (v.pose === name + reduced) return;
    v.pose = name + reduced;
    if (reduced) { v.sprite.stop(); return; }
    const catName = name === 'hit' ? 'hurt' : name === 'windup' ? 'equip' : name === 'cast' ? 'attack' : name;
    const key = v.sheet?.anims[catName as keyof CatSheet['anims']]?.key ?? v.monster?.[(name === 'victory' ? 'idle' : name === 'cast' ? 'attack' : name) as MonsterAnim];
    if (key) v.sprite.play(key, true);
  }
  private number(event: squad.BattleEvent, tick: number) {
    const target = this.actors.get(event.targets[0] ?? event.source ?? '');
    if (!target) return;
    const key = `${event.type}:${event.targets[0] ?? event.source}:${event.text ?? ''}`;
    const existing = this.labels.find(x => x.key === key && x.until >= tick);
    const amount = (existing?.amount ?? 0) + (event.amount ?? 0);
    const value = event.type === 'heal' ? `+${amount}` : event.type === 'shield' ? `◇${amount}` : event.type === 'impact' ? amount === 0 ? 'Guard' : `−${amount}` : event.text ?? '';
    if (!value) return;
    if (existing) { existing.amount = amount; existing.until = tick + 16; existing.text.setText(value); return; }
    if (this.labels.length >= 18) this.labels.shift()!.text.destroy();
    const y = target.sprite.y - target.sprite.displayHeight - 18 - this.labels.filter(x => Math.abs(x.text.x - target.sprite.x) < 20).length * 13;
    const text = this.add.text(target.sprite.x, y, value, { fontFamily: 'monospace', fontSize: event.type === 'passive' ? '11px' : '14px', fontStyle: 'bold', color: event.type === 'heal' ? '#c0edb1' : event.type === 'shield' ? '#b1def0' : '#ffe8bc', stroke: '#211d2a', strokeThickness: 3 }).setOrigin(0.5).setDepth(1000);
    this.labels.push({ text, until: tick + 16, y, key, amount });
  }
  update() {
    if (!this.floor) return;
    const { battle: s, running, reduced, speed, restoration = 0 } = this.bridge.read();
    if (this.w !== this.scale.width || this.h !== this.scale.height || restoration !== this.restoration) { this.restoration = restoration; this.room(); this.w = this.scale.width; this.h = this.scale.height; }
    const optionsKey = JSON.stringify(s.options);
    if (s.tick < this.lastTick || s.events.length < this.cursor || optionsKey !== this.optionsKey) {
      for (const v of this.actors.values()) { v.sprite.destroy(); v.label.destroy(); }
      this.actors.clear(); this.cursor = 0; this.effects = []; this.labels.forEach(x => x.text.destroy()); this.labels = [];
    }
    this.optionsKey = optionsKey;
    this.lastTick = s.tick;
    for (const [id, v] of this.actors) if (!s.actors.some(a => a.id === id)) { v.sprite.destroy(); v.label.destroy(); this.actors.delete(id); }
    this.zones.clear(); this.fx.clear(); this.bars.clear();
    for (const p of s.patches) {
      const pos = this.point(p);
      const area = this.areaSize(p.radius);
      this.zones.fillStyle(COLORS.sage, 0.13).fillEllipse(pos.x, pos.y, area.width, area.height);
      this.zones.lineStyle(2, COLORS.sage, 0.65).strokeEllipse(pos.x, pos.y, area.width, area.height);
      this.zones.fillStyle(COLORS.sage).fillRect(pos.x - 3, pos.y - 9, 6, 18).fillRect(pos.x - 9, pos.y - 3, 18, 6);
    }
    for (const a of s.actors) {
      let v = this.actors.get(a.id); if (!v) { v = this.addActor(a); this.actors.set(a.id, v); }
      v.home = this.point(a);
      const displayScale = this.scale.width >= 600 ? 2 : 1;
      v.sprite.setScale((a.role === 'yarn' || a.role === 'vacuum') ? displayScale + 1 : displayScale);
      const c = a.cast, pos = { ...v.home };
      const melee = squad.isMeleeCast(a);
      v.sprite.setPosition(Math.round(pos.x), Math.round(pos.y)).setDepth(100 + pos.y).setAlpha(a.hp ? 1 : 0.25);
      v.label.setPosition(v.home.x, v.home.y + 12).setAlpha(a.hp ? 1 : 0.4);
      const pose = !a.hp ? 'defeat' : s.phase === 'won' && a.side === 'hero' ? 'victory' : s.tick < v.hitUntil ? 'hit' : c ? s.tick < c.release ? melee ? 'walk' : 'windup' : 'cast' : 'idle';
      this.pose(v, pose, reduced);
      // Pin release/contact to the rig's authored contact frame, rather than starting a swing after damage.
      if (v.sheet && c && s.tick >= c.release && s.tick >= v.hitUntil && a.hp) {
        const contact = v.sheet.anims.attack.hitFrames?.[0] ?? 1;
        v.sprite.stop().setFrame(`attack:${contact}`);
      }
      v.sprite.anims.timeScale = speed;
      if (!running && s.phase !== 'won' && s.phase !== 'lost') v.sprite.anims.pause(); else if (!reduced) v.sprite.anims.resume();
      if (!a.hp) continue;
      const barY = v.home.y - ((a.role === 'yarn' || a.role === 'vacuum') ? 115 : 64), barW = (a.role === 'yarn' || a.role === 'vacuum') ? 100 : 60;
      this.bars.fillStyle(COLORS.ink, 0.95).fillRect(v.home.x - barW / 2 - 1, barY - 1, barW + 2, 7);
      this.bars.fillStyle(a.side === 'hero' ? COLORS.sage : COLORS.rose).fillRect(v.home.x - barW / 2, barY, Math.round(barW * a.hp / a.maxHp), 5);
      if (squad.shieldOf(a)) this.bars.fillStyle(COLORS.blue).fillRect(v.home.x - barW / 2, barY + 7, barW * squad.shieldOf(a) / a.maxHp, 3);
      if (a.role === 'yarn' || a.role === 'vacuum') this.bars.fillStyle(COLORS.amber).fillRect(v.home.x - barW / 2, barY + 10, barW * a.break / 100, 3);
      if (s.focus === a.id) this.bars.lineStyle(2, COLORS.amber).strokeEllipse(v.home.x, v.home.y, 78, 24);
      if (squad.hasStatus(a, 'bound') || squad.hasStatus(a, 'snare')) this.fx.lineStyle(2, COLORS.lavender).strokeEllipse(pos.x, pos.y - 20, 55, 35).lineBetween(pos.x - 25, pos.y - 35, pos.x + 25, pos.y - 5);
      if (squad.hasStatus(a, 'guard') || squad.shieldOf(a)) this.fx.lineStyle(2, COLORS.blue, 0.65).strokeRoundedRect(pos.x - 25, pos.y - 52, 50, 55, 15);
      if (squad.hasStatus(a, 'marked')) this.fx.lineStyle(2, COLORS.amber).strokeTriangle(pos.x, pos.y - 75, pos.x - 8, pos.y - 87, pos.x + 8, pos.y - 87);
      if (a.role === 'vacuum' && squad.hasStatus(a, 'exposed')) this.fx.lineStyle(3, COLORS.rose, 0.8).lineBetween(pos.x - 15, pos.y - 80, pos.x - 20, pos.y - 100).lineBetween(pos.x + 15, pos.y - 80, pos.x + 20, pos.y - 100);
      if (squad.hasStatus(a, 'exposed')) this.fx.lineStyle(3, COLORS.amber).strokeCircle(pos.x, pos.y - 42, 23);
      if (squad.hasStatus(a, 'burn')) this.fx.fillStyle(COLORS.amber).fillTriangle(pos.x - 10, pos.y - 12, pos.x, pos.y - 34, pos.x + 10, pos.y - 12);
      if (a.linkedTo) { const ally = s.actors.find(x => x.id === a.linkedTo && squad.hasStatus(x, 'bound')); if (ally) { const linked = this.point(ally); this.zones.lineStyle(2, COLORS.lavender, 0.8).lineBetween(pos.x, pos.y - 12, linked.x, linked.y - 20); } }
      if (c && s.tick <= c.impact) this.telegraph(a, c, s.tick);
    }
    for (const e of s.events.slice(this.cursor)) {
      if (s.tick - e.tick > 24) continue;
      if (['release', 'impact', 'heal', 'shield', 'interrupt'].includes(e.type)) this.effects.push({ event: e, until: e.tick + Math.max(10, e.duration ?? 0) });
      if (['impact', 'heal', 'shield', 'passive', 'interrupt'].includes(e.type)) this.number(e, s.tick);
      if (e.type === 'impact' && e.amount) { const v = this.actors.get(e.targets[0]!); if (v) v.hitUntil = s.tick + 4; }
    }
    this.cursor = s.events.length;
    this.effects = this.effects.filter(e => e.until >= s.tick).slice(-32);
    for (const effect of this.effects) this.effect(effect, s.tick, reduced);
    this.labels = this.labels.filter(x => {
      if (s.tick > x.until) { x.text.destroy(); return false; }
      x.text.setY(reduced ? x.y : x.y - (16 - (x.until - s.tick)) * 0.7).setAlpha(Math.min(1, (x.until - s.tick) / 5)); return true;
    });
  }
  private telegraph(a: squad.Actor, c: squad.Cast, tick: number) {
    const tracked = ['charge', 'volley', 'thread'].includes(c.skill) ? this.actors.get(c.targets[0]!)?.home : undefined;
    const p = tracked ?? this.point(c.point), t = (tick - c.start) / Math.max(1, c.impact - c.start), enemy = a.side === 'enemy';
    const color = enemy ? COLORS.rose : c.skill === 'milk' || c.skill === 'moss' ? COLORS.sage : COLORS.lavender;
    if (c.skill === 'sweep' || c.skill === 'suction') {
      const halfHeight = squad.SKILLS[c.skill].radius * this.scale.height / 380;
      this.zones.fillStyle(COLORS.rose, 0.18).fillRect(0, p.y - halfHeight, this.scale.width, halfHeight * 2);
      this.zones.lineStyle(2, COLORS.rose).lineBetween(0, p.y - halfHeight, this.scale.width, p.y - halfHeight).lineBetween(0, p.y + halfHeight, this.scale.width, p.y + halfHeight);
      for (let x = 30; x < this.scale.width; x += 80) this.zones.fillStyle(COLORS.rose, 0.6).fillTriangle(x, p.y, x + 15, p.y - 9, x + 15, p.y + 9);
    } else if (['charge', 'volley', 'thread'].includes(c.skill)) {
      const from = this.point(a); this.zones.lineStyle(3, color, 0.5).lineBetween(from.x, from.y, p.x, p.y);
      this.zones.lineStyle(2, color).strokeCircle(p.x, p.y, 22 + 10 * t);
    } else if (c.skill === 'orb' || c.skill === 'snare') {
      const area = this.areaSize(squad.SKILLS[c.skill].radius + (c.skill === 'orb' && a.gear.includes('cinder') ? 35 : 0));
      this.zones.lineStyle(2, color, 0.6).strokeEllipse(p.x, p.y, area.width, area.height);
    } else if (c.skill === 'pierce') {
      const half = squad.SKILLS.pierce.radius * this.scale.height / 380;
      this.zones.lineStyle(1, COLORS.amber, 0.5).lineBetween(p.x - 40, p.y - half, this.scale.width, p.y - half).lineBetween(p.x - 40, p.y + half, this.scale.width, p.y + half);
    } else if (c.skill === 'motor' || c.skill === 'debris') {
      this.zones.fillStyle(COLORS.rose, 0.08 + t * 0.12).fillRect(20, this.scale.height * 0.2, this.scale.width * 0.5, this.scale.height * 0.7);
      for (const id of c.targets) { const v = this.actors.get(id); if (v) this.zones.lineStyle(3, COLORS.rose).strokeCircle(v.home.x, v.home.y - 20, 25 + t * 10); }
    } else if (c.skill === 'lanternstorm' || c.skill === 'rain') {
      for (const id of c.targets) { const v = this.actors.get(id); if (v) this.zones.lineStyle(2, COLORS.amber).strokeCircle(v.home.x, v.home.y, 26); }
    }
    if (enemy && ['sweep', 'thread', 'charge', 'volley', 'motor', 'suction', 'debris'].includes(c.skill)) {
      const from = this.point(a); this.bars.fillStyle(color).fillRect(from.x - 30, from.y + 29, 60 * Math.min(1, t), 3);
    }
  }
  private effect({ event: e, until }: Effect, tick: number, reduced: boolean) {
    const from = this.actors.get(e.source ?? ''), target = this.actors.get(e.targets[0] ?? '');
    const homing = e.type === 'release' && ['basic', 'milk', 'mend', 'volley', 'thread'].includes(e.skill ?? 'basic');
    const to = homing && target ? target.home : e.point ? this.point(e.point) : target?.home;
    if (!to) return;
    const heal = e.skill === 'milk' || e.skill === 'moss' || e.skill === 'mend';
    const color = heal ? COLORS.sage : e.skill === 'snare' ? COLORS.lavender : COLORS.amber;
    if (e.type === 'release' && (e.skill === 'hearthwall' || e.skill === 'shelter')) {
      const x = this.point({ x: 380, y: 0 }).x;
      this.fx.fillStyle(COLORS.blue, 0.1).fillRoundedRect(45, this.scale.height * 0.18, x - 45, this.scale.height * 0.68, 18);
      this.fx.lineStyle(4, COLORS.blue, 0.8).lineBetween(x, this.scale.height * 0.18, x, this.scale.height * 0.86);
    }
    if (e.type === 'release' && from && (e.duration ?? 0) > 0) {
      const t = Phaser.Math.Clamp((tick - e.tick) / Math.max(1, e.duration!), 0, 1);
      if (t >= 1) return;
      const x = from.sprite.x + (to.x - from.sprite.x) * t, y = from.sprite.y - 32 + (to.y - from.sprite.y) * t - (heal ? Math.sin(t * Math.PI) * 65 : 0);
      if (reduced) { this.fx.lineStyle(2, color, 0.6).lineBetween(from.home.x, from.home.y - 30, to.x, to.y - 30); return; }
      if (heal) this.fx.fillStyle(color).fillRect(x - 5, y - 4, 10, 12).fillRect(x - 2, y - 9, 4, 5);
      else if (e.skill === 'rain') {
        for (const id of e.targets) { const v = this.actors.get(id); if (v) { const py = v.home.y - 120 + t * 90; this.fx.lineStyle(2, COLORS.cream).lineBetween(v.home.x + 10, py - 18, v.home.x, py); this.fx.fillStyle(COLORS.amber).fillTriangle(v.home.x - 4, py - 5, v.home.x + 6, py - 2, v.home.x - 2, py + 5); } }
      } else if (e.skill === 'pierce' || e.skill === 'mark') {
        this.fx.lineStyle(3, COLORS.cream).lineBetween(x - 25, y, x + 8, y); this.fx.fillStyle(COLORS.amber).fillTriangle(x + 8, y - 5, x + 17, y, x + 8, y + 5);
      } else if (e.skill === 'debris') {
        for (const id of e.targets) { const v = this.actors.get(id); if (v) { const dx = from.sprite.x + (v.home.x - from.sprite.x) * t, dy = from.sprite.y - 35 + (v.home.y - from.sprite.y) * t; this.fx.fillStyle(COLORS.rose).fillRect(dx - 5, dy - 5, 10, 10); } }
      } else if (e.skill === 'lanternstorm') {
        for (const id of e.targets) { const v = this.actors.get(id); if (v) this.fx.fillStyle(COLORS.amber).fillRect(v.home.x - 5, v.home.y - 120 + t * 90, 10, 14); }
      } else if (e.skill === 'orb') this.fx.fillStyle(color).fillCircle(x, y, 11).lineStyle(3, COLORS.rose).lineBetween(x - 20, y + 3, x - 8, y);
      else this.fx.fillStyle(color).fillTriangle(x - 8, y - 4, x + 9, y, x - 8, y + 4);
    } else if (e.type === 'impact') {
      const radius = reduced ? 16 : 12 + (tick - e.tick) * 2;
      this.fx.lineStyle(2, color, Math.max(0, (until - tick) / 10));
      if (e.skill === 'nightfall' || e.skill === 'pounce') { this.fx.lineStyle(3, COLORS.lavender).lineBetween(to.x - 25, to.y - 50, to.x + 20, to.y - 10).lineBetween(to.x + 25, to.y - 50, to.x - 20, to.y - 10); }
      else if (e.skill === 'orb' || e.skill === 'lanternstorm' || e.skill === 'motor') this.fx.strokeCircle(to.x, to.y - 24, radius);
      else this.fx.lineBetween(to.x - 14, to.y - 38, to.x + 14, to.y - 12).lineBetween(to.x - 10, to.y - 12, to.x + 12, to.y - 40);
    } else if (e.type === 'heal') {
      this.fx.fillStyle(COLORS.sage, Math.max(0, (until - tick) / 10)).fillRect(to.x - 3, to.y - 42, 6, 20).fillRect(to.x - 10, to.y - 35, 20, 6);
    }
  }
}
