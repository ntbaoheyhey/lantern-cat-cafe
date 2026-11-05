import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createTurnBattle, getTimeline, startTurn } from '@taskbar-hero/game-rules/src/squad/turn/engine';
import { RoundOrder } from './RoundOrder';
it('shows both numbered rounds with readable integer Initiative and committed intent',()=>{
  const b=createTurnBattle({encounter:'group'});startTurn(b);
  render(<RoundOrder slots={getTimeline(b)} actors={b.actors} round={b.round} activeId={b.activeId}/>);
  const current=screen.getByRole('list',{name:'Round 1 remaining'}),next=screen.getByRole('list',{name:'Round 2 next order'});
  expect(within(current).getAllByRole('listitem')).toHaveLength(9);
  expect(within(next).getAllByRole('listitem')).toHaveLength(9);
  expect(current.textContent).toContain('Mochi');expect(current.textContent).toContain('Order 8');
  expect(current.querySelector('.is-current')?.textContent).toContain('Mochi');
});
