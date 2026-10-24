/** v2 cat rig: shared 32 x 32 cat, anchors per frame, gear layers, baked Phaser textures. */
export { bakeCat, bakeCatInto, buildSheet, catTextureKey, phaserTextures } from './bake';
export type { AnimSink, CatAnim, CatSheet, SheetImage, TextureSink } from './bake';
export { composeFrame, FRAME, FRAME_ORIGIN } from './compose';
export { ARMOR_SETS, WEAPON_SETS } from './gear';
export { CLASS_LOOKS, RARITY_PALETTES } from './palettes';
export { animsFor, ATTACKS, SHARED_ANIMS } from './poses';
export * from './types';
