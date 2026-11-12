import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { FormationC2 } from './FormationC2';
import { suggestedTeamsA6 } from '../ui-v3/formation-a6';

afterEach(cleanup);
it('places by tap and by drag with four stable slots and two cats per row',()=>{
  const m=new DepthModel(true,true,true,true,true);render(<FormationC2 m={m}/>);
  const front=R.formationSeatsC2(m.state.team,m.state.rows)[0]!,rear=R.formationSeatsC2(m.state.team,m.state.rows)[2]!;
  const button=(id:string)=>screen.getByRole('button',{name:new RegExp(`^${R.CAT_BY_ID[id]!.name},`)});
  fireEvent.click(button(rear));fireEvent.click(button(front));
  expect(m.error).toBe(false);expect(m.state.rows[rear]).toBe('front');expect(m.state.rows[front]).toBe('rear');
  fireEvent.drop(button(rear),{dataTransfer:{getData:()=>front}});
  expect(m.state.rows[front]).toBe('front');expect(R.validRowsC2(m.state.team,m.state.rows)).toBe(true);
  for(const s of suggestedTeamsA6(m.state)){expect(s.team).toHaveLength(4);expect(R.configureTeam(m.state,s.team,s.rows,m.state.skills).ok).toBe(true);}
});
it('retains HP and enemy seed during preparation and locks after committing',()=>{
  const m=new DepthModel(true,true,true,true,true);m.start(1,'campaign',1);m.enter('0-0');
  const seed=m.battle!.seed,hp=structuredClone(m.state.run!.hp);render(<FormationC2 m={m} preparing/>);
  const buttons=screen.getAllByRole('button',{name:/Select for placement/});fireEvent.click(buttons[0]!);fireEvent.click(buttons[2]!);
  expect(m.battle!.seed).toBe(seed);expect(m.state.run!.hp).toEqual(hp);expect(m.error).toBe(false);
});
