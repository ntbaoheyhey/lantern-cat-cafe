/** Measure the rendered clock, keeping planned timings separate from observations.
 * Pixel contact/readability still requires the frame review; telemetry cannot
 * establish that a painted stroke actually touched its recipient. */
export function renderedTiming(plan, frames) {
  const indices = frames.flatMap((frame, index) => frame.action?.key === plan.key ? [index] : []);
  if (!indices.length) return null;
  const samples = indices.map(index => frames[index]);
  const offset = frame => frame ? (frame.t - plan.clockStart) * 1000 : null;
  const impact = samples.find(frame => frame.action.elapsed >= plan.impact);
  const anticipation = samples.find(frame => frame.action.elapsed >= plan.beats[0].duration);
  const lastIndex = indices.at(-1);
  const end = frames[lastIndex + 1];
  const previous = impact ? samples[samples.indexOf(impact) - 1] : null;
  return {
    key: plan.key, actor: plan.actorId, skill: plan.skillId, tier: plan.tier,
    clockStart: plan.clockStart, plannedDurationMs: plan.duration, plannedImpactMs: plan.impact,
    firstVisible: samples[0].t, lastVisible: samples.at(-1).t,
    observedDurationMs: offset(end), observedImpactMs: offset(impact),
    observedAnticipationEndMs: offset(anticipation),
    firstContact: impact?.t ?? null,
    contactBracketMs: impact && previous ? (impact.t - previous.t) * 1000 : null,
    boundaryTruncated: !end,
  };
}
