import { scoutingV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/scouting-v4';
import type { Run } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
export function ScoutingV4({ run }: { run: Run | null }) {
  if (!run?.gameplayV4) return null;
  const scouting = scoutingV4(run);
  return <section className="cr-panel dp-v4-scouting" aria-label="Boss scouting"><h2>Known about the boss: {scouting.found}/3</h2>
    <div className="dp-v4-grid">{scouting.clues.map(clue => <article key={clue.id}><h3>{clue.label}</h3>
      <p>{clue.text ?? (clue.id === 'opening' ? 'Complete the first stop.' : clue.id === 'closing' ? 'Beat an elite to learn more.' : 'Visit a story stop to learn more.')}</p></article>)}</div>
  </section>;
}
