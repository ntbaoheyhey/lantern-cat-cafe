import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {DepthModel} from '../depth/model';
import {RouteC2} from './RouteC2';

afterEach(cleanup);
function cleared(chapter:number,won=true){const m=new DepthModel(true,true,true,true);m.start(1,'campaign',1);m.state.run!.chapter=chapter;m.state.run!.complete=true;m.state.run!.won=won;return m;}

it('offers the Chapter 1 guardian Relic on the compact route-clear screen',()=>{
 render(<RouteC2 m={cleared(1)} map={null}/>);
 expect(screen.getByText('Route clear')).toBeTruthy();
 expect(screen.getByText('Keep as Relic')).toBeTruthy();
});
it.each([[1,false],[2,true]] as const)('shows no Relic offer for chapter %i won=%s',(chapter,won)=>{
 render(<RouteC2 m={cleared(chapter,won)} map={null}/>);
 expect(screen.queryByText('Keep as Relic')).toBeNull();
});
