import {useEffect} from 'react';
import {audioEngine} from './engine';

/** Quiet café chatter follows the room and shares the existing single voice bus. */
export function useCafeChatter(active:boolean){
 useEffect(()=>{
  if(!active)return;
  let timer:ReturnType<typeof setTimeout>,alive=true;
  const schedule=(first=false)=>{timer=setTimeout(()=>{
   if(!alive)return;
   if(!document.hidden)audioEngine.play('voice.guide.idle',{priority:25});
   schedule();
  },(first?20000:30000)+Math.random()*3000);};
  schedule(true);return()=>{alive=false;clearTimeout(timer);};
 },[active]);
}
