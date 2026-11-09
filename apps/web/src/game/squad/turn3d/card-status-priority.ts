import { statusIdentity } from './card-status-data';
type Mark = string | { id: string; stacks: number };
const idOf = (mark: Mark) => typeof mark === 'string' ? mark : mark.id;
const stacksOf = (mark: Mark) => typeof mark === 'string' ? 1 : mark.stacks;
const control = new Set(['drowsy', 'hush', 'rattled']);
const rank = (mark: Mark) => control.has(idOf(mark)) ? 1 : statusIdentity(idOf(mark))?.order === 0 ? 0 : 2;
/** Bounded comparison, no sorting/copies in the frame loop. Badge data is untouched. */
export function showBodyMark(marks: readonly Mark[], index: number): boolean {
  if (marks.length <= 3) return true;
  const own = marks[index]!, priority = rank(own), stacks = stacksOf(own);
  let ahead = 0;
  for (let i = 0; i < marks.length; i++) {
    const other = marks[i]!, otherRank = rank(other);
    if (otherRank < priority || otherRank === priority &&
      (priority === 0 && stacksOf(other) > stacks || (priority !== 0 || stacksOf(other) === stacks) && i < index)) ahead++;
    if (ahead >= 3) return false;
  }
  return true;
}
