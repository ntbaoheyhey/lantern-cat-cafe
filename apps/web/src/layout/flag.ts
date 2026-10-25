/** Cut-over switch: v2 is the default; VITE_GAME_V2=0 keeps the classic rollback build. */
export function isGameV2(): boolean {
  return import.meta.env.VITE_GAME_V2 !== '0';
}
