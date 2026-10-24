import Phaser from 'phaser';
import type { GameLoop } from './gameState';
import { STRIP_HEIGHT, StripScene } from './StripScene';

export function createGame(parent: HTMLElement, loop: GameLoop): Phaser.Game {
  const game = new Phaser.Game({
    // Canvas, not AUTO: the strip is flat 2D sprites, and Phaser's WebGL renderer uploads GPU-backed
    // canvases (TileSprite, boot textures), which makes Chromium log "GPU stall due to ReadPixels".
    type: Phaser.CANVAS,
    parent,
    width: Math.max(parent.clientWidth, 1),
    height: STRIP_HEIGHT,
    pixelArt: true,
    audio: { noAudio: true },
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [StripScene],
  });
  game.registry.set('loop', loop);
  return game;
}
