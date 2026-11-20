import {ITEM_BY_ID} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type { RoundSlot, TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';

export function RoundOrder({ slots, actors, round, activeId }: {
  slots: RoundSlot[]; actors: TurnActor[]; round: number; activeId: string | null;
}) {
  return <div className="t3-rounds" aria-label="Round order">{[round, round + 1].map(n =>
    <div className={`t3-round ${n > round ? 'is-next' : ''}`} key={n}>
      <b>Round {n}<small>{n === round ? 'REMAINING' : 'NEXT'}</small></b>
      <ol aria-label={`Round ${n} ${n === round ? 'remaining' : 'next order'}`}>
        {slots.filter(s => s.round === n).map((slot, i) => {
          const a = actors.find(a => a.id === slot.actorId); if (!a) return null;
          const current = n === round && a.id === activeId;
          return <li key={a.id} className={`${a.side}${current ? ' is-current' : ''}`}>
            <span title={`${a.name} · Initiative ${a.initiative}${slot.intent ? ` · ${slot.intent.label}, ${slot.intent.countdown ? 'next' : 'this'} round` : ''}`}>
              <i>{current ? '▶' : i + 1}</i> {a.name}{a.equipment.weapon&&<em title={ITEM_BY_ID[a.equipment.weapon]?.name}>✧</em>}<small>Order {a.initiative}</small>
            </span>
          </li>;
        })}
      </ol>
    </div>)}</div>;
}
