import type { Run, RunNode } from './contract';
import { CHAPTERS } from './run';
import { enemyGuideV4 } from './gameplay-v4';

export type ScoutTraitV4 = 'opening' | 'closing' | 'reach';
/** A route choice reveals a distinct clue only after that stop is completed. */
export function nodeClueV4(node: RunNode): ScoutTraitV4 | null {
  if (node.kind === 'boss') return null;
  if (node.depth === 0) return 'opening';
  if (node.kind === 'elite') return 'closing';
  if (node.kind === 'event') return 'reach';
  return null;
}
export function scoutingV4(run: Run | null) {
  if (!run?.gameplayV4) return { found: 0, total: 3, clues: [] };
  const chapter = CHAPTERS[run.chapter - 1]!;
  const guide = enemyGuideV4(chapter.boss);
  const learned = new Set(run.nodes.filter(node => run.visited.includes(node.id)).map(nodeClueV4));
  const text: Record<ScoutTraitV4, string> = {
    opening: run.chapter === 1 ? 'Loomfall sweeps the front row and summons threads.'
      : run.chapter === 2 ? 'Cloudburst removes shields before hitting one row.'
        : 'Empty Banquet removes shields and applies Hush.',
    closing: run.chapter === 1 ? 'Below half HP, Loomfall reaches both rows from the next round; threads still arrive.'
      : run.chapter === 2 ? 'Below half HP, Cloudburst reaches both rows from the next round and removes shields.'
        : 'Below half HP, Empty Banquet widens and summons threads from the next round.',
    reach: guide.exception,
  };
  const clues = (['opening', 'closing', 'reach'] as const).map(id => ({ id, known: learned.has(id),
    label: id === 'opening' ? 'Opening pattern' : id === 'closing' ? 'Closing pattern' : 'Who it can reach',
    text: learned.has(id) ? text[id] : null }));
  return { found: clues.filter(clue => clue.known).length, total: 3, clues };
}
