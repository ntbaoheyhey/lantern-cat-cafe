/** Frame identity is decoded from compositor pixels, not inferred from the
 * planned clock or a post-draw timestamp. A clock contact is still not proof
 * that the effect's painted edge touched a target: retain the manual review. */
export function mediaTiming(plan, pictures, renders) {
  const samples = pictures.map((picture, index) => ({picture, index,
    render: Number.isInteger(picture.renderFrame) ? renders[picture.renderFrame] : null}));
  const active = samples.filter(s => s.render?.action?.key === plan.key);
  if (!active.length) return null;
  const first = active[0], last = active.at(-1);
  const next = samples[last.index + 1];
  const unknownInside = samples.slice(first.index, last.index + 1).some(s => !s.render);
  const impact = active.find(s => s.render.action.elapsed >= plan.impact);
  const anticipation = active.find(s => s.render.action.elapsed >= plan.beats[0].duration);
  const offset = sample => sample ? (sample.picture.t - first.picture.t) * 1000 : null;
  const consecutive = active.every((s,i) => i === 0 || s.index === active[i-1].index + 1);
  return {key: plan.key, actor: plan.actorId, skill: plan.skillId, tier: plan.tier,
    start: first.picture.t, last: last.picture.t,
    firstRenderOrdinal: first.picture.renderFrame, lastRenderOrdinal: last.picture.renderFrame,
    durationMs: next?.render && consecutive && !unknownInside ? offset(next) : null,
    clockContactMs: offset(impact), anticipationEndMs: offset(anticipation),
    boundaryTruncated: !next, unknownInside, consecutive,
    evidence: 'Actual compositor frame identities. Contact names the rendered clock crossing; pixel-contact judgement remains separate.'};
}
