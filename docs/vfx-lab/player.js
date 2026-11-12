/* Standalone file:// workbench; field tracks are generated from the game runtime. */
const ids=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold','yarn-giant'];
const $=id=>document.getElementById(id),v=$('video'),canvas=$('field'),c=canvas.getContext('2d'),{DATA,FieldVfx,samplePaint}=window.VfxField;
let audio,timeline,elapsed=0,playing=false,last=0,before=false,images={},generation=0;
ids.forEach(id=>$('unit').add(new Option(id[0].toUpperCase()+id.slice(1),id)));
const loadImage=src=>new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes(i);i.onerror=no;i.src=src;});
const point=(id,socket)=>({x:id==='caster'?360:920,y:socket==='feet'?610:socket==='head'?310:450});
const field=new FieldVfx(point);
async function load(){
 playing=false;v.pause();elapsed=0;const id=$('unit').value;let skill=$('skill').value;
 if(id==='yarn-giant'){$('skill').value='ult';skill='ult';}
 const isUlt=skill==='ult';canvas.hidden=isUlt;v.hidden=!isUlt;$('before').hidden=!isUlt||!before;$('stage').classList.toggle('before',isUlt&&before);
 $('badge').textContent=before?'BEFORE · PAINTED LAYERS':isUlt?'AFTER · FULL PLATE':'AFTER · FIELD SEQUENCE';
 if(isUlt){v.innerHTML=`<source src="../../apps/web/public/cinematics/${id}-ult.webm" type="video/webm"><source src="../../apps/web/public/cinematics/${id}-ult.mp4" type="video/mp4">`;v.poster=`../../apps/web/public/cinematics/${id}-ult-poster.webp`;v.load();$('before').src=`../../assets/cardrpg-look/vfx-layered/${id==='yarn-giant'?'enemy-yarn-giant':id+'-4'}.webp`;}
 else {const key=++generation;timeline=DATA[id][+skill-1];const target=timeline.friendly?'mochi':'yarn-giant';const [caster,receiver,atlas]=await Promise.all([loadImage(`../../apps/web/public/units/${id}/runtime.webp`),loadImage(`../../apps/web/public/units/${target}/runtime.webp`),loadImage(`../../assets/cardrpg-look/vfx-layered/${id}-${skill}.webp`)]);if(key!==generation)return;images={caster,receiver,atlas};draw();}
 $('note').textContent=isUlt?'Field contact follows the plate at 3.20 seconds. Full / Short / Off and Skip are available in the battle menu.':'Exact runtime paint and procedural tracks. Drag the scrubber to inspect charge, travel and impact. The live battle supplies real targets and damage.';
}
function draw(){
 if(!timeline||!images.atlas)return;
 const s=timeline.sequence,t=elapsed,impact=s.impact,old=t<=impact?t/impact*timeline.impact:timeline.impact+(t-impact)/(s.duration-impact)*(timeline.duration-timeline.impact);
 c.clearRect(0,0,1280,720);const bg=c.createLinearGradient(0,0,0,720);bg.addColorStop(0,'#262133');bg.addColorStop(1,'#503734');c.fillStyle=bg;c.fillRect(0,0,1280,720);
 c.strokeStyle='#ffda8b22';for(let i=0;i<8;i++){c.beginPath();c.moveTo(i*200-200,720);c.lineTo(640+(i-3.5)*80,330);c.stroke();}
 c.fillStyle='#14102588';for(const x of [360,920]){c.beginPath();c.ellipse(x,615,160,26,0,0,7);c.fill();}
 c.drawImage(images.caster,90,60,540,590);c.save();c.translate(1180,60);c.scale(-1,1);c.drawImage(images.receiver,0,0,540,590);c.restore();
 for(const layer of timeline.layers){const k=samplePaint(layer,old);if(!k)continue;let p=point(layer.anchor==='caster'?'caster':'target',layer.socket),unit=300;
  if(layer.anchor==='flight'){const u=Math.max(0,Math.min(1,(old-layer.start)/(timeline.impact-layer.start)));p={x:360+(p.x-360)*u,y:450+(p.y-450)*u-Math.sin(u*Math.PI)*54};}
  const extent=unit*layer.size;c.save();c.globalAlpha=k.alpha;c.globalCompositeOperation=layer.blend==='add'?'lighter':layer.blend==='screen'?'screen':'source-over';c.translate(p.x+k.x*unit,p.y+k.y*unit);c.rotate(k.rotate);c.scale(k.sx,k.sy);c.drawImage(images.atlas,...layer.region,-extent/2,-extent/2,extent,extent);c.restore();
 }
 if(!before)field.render(c,{frame:{elapsed:t,plan:{sequence:s,actorId:'caster',targetIds:['target'],skillId:timeline.id,color:'#ffc477',accent:'#fff1c8'}},reducedMotion:false});
 c.fillStyle='#ffe3ad';c.font='800 36px Baloo';c.textAlign='center';c.fillText(timeline.name,640,685);$('time').textContent=(t/1000).toFixed(2)+' / '+(s.duration/1000).toFixed(2)+' s';$('scrub').value=t/s.duration*1000;
}
$('unit').onchange=$('skill').onchange=()=>{void load();};
$('play').onclick=()=>{if($('skill').value==='ult'){if(v.paused)void v.play();else v.pause();}else{playing=!playing;if(elapsed>=timeline.sequence.duration)elapsed=0;last=0;}if($('sound').checked){audio?.pause();audio=new Audio('./audio/release.mp3');audio.volume=.5;void audio.play().catch(()=>{});}};
$('speed').onchange=()=>{v.playbackRate=+$('speed').value;};
$('scrub').oninput=()=>{playing=false;v.pause();if($('skill').value==='ult')v.currentTime=+$('scrub').value/1000*(v.duration||2.27);else{elapsed=+$('scrub').value/1000*timeline.sequence.duration;draw();}};
$('compare').onclick=()=>{before=!before;$('compare').textContent=before?'Show after':'Show before';$('compare').setAttribute('aria-pressed',String(before));if($('skill').value==='ult'){$('stage').classList.toggle('before',before);$('before').hidden=!before;}else draw();$('badge').textContent=before?'BEFORE · PAINTED LAYERS':$('skill').value==='ult'?'AFTER · FULL PLATE':'AFTER · FIELD SEQUENCE';};
v.ontimeupdate=()=>{if($('skill').value!=='ult')return;$('scrub').value=v.currentTime/(v.duration||2.27)*1000;$('time').textContent=v.currentTime.toFixed(2)+' / '+(v.duration||2.27).toFixed(2)+' s';};
function tick(now){if(playing&&timeline){elapsed=Math.min(timeline.sequence.duration,elapsed+(last?now-last:0)*+$('speed').value);draw();if(elapsed>=timeline.sequence.duration)playing=false;}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);void load();
