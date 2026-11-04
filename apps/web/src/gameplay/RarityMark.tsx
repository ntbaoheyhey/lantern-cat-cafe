/** Redundant shape + text: rarity is never conveyed by colour alone. No new rarity tier. */
const MARKS: Record<string, string> = { common: '●', uncommon: '▲', rare: '◆', epic: '✦', legendary: '✷', mythic: '✹', relic: '✷' };
export function RarityMark({ rarity }: { rarity: string }) {
  return <span className="rarity-mark" data-rarity={rarity} title={rarity} aria-hidden="true">{MARKS[rarity] ?? '◇'}</span>;
}
