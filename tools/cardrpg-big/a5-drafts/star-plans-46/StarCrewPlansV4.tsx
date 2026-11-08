import { useMemo } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
import { starCrewPlansV4 } from './star-plans-v4';

export function StarCrewPlansV4({ m, goal, band }: { m: DepthModel; goal: R.NodeStarsV4 | undefined; band: number }) {
  const plans = useMemo(() => starCrewPlansV4(m.state, goal, band), [m.state, goal, band]);
  if (!plans.length || !goal) return null;
  const destination = `${goal.kind} at stop ${Number(goal.nodeId.split('-')[0]) + 1}`;
  return <details className="dp-v4-star-plans"><summary>Prepare for this star</summary>
    <p>Choose a four-mark crew. Complete the {destination} to earn its job star.</p>
    <p>Swap one companion. Each cat keeps its own equipment.</p>
    <div className="dp-three">{plans.map(plan => <article className="cr-panel" key={plan.incoming + ':' + plan.outgoing}>
      <h3>{R.CAT_BY_ID[plan.incoming]!.name} for {R.CAT_BY_ID[plan.outgoing]!.name}</h3>
      {plan.bonuses.map(crew => <p key={crew.id}><b>{crew.name} · {crew.marks}/4 marks</b><br />{crew.description}</p>)}
      <button onClick={() => {
        const current = starCrewPlansV4(m.state, goal, band).find(p => p.incoming === plan.incoming && p.outgoing === plan.outgoing);
        if (current) m.apply(R.configureTeam(m.state, current.team, current.rows, m.state.skills), `Crew ready. Complete the ${destination} for its job star.`);
      }}>Use {R.CAT_BY_ID[plan.incoming]!.name} instead of {R.CAT_BY_ID[plan.outgoing]!.name}</button>
    </article>)}</div>
  </details>;
}
