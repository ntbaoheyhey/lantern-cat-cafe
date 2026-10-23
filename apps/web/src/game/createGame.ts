import Phaser from 'phaser';
import { STRIP_HEIGHT, StripScene } from './StripScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(parent.clientWidth, 1),
    height: STRIP_HEIGHT,
    pixelArt: true,
    audio: { noAudio: true },
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [StripScene],
  });
}
