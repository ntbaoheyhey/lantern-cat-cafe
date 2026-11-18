/** Batch M source-free experiment. Changes only Panko instances in a disposable dev page. */
export async function installPankoExperiment(page){
 return page.evaluate(async()=>{
  const {springWave,SECONDARY_SPRINGS}=await import('/src/game/rig/secondary-motion.ts');
  const entry=[...window.__depthScene.actors.values()].find(e=>e.asset==='panko');
  if(!entry?.craftPose?.drawing)throw Error('Panko drawing missing');
  const d=entry.craftPose.drawing;
  const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*t*(t*(t*6-15)+10);};
  const phase=(t,offset=0)=>(t-offset)%10<0?(t-offset)%10+10:(t-offset)%10;
  const blink=t=>{let v=0;for(const start of [1.0,4.333333333333,7.666666666667]){const a=phase(t,start);v=Math.max(v,smooth(a/.18)*(1-smooth((a-.58)/.32)));}return v;};
  for(const m of [d.secondary,d.seekMotion]){
   const sample=m.sample.bind(m),layer=m.layer.bind(m);
   m.sample=function(clock,clip,time,reduced,...rest){
    sample(clock,clip,time,reduced,...rest);if(!['idle','idle-phase2'].includes(clip))return;
    const t=phase(clock),w=2*Math.PI/10,amount=reduced?0:1;
    this.period=10/3;this.body=.55*Math.sin(3*w*t+.4)*(reduced?.25:1);
    this.weight=amount*.48*Math.sin(w*t+.2);
    this.turn=amount*(.5*Math.sin(w*t+.4)+.12*Math.sin(2*w*t-.7));
    this.tilt=amount*(1.4*Math.sin(w*t+.8)+.35*Math.sin(2*w*t-.3));
    this.tiltSin=Math.sin(this.tilt*Math.PI/180);this.tiltCos=Math.cos(this.tilt*Math.PI/180);
    this.nod=amount*.2*Math.sin(3*w*t-.2);
    this.leftBlink=blink(t);this.rightBlink=blink(t-.045);
    this.leftSoftness=this.rightSoftness=0;this.earFlick=0;this.handLift=0;this.tailSweep=0;
    this.overlapGain=1.8;this.fidgetAge=-1;
    this.hair=this.layer('hair',0);this.ear=this.layer('ear',.4);this.accessory=this.layer('accessory',.8);
   };
   m.layer=function(part,p){
    if(!['idle','idle-phase2'].includes(this.clip))return layer(part,p);
    if(!this.amount)return 0;
    const spec=SECONDARY_SPRINGS[part]??SECONDARY_SPRINGS.accessory,w=2*Math.PI/10,t=phase(this.clock);
    return .72*springWave(t,w*3,.4,spec)+.22*springWave(t,w,0,spec);
   };
  }
  return{cat:'panko',cycleSeconds:10,breathSeconds:10/3,blinkStarts:[1,4.333333333333,7.666666666667],blinkDuration:.9,method:'Instance-local sample and layer override; no source or loader edit'};
 });
}
