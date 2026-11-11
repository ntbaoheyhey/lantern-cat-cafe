import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RouteCampfire,RouteShop} from './RouteStops';

afterEach(cleanup);
function model(kind:'shop'|'campfire',modern=true){
 const m=new DepthModel(true,modern,modern,modern);m.start(1,'campaign',1);
 const run=m.state.run!;run.current=run.nodes.find(n=>n.kind===kind)!.id;run.points=100;run.supplies=2;
 return m;
}
const button=(name:string)=>screen.getByRole('button',{name}) as HTMLButtonElement;

it.each([{points:35,supplies:2},{points:100,supplies:5},{points:35,supplies:5}])('explains shop limits before purchase ($points points, $supplies tonics)',({points,supplies})=>{
 const m=model('shop');Object.assign(m.state.run!,{points,supplies});const before=R.exportSave(m.state);
 render(<RouteShop m={m}/>);expect(button('Buy route tonic · 45 points').disabled).toBe(true);
 if(points<45)expect(screen.getByText(/Need 10 more for a purchase/)).toBeTruthy();
 if(supplies===5)expect(screen.getByText(/5\/5. At the carrying limit/)).toBeTruthy();
 fireEvent.click(button('Buy route tonic · 45 points'));expect(R.exportSave(m.state)).toBe(before);
 expect(button('Keep points and leave').disabled).toBe(false);
});
it.each(['tonic','charm','leave'])('previews read-only shop choices and applies the exact %s command',kind=>{
 const m=model('shop');m.state.run!.points=45;const id=kind==='charm'?R.shopStock(m.state.run!)[0]!:kind;
 const expected=R.resolveNode(m.state,id),before=R.exportSave(m.state);render(<RouteShop m={m}/>);
 expect(screen.getByText(/0 left after a purchase/)).toBeTruthy();expect(R.exportSave(m.state)).toBe(before);
 const action=kind==='tonic'?button('Buy route tonic · 45 points'):kind==='leave'?button('Keep points and leave'):screen.getByRole('button',{name:new RegExp(R.BOON_BY_ID[id]!.name)});
 fireEvent.click(action);expect(expected.ok).toBe(true);expect(m.state).toEqual(expected.state);
});
it('preserves the legacy tonic purchase above five',()=>{
 const m=model('shop',false);m.state.run!.supplies=5;const expected=R.resolveNode(m.state,'tonic');render(<RouteShop m={m}/>);
 expect(button('Buy route tonic · 45 points').disabled).toBe(false);expect(screen.getByText(/Route tonics: 5 → 6\./)).toBeTruthy();
 fireEvent.click(button('Buy route tonic · 45 points'));expect(m.state).toEqual(expected.state);
});
it('revalidates a stale shop quote before spending',()=>{
 const m=model('shop');render(<RouteShop m={m}/>);m.state={...m.state,run:{...m.state.run!,points:0}};
 const before=R.exportSave(m.state);fireEvent.click(button('Buy route tonic · 45 points'));expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(true);
 expect(button('Buy route tonic · 45 points').disabled).toBe(true);
});
it.each([true,false])('shows exact campfire healing, clipping and revival (modern=%s)',modern=>{
 const m=model('campfire',modern),cats=R.battleCats(m.state);m.state.run!.hp.mochi=cats[0]!.stats.hp-43;m.state.run!.hp.soot=0;
 const expected=R.resolveNode(m.state,'heal'),before=R.exportSave(m.state);render(<RouteCampfire m={m}/>);
 const region=screen.getByRole('region',{name:'Campfire recovery'});
 for(const cat of cats){const hp=m.state.run!.hp[cat.id]!,after=expected.state.run!.hp[cat.id]!;expect(region.textContent).toContain(`${hp} → ${after} HP (+${after-hp})`);}
 expect(region.textContent).toContain('Revives');expect(R.exportSave(m.state)).toBe(before);expect(button('Heal the crew').getAttribute('aria-describedby')).toBe(region.id);
 fireEvent.click(button('Heal the crew'));expect(m.state).toEqual(expected.state);
});
it('previews a chosen skill rank and keeps HP unchanged when strengthening it',()=>{
 const m=model('campfire'),skill=R.defaultSkills(m.state,'soot')[0]!;m.state.run!.upgrades[skill]=1;m.state.run!.hp.mochi!-=43;
 const before=R.exportSave(m.state),expected=R.resolveNode(m.state,'upgrade',skill);render(<RouteCampfire m={m}/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Campfire skill'}),{target:{value:skill}});
 expect(screen.getByText('Rank 1 → 2/3 · effect power +20% → +40% for this route.')).toBeTruthy();expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(button('Strengthen skill'));expect(m.state).toEqual(expected.state);
});
it('disables a capped skill and keeps full-HP continuation when every skill is capped',()=>{
 const m=model('campfire');for(const id of m.state.team.flatMap(id=>R.defaultSkills(m.state,id)))m.state.run!.upgrades[id]=3;
 const expected=R.resolveNode(m.state,'heal');render(<RouteCampfire m={m}/>);
 expect(button('Strengthen skill').disabled).toBe(true);expect(screen.getByText('This skill already has all 3 route upgrades.')).toBeTruthy();
 expect(screen.getByText(/All skills have 3 route upgrades. Continue when ready./)).toBeTruthy();
 expect(button('Continue at full HP').disabled).toBe(false);fireEvent.click(button('Continue at full HP'));expect(m.state).toEqual(expected.state);
});
it('refreshes quotes after route recovery and revalidates a stale upgrade',()=>{
 const m=model('campfire');m.state.run!.hp.mochi!-=43;render(<RouteCampfire m={m}/>);
 act(()=>m.apply(R.useTonic(m.state)));expect(button('Continue at full HP').disabled).toBe(false);
 const skill=(screen.getByRole('combobox',{name:'Campfire skill'}) as HTMLSelectElement).value;
 fireEvent.change(screen.getByRole('combobox',{name:'Campfire skill'}),{target:{value:skill}});
 m.state={...m.state,run:{...m.state.run!,upgrades:{[skill]:3}}};const before=R.exportSave(m.state);
 fireEvent.click(button('Strengthen skill'));expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(true);expect(button('Strengthen skill').disabled).toBe(true);
});
