import {useEffect} from 'react';
import {audioEngine} from './engine';

/** Quiet café chatter follows the room and shares the existing single voice bus. */
export function useCafeChatter(active:boolean){
 useEffect(()=>{
  if(!active)return;
  let timer:ReturnType<typeof setTimeout>,alive=true;
  const schedule=()=>{timer=setTimeout(()=>{
   if(!alive)return;
   if(!document.hidden)audioEngine.play('voice.guide.idle',{priority:25});
   schedule();
  },20000+Math.random()*10000);};
  schedule();return()=>{alive=false;clearTimeout(timer);};
 },[active]);
}
