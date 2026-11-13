import {playCue} from '../game/cardrpg/contracts/audio-cues';

/** A quiet repeating wait cue; one loop across concurrent receipts. */
export class TransactionSounds {
 private epoch=0;private pending=0;private timer?:ReturnType<typeof setInterval>;
 scope(){
  const epoch=this.epoch;
  return {
   wallet:()=>{if(epoch===this.epoch)this.wallet();},
   failure:()=>{if(epoch===this.epoch)this.failure();},
   begin:()=>epoch===this.epoch?this.begin():(_ok:boolean)=>{},
  };
 }
 wallet(){playCue('tx.wallet');}
 begin(){
  const epoch=this.epoch;let done=false;
  if(++this.pending===1){playCue('tx.pending',{volume:.35});this.timer=setInterval(()=>playCue('tx.pending',{volume:.35}),1600);}
  return (ok:boolean)=>{
   if(done||epoch!==this.epoch)return;done=true;
   if(--this.pending===0)this.stopLoop();
   playCue(ok?'tx.confirmed':'tx.failed');
  };
 }
 failure(){playCue('tx.failed');}
 private stopLoop(){clearInterval(this.timer);this.timer=undefined;if(typeof window!=='undefined')window.__thAudio?.stop('tx.pending');}
 silence(){this.epoch++;this.pending=0;this.stopLoop();}
}
