/** Native keyboard slider operations, actual Web Audio gains, and reload persistence. */
import {createRequire} from 'node:module';import {writeFileSync,readFileSync,mkdirSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';import {openAudioScreen} from './ui-fixtures.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const B=process.env.AUDIO_EVIDENCE_DIR??'reports/v3-shell/b2',log=`${B}/tests/s6-settings-browser.log`,lines=[];
if(process.env.AUDIO_EVIDENCE_DIR&&existsSync(`${B}/UI-AUDIO-SETTINGS.json`))throw Error('Preserve prior evidence; choose a new AUDIO_EVIDENCE_DIR');
mkdirSync(`${B}/tests`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']}),p=await browser.newPage({viewport:{width:1280,height:720}});
let checks=0;const pass=description=>{checks++;lines.push('PASS '+description);};
try{
 await openAudioScreen(p,'settings-audio',process.env.AUDIO_URL??'http://127.0.0.1:5996');
 // Chromium does not advance AudioParam.value on a dormant inputless bus.
 // Feed a quiet diagnostic tone through the real bus and measure its output.
 await p.evaluate(()=>window.__thAudio.stop());
 const probe=async bus=>p.evaluate(bus=>{
  const e=window.__thAudio,source=e.ctx.createOscillator(),level=e.ctx.createGain(),meter=e.ctx.createAnalyser();
  source.frequency.value=440;level.gain.value=.02;meter.fftSize=2048;
  source.connect(level).connect(e.buses.get(bus));e.buses.get(bus).connect(meter);source.start();
  window.__mixerProbe={source,level,meter,bus};
 },bus);
 const reading=async()=>p.evaluate(()=>{
  const {meter,bus}=window.__mixerProbe,e=window.__thAudio,data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);
  return {preference:e.settings[bus],gain:e.buses.get(bus).gain.value,saved:JSON.parse(localStorage.getItem('tbh-audio-v3'))[bus],rms:Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length)};
 });
 const stopProbe=async()=>p.evaluate(()=>{const p=window.__mixerProbe;p.source.stop();p.source.disconnect();p.level.disconnect();window.__thAudio.buses.get(p.bus).disconnect(p.meter);});
 for(const bus of ['master','music','ambience','sfx','voice','ui']){
  const before=await p.evaluate(()=>window.__thAudio.settings);
  await probe(bus);const slider=p.getByRole('slider',{name:bus+' volume',exact:true});await slider.focus();await slider.press('Home');await p.waitForTimeout(350);
  const silent=await reading();assert(silent.rms<.0001,JSON.stringify({bus,silent}));pass(bus+' zero volume silences the actual bus output');
  for(let n=0;n<5;n++)await slider.press('ArrowRight');await p.waitForTimeout(350);
  const value=await reading();assert.equal(value.preference,.25);assert.equal(value.saved,.25);assert(Math.abs(value.gain-.25)<.01,JSON.stringify({bus,...value}));
  assert(Math.abs(value.rms-.02*.25/Math.SQRT2)<.0005,JSON.stringify({bus,...value}));
  const after=await p.evaluate(()=>window.__thAudio.settings);for(const other of Object.keys(before))if(other!==bus)assert.equal(after[other],before[other]);
  pass(bus+' slider changes actual output amplitude, leaves other buses unchanged and persists');await stopProbe();
 }
 await probe('master');
 await p.getByRole('button',{name:'Mute sound',exact:true}).click();await p.waitForTimeout(200);
 assert(await p.evaluate(()=>window.__thAudio.muted&&window.__thAudio.buses.get('master').gain.value<.001));assert((await reading()).rms<.0001);pass('mute silences master output');
 await p.reload();await p.locator('.uv-shell').waitFor();await p.keyboard.press('Shift');
 await p.evaluate(()=>window.__depthReview.go('save'));await p.locator('.th-audio summary').click();
 const restored=await p.evaluate(()=>({muted:window.__thAudio.muted,settings:window.__thAudio.settings}));
 assert(restored.muted);assert(Object.values(restored.settings).every(v=>v===.25));pass('all preferences and mute survive reload');
 await p.getByRole('button',{name:'Unmute sound',exact:true}).click();await p.waitForTimeout(200);
 assert(await p.evaluate(()=>!window.__thAudio.muted&&Math.abs(window.__thAudio.buses.get('master').gain.value-.25)<.01));pass('unmute restores saved master level');
 writeFileSync(log,lines.join('\n')+'\n');
 const result={passed:true,tests:checks,log,sha256:createHash('sha256').update(readFileSync(log)).digest('hex'),method:'Actual native sliders with Home/ArrowRight; quiet 440 Hz diagnostic input checks zero and 25% output RMS on every real bus. Other settings unchanged; localStorage and mute checked before and after reload. Probe is isolated from the crawler and production renders.'};
 writeFileSync(`${B}/UI-AUDIO-SETTINGS.json`,JSON.stringify(result,null,2)+'\n');console.log(`${checks} settings checks pass`);
}catch(error){lines.push('FAIL '+error.message);writeFileSync(log,lines.join('\n')+'\n');throw error;}finally{await browser.close();}
