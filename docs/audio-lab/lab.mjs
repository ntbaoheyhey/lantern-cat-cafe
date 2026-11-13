import {AudioEngine,resolveCue,resolveDesign} from './runtime.js';
import {CatPreview} from './preview.mjs';
const $=id=>document.getElementById(id),base=new URL('../../apps/web/public/audio/',location.href),root=new URL('../../',location.href);
const read=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`Cannot load ${url}: ${r.status}`);return r.json();};
const [manifest,map,ledger,voices,catalogue]=await Promise.all([read(new URL('manifest.json',base)),read(new URL('reports/v3-shell/b2/SOUND-MAP.json',root)),read(new URL('LICENSES.json',base)),read(new URL('apps/web/src/audio/voice-profiles.json',root)),read(new URL('assets/audio-sources/CATALOG.json',root))]);
const engine=new AudioEngine(Math.random,base.href),preview=new CatPreview(root,voices,catalogue.clips);let generation=0;
// A lab listening level is local to this browser origin, never the game origin.
engine.mute(false);engine.setBus('master',.5);
const errors=[],plays=[],status=(message,error=false)=>{$('status').textContent=message;$('status').dataset.error=String(error);if(error)errors.push(message);};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const unique=new Map();for(const row of map.rows){const cue=unique.get(row.cueId);if(cue)cue.screens.add(row.screen);else unique.set(row.cueId,{...row,screens:new Set([row.screen])});}
const sorted=[...unique.values()].sort((a,b)=>a.cueId.localeCompare(b.cueId));
function stop(){generation++;engine.stop();preview.stop();status('Stopped.');}
$('stop').onclick=stop;$('level').oninput=e=>{engine.setBus('master',Number(e.target.value));preview.level=Number(e.target.value);};
async function play(id){
 await engine.unlock();engine.stop();preview.stop();
 const row=unique.get(id),before=engine.hits.length;status(`${id} · loading`);
 if(row.bus==='music')engine.music(id);else if(row.bus==='ambience')engine.ambience(id);else engine.play(id);
 let hit;for(let n=0;n<150;n++){await delay(60);hit=engine.hits.slice(before).find(r=>r.id===id);if(hit)break;}
 if(!hit||hit.result!=='played')throw Error(`${id}: ${hit?.result??'playback timeout'}`);
 plays.push(hit);status(`${id} · ${hit.layers?.length??1} layers playing`);
 $('play-log').textContent=plays.slice(-12).map(h=>`${h.id} · ${h.layers?.map(l=>`${l.role}: ${l.variantId}`).join(' / ')??'loop'}`).join('\n');return hit;
}
function action(button,work){button.addEventListener('click',async()=>{button.disabled=true;try{await work();}catch(e){status(e.message,true);}finally{button.disabled=false;}});}
function text(tag,value,cls){const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;}
function sourceLink(row){const item=document.createElement('li');const a=text('a',`${row.author} · ${row.license}`);a.href=row.licenseUrl||row.sourceUrl;a.target='_blank';a.rel='noopener';item.append(a,` · ${row.file||row.path} · ${row.date} `,text('code',row.sha256));return item;}
for(const bus of [...new Set(sorted.map(r=>r.bus))]){const option=text('option',bus);option.value=bus;$('bus').append(option);}
for(const screen of [...new Set(map.rows.map(r=>r.screen))].sort()){const option=text('option',screen);option.value=screen;$('screen').append(option);}
const fragment=document.createDocumentFragment();
for(const row of sorted){
 const article=text('article','','cue');article.dataset.cue=row.cueId;
 const heading=text('div','','cue-heading'),title=text('h3',row.cueId),playButton=text('button','Play'),randomButton=text('button','Randomise 10×');playButton.dataset.play=row.cueId;randomButton.dataset.randomise=row.cueId;
 action(playButton,()=>{generation++;return play(row.cueId);});action(randomButton,async()=>{const token=++generation;for(let i=0;i<10&&token===generation;i++){await play(row.cueId);if(i<9)await delay(row.bus==='voice'?7100:Math.max(550,row.cooldownMs+50));}});
 heading.append(title,text('span',row.bus,'badge'),playButton,randomButton);
 const design=resolveDesign(row.cueId,manifest),samples=resolveCue(row.cueId,manifest)||[],layers=design?.layers||[{role:row.bus,variants:samples,offsetMs:0,eq:'flat',gainDb:0}];
 article.append(heading,text('p',layers.map(l=>`${l.role} · ${l.variants.length} variants · +${l.offsetMs} ms · ${l.eq}`).join(' / '),'layer-line'));
 const details=text('details',''),summary=text('summary','Design, screens & licences'),list=text('ul','');
 list.append(text('li',`Screens: ${[...row.screens].join(', ')}`),text('li',`Pitch ${row.pitchRange.join('–')} · gain ${row.volumeRange.join('–')} dB · cooldown ${row.cooldownMs} ms · priority ${row.priority} · duck ${JSON.stringify(row.ducking)}`));
 const packs=new Set([...(design?.baked?.map(v=>v.sample.pack)||[]),...layers.flatMap(l=>l.variants.map(v=>v.pack))]);
 for(const l of ledger.files.filter(l=>[...packs].some(p=>l.path===`apps/web/public/audio/${p}.webm`)))list.append(sourceLink(l));
 details.append(summary,list);article.append(details);fragment.append(article);
}
$('cue-list').append(fragment);
function filter(){let visible=0;const q=$('filter').value.toLowerCase(),bus=$('bus').value,screen=$('screen').value;for(const article of $('cue-list').children){const row=unique.get(article.dataset.cue);article.hidden=!(row.cueId.toLowerCase().includes(q)&&(!bus||row.bus===bus)&&(!screen||row.screens.has(screen)));if(!article.hidden)visible++;}$('count').textContent=`${visible} / ${sorted.length} cues`;}
for(const id of ['filter','bus','screen'])$(id).addEventListener('input',filter);filter();
for(const [cat,profile] of Object.entries(voices)){
 const card=text('article','','voice'),input=document.createElement('input');input.value=profile.lines.ult[0];input.maxLength=80;input.setAttribute('aria-label',`${cat} preview text`);
 const button=text('button',`Hear ${cat}`);button.dataset.voice=cat;action(button,async()=>{generation++;engine.stop();const result=await preview.say(cat,input.value);status(`${cat} · ${result.syllables} syllables · ${result.consonants} consonant grains`);});
 const clip=catalogue.clips.find(c=>c.path===`assets/audio-sources/b2/cats/${profile.source}.flac`),credit=text('a',`${clip.author} · ${clip.license}`,'source');credit.href=clip.licenseUrl;
 card.append(text('h3',cat[0].toUpperCase()+cat.slice(1)),text('p',profile.personality),input,button,text('p',`${profile.baseSemitones} st · ${profile.signature} · ${profile.brightness} Hz`),credit);$('voice-list').append(card);
}
const table=document.createDocumentFragment();for(const row of map.rows){const tr=document.createElement('tr');for(const value of [row.screen,row.event,row.cueId,row.bus,row.layers.map(l=>`${l.role} (${l.variants})`).join(', '),`${row.cooldownMs} ms / ${row.priority} / ${JSON.stringify(row.ducking)}`])tr.append(text('td',value));table.append(tr);}$('map-body').append(table);$('map-count').textContent=`${map.rows.length} mapped events across ${new Set(map.rows.map(r=>r.screen)).size} screens.`;
window.__audioLab={engine,preview,plays,errors,cueIds:sorted.map(r=>r.cueId),mappedEvents:map.rows.length};status(`${sorted.length} cues ready · click Play to unlock audio`);
