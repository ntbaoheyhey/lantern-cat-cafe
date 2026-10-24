import { MONSTERS, type MonsterDef } from './monsters';

export interface ChapterDef {
  /** 'ch1'..'ch5'. */
  id: string;
  /** 1-based; stage s = (index - 1) x roundsPerChapter + round. */
  index: number;
  name: string;
  /** Background drawing id. */
  background: string;
  regulars: readonly string[];
  elite: string;
  boss: string;
  /** Kills to finish a round. The last kill of each round is the elite. */
  killsPerRound: number;
  roundsPerChapter: number;
  /** Chest table ids (chests.ts). */
  chests: { firstClear: string; repeat: string };
}

const NAMES = ['Living Room', 'Kitchen', 'Bathroom', 'Basement', 'Night Rooftops'] as const;
const BACKGROUNDS = ['livingroom', 'kitchen', 'bathroom', 'basement', 'rooftops'] as const;

function byKind(chapter: number, kind: MonsterDef['kind']): string[] {
  return MONSTERS.filter((m) => m.chapter === chapter && m.kind === kind).map((m) => m.id);
}

export const CHAPTERS: readonly ChapterDef[] = NAMES.map((name, i) => {
  const index = i + 1;
  return {
    id: `ch${index}`,
    index,
    name,
    background: BACKGROUNDS[i] ?? 'livingroom',
    regulars: byKind(index, 'regular'),
    elite: byKind(index, 'elite')[0] ?? '',
    boss: byKind(index, 'boss')[0] ?? '',
    // Chapter 1 is short so the first boss arrives in about 10 minutes.
    killsPerRound: index === 1 ? 6 : 10,
    roundsPerChapter: 10,
    chests: { firstClear: `chest.ch${index}.first`, repeat: `chest.ch${index}.repeat` },
  };
});
