import Phaser from 'phaser';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { monsterArt } from '../../art/monsters';
import { backdropFor } from '../../art/backdrops';
import { bakeCat, CLASS_LOOKS } from '../rig';
import { CombatDirector, asCombatScene, weaponOf, buildIdleCues } from '../combat';
import { bakeMonster, equippedVisuals } from '../arena/assets';

import { claimedKills } from './progress';

export class StageScene extends Phaser.Scene {
  private state0: ServerStateV2 | null = null;
  private cat: Phaser.GameObjects.Sprite | null = null;
  private monster: Phaser.GameObjects.Sprite | null = null;
  private director: CombatDirector | null = null;
  private reduced = false;
  constructor() { super('v2-stage'); }
  create() {
    this.events.once('shutdown', () => this.director?.destroy());
    if (this.state0) this.show(this.state0, this.reduced);
  }
  show(state: ServerStateV2, reducedMotion: boolean) {
    const before = this.state0;
    this.state0 = state; this.reduced = reducedMotion;
    if (!this.sys.isActive() || !state.cat.classId) return;
    this.director?.destroy(); this.cat?.destroy(); this.monster?.destroy();
    const cls = state.cat.classId;
    const sheet = bakeCat(this, CLASS_LOOKS[cls], equippedVisuals(state));
    const floor = backdropFor(state.progress.chapter).floorY;
    const width = this.scale.width;
    this.cat = this.add.sprite(width * 0.3, floor, sheet.key, 'idle:0').setOrigin(sheet.origin.x, sheet.origin.y);
    const chapter = v2.CHAPTERS.find(ch => ch.index === state.progress.chapter)!;
    const art = monsterArt(chapter.regulars[(state.progress.round - 1) % chapter.regulars.length]!)!;
    const anims = bakeMonster(this, art);
    this.monster = this.add.sprite(width * 0.7, floor, anims.walk, '0').setOrigin(0.5, 1);
    this.monster.play(anims.walk);
    this.cat.play(sheet.anims[reducedMotion || state.progress.gated ? 'idle' : 'walk'].key);
    this.director = new CombatDirector({ scene: asCombatScene(this), cat: this.cat, monster: this.monster,
      weapon: weaponOf(cls), anims: { attack: sheet.anims.attack.key, idle: sheet.anims.idle.key, hurt: sheet.anims.hurt.key },
      lootTarget: { x: width / 2, y: 0 }, monsterHeight: art.size.h, reducedMotion,
      hooks: { onImpact: () => this.monster?.play(anims.hit), onDefeat: () => this.monster?.play(anims.defeat), onMonsterHp: (hp, max) => { if (hp === max) this.monster?.play(anims.walk); } },
    });
    // Long claims are compressed to a short montage. The HUD retains every authoritative kill.
    const count = Math.min(8, claimedKills(before, state));
    if (count > 0) {
      const stats = v2.deriveStats({ classId: cls, level: state.cat.level }, state.inventory.filter(i => i.equipped).map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus })));
      const monster = v2.monsterAt(art.id, v2.stageOf(state.progress.chapter, state.progress.round));
      this.director.play(buildIdleCues(stats, monster, { cycles: count }));
    }
  }
  update(_time: number, delta: number) { this.director?.update(delta); }
}
