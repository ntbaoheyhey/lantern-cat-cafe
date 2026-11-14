import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {CatsSheet} from './SheetsV3';

vi.mock('../depth/CompanionPreview',()=>({CompanionPreview:({id,skillId}:{id:string;skillId?:string})=><div data-testid="preview" data-cat={id} data-skill={skillId??''}/> }));
const modal=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'showModal');
const close=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'close');
beforeAll(()=>{
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value(){this.open=true;}});
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value(){this.open=false;}});
});
afterEach(cleanup);
afterAll(()=>{
 if(modal)Object.defineProperty(HTMLDialogElement.prototype,'showModal',modal);else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
 if(close)Object.defineProperty(HTMLDialogElement.prototype,'close',close);else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
});

it('opens the selected skill, previews freely and restores its trigger without changing the account',()=>{
 const m=new DepthModel(true,true,true,true),before=JSON.stringify(m.state),cat=R.CAT_BY_ID.mochi!,last=cat.skills.at(-1)!;
 render(<CatsSheet m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));
 fireEvent.click(screen.getByRole('button',{name:new RegExp(last.name)}));
 const trigger=screen.getByRole('button',{name:'Watch skill previews'});trigger.focus();fireEvent.click(trigger);
 const dialog=screen.getByRole('dialog',{name:'Mochi · skill previews'});
 expect(screen.getByTestId('preview').getAttribute('data-skill')).toBe(last.id);
 expect(within(dialog).queryByText('Opens at level 6 or 3 stars')).toBeNull();
 expect(within(dialog).getByText('Automatic at 100 rage')).toBeTruthy();
 expect(within(dialog).getByText('Ready at 100 rage. Casts in 2.2 seconds.',{exact:false})).toBeTruthy();
 expect(within(dialog).getByText('Base effects shown.')).toBeTruthy();
 for(const skill of R.battleKitA6(cat.id)){
  fireEvent.click(within(dialog).getByRole('button',{name:new RegExp(skill.name)}));
  expect(screen.getByTestId('preview').getAttribute('data-skill')).toBe(skill.id);
  expect(within(dialog).getByRole('region',{name:skill.name}).textContent).toContain(R.kitSkillV5(skill).description);
 }
 fireEvent.click(within(dialog).getByRole('button',{name:'View miniature'}));
 expect(screen.getByTestId('preview').getAttribute('data-skill')).toBe('');
 fireEvent.keyDown(dialog,{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);
 expect(screen.getByRole('button',{name:new RegExp(last.name)}).getAttribute('aria-pressed')).toBe('true');
 expect(JSON.stringify(m.state)).toBe(before);
});

it('allows unowned previews without implying unlock, and returns from the gear miniature',()=>{
 const m=new DepthModel(true,true,true,true),before=JSON.stringify(m.state);
 render(<CatsSheet m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Discover all'}));
 fireEvent.click(screen.getByRole('button',{name:/Velvet/}));
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));
 fireEvent.click(screen.getByRole('button',{name:'Watch skill previews'}));
 let dialog=screen.getByRole('dialog',{name:'Velvet · skill previews'});
 expect(within(dialog).getByText('Recruit to unlock')).toBeTruthy();
 expect(within(dialog).queryByText('Stats & equipped gear')).toBeNull();
 fireEvent.click(within(dialog).getByRole('button',{name:/Back to Skills/}));
 fireEvent.click(screen.getByRole('button',{name:/Mochi/}));
 fireEvent.click(screen.getByRole('button',{name:'Gear'}));
 const trigger=screen.getByRole('button',{name:'Inspect stats & previews'});trigger.focus();fireEvent.click(trigger);
 dialog=screen.getByRole('dialog',{name:'Mochi · skill previews'});
 expect(screen.getByTestId('preview').getAttribute('data-skill')).toBe('');
 expect(within(dialog).getByText('Stats & equipped gear')).toBeTruthy();
 fireEvent.click(within(dialog).getByRole('button',{name:/Back to cat/}));
 expect(document.activeElement).toBe(trigger);expect(JSON.stringify(m.state)).toBe(before);
});
