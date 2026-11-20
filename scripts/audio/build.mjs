/** Reproducible CC0 audio sprite pipeline. Requires ffmpeg/ffprobe, no paid services. */
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,basename} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),src=resolve(root,'assets/audio-sources'),out=resolve(root,'apps/web/public/audio'),tmp=resolve(root,'tmp/audio-v3');
// The B1-only generator predates provenance-preserving B2 sprites. Fail closed
// rather than silently replacing the richer manifest and source licence ledger.
if(JSON.parse(readFileSync(resolve(out,'manifest.json'))).version>=4)throw new Error('B2 audio: use python3 scripts/audio/build-layered.py; this legacy builder would erase B2 provenance.');
mkdirSync(out,{recursive:true});mkdirSync(tmp,{recursive:true});
const ff=(args)=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{maxBuffer:80*1024*1024});
const rate=44100;const raw=(file,extra=[])=>{const b=ff(['-i',file,...extra,'-ac','1','-ar',String(rate),'-f','f32le','pipe:1']);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const sources=JSON.parse(readFileSync(resolve(src,'SOURCES.json'))),manifest={version:3,packs:{},cues:{}},licenses=[],report=[];
const sourceMap=Object.fromEntries(sources.map(s=>[s.pack,s]));
const audioFiles=(pack)=>readdirSync(resolve(src,pack)).filter(n=>n.endsWith('.ogg')).sort();
const pick=(pack,prefix,count=1)=>audioFiles(pack).filter(n=>n.startsWith(prefix)).slice(0,count).map(n=>resolve(src,pack,n));
const samples=new Map(),packMembers=new Map();
function add(cue,files,pack,bus='sfx',loop=false){const rows=[];for(const file of files){const key=pack+'/'+basename(file);if(!samples.has(key)){samples.set(key,{file,pack,bus,loop,key});const list=packMembers.get(pack)??[];list.push(key);packMembers.set(pack,list);}rows.push(key);}manifest.cues[cue]=rows;}
for(const [kind,prefix] of [['blunt','impactWood'],['heavy','impactMetal'],['magic','impactGlass'],['slash','impactPlank']])add('hit.'+kind,pick('impact-sounds',prefix,3),'impact');
for(const [cue,prefix] of Object.entries({click:'click',hover:'select',open:'open',close:'close',tab:'switch',reward:'confirmation',coin:'bong',turn:'tick',heal:'maximize',crit:'confirmation',block:'error',death:'minimize',fail:'error','level-up':'confirmation','reward-fly':'select'})){
 const files=pick('interface-sounds',prefix,3);add('ui.'+cue,files.length?files:pick('interface-sounds','click',3),'interface','ui');
}
for(const [phase,prefix] of [['charge','drawKnife'],['release','knifeSlice'],['impact','chop'],['tail','cloth']])for(const element of ['magic','slash','heavy','fire','ice','nature','lightning','hearth','moon','garden','tide','ember'])add(`kit.${element}.${phase}`,pick('rpg-audio',prefix,phase==='impact'?1:3),'rpg');
for(const status of ['burn','freeze','poison','bleed','stun','shield','scald','cozy','tangle','steep','crumb','scent','rattled','drowsy','glaze','shelter','riposte','hush','brittle','link','sprout','decoy'])for(const phase of ['on','off','tick'])add(`status.${status}.${phase}`,pick('rpg-audio',status==='shield'?'metalPot':phase==='off'?'bookClose':'cloth',3),'rpg');
for(const [i,rarity] of ['common','rare','epic','legendary','mythic'].entries())add('ui.reveal.'+rarity,pick('music-jingles',`jingles_HIT${String(i+1).padStart(2,'0')}`),'jingles','sfx');
for(const [cue,prefix] of [['victory','jingles_SAX00'],['defeat','jingles_SAX16'],['reveal','jingles_HIT09']]){const files=pick('music-jingles',prefix);add('music.'+cue,files.length?files:pick('music-jingles','jingles_HIT',1),'jingles','music');}
add('ui.forge.success',pick('music-jingles','jingles_HIT10'),'jingles');add('ui.forge.fail',pick('rpg-audio','metalPot',1),'rpg');
add('voice.meow',[resolve(src,'meow.mp3')],'voice','voice');
for(const name of ['landing','home','battle','boss'])add('music.'+name,[resolve(src,name+'.ogg')],name,'music',true);
// An original arrangement of CC0 soft cloth and crockery for the quiet café.
const room=new Float32Array(rate*8);let seed=12;for(let j=0;j<8;j++){const grain=raw(pick('rpg-audio',j%3?'cloth':'metalPot',3)[j%3]);const at=rate*j;for(let i=0;i<grain.length&&at+i<room.length;i++)room[at+i]+=grain[i]*.12;}
writeFileSync(resolve(tmp,'cafe.f32'),Buffer.from(room.buffer));ff(['-f','f32le','-ar',String(rate),'-ac','1','-i',resolve(tmp,'cafe.f32'),'-c:a','pcm_s16le',resolve(tmp,'cafe.wav')]);add('ambience.cafe',[resolve(tmp,'cafe.wav')],'ambience','ambience',true);
for(const s of samples.values()){
 let data=raw(s.file,s.loop&&s.bus==='music'?['-ss','8','-t','33']:[]);
 if(s.bus==='voice'){const repeat=new Float32Array(data.length*6);for(let i=0;i<6;i++)repeat.set(data,i*data.length);data=repeat;}
 if(s.loop&&s.bus==='music'){
  // Equal-power wrap: overlap last 0.5s with the first 0.5s, then trim the head.
  const n=Math.floor(rate*1),end=data.length-n;for(let i=0;i<n;i++){const t=i/n;data[end+i]=data[end+i]*(1-t)+data[i]*t;}data=data.slice(n);
 }
 const sourceRaw=resolve(tmp,basename(s.key)+'.f32'),normal=resolve(tmp,basename(s.key)+'.wav');writeFileSync(sourceRaw,Buffer.from(data.buffer));
 const target=s.bus==='music'?-18:s.bus==='voice'?-16:-22;
 const measurement=spawnSync('ffmpeg',['-hide_banner','-f','f32le','-ar',String(rate),'-ac','1','-i',sourceRaw,'-af',`loudnorm=I=${target}:TP=-4:LRA=11:print_format=json`,'-f','null','-'],{encoding:'utf8'}).stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
 const a=measurement?JSON.parse(measurement[0]):{};
 const second=Number.isFinite(Number(a.input_i))?`:measured_I=${a.input_i}:measured_TP=${a.input_tp}:measured_LRA=${a.input_lra}:measured_thresh=${a.input_thresh}:offset=${a.target_offset}:linear=true`:'';
 ff(['-f','f32le','-ar',String(rate),'-ac','1','-i',sourceRaw,'-af',`loudnorm=I=${target}:TP=-4:LRA=11${second},aresample=${rate}`,'-ar',String(rate),normal]);
 s.data=raw(normal);
 if(s.loop&&s.bus==='music'){const n=2205;const rms=(a,b)=>{let sum=0;for(let i=a;i<b;i++)sum+=s.data[i]*s.data[i];return Math.sqrt(sum/(b-a));};for(let at=rate;at<s.data.length-rate;at+=441){const a=rms(at-n,at),b=rms(at,at+n);if(a>.001&&b>.001&&Math.abs(20*Math.log10(a/b))<.5){const rotated=new Float32Array(s.data.length);rotated.set(s.data.slice(at));rotated.set(s.data.slice(0,at),s.data.length-at);s.data=rotated;break;}}}
 s.duration=s.data.length/rate;
}
const offsets=new Map();
for(const [pack,keys] of packMembers){
 const chunks=[];let cursor=0;for(const key of keys){const s=samples.get(key);offsets.set(key,{pack,start:cursor,duration:s.duration,bus:s.bus,...(s.loop?{loop:true}:{})});chunks.push(Buffer.from(s.data.buffer));cursor+=s.duration;if(!s.loop){const gap=new Float32Array(Math.ceil(rate*.08));chunks.push(Buffer.from(gap.buffer));cursor+=gap.length/rate;}}
 const input=resolve(tmp,pack+'.f32');writeFileSync(input,Buffer.concat(chunks));const music=['landing','home','battle','boss'].includes(pack);
 for(const format of ['webm','mp3']){const file=`${pack}.${format}`;ff(['-f','f32le','-ar',String(rate),'-ac','1','-i',input,...(format==='webm'?['-c:a','libopus','-b:a',music?'96k':'64k']:['-c:a','libmp3lame','-b:a',music?'96k':'64k']),resolve(out,file)]);

 }
 manifest.packs[pack]={webm:'/audio/'+pack+'.webm',mp3:'/audio/'+pack+'.mp3'};
 const source=sourceMap[({impact:'impact-sounds',interface:'interface-sounds',rpg:'rpg-audio',jingles:'music-jingles',ambience:'rpg-audio'})[pack]??pack];
 for(const format of ['webm','mp3'])licenses.push({...source,file:pack+'.'+format,sourceFiles:keys.map(k=>basename(samples.get(k).file)),processing:pack==='ambience'?'Original quiet crockery arrangement; loudnorm; encode':'loudnorm; wrap crossfade for music loops; sprite encode'});
}
for(const cat of ['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold']){for(const event of ['select','attack','skill','ult','hit','death','victory'])manifest.cues[`voice.${cat}.${event}`]=manifest.cues['voice.meow'];for(const phase of ['charge','release','impact','tail'])manifest.cues[`ult.${cat}.${phase}`]=manifest.cues[`kit.magic.${phase}`];for(let skill=1;skill<=3;skill++)for(const phase of ['cast','impact'])manifest.cues[`skill.${cat}.${skill}.${phase}`]=manifest.cues[`kit.magic.${phase==='cast'?'charge':'impact'}`];}
for(const [cue,keys] of Object.entries(manifest.cues))manifest.cues[cue]=keys.map(k=>offsets.get(k));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');writeFileSync(resolve(out,'LICENSES.json'),JSON.stringify({licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',files:licenses},null,2)+'\n');
rmSync(tmp,{recursive:true,force:true});console.log(`Built ${samples.size} samples, ${Object.keys(manifest.cues).length} cues; ${readdirSync(out).reduce((s,f)=>s+statSync(resolve(out,f)).size,0)} bytes.`);
