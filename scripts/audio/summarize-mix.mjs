/** Build the review pack from measured files; never substitutes target values. */
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='reports/v3-shell/b2',dir=`${base}/mix`;
const rows=readdirSync(dir).filter(n=>/^\d+.*\.json$/.test(n)).map(n=>JSON.parse(readFileSync(`${dir}/${n}`,'utf8'))).filter(r=>r.name&&r.path&&!r.diagnostic);
const trials=[...new Set(rows.map(r=>r.trial))].sort();
const notes={
 '01-baseline':'Actual app capture exposed missing battle music routing and quiet menus.',
 '02-routing-level':'Routed battle/boss from visible battle state and raised mix trim; true peaks failed.',
 '03-headroom':'Added 2 dB output headroom and a tighter compressor; levels recovered.',
 '04-underscore':'Authored separate original battle/boss scores; stationary-tone detector regression diagnosed independently.',
 '05-phase-history':'Stopped replaying cast/travel history at impact; kept damage and status timing.',
 '06-scene-beds':'Added licensed scene room tone and decode-safe 800 ms crossfades.',
 '07-string-texture':'Added bowed-string friction and restored upper harp harmonics for a broader score.',
 '08-menu-voices':'Added quiet hub chatter and rate-limited comments on gear inspection/enhancement.',
 '09-score-voice-balance':'Raised the authored battle score 3 dB; fixed the encounter seed for subsequent comparisons and measured the first complete encounters.',
 '10-upper-strings':'Restored upper bowed-string texture after spectral balance and isolated-stem diagnosis.',
 '11-room-tails':'Smoothed the impact room tails to reduce excess short bursts. Full captures still miss transient/voice targets; source-start analysis identifies interrupted charge/release lines.',
 '12-solo-current':'Current A battle in isolated B checkout: zero source-start interruptions in both full renders, but the battle mix masks voiced contours. Boss passes the voice band.',
 '13-battle-score-space':'Lowering the entire battle score by6dB leaves the45s probe below voice density and loudness targets. Rejected as the final mix.',
 '14-speech-space':'A low-shelf opening under battle speech keeps loudness, but this45s probe still misses voice density. Not acceptance evidence.',
 '15-speech-space-transitions':'Schedule the speech shelf on voice-state changes only; inspect actual shelf automation alongside the45s probe. Full renders remain required.',
 '16-callout-presence':'The short presence probe passes, but is not acceptance evidence. The following full capture exposes the remaining articulation weakness.',
 '17-current-full':'Full battle and boss fail contour density after the short probe passed. Source articulation, rather than more overall gain, is the next method.',
 '18-spoken-articulation':'Both full voice-density bands pass, but a Mochi clarity edit breaks identity separation. Rejected; original Mochi restored.',
 '19-preserved-identities':'All twelve voice identities pass. Battle contours4.661/min pass; boss6.988/min exceeds6.75. Rejected as final acceptance.',
 '20-boss-balance':'Reduce only boss voice presence from6 to4.5dB; battle stays6dB. Source takes, every required callout, timing and analyser remain unchanged.',
};
const columns=['onsetsPerSecond','layersPerOnset','tickTransientsPerSecond','voiceContoursPerMinute','musicBedFraction','integratedLufs','truePeakDbTP'];
let md='# S5 mix iterations\n\nEvery row links to actual browser-output measurements. Early trials are 30-second probes, not full-duration acceptance. All have been remeasured with the same corrected analyser. Diagnostic isolated stems are excluded from the iteration count and all gates. Numeric acceptance thresholds are unchanged.\n\n';
for(const trial of trials){
 md+=`## ${trial}\n\n${notes[trial]??'See the change and interpretation recorded in DECISIONS.md.'}\n\n| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
 for(const r of rows.filter(r=>r.trial===trial))md+=`| [${r.name}](mix/${trial}-${r.name}.json) | ${r.durationSeconds.toFixed(2)} | ${columns.map(k=>r[k].toFixed(3)).join(' | ')} |\n`;
 md+='\n';
}
writeFileSync(`${base}/MIX-ITERATIONS.md`,md.trimEnd()+'\n');
const requested=process.env.ACCEPT_TRIAL;
if(!requested){console.log(`Wrote ${trials.length} measured iterations (${rows.length} captures).`);process.exit(0);}
const renders=['battle','boss','home','bag','gacha','forge'].map(name=>{
 const found=rows.find(r=>r.trial===requested&&r.name===name);
 if(!found)throw Error(`Missing ${requested}/${name}`);
 return found;
});
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
// Direct segments from the final mixed output, joined with short fades only.
const reelPath=`${base}/SOUND-REEL.mp3`,inputs=[renders[0],...renders.slice(2)];
// MP3 frame trimming can shave a few milliseconds; retain a little more of
// the final scene so the decoded review reel still contains at least 90 s.
const durations=[45,12,11,11,11.05];
const filters=durations.map((d,i)=>`[${i}:a]atrim=start=0:end=${d},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=${d-.03}:d=0.03[s${i}]`);
filters.push(`${inputs.map((_,i)=>`[s${i}]`).join('')}concat=n=${inputs.length}:v=0:a=1[out]`);
execFileSync('ffmpeg',['-v','error','-y',...inputs.flatMap(r=>['-i',r.path]),'-filter_complex',filters.join(';'),'-map','[out]','-c:a','libmp3lame','-b:a','160k',reelPath]);
const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',reelPath],{encoding:'utf8'}));
const output={renders,mixIterations:trials.length,ducking:{db:-8,attackMs:120,releaseMs:400},reel:{...signed(reelPath),durationSeconds:duration},method:'Six actual browser-output captures at production defaults; no final loudness normalization. Proxy limitations and failed gates remain reported.'};
const interruptionsPath=`${base}/VOICE-INTERRUPTIONS.json`;
if(existsSync(interruptionsPath)){
 const interruptions=JSON.parse(readFileSync(interruptionsPath));
 if(interruptions.trial===requested&&interruptions.scenes.some(s=>s.interruptedCount>0)){
  output.sessionABlocker='S5-A-VOICE-WINDOW';output.voiceInterruptions=signed(interruptionsPath);
 }
}
writeFileSync(`${base}/OUR-AUDIO.json`,JSON.stringify(output,null,2)+'\n');
console.log(`Published ${renders.length} full renders and ${duration.toFixed(2)}s reel.`);
