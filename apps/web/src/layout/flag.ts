/** Cat RPG v2 switch. Until the cut-over the stage-first layout renders only when the build sets VITE_GAME_V2=1. */
export function isGameV2(): boolean {
  return import.meta.env.VITE_GAME_V2 === '1';
}
