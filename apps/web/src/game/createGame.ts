import Phaser from 'phaser';
import type { GameLoop } from './gameState';
import { STRIP_HEIGHT, StripScene } from './StripScene';

/**
 * Creates the strip game. Without `zoom` it fills its parent (the classic 96 px strip). With `zoom` it keeps the
 * 96 px-tall scene and shows it scaled up by that whole number (the stage-first layout); see fitStage.
 */
export function createGame(parent: HTMLElement, loop: GameLoop, zoom?: number): Phaser.Game {
  const game = new Phaser.Game({
    // Canvas, not AUTO: the strip is flat 2D sprites, and Phaser's WebGL renderer uploads GPU-backed
    // canvases (TileSprite, boot textures), which makes Chromium log "GPU stall due to ReadPixels".
    type: Phaser.CANVAS,
    parent,
    width: zoom ? Math.max(Math.floor(parent.clientWidth / zoom), 1) : Math.max(parent.clientWidth, 1),
    height: STRIP_HEIGHT,
    pixelArt: true,
    audio: { noAudio: true },
    banner: false,
    scale: zoom ? { mode: Phaser.Scale.NONE, zoom } : { mode: Phaser.Scale.RESIZE },
    scene: [StripScene],
  });
  game.registry.set('loop', loop);
  return game;
}

/** Re-fit a zoomed game to its parent: scene width = parent width / zoom, scene height stays 96. */
export function fitStage(game: Phaser.Game, parent: HTMLElement, zoom: number): void {
  game.scale.setZoom(zoom);
  game.scale.resize(Math.max(Math.floor(parent.clientWidth / zoom), 1), STRIP_HEIGHT);
}
