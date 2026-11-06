/** Invitation reveal uses presentation time only. It cannot alter battle state. */
export const CARD_ENTRANCE_SECONDS = 1.35;
export function cardEntrancePose(elapsedSeconds: number, reducedMotion: boolean) {
  if (reducedMotion) return { progress: 1, lift: 0, zoom: 0, turn: 0, finished: true };
  const progress = Math.max(0, Math.min(1, elapsedSeconds / CARD_ENTRANCE_SECONDS));
  const settle = 1 - (1 - progress) ** 3;
  return { progress, lift: Math.sin(progress * Math.PI) * .16,
    zoom: Math.sin(progress * Math.PI) * .035, turn: (1 - settle) * -.25, finished: progress >= 1 };
}
