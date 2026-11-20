import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,expect,it,vi} from 'vitest';
import {StrictMode,useRef,useState} from 'react';
import {useNativeModal} from './native-modal';
import {ShellPages} from './ShellPages';

vi.mock('./LiveCounters',()=>({LiveCounters:()=>null}));
vi.mock('../contracts/audio-cues',()=>({playCue:vi.fn()}));
const methods=['showModal','close'] as const,original=methods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{for(const key of methods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
afterAll(()=>{methods.forEach((key,i)=>{if(original[i])Object.defineProperty(HTMLDialogElement.prototype,key,original[i]!);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);});});

function Panel(){const ref=useRef<HTMLDialogElement>(null);useNativeModal(ref,true);return <dialog ref={ref} tabIndex={-1} aria-label="Test"/>;}
function Fixture(){const [open,setOpen]=useState(false);return <><button onClick={()=>setOpen(!open)}>Open</button>{open&&<Panel/>}</>;}
it('pairs native lifecycle with cleanup under StrictMode and restores the connected opener',()=>{
 const show=vi.spyOn(HTMLDialogElement.prototype,'showModal'),close=vi.spyOn(HTMLDialogElement.prototype,'close');
 render(<StrictMode><Fixture/></StrictMode>);const opener=screen.getByRole('button',{name:'Open'});opener.focus();fireEvent.click(opener);
 const dialog=screen.getByRole('dialog',{name:'Test'}) as HTMLDialogElement;
 expect(dialog.open).toBe(true);expect(document.activeElement).toBe(dialog);expect(show).toHaveBeenCalledTimes(2);expect(close).toHaveBeenCalledTimes(1);
 fireEvent.click(opener);expect(screen.queryByRole('dialog')).toBeNull();expect(close).toHaveBeenCalledTimes(2);expect(document.activeElement).toBe(opener);
});
it('keeps ShellPages native modality through the exit animation and then restores focus',async()=>{
 let finish!:()=>void;vi.stubGlobal('matchMedia',()=>({matches:false}));
 const animate=vi.fn(()=>({finished:new Promise<void>(resolve=>{finish=resolve;}),cancel:vi.fn()}));
 vi.stubGlobal('Animation',class {});const descriptor=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');
 Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});
 try{
  render(<><button onClick={()=>window.dispatchEvent(new CustomEvent('shell:page',{detail:'odds'}))}>Open odds</button><ShellPages/></>);
  const opener=screen.getByRole('button',{name:'Open odds'});opener.focus();fireEvent.click(opener);
  const dialog=screen.getByRole('dialog',{name:'odds'}) as HTMLDialogElement,cancel=new Event('cancel',{cancelable:true});
  fireEvent(dialog,cancel);expect(cancel.defaultPrevented).toBe(true);expect(dialog.open).toBe(true);expect(document.activeElement).toBe(dialog);
  expect(animate).toHaveBeenCalledOnce();await act(async()=>finish());
  expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(opener);
 }finally{if(descriptor)Object.defineProperty(HTMLElement.prototype,'animate',descriptor);else Reflect.deleteProperty(HTMLElement.prototype,'animate');}
});
