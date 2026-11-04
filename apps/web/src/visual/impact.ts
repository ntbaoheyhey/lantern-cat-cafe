import { CONFIG } from '@taskbar-hero/game-rules';
import { VISUAL_PALETTE } from './tokens';
/** A fixed-capacity cosmetic pool. No game state, RNG, timers or per-frame allocation. */
export interface ImpactInk { clear(): ImpactInk; fillStyle(color: number, alpha: number): ImpactInk; fillRect(x: number, y: number, width: number, height: number): ImpactInk; destroy(): void }
export class ImpactPool {
  private particles = Array.from({ length: CONFIG.gameplay.juice.maxParticles }, () => ({ active: false, x: 0, y: 0, dx: 0, dy: 0, age: 0, color: 0 }));
  private cursor = 0;
  constructor(private ink: ImpactInk) {}
  burst(x: number, y: number, crit: boolean, defeat = false) {
    const n = defeat ? CONFIG.gameplay.juice.burstDefeat : crit ? CONFIG.gameplay.juice.burstCrit : CONFIG.gameplay.juice.burstNormal;
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.cursor++ % this.particles.length]!;
      const angle = i * Math.PI * 2 / n;
      Object.assign(p, { active: true, x, y, dx: Math.cos(angle) * (crit ? 18 : 12), dy: Math.sin(angle) * 14 - 9, age: 0,
        color: parseInt((defeat ? VISUAL_PALETTE.mist : i % 2 ? VISUAL_PALETTE.cream : VISUAL_PALETTE.gold).slice(1), 16) });
    }
  }
  update(delta: number) {
    this.ink.clear();
    for (const p of this.particles) if (p.active) {
      p.age += Math.min(delta, 50);
      const t = p.age / CONFIG.gameplay.juice.settleMs;
      if (t >= 1) { p.active = false; continue; }
      this.ink.fillStyle(p.color, 1 - t).fillRect(Math.round(p.x + p.dx * t), Math.round(p.y + p.dy * t + 13 * t * t), 1, 1);
    }
  }
  clear() { for (const p of this.particles) p.active = false; this.ink.clear(); }
  destroy() { this.clear(); this.ink.destroy(); }
}
