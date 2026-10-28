import type Phaser from 'phaser';

type WindowHandler = NonNullable<Window['onfocus']>;
const retiredHandlers = new WeakMap<WindowHandler, WindowHandler | null>();
function liveHandler(handler: WindowHandler | null): WindowHandler | null {
  while (handler && retiredHandlers.has(handler)) handler = retiredHandlers.get(handler)!;
  return handler;
}

/** Phaser 3.90's VisibilityHandler owns closures that Game.runDestroy never removes.
 * Capture only the synchronous registrations made by this game's start(), then release
 * them on its destroy event. The original handler still owns pause/resume behavior.
 */
export function startWithVisibilityCleanup(game: Pick<Phaser.Game, 'events'>, start: () => void): void {
  const add = document.addEventListener;
  const beforeBlur = window.onblur;
  const beforeFocus = window.onfocus;
  const listeners: { type: string; listener: EventListenerOrEventListenerObject; options?: boolean | AddEventListenerOptions }[] = [];
  document.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (type === 'visibilitychange' || /^(webkit|moz|ms)visibilitychange$/.test(type)) {
      listeners.push({ type, listener, options });
    }
    return add.call(this, type, listener, options);
  };
  try {
    start();
  } finally {
    document.addEventListener = add;
    const ownedBlur = window.onblur;
    const ownedFocus = window.onfocus;
    game.events.once('destroy', () => {
      for (const { type, listener, options } of listeners) document.removeEventListener(type, listener, options);
      // A stage and arena can overlap and can be destroyed in either order.
      if (ownedBlur && ownedBlur !== beforeBlur) retiredHandlers.set(ownedBlur, beforeBlur);
      if (ownedFocus && ownedFocus !== beforeFocus) retiredHandlers.set(ownedFocus, beforeFocus);
      if (window.onblur === ownedBlur) window.onblur = liveHandler(beforeBlur);
      if (window.onfocus === ownedFocus) window.onfocus = liveHandler(beforeFocus);
    });
  }
}

/** Keep the engine workaround at one boundary for stage and temporary boss games. */
export function createManagedGame(engine: typeof Phaser, config: Phaser.Types.Core.GameConfig): Phaser.Game {
  class ManagedGame extends engine.Game {
    override start(): void {
      startWithVisibilityCleanup(this, () => super.start());
    }
  }
  return new ManagedGame(config);
}
