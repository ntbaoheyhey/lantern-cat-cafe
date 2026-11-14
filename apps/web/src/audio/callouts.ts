import authoredCallouts from './voice-callouts.json';

export const VOICE_CALLOUTS = authoredCallouts;
const byCue = new Map(VOICE_CALLOUTS.map(row => [row.cueId, row]));
const units = [...new Set(VOICE_CALLOUTS.map(row => row.unitId))];

/** Instance prefixes belong to the battle, never to the sound catalogue. */
export function voiceUnit(actorId: string): string | undefined {
  return units.find(unit => actorId === unit ||
    actorId.replace(/^(?:party|cat)[-:]/, '') === unit ||
    actorId.replace(/^foe-\d+-/, '') === unit);
}

export function voiceCallout(id: string) { return byCue.get(id); }

export function calloutForCast(id: string): string | undefined {
  const ultimate = /^ult\.(.+)\.(charge|release)$/.exec(id);
  if (ultimate) {
    const unit = voiceUnit(ultimate[1]!);
    const cue = `voice.${unit}.ult.${ultimate[2]}`;
    return byCue.has(cue) ? cue : undefined;
  }
  const skill = /^skill\.(.+)\.(\d+)\.cast$/.exec(id);
  if (!skill) return;
  const unit = voiceUnit(skill[1]!);
  return VOICE_CALLOUTS.find(row => row.unitId === unit &&
    row.kind === 'skill' && row.slot === Number(skill[2]))?.cueId;
}

export function skillSlot(unit: string, skillId: string): number | undefined {
  return VOICE_CALLOUTS.find(row => row.unitId === unit &&
    row.kind === 'skill' && row.skillId === skillId)?.slot;
}
