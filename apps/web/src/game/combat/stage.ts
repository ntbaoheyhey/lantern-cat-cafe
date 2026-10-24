import type Phaser from 'phaser';

/**
 * The slice of Phaser the combat layer touches. Phaser's own Scene, Sprite, Graphics and Text
 * satisfy these structurally (see asCombatScene), and tests pass a lightweight fake instead.
 */
export interface Point {
  x: number;
  y: number;
}

export interface FxGraphics {
  setDepth(depth: number): this;
  setVisible(visible: boolean): this;
  clear(): this;
  fillStyle(color: number, alpha?: number): this;
  fillRect(x: number, y: number, width: number, height: number): this;
  fillCircle(x: number, y: number, radius: number): this;
  lineStyle(width: number, color: number, alpha?: number): this;
  lineBetween(x1: number, y1: number, x2: number, y2: number): this;
  strokeCircle(x: number, y: number, radius: number): this;
  destroy(): void;
}

export interface FxText {
  setDepth(depth: number): this;
  setOrigin(x: number, y?: number): this;
  setText(text: string): this;
  setPosition(x: number, y?: number): this;
  setAlpha(alpha: number): this;
  setVisible(visible: boolean): this;
  setColor(color: string): this;
  setFontSize(size: number): this;
  destroy(): void;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: string;
  color: string;
  stroke: string;
  strokeThickness: number;
}

export interface CombatScene {
  add: {
    graphics(): FxGraphics;
    text(x: number, y: number, text: string, style: TextStyle): FxText;
  };
  cameras: { main: { width: number; shake(durationMs: number, intensity: number): unknown } };
}

/** The cat's sprite: plays the attack animation, may pause during hit-stop. */
export interface CombatCat {
  x: number;
  y: number;
  play(key: string, ignoreIfPlaying?: boolean): unknown;
  anims?: { pause(): unknown; resume(): unknown };
}

/** The monster's sprite or image: flashed, nudged, hopped and faded by the director. */
export interface CombatMonster {
  x: number;
  y: number;
  alpha: number;
  setPosition(x: number, y: number): this;
  setAlpha(alpha: number): this;
  setVisible(visible: boolean): this;
  setTintFill(color: number): this;
  clearTint(): this;
  anims?: { pause(): unknown; resume(): unknown };
}

/** Compile-time check that the real Phaser scene fits CombatScene. */
export function asCombatScene(scene: Phaser.Scene): CombatScene {
  return scene;
}
