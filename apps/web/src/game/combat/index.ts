/** v2 combat animation: cue scheduler, pools and the Phaser director. */
export { buildBossCues, buildIdleCues, CuePlayer } from './timeline';
export type { CombatCue, CueType, IdleOptions, ProjectileKind, WeaponTiming } from './timeline';
export { Pool } from './pool';
export { CombatDirector, FEEL, gripFromSheet, MAX_PARTICLES, prefersReducedMotion, weaponOf } from './CombatDirector';
export type { CombatDirectorOptions, CombatHooks, MonsterTier } from './CombatDirector';
export { asCombatScene } from './stage';
export type { CombatCat, CombatMonster, CombatScene, FxGraphics, FxText, Point } from './stage';
